import { JsonRpcProvider, formatEther, parseEther, TransactionRequest } from 'ethers';
import { config } from '../../config/environment';
import { logger } from '../../config/logger';

export interface ProviderConfig {
  rpcUrl: string;
  chainId: number;
  chainName: string;
}

export const SCROLL_MAINNET: ProviderConfig = {
  rpcUrl: config.blockchain.scrollRpcUrl,
  chainId: 534352,
  chainName: 'Scroll',
};

export const SCROLL_TESTNET: ProviderConfig = {
  rpcUrl: config.blockchain.scrollTestnetRpcUrl,
  chainId: 534351,
  chainName: 'Scroll Sepolia',
};

export class ScrollProvider {
  private config: ProviderConfig;
  private provider: JsonRpcProvider;
  
  constructor(testnet: boolean = false) {
    this.config = testnet ? SCROLL_TESTNET : SCROLL_MAINNET;
    this.provider = new JsonRpcProvider(this.config.rpcUrl);
    logger.info(`ScrollProvider initialized with ${this.config.chainName}`);
  }
  
  switchNetwork(testnet: boolean): void {
    this.config = testnet ? SCROLL_TESTNET : SCROLL_MAINNET;
    this.provider = new JsonRpcProvider(this.config.rpcUrl);
    logger.info(`ScrollProvider switched to ${this.config.chainName}`);
  }
  
  getProvider(): JsonRpcProvider {
    return this.provider;
  }
  
  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return formatEther(balance);
    } catch (error) {
      logger.error('Error fetching balance', error);
      return '0.0000';
    }
  }
  
  async getBlockNumber(): Promise<number> {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      logger.error('Error fetching block number', error);
      return 0;
    }
  }
  
  async estimateGas(transaction: TransactionRequest): Promise<bigint> {
    try {
      return await this.provider.estimateGas(transaction);
    } catch (error) {
      logger.error('Error estimating gas', error);
      throw error;
    }
  }

  async getGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice || BigInt(0);
    } catch (error) {
      logger.error('Error fetching gas price', error);
      return BigInt(0);
    }
  }

  async getTransaction(hash: string) {
    try {
      return await this.provider.getTransaction(hash);
    } catch (error) {
      logger.error('Error fetching transaction', error);
      return null;
    }
  }

  async getTransactionReceipt(hash: string) {
    try {
      return await this.provider.getTransactionReceipt(hash);
    } catch (error) {
      logger.error('Error fetching transaction receipt', error);
      return null;
    }
  }

  async waitForTransaction(hash: string, confirmations: number = 1) {
    try {
      return await this.provider.waitForTransaction(hash, confirmations);
    } catch (error) {
      logger.error('Error waiting for transaction', error);
      throw error;
    }
  }
  
  getConfig(): ProviderConfig {
    return this.config;
  }
}

// Create a singleton instance
let scrollProviderInstance: ScrollProvider | null = null;

export function getScrollProvider(testnet: boolean = false): ScrollProvider {
  if (!scrollProviderInstance) {
    scrollProviderInstance = new ScrollProvider(testnet);
  }
  return scrollProviderInstance;
}

export const scrollProvider = getScrollProvider(false);

