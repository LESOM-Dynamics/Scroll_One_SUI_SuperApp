import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  type Eip1193Provider,
  type TransactionRequest,
} from 'ethers';
import { CHAIN_BY_ENV, type SupportedEnvironment } from './networks';
import type { BlockchainClient, ContractExecutionConfig, TransactionLifecycle, WalletConnection } from './types';
import { NetworkValidationError, TransactionExecutionError, WalletConnectionError } from './errors';

function getInjectedProvider(): Eip1193Provider | null {
  if (typeof window === 'undefined') return null;
  return ((window as any).ethereum as Eip1193Provider | undefined) ?? null;
}

export class ScrollBlockchainClient implements BlockchainClient {
  private browserProvider: BrowserProvider | null = null;
  private rpcProvider: JsonRpcProvider;

  constructor(public readonly environment: SupportedEnvironment = 'mainnet') {
    this.rpcProvider = new JsonRpcProvider(CHAIN_BY_ENV[environment].rpcUrl);
  }

  get chainConfig() {
    return CHAIN_BY_ENV[this.environment];
  }

  async connectWallet(): Promise<WalletConnection> {
    const injected = getInjectedProvider();
    if (!injected) {
      throw new WalletConnectionError('No EIP-1193 wallet detected. Install MetaMask/WalletConnect compatible wallet.');
    }

    this.browserProvider = new BrowserProvider(injected);
    await this.browserProvider.send('eth_requestAccounts', []);
    await this.validateNetwork();

    const signer = await this.browserProvider.getSigner();
    const address = await signer.getAddress();
    const network = await this.browserProvider.getNetwork();

    return {
      address,
      chainId: Number(network.chainId),
      walletType: 'metamask',
    };
  }

  async validateNetwork(): Promise<void> {
    if (!this.browserProvider) {
      return;
    }

    const network = await this.browserProvider.getNetwork();
    const currentChainId = Number(network.chainId);
    if (currentChainId !== this.chainConfig.chainId) {
      throw new NetworkValidationError(
        `Wrong network: expected ${this.chainConfig.chainName} (${this.chainConfig.chainId}), got ${currentChainId}`,
      );
    }
  }

  async withSigner() {
    if (!this.browserProvider) {
      throw new WalletConnectionError('Wallet not connected. Call connectWallet() first.');
    }

    await this.validateNetwork();
    return this.browserProvider.getSigner();
  }

  async sendNativeTransaction(
    tx: TransactionRequest,
    confirmations = 1,
  ): Promise<TransactionLifecycle> {
    try {
      const signer = await this.withSigner();
      const response = await signer.sendTransaction(tx);
      const receipt = await response.wait(confirmations);

      return {
        hash: response.hash,
        explorerUrl: `${this.chainConfig.explorerTxUrl}${response.hash}`,
        confirmations,
        receipt,
      };
    } catch (error) {
      throw new TransactionExecutionError(
        `Native transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async callContract(
    config: ContractExecutionConfig,
    confirmations = 1,
  ): Promise<TransactionLifecycle> {
    try {
      const signer = await this.withSigner();
      const contract = new Contract(config.address, config.abi, signer);
      const method = (contract as any)[config.method];

      if (typeof method !== 'function') {
        throw new Error(`Method ${config.method} not found in contract ABI.`);
      }

      const txResponse = await method(...(config.args ?? []), {
        value: config.valueWei,
      });
      const receipt = await txResponse.wait(confirmations);

      return {
        hash: txResponse.hash,
        explorerUrl: `${this.chainConfig.explorerTxUrl}${txResponse.hash}`,
        confirmations,
        receipt,
      };
    } catch (error) {
      throw new TransactionExecutionError(
        `Contract execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getTransaction(hash: string) {
    return this.rpcProvider.getTransaction(hash);
  }
}
