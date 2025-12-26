import { pool } from '../../config/database';
import { cacheService } from '../../config/redis';
import { logger } from '../../config/logger';

export interface Transaction {
  id: string;
  hash: string;
  from: string;
  to: string | null;
  value: string;
  gasUsed: string | null;
  gasPrice: string | null;
  fee: string | null;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber: number | null;
  transactionIndex: number | null;
  timestamp: Date;
  network: string;
  type: 'send' | 'receive' | 'swap' | 'contract';
  tokenTransfers: any[];
  metadata: Record<string, any>;
}

export class TransactionService {
  async indexTransaction(txData: {
    hash: string;
    from: string;
    to: string | null;
    value: string;
    gasUsed?: string;
    gasPrice?: string;
    status: string;
    blockNumber?: number;
    transactionIndex?: number;
    timestamp: Date;
    network: string;
    type?: string;
    tokenTransfers?: any[];
  }): Promise<Transaction> {
    const fee = txData.gasUsed && txData.gasPrice
      ? (BigInt(txData.gasUsed) * BigInt(txData.gasPrice)).toString()
      : null;

    const query = `
      INSERT INTO transactions (
        hash, from_address, to_address, value, gas_used, gas_price, fee,
        status, block_number, transaction_index, timestamp, network, type, token_transfers
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (hash) DO UPDATE SET
        status = EXCLUDED.status,
        block_number = EXCLUDED.block_number,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await pool.query(query, [
      txData.hash,
      txData.from,
      txData.to,
      txData.value,
      txData.gasUsed || null,
      txData.gasPrice || null,
      fee,
      txData.status,
      txData.blockNumber || null,
      txData.transactionIndex || null,
      txData.timestamp,
      txData.network,
      txData.type || 'send',
      JSON.stringify(txData.tokenTransfers || []),
    ]);

    // Invalidate cache
    await cacheService.delete(`transactions:${txData.from}`);
    if (txData.to) {
      await cacheService.delete(`transactions:${txData.to}`);
    }

    return this.mapRowToTransaction(result.rows[0]);
  }

  async getUserTransactions(
    walletAddress: string,
    filters: {
      status?: string;
      type?: string;
      limit?: number;
      offset?: number;
      fromDate?: Date;
      toDate?: Date;
    } = {}
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const cacheKey = `transactions:${walletAddress}:${JSON.stringify(filters)}`;
    const cached = await cacheService.get<{ transactions: Transaction[]; total: number }>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    conditions.push(`(from_address = $${paramIndex} OR to_address = $${paramIndex})`);
    params.push(walletAddress);
    paramIndex++;

    if (filters.status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.type) {
      conditions.push(`type = $${paramIndex}`);
      params.push(filters.type);
      paramIndex++;
    }

    if (filters.fromDate) {
      conditions.push(`timestamp >= $${paramIndex}`);
      params.push(filters.fromDate);
      paramIndex++;
    }

    if (filters.toDate) {
      conditions.push(`timestamp <= $${paramIndex}`);
      params.push(filters.toDate);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM transactions ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get transactions
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const query = `
      SELECT *
      FROM transactions
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const result = await pool.query(query, params);

    const transactions = result.rows.map(this.mapRowToTransaction);

    const data = { transactions, total };
    await cacheService.set(cacheKey, data, 300); // Cache for 5 minutes

    return data;
  }

  async getTransactionByHash(hash: string): Promise<Transaction | null> {
    const query = 'SELECT * FROM transactions WHERE hash = $1';
    const result = await pool.query(query, [hash]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTransaction(result.rows[0]);
  }

  async getTransactionStats(walletAddress: string): Promise<{
    totalTransactions: number;
    totalSent: number;
    totalReceived: number;
    totalSwaps: number;
    totalVolume: string;
    totalFees: string;
  }> {
    const query = `
      SELECT
        COUNT(*) as total_transactions,
        COUNT(*) FILTER (WHERE type = 'send') as total_sent,
        COUNT(*) FILTER (WHERE type = 'receive') as total_received,
        COUNT(*) FILTER (WHERE type = 'swap') as total_swaps,
        COALESCE(SUM(value), 0) as total_volume,
        COALESCE(SUM(fee), 0) as total_fees
      FROM transactions
      WHERE (from_address = $1 OR to_address = $1)
        AND status = 'confirmed'
    `;

    const result = await pool.query(query, [walletAddress]);
    const row = result.rows[0];

    return {
      totalTransactions: parseInt(row.total_transactions, 10),
      totalSent: parseInt(row.total_sent, 10),
      totalReceived: parseInt(row.total_received, 10),
      totalSwaps: parseInt(row.total_swaps, 10),
      totalVolume: row.total_volume || '0',
      totalFees: row.total_fees || '0',
    };
  }

  async updateTransactionStatus(hash: string, status: 'pending' | 'confirmed' | 'failed'): Promise<void> {
    const query = `
      UPDATE transactions
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE hash = $2
    `;

    await pool.query(query, [status, hash]);
  }

  private mapRowToTransaction(row: any): Transaction {
    return {
      id: row.id,
      hash: row.hash,
      from: row.from_address,
      to: row.to_address,
      value: row.value,
      gasUsed: row.gas_used,
      gasPrice: row.gas_price,
      fee: row.fee,
      status: row.status,
      blockNumber: row.block_number,
      transactionIndex: row.transaction_index,
      timestamp: row.timestamp,
      network: row.network,
      type: row.type,
      tokenTransfers: row.token_transfers || [],
      metadata: row.metadata || {},
    };
  }
}

export const transactionService = new TransactionService();

