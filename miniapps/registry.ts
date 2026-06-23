import { type MiniApp } from '@/store/miniAppStore';
import { loadMiniAppsFromWalrus } from '@/services/walrus/manifest';

// Curated dApps from the Sui ecosystem
export const MINIAPPS: MiniApp[] = [  {
    id: 'deepbook',
    name: 'DeepBook',
    url: 'https://deepbook.tech',
    icon: '📖',
    description: 'Native on-chain orderbook DEX on Sui — swap via DeepBook V3.',
    category: 'DeFi',
    featured: true,
    verified: true,
  },
  {
    id: 'cetus',
    name: 'Cetus',
    url: 'https://app.cetus.zone',
    icon: '🐬',
    description: 'Leading DEX and liquidity protocol on Sui.',
    category: 'DeFi',
    featured: true,
    verified: true,
  },
  {
    id: 'scallop',
    name: 'Scallop',
    url: 'https://app.scallop.io',
    icon: '🏦',
    description: 'Lend, borrow, and earn on Sui.',
    category: 'Lending',
    featured: true,
    verified: true,
  },
  {
    id: 'turbos',
    name: 'Turbos Finance',
    url: 'https://app.turbos.finance',
    icon: '💱',
    description: 'Concentrated liquidity DEX on Sui.',
    category: 'DeFi',
    featured: true,
    verified: true,
  },
  {
    id: 'aftermath',
    name: 'Aftermath Finance',
    url: 'https://aftermath.finance',
    icon: '⚡',
    description: 'AMM, liquid staking, and DeFi suite on Sui.',
    category: 'DeFi',
    featured: false,
    verified: true,
  },
  {
    id: 'suins',
    name: 'SuiNS',
    url: 'https://suins.io',
    icon: '🏷️',
    description: 'Register human-readable .sui names.',
    category: 'Tools',
    featured: true,
    verified: true,
  },
  {
    id: 'suivision',
    name: 'SuiVision',
    url: 'https://suivision.xyz',
    icon: '📊',
    description: 'Block explorer and analytics for Sui.',
    category: 'Tools',
    featured: false,
    verified: true,
  },
  {
    id: 'wormhole-bridge',
    name: 'Wormhole Bridge',
    url: 'https://portalbridge.com/sui',
    icon: '🌉',
    description: 'Bridge assets to and from Sui.',
    category: 'Bridge',
    featured: true,
    verified: true,
  },
  {
    id: 'onramp-ramp',
    name: 'Ramp On-Ramp',
    url: 'https://ramp.network/buy',
    icon: '💳',
    description: 'Buy crypto using cards or bank transfers.',
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
    id: 'flowx',
    name: 'FlowX Finance',
    url: 'https://flowx.finance',
    icon: '💧',
    description: 'DEX aggregator and liquidity hub on Sui.',
    category: 'DeFi',
    featured: false,
    verified: true,
  },
];

let activeMiniApps: MiniApp[] = MINIAPPS;

export function getActiveMiniApps(): MiniApp[] {
  return activeMiniApps;
}

export async function hydrateMiniAppsFromWalrus(isTestnet: boolean): Promise<MiniApp[]> {
  activeMiniApps = await loadMiniAppsFromWalrus(isTestnet);
  return activeMiniApps;
}

export function getMiniAppById(id: string): MiniApp | undefined {
  return activeMiniApps.find((app) => app.id === id);
}

export function getMiniAppsByCategory(category: string): MiniApp[] {
  return activeMiniApps.filter((app) => app.category === category);
}

export function getFeaturedMiniApps(): MiniApp[] {
  return activeMiniApps.filter((app) => app.featured);
}

export function getCategories(): string[] {
  const categories = new Set(activeMiniApps.map((app) => app.category));
  return Array.from(categories);
}
