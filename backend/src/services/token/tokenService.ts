import { formatUnits } from 'ethers';
import { pool } from '../../config/database';
import { cacheService } from '../../config/redis';
import { logger } from '../../config/logger';
import { suiProvider } from '../blockchain/suiProvider';

export interface TokenInfo {
  id: string;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  icon?: string;
  verified: boolean;
  priceSource?: string;
  lastPriceUpdate?: Date;
}

export interface TokenPrice {
  tokenId: string;
  price: number;
  change24h: number;
  marketCap?: number;
  volume24h?: number;
  timestamp: Date;
}

export class TokenService {
  async getTokens(filters: {
    chainId?: number;
    verified?: boolean;
  } = {}): Promise<TokenInfo[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.chainId) {
      conditions.push(`chain_id = $${paramIndex++}`);
      params.push(filters.chainId);
    }

    if (filters.verified !== undefined) {
      conditions.push(`verified = $${paramIndex++}`);
      params.push(filters.verified);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `SELECT * FROM tokens ${whereClause} ORDER BY symbol`;
    const result = await pool.query(query, params);

    return result.rows.map(this.mapRowToToken);
  }

  async getTokenByAddress(address: string): Promise<TokenInfo | null> {
    const cacheKey = `token:${address.toLowerCase()}`;
    const cached = await cacheService.get<TokenInfo>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const query = 'SELECT * FROM tokens WHERE LOWER(address) = LOWER($1)';
    const result = await pool.query(query, [address]);

    if (result.rows.length === 0) {
      return null;
    }

    const token = this.mapRowToToken(result.rows[0]);
    await cacheService.set(cacheKey, token, 3600);
    return token;
  }

  async getTokenPrice(tokenAddress: string): Promise<TokenPrice | null> {
    const cacheKey = `token:price:${tokenAddress.toLowerCase()}`;
    const cached = await cacheService.get<TokenPrice>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const token = await this.getTokenByAddress(tokenAddress);
    if (!token) {
      return null;
    }

    const query = `
      SELECT * FROM token_prices
      WHERE token_id = $1
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [token.id]);

    if (result.rows.length === 0) {
      return null;
    }

    const price = this.mapRowToTokenPrice(result.rows[0]);
    await cacheService.set(cacheKey, price, 60); // Cache for 1 minute
    return price;
  }

  async getTokenBalance(
    coinType: string,
    walletAddress: string
  ): Promise<string> {
    try {
      const balance = await suiProvider.getClient().getBalance({
        owner: walletAddress,
        coinType,
      });
      const metadata = await suiProvider.getClient().getCoinMetadata({ coinType });
      const decimals = metadata?.decimals ?? 9;
      return formatUnits(balance.totalBalance, decimals);
    } catch (error) {
      logger.error('Error fetching token balance', error);
      return '0.0';
    }
  }

  async getTokenBalances(walletAddress: string, chainId: number = 101): Promise<Array<{
    token: TokenInfo;
    balance: string;
    usdValue: number;
  }>> {
    const tokens = await this.getTokens({ chainId, verified: true });
    const balances = await Promise.all(
      tokens.map(async (token) => {
        const balance = await this.getTokenBalance(token.address, walletAddress);
        const price = await this.getTokenPrice(token.address);
        const usdValue = price ? parseFloat(balance) * price.price : 0;

        return {
          token,
          balance,
          usdValue,
        };
      })
    );

    return balances.filter((b) => parseFloat(b.balance) > 0);
  }

  async addCustomToken(
    address: string,
    chainId: number,
    userId: string
  ): Promise<TokenInfo> {
    // Fetch token metadata from blockchain
    const metadata = await this.fetchTokenMetadata(address);
    
    if (!metadata) {
      throw new Error('Invalid coin type or token metadata unavailable');
    }

    const query = `
      INSERT INTO tokens (address, symbol, name, decimals, chain_id, verified)
      VALUES ($1, $2, $3, $4, $5, false)
      ON CONFLICT (address) DO UPDATE SET
        symbol = EXCLUDED.symbol,
        name = EXCLUDED.name,
        decimals = EXCLUDED.decimals,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await pool.query(query, [
      address,
      metadata.symbol,
      metadata.name,
      metadata.decimals,
      chainId,
    ]);

    return this.mapRowToToken(result.rows[0]);
  }

  private async fetchTokenMetadata(address: string): Promise<{
    symbol: string;
    name: string;
    decimals: number;
  } | null> {
    try {
      const metadata = await suiProvider.getClient().getCoinMetadata({ coinType: address });
      if (!metadata) {
        return null;
      }
      return {
        symbol: metadata.symbol,
        name: metadata.name,
        decimals: metadata.decimals,
      };
    } catch (error) {
      logger.error('Error fetching token metadata', error);
      return null;
    }
  }

  private mapRowToToken(row: any): TokenInfo {
    return {
      id: row.id,
      address: row.address,
      symbol: row.symbol,
      name: row.name,
      decimals: row.decimals,
      chainId: row.chain_id,
      icon: row.icon,
      verified: row.verified,
      priceSource: row.price_source,
      lastPriceUpdate: row.last_price_update,
    };
  }

  private mapRowToTokenPrice(row: any): TokenPrice {
    return {
      tokenId: row.token_id,
      price: parseFloat(row.price),
      change24h: parseFloat(row.change_24h || '0'),
      marketCap: row.market_cap ? parseFloat(row.market_cap) : undefined,
      volume24h: row.volume_24h ? parseFloat(row.volume_24h) : undefined,
      timestamp: row.timestamp,
    };
  }
}

export const tokenService = new TokenService();

