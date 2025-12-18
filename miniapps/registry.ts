import { type MiniApp } from '@/store/miniAppStore';

// Curated real dApps from the Scroll ecosystem (https://scroll.io/ecosystem)
// Focus: core DeFi, bridge, tools, and NFT that are live on Scroll.
export const MINIAPPS: MiniApp[] = [
  // --- Core DeFi: DEXes ---
  {
    id: 'syncswap',
    name: 'SyncSwap',
    url: 'https://syncswap.xyz',
    icon: '💱',
    description: 'Scroll-native DEX for swaps and liquidity provision.',
    category: 'DeFi',
    featured: true,
    verified: true,
  },
  {
    id: 'skydrome',
    name: 'Skydrome',
    url: 'https://app.skydrome.finance',
    icon: '💧',
    description: 've(3,3) DEX powering incentivized liquidity on Scroll.',
    category: 'DeFi',
    featured: true,
    verified: true,
  },
  {
    id: 'izumi',
    name: 'iZiSwap (izumi)',
    url: 'https://izumi.finance/trade/swap?chainId=534352',
    icon: '💧',
    description: 'Concentrated liquidity and swaps on Scroll.',
    category: 'DeFi',
    featured: false,
    verified: true,
  },

  // --- Lending / Money Markets ---
  {
    id: 'layerbank',
    name: 'LayerBank',
    url: 'https://app.layerbank.finance',
    icon: '🏦',
    description: 'Lend and borrow blue‑chip assets on Scroll.',
    category: 'Lending',
    featured: true,
    verified: true,
  },
  {
    id: 'aave-v3-scroll',
    name: 'Aave v3 (Scroll)',
    url: 'https://app.aave.com/markets/?marketName=proto_scroll_v3',
    icon: '🏦',
    description: 'Blue‑chip lending and borrowing market on Scroll.',
    category: 'Lending',
    featured: true,
    verified: true,
  },

  // --- Bridges / Onboarding ---
  {
    id: 'scroll-bridge',
    name: 'Scroll Bridge',
    url: 'https://scroll.io/bridge',
    icon: '🌉',
    description: 'Official bridge between Ethereum and Scroll.',
    category: 'Bridge',
    featured: true,
    verified: true,
  },
  {
    id: 'onramp-ramp',
    name: 'Ramp On-Ramp',
    url: 'https://ramp.network/buy',
    icon: '💳',
    description: 'Buy crypto on Scroll using cards or bank transfers.',
    category: 'Onramp',
    featured: false,
    verified: true,
  },
  {
    id: 'onramp-moonpay',
    name: 'MoonPay On-Ramp',
    url: 'https://buy.moonpay.com',
    icon: '💳',
    description: 'Global fiat on-ramp for crypto purchases.',
    category: 'Onramp',
    featured: false,
    verified: true,
  },
  {
    id: 'onramp-transak',
    name: 'Transak On-Ramp',
    url: 'https://global.transak.com',
    icon: '💳',
    description: 'Multi-rail on-ramp with cards and local payment methods.',
    category: 'Onramp',
    featured: false,
    verified: true,
  },

  // --- NFT / Explorers / Tools ---
  {
    id: 'nftscan-scroll',
    name: 'NFTScan (Scroll)',
    url: 'https://scroll.nftscan.com',
    icon: '🖼️',
    description: 'NFT explorer and analytics for Scroll NFTs.',
    category: 'NFT',
    featured: false,
    verified: true,
  },
  {
    id: 'scrollscan',
    name: 'ScrollScan',
    url: 'https://scrollscan.com',
    icon: '📊',
    description: 'Block explorer for transactions and contracts on Scroll.',
    category: 'Tools',
    featured: false,
    verified: true,
  },
];

export function getMiniAppById(id: string): MiniApp | undefined {
  return MINIAPPS.find((app) => app.id === id);
}

export function getMiniAppsByCategory(category: string): MiniApp[] {
  return MINIAPPS.filter((app) => app.category === category);
}

export function getFeaturedMiniApps(): MiniApp[] {
  return MINIAPPS.filter((app) => app.featured);
}

export function getCategories(): string[] {
  const categories = new Set(MINIAPPS.map((app) => app.category));
  return Array.from(categories);
}
