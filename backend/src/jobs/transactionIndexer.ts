import cron from 'node-cron';
import { ethers } from 'ethers';
import { config } from '../config/environment';
import { logger } from '../config/logger';
import { transactionService } from '../services/transaction/transactionService';
import { pool } from '../config/database';

export class TransactionIndexer {
  private provider: ethers.JsonRpcProvider;
  private isRunning = false;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.blockchain.scrollRpcUrl);
  }

  start(): void {
    // Index transactions every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
      if (this.isRunning) {
        logger.debug('Transaction indexer already running, skipping...');
        return;
      }

      await this.indexNewTransactions();
    });

    logger.info('Transaction indexer started');
  }

  private async indexNewTransactions(): Promise<void> {
    this.isRunning = true;

    try {
      // Get addresses to monitor (users with recent activity)
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

      logger.info(`Indexing transactions for ${addresses.length} addresses`);

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
      // Get the last indexed block for this address
      const lastTxQuery = `
        SELECT block_number
        FROM transactions
        WHERE (from_address = $1 OR to_address = $1)
        ORDER BY block_number DESC
        LIMIT 1
      `;

      const lastTxResult = await pool.query(lastTxQuery, [address]);
      const lastBlock = lastTxResult.rows[0]?.block_number || 0;

      // Get current block
      const currentBlock = await this.provider.getBlockNumber();
      const startBlock = Math.max(lastBlock - 100, 0); // Check last 100 blocks

      if (startBlock >= currentBlock) {
        return; // No new blocks to check
      }

      // Fetch transactions from ScrollScan API
      const apiUrl = config.blockchain.scrollscanApiKey
        ? `https://api.scrollscan.com/api?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${currentBlock}&sort=desc&apikey=${config.blockchain.scrollscanApiKey}`
        : `https://api.scrollscan.com/api?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${currentBlock}&sort=desc`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status === '1' && data.result && Array.isArray(data.result)) {
        for (const tx of data.result) {
          await transactionService.indexTransaction({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value || '0',
            gasUsed: tx.gasUsed,
            gasPrice: tx.gasPrice,
            status: tx.txreceipt_status === '1' ? 'confirmed' : 'failed',
            blockNumber: parseInt(tx.blockNumber, 10),
            transactionIndex: parseInt(tx.transactionIndex, 10),
            timestamp: new Date(parseInt(tx.timeStamp, 10) * 1000),
            network: 'mainnet',
            type: this.determineTransactionType(tx),
          });
        }

        logger.debug(`Indexed ${data.result.length} transactions for ${address}`);
      }
    } catch (error) {
      logger.error(`Error indexing transactions for ${address}`, error);
    }
  }

  private determineTransactionType(tx: any): 'send' | 'receive' | 'swap' | 'contract' {
    if (tx.to === null || tx.to === '') {
      return 'contract';
    }

    // Check if it's a swap (interaction with DEX contract)
    // This would need to be expanded with actual DEX addresses
    const dexAddresses: string[] = [];

    if (dexAddresses.includes(tx.to.toLowerCase())) {
      return 'swap';
    }

    // Check if it's a contract interaction
    if (tx.input && tx.input !== '0x' && tx.input.length > 10) {
      return 'contract';
    }

    return 'send';
  }
}

export const transactionIndexer = new TransactionIndexer();

