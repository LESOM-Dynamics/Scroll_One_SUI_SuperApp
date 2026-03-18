import type { ContractRunner, TransactionReceipt, TransactionRequest, TransactionResponse } from 'ethers';
import type { ChainConfig, SupportedEnvironment } from './networks';

export interface WalletConnection {
  address: string;
  chainId: number;
  walletType: 'metamask' | 'walletconnect' | 'embedded';
}

export interface TransactionLifecycle {
  hash: string;
  explorerUrl: string;
  confirmations: number;
  receipt?: TransactionReceipt | null;
}

export interface ContractExecutionConfig {
  address: string;
  abi: readonly string[];
  method: string;
  args?: readonly unknown[];
  valueWei?: bigint;
}

export interface BlockchainClient {
  environment: SupportedEnvironment;
  chainConfig: ChainConfig;
  connectWallet(): Promise<WalletConnection>;
  validateNetwork(): Promise<void>;
  sendNativeTransaction(tx: TransactionRequest, confirmations?: number): Promise<TransactionLifecycle>;
  callContract(config: ContractExecutionConfig, confirmations?: number): Promise<TransactionLifecycle>;
  withSigner(): Promise<ContractRunner>;
  getTransaction(hash: string): Promise<TransactionResponse | null>;
}
