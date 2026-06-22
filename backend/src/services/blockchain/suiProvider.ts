import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { MIST_PER_SUI } from '@mysten/sui/utils';
import { logger } from '../../config/logger';

export type SuiNetworkName = 'mainnet' | 'testnet' | 'devnet';

export interface ProviderConfig {
  network: SuiNetworkName;
  chainId: number;
  chainName: string;
  rpcUrl: string;
}

const CHAIN_IDS: Record<SuiNetworkName, number> = {
  mainnet: 101,
  testnet: 102,
  devnet: 103,
};

const CHAIN_NAMES: Record<SuiNetworkName, string> = {
  mainnet: 'Sui Mainnet',
  testnet: 'Sui Testnet',
  devnet: 'Sui Devnet',
};

function resolveRpcUrl(network: SuiNetworkName): string {
  if (network === 'mainnet') {
    return process.env.SUI_MAINNET_RPC_URL || getJsonRpcFullnodeUrl('mainnet');
  }
  if (network === 'testnet') {
    return process.env.SUI_TESTNET_RPC_URL || getJsonRpcFullnodeUrl('testnet');
  }
  return process.env.SUI_DEVNET_RPC_URL || getJsonRpcFullnodeUrl('devnet');
}

export class SuiProvider {
  private config: ProviderConfig;
  private client: SuiJsonRpcClient;

  constructor(testnet: boolean = false) {
    const network: SuiNetworkName = testnet ? 'testnet' : 'mainnet';
    this.config = {
      network,
      chainId: CHAIN_IDS[network],
      chainName: CHAIN_NAMES[network],
      rpcUrl: resolveRpcUrl(network),
    };
    this.client = new SuiJsonRpcClient({ url: this.config.rpcUrl, network });
    logger.info(`SuiProvider initialized with ${this.config.chainName}`);
  }

  switchNetwork(testnet: boolean): void {
    const network: SuiNetworkName = testnet ? 'testnet' : 'mainnet';
    this.config = {
      network,
      chainId: CHAIN_IDS[network],
      chainName: CHAIN_NAMES[network],
      rpcUrl: resolveRpcUrl(network),
    };
    this.client = new SuiJsonRpcClient({ url: this.config.rpcUrl, network });
    logger.info(`SuiProvider switched to ${this.config.chainName}`);
  }

  getClient(): SuiJsonRpcClient {
    return this.client;
  }

  async getBalance(address: string, coinType?: string): Promise<string> {
    try {
      const balance = await this.client.getBalance({
        owner: address,
        coinType: coinType ?? '0x2::sui::SUI',
      });
      return (Number(balance.totalBalance) / Number(MIST_PER_SUI)).toFixed(4);
    } catch (error) {
      logger.error('Error fetching balance', error);
      return '0.0000';
    }
  }

  getConfig(): ProviderConfig {
    return this.config;
  }
}

let suiProviderInstance: SuiProvider | null = null;

export function getSuiProvider(testnet: boolean = false): SuiProvider {
  if (!suiProviderInstance) {
    suiProviderInstance = new SuiProvider(testnet);
  }
  return suiProviderInstance;
}

export const suiProvider = getSuiProvider(false);
