import cron from 'node-cron';
import axios from 'axios';
import { config } from '../config/environment';
import { logger } from '../config/logger';
import { pool } from '../config/database';

export class PriceUpdater {
  private isRunning = false;

  start(): void {
    // Update prices every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      if (this.isRunning) {
        logger.debug('Price updater already running, skipping...');
        return;
      }

      await this.updatePrices();
    });

    logger.info('Price updater started');
  }

  private async updatePrices(): Promise<void> {
    this.isRunning = true;

    try {
      // Get all verified tokens
      const query = 'SELECT * FROM tokens WHERE verified = true';
      const result = await pool.query(query);
      const tokens = result.rows;

      logger.info(`Updating prices for ${tokens.length} tokens`);

      // Map token symbols to CoinGecko IDs
      const tokenMap: Record<string, string> = {
        ETH: 'ethereum',
        USDC: 'usd-coin',
        WBTC: 'wrapped-bitcoin',
        USDT: 'tether',
        DAI: 'dai',
      };

      // Fetch prices from CoinGecko
      const symbols = tokens.map((t) => t.symbol).filter((s) => tokenMap[s]);
      if (symbols.length === 0) {
        return;
      }

      const coinIds = symbols.map((s) => tokenMap[s]).join(',');
      const apiUrl = config.apis.coingecko.apiKey
        ? `${config.apis.coingecko.baseUrl}/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true&x_cg_demo_api_key=${config.apis.coingecko.apiKey}`
        : `${config.apis.coingecko.baseUrl}/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`;

      const response = await axios.get(apiUrl);
      const prices = response.data;

      // Update prices in database
      for (const token of tokens) {
        const coinId = tokenMap[token.symbol];
        if (!coinId || !prices[coinId]) {
          continue;
        }

        const priceData = prices[coinId];
        const price = priceData.usd;
        const change24h = priceData.usd_24h_change || 0;

        // Insert price record
        const insertQuery = `
          INSERT INTO token_prices (token_id, price, change_24h, timestamp)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        `;

        await pool.query(insertQuery, [token.id, price, change24h]);

        // Update token last_price_update
        const updateQuery = `
          UPDATE tokens
          SET last_price_update = CURRENT_TIMESTAMP
          WHERE id = $1
        `;

        await pool.query(updateQuery, [token.id]);
      }

      logger.info('Price update completed');
    } catch (error) {
      logger.error('Price updater error', error);
    } finally {
      this.isRunning = false;
    }
  }
}

export const priceUpdater = new PriceUpdater();

