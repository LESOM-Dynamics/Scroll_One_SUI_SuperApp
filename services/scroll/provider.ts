import { JsonRpcProvider, formatEther, parseEther, TransactionRequest } from 'ethers';

const SCROLL_MAINNET_RPC = 'https://rpc.scroll.io';
const SCROLL_TESTNET_RPC = 'https://sepolia-rpc.scroll.io';

export interface ProviderConfig {
  rpcUrl: string;
  chainId: number;
  chainName: string;
}

export const SCROLL_MAINNET: ProviderConfig = {
  rpcUrl: SCROLL_MAINNET_RPC,
  chainId: 534352,
  chainName: 'Scroll',
};

export const SCROLL_TESTNET: ProviderConfig = {
  rpcUrl: SCROLL_TESTNET_RPC,
  chainId: 534351,
  chainName: 'Scroll Sepolia',
};

export class ScrollProvider {
  private config: ProviderConfig;
  private provider: JsonRpcProvider;
  
  constructor(testnet: boolean = false) {
    this.config = testnet ? SCROLL_TESTNET : SCROLL_MAINNET;
    this.provider = new JsonRpcProvider(this.config.rpcUrl);
    console.log(`[ScrollProvider] Initialized with ${this.config.chainName}`);
  }
  
  switchNetwork(testnet: boolean): void {
    this.config = testnet ? SCROLL_TESTNET : SCROLL_MAINNET;
    this.provider = new JsonRpcProvider(this.config.rpcUrl);
    console.log(`[ScrollProvider] Switched to ${this.config.chainName}`);
  }
  
  getProvider(): JsonRpcProvider {
    return this.provider;
  }
  
  async getBalance(address: string): Promise<string> {
    console.log(`[ScrollProvider] Fetching balance for ${address}`);
    
    try {
      const balance = await this.provider.getBalance(address);
      const balanceEth = formatEther(balance);
      
      console.log(`[ScrollProvider] Balance: ${balanceEth} ETH`);
      return balanceEth;
    } catch (error) {
      console.error('[ScrollProvider] Error fetching balance:', error);
      return '0.0000';
    }
  }
  
  async getBlockNumber(): Promise<number> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      return blockNumber;
    } catch (error) {
      console.error('[ScrollProvider] Error fetching block number:', error);
      return 0;
    }
  }
  
  async estimateGas(transaction: TransactionRequest): Promise<bigint> {
    console.log('[ScrollProvider] Estimating gas for transaction');
    
    try {
      const gasEstimate = await this.provider.estimateGas(transaction);
      console.log(`[ScrollProvider] Estimated gas: ${gasEstimate.toString()}`);
      return gasEstimate;
    } catch (error) {
      console.error('[ScrollProvider] Error estimating gas:', error);
      throw error;
    }
  }

  async getGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice || BigInt(0);
    } catch (error) {
      console.error('[ScrollProvider] Error fetching gas price:', error);
      return BigInt(0);
    }
  }

  async getTransaction(hash: string) {
    try {
      return await this.provider.getTransaction(hash);
    } catch (error) {
      console.error('[ScrollProvider] Error fetching transaction:', error);
      return null;
    }
  }

  async getTransactionReceipt(hash: string) {
    try {
      return await this.provider.getTransactionReceipt(hash);
    } catch (error) {
      console.error('[ScrollProvider] Error fetching transaction receipt:', error);
      return null;
    }
  }

  async waitForTransaction(hash: string, confirmations: number = 1) {
    try {
      return await this.provider.waitForTransaction(hash, confirmations);
    } catch (error) {
      console.error('[ScrollProvider] Error waiting for transaction:', error);
      throw error;
    }
  }
  
  getConfig(): ProviderConfig {
    return this.config;
  }
}

// Create a singleton instance that can be updated dynamically
let scrollProviderInstance: ScrollProvider | null = null;

export function getScrollProvider(testnet: boolean = false): ScrollProvider {
  if (!scrollProviderInstance) {
    scrollProviderInstance = new ScrollProvider(testnet);
  }
  return scrollProviderInstance;
}

export const scrollProvider = getScrollProvider(false);
