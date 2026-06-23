import { env } from '@/config/env';

export interface WalrusEndpoints {
  publisher?: string;
  aggregator: string;
  uploadRelay: string;
}

export function getWalrusEndpoints(isTestnet: boolean): WalrusEndpoints {
  if (isTestnet) {
    return {
      publisher: env.walrus.publisherTestnet,
      aggregator: env.walrus.aggregatorTestnet,
      uploadRelay: env.walrus.uploadRelayTestnet,
    };
  }
  return {
    aggregator: env.walrus.aggregatorMainnet,
    uploadRelay: env.walrus.uploadRelayMainnet,
  };
}

export const WALRUS_DEFAULT_EPOCHS = 5;
