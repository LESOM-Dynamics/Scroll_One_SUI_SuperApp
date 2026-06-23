/**
 * Centralized environment configuration for the mobile app.
 * Expo exposes only variables prefixed with EXPO_PUBLIC_ at build time.
 */
export const env = {
  sui: {
    mainnetRpcUrl:
      process.env.EXPO_PUBLIC_SUI_MAINNET_RPC_URL || 'https://fullnode.mainnet.sui.io:443',
    testnetRpcUrl:
      process.env.EXPO_PUBLIC_SUI_TESTNET_RPC_URL || 'https://fullnode.testnet.sui.io:443',
    devnetRpcUrl:
      process.env.EXPO_PUBLIC_SUI_DEVNET_RPC_URL || 'https://fullnode.devnet.sui.io:443',
  },
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  },
  walrus: {
    publisherTestnet:
      process.env.EXPO_PUBLIC_WALRUS_PUBLISHER_TESTNET ||
      'https://publisher.walrus-testnet.walrus.space',
    aggregatorTestnet:
      process.env.EXPO_PUBLIC_WALRUS_AGGREGATOR_TESTNET ||
      'https://aggregator.walrus-testnet.walrus.space',
    aggregatorMainnet:
      process.env.EXPO_PUBLIC_WALRUS_AGGREGATOR_MAINNET ||
      'https://aggregator.walrus-mainnet.walrus.space',
    uploadRelayTestnet:
      process.env.EXPO_PUBLIC_WALRUS_UPLOAD_RELAY_TESTNET ||
      'https://upload-relay.testnet.walrus.space',
    uploadRelayMainnet:
      process.env.EXPO_PUBLIC_WALRUS_UPLOAD_RELAY_MAINNET ||
      'https://upload-relay.mainnet.walrus.space',
    /** Optional: Walrus blob ID for the mini-app manifest (set after first publish). */
    manifestBlobId:
      process.env.EXPO_PUBLIC_WALRUS_MANIFEST_BLOB_ID || '',
  },
} as const;
