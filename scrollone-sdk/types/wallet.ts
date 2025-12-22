/**
 * ScrollOne SDK v1 - Wallet Types
 */

export interface AccountInfo {
  address: string | null;
  isConnected: boolean;
}

export interface BalanceInfo {
  balance: string;
  formatted: string;
  symbol?: string;
}

export interface NetworkInfo {
  chainId: number;
  chainName: string;
  rpcUrl: string;
  isTestnet: boolean;
}
