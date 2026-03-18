export type SupportedEnvironment = 'dev' | 'testnet' | 'mainnet';

export interface ChainConfig {
  chainId: number;
  chainName: string;
  rpcUrl: string;
  explorerTxUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const CHAIN_BY_ENV: Record<SupportedEnvironment, ChainConfig> = {
  dev: {
    chainId: 534351,
    chainName: 'Scroll Sepolia (Dev)',
    rpcUrl: process.env.EXPO_PUBLIC_SCROLL_DEV_RPC_URL || 'https://sepolia-rpc.scroll.io',
    explorerTxUrl: 'https://sepolia.scrollscan.com/tx/',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  testnet: {
    chainId: 534351,
    chainName: 'Scroll Sepolia',
    rpcUrl: process.env.EXPO_PUBLIC_SCROLL_TESTNET_RPC_URL || 'https://sepolia-rpc.scroll.io',
    explorerTxUrl: 'https://sepolia.scrollscan.com/tx/',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  mainnet: {
    chainId: 534352,
    chainName: 'Scroll',
    rpcUrl: process.env.EXPO_PUBLIC_SCROLL_MAINNET_RPC_URL || 'https://rpc.scroll.io',
    explorerTxUrl: 'https://scrollscan.com/tx/',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
};
