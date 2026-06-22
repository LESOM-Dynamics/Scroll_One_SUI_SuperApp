import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc';
import { MIST_PER_SUI, SUI_TYPE_ARG } from '@mysten/sui/utils';
import { Transaction } from '@mysten/sui/transactions';

export type SuiNetworkName = 'mainnet' | 'testnet' | 'devnet';

export interface ProviderConfig {
  network: SuiNetworkName;
  chainId: number;
  chainName: string;
  rpcUrl: string;
  explorerTxUrl: string;
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

const EXPLORER_URLS: Record<SuiNetworkName, string> = {
  mainnet: 'https://suiscan.xyz/mainnet/tx/',
  testnet: 'https://suiscan.xyz/testnet/tx/',
  devnet: 'https://suiscan.xyz/devnet/tx/',
};

function resolveRpcUrl(network: SuiNetworkName): string {
  if (network === 'mainnet') {
    return process.env.EXPO_PUBLIC_SUI_MAINNET_RPC_URL || getJsonRpcFullnodeUrl('mainnet');
  }
  if (network === 'testnet') {
    return process.env.EXPO_PUBLIC_SUI_TESTNET_RPC_URL || getJsonRpcFullnodeUrl('testnet');
  }
  return process.env.EXPO_PUBLIC_SUI_DEVNET_RPC_URL || getJsonRpcFullnodeUrl('devnet');
}

export class SuiProvider {
  private config: ProviderConfig;
  private client: SuiJsonRpcClient;

  constructor(testnet: boolean = false, devnet: boolean = false) {
    const network: SuiNetworkName = devnet ? 'devnet' : testnet ? 'testnet' : 'mainnet';
    this.config = this.buildConfig(network);
    this.client = new SuiJsonRpcClient({ url: this.config.rpcUrl, network });
    console.log(`[SuiProvider] Initialized with ${this.config.chainName}`);
  }

  private buildConfig(network: SuiNetworkName): ProviderConfig {
    return {
      network,
      chainId: CHAIN_IDS[network],
      chainName: CHAIN_NAMES[network],
      rpcUrl: resolveRpcUrl(network),
      explorerTxUrl: EXPLORER_URLS[network],
    };
  }

  switchNetwork(testnet: boolean, devnet: boolean = false): void {
    const network: SuiNetworkName = devnet ? 'devnet' : testnet ? 'testnet' : 'mainnet';
    this.config = this.buildConfig(network);
    this.client = new SuiJsonRpcClient({ url: this.config.rpcUrl, network });
    console.log(`[SuiProvider] Switched to ${this.config.chainName}`);
  }

  getClient(): SuiJsonRpcClient {
    return this.client;
  }

  async getBalance(address: string, coinType: string = SUI_TYPE_ARG): Promise<string> {
    console.log(`[SuiProvider] Fetching balance for ${address}`);

    try {
      const balance = await this.client.getBalance({ owner: address, coinType });
      const suiBalance = Number(balance.totalBalance) / Number(MIST_PER_SUI);
      const formatted = suiBalance.toFixed(4);
      console.log(`[SuiProvider] Balance: ${formatted} SUI`);
      return formatted;
    } catch (error) {
      console.error('[SuiProvider] Error fetching balance:', error);
      return '0.0000';
    }
  }

  async getCheckpoint(): Promise<string> {
    try {
      const sequence = await this.client.getLatestCheckpointSequenceNumber();
      return sequence;
    } catch (error) {
      console.error('[SuiProvider] Error fetching checkpoint:', error);
      return '0';
    }
  }

  async estimateTransactionFee(
    buildTx: (tx: Transaction) => void,
    sender: string
  ): Promise<{ budget: bigint; price: bigint; fee: string }> {
    console.log('[SuiProvider] Estimating gas for transaction');

    try {
      const tx = new Transaction();
      buildTx(tx);
      tx.setSender(sender);

      const txBytes = await tx.build({ client: this.client.core });
      const dryRun = await this.client.dryRunTransactionBlock({
        transactionBlock: txBytes,
      });

      const computationCost = BigInt(dryRun.effects?.gasUsed?.computationCost ?? 0);
      const storageCost = BigInt(dryRun.effects?.gasUsed?.storageCost ?? 0);
      const storageRebate = BigInt(dryRun.effects?.gasUsed?.storageRebate ?? 0);
      const total = computationCost + storageCost - storageRebate;
      const gasPrice = await this.client.getReferenceGasPrice();

      return {
        budget: total > 0n ? total : 5_000_000n,
        price: BigInt(gasPrice),
        fee: (Number(total > 0n ? total : 5_000_000n) / Number(MIST_PER_SUI)).toFixed(6),
      };
    } catch (error) {
      console.error('[SuiProvider] Error estimating gas:', error);
      return { budget: 5_000_000n, price: 750n, fee: '0.005' };
    }
  }

  async getReferenceGasPrice(): Promise<bigint> {
    try {
      const price = await this.client.getReferenceGasPrice();
      return BigInt(price);
    } catch (error) {
      console.error('[SuiProvider] Error fetching gas price:', error);
      return 750n;
    }
  }

  async getTransaction(digest: string) {
    try {
      return await this.client.getTransactionBlock({
        digest,
        options: { showEffects: true, showBalanceChanges: true },
      });
    } catch (error) {
      console.error('[SuiProvider] Error fetching transaction:', error);
      return null;
    }
  }

  async waitForTransaction(digest: string) {
    try {
      return await this.client.core.waitForTransaction({
        digest,
        options: { showEffects: true },
      });
    } catch (error) {
      console.error('[SuiProvider] Error waiting for transaction:', error);
      throw error;
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
