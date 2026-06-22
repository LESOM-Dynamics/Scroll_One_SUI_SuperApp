export type SupportedEnvironment = 'dev' | 'testnet' | 'mainnet';

export interface ChainConfig {
  chainId: number;
  chainName: string;
  rpcUrl: string;
  explorerTxUrl: string;
  network: 'mainnet' | 'testnet' | 'devnet';
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const CHAIN_BY_ENV: Record<SupportedEnvironment, ChainConfig> = {
  dev: {
    chainId: 103,
    chainName: 'Sui Devnet',
    network: 'devnet',
    rpcUrl: process.env.EXPO_PUBLIC_SUI_DEVNET_RPC_URL || 'https://fullnode.devnet.sui.io:443',
    explorerTxUrl: 'https://suiscan.xyz/devnet/tx/',
    nativeCurrency: { name: 'Sui', symbol: 'SUI', decimals: 9 },
  },
  testnet: {
    chainId: 102,
    chainName: 'Sui Testnet',
    network: 'testnet',
    rpcUrl: process.env.EXPO_PUBLIC_SUI_TESTNET_RPC_URL || 'https://fullnode.testnet.sui.io:443',
    explorerTxUrl: 'https://suiscan.xyz/testnet/tx/',
    nativeCurrency: { name: 'Sui', symbol: 'SUI', decimals: 9 },
  },
  mainnet: {
    chainId: 101,
    chainName: 'Sui Mainnet',
    network: 'mainnet',
    rpcUrl: process.env.EXPO_PUBLIC_SUI_MAINNET_RPC_URL || 'https://fullnode.mainnet.sui.io:443',
    explorerTxUrl: 'https://suiscan.xyz/mainnet/tx/',
    nativeCurrency: { name: 'Sui', symbol: 'SUI', decimals: 9 },
  },
};
