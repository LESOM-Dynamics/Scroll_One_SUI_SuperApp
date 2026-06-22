import cron from 'node-cron';
import { logger } from '../config/logger';
import { transactionService } from '../services/transaction/transactionService';
import { pool } from '../config/database';
import { suiProvider } from '../services/blockchain/suiProvider';

export class TransactionIndexer {
  private isRunning = false;

  start(): void {
    cron.schedule('*/30 * * * * *', async () => {
      if (this.isRunning) {
        logger.debug('Transaction indexer already running, skipping...');
        return;
      }

      await this.indexNewTransactions();
    });

    logger.info('Sui transaction indexer started');
  }

  private async indexNewTransactions(): Promise<void> {
    this.isRunning = true;

    try {
      const query = `
        SELECT DISTINCT wallet_address
        FROM users
        WHERE last_active_at > NOW() - INTERVAL '7 days'
        LIMIT 100
      `;

      const result = await pool.query(query);
      const addresses = result.rows.map((row) => row.wallet_address);

      if (addresses.length === 0) {
        logger.debug('No active users to index transactions for');
        return;
      }

      logger.info(`Indexing Sui transactions for ${addresses.length} addresses`);

      for (const address of addresses) {
        await this.indexAddressTransactions(address);
      }
    } catch (error) {
      logger.error('Transaction indexer error', error);
    } finally {
      this.isRunning = false;
    }
  }

  private async indexAddressTransactions(address: string): Promise<void> {
    try {
      const client = suiProvider.getClient();
      const response = await client.queryTransactionBlocks({
        filter: { FromAddress: address },
        options: { showEffects: true, showBalanceChanges: true },
        order: 'descending',
        limit: 25,
      });

      for (const tx of response.data) {
        const gasUsed = tx.effects?.gasUsed;
        const status = tx.effects?.status?.status === 'success' ? 'confirmed' : 'failed';

        await transactionService.indexTransaction({
          hash: tx.digest,
          from: tx.transaction?.data.sender ?? address,
          to: address,
          value: '0',
          gasUsed: gasUsed?.computationCost?.toString(),
          gasPrice: undefined,
          status,
          blockNumber: Number(tx.checkpoint ?? 0),
          transactionIndex: 0,
          timestamp: new Date(Number(tx.timestampMs ?? Date.now())),
          network: suiProvider.getConfig().network,
          type: 'send',
        });
      }

      logger.debug(`Indexed ${response.data.length} transactions for ${address}`);
    } catch (error) {
      logger.error(`Error indexing transactions for ${address}`, error);
    }
  }
}

export const transactionIndexer = new TransactionIndexer();
