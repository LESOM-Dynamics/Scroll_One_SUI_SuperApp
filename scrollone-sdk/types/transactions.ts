/**
 * ScrollOne SDK v1 - Transaction Types
 */

export interface TransactionRequest {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  nonce?: number;
}

export interface TransactionResponse {
  hash: string;
  from: string;
  to: string | null;
}

export interface SignMessageRequest {
  message: string;
}

export interface SignMessageResponse {
  signature: string;
}

export interface SignTypedDataRequest {
  domain: any;
  types: any;
  value: any;
}

export interface SignTypedDataResponse {
  signature: string;
}

export interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  estimatedFee: string;
}

export interface TransactionStatus {
  status: 'pending' | 'confirmed' | 'failed';
  hash: string;
  blockNumber?: number;
  confirmations?: number;
}
