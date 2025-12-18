import { Contract, formatUnits, JsonRpcProvider } from 'ethers';
import { scrollProvider } from './provider';

// ERC-20 Token ABI (minimal interface for balanceOf and decimals)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon: string;
}

// Common token addresses on Scroll network
// Note: These are placeholder addresses - update with actual deployed token addresses
export const SCROLL_TOKENS: Record<string, TokenInfo> = {
  // Mainnet tokens
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x06eFdBFf2a14a7c8E15953D5F4e4C0A8b8b8b8b8', // Placeholder - update with real address
    decimals: 6,
    icon: '💵',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether',
    address: '0x06eFdBFf2a14a7c8E15953D5F4e4C0A8b8b8b8b9', // Placeholder - update with real address
    decimals: 6,
    icon: '💵',
  },
  WBTC: {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: '0x06eFdBFf2a14a7c8E15953D5F4e4C0A8b8b8b8bA', // Placeholder - update with real address
    decimals: 8,
    icon: '₿',
  },
  DAI: {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0x06eFdBFf2a14a7c8E15953D5F4e4C0A8b8b8b8bB', // Placeholder - update with real address
    decimals: 18,
    icon: '💱',
  },
};

// Testnet token addresses (if different from mainnet)
export const SCROLL_TESTNET_TOKENS: Record<string, TokenInfo> = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x06eFdBFf2a14a7c8E15953D5F4e4C0A8b8b8b8b8', // Placeholder - update with real testnet address
    decimals: 6,
    icon: '💵',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether',
    address: '0x06eFdBFf2a14a7c8E15953D5F4e4C0A8b8b8b8b9', // Placeholder - update with real testnet address
    decimals: 6,
    icon: '💵',
  },
};

/**
 * Get token info for a given symbol
 */
export function getTokenInfo(symbol: string, isTestnet: boolean = false): TokenInfo | null {
  const tokens = isTestnet ? SCROLL_TESTNET_TOKENS : SCROLL_TOKENS;
  return tokens[symbol.toUpperCase()] || null;
}

/**
 * Get all available token symbols
 */
export function getAvailableTokens(isTestnet: boolean = false): string[] {
  const tokens = isTestnet ? SCROLL_TESTNET_TOKENS : SCROLL_TOKENS;
  return Object.keys(tokens);
}

/**
 * Fetch ERC-20 token balance for a given address
 */
export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string,
  provider?: JsonRpcProvider
): Promise<string> {
  const normalizedTokenAddress = tokenAddress.trim().toLowerCase();
  console.log(`[TokenService] Fetching balance for token ${normalizedTokenAddress}`);
  
  try {
    const rpcProvider = provider || scrollProvider.getProvider();
    const tokenContract = new Contract(normalizedTokenAddress, ERC20_ABI, rpcProvider);
    
    // Fetch balance and decimals in parallel
    const [balance, decimals] = await Promise.all([
      tokenContract.balanceOf(walletAddress),
      tokenContract.decimals(),
    ]);
    
    // Format balance using token decimals
    const formattedBalance = formatUnits(balance, decimals);
    
    console.log(`[TokenService] Balance: ${formattedBalance} (decimals: ${decimals})`);
    return formattedBalance;
  } catch (error) {
    console.error(`[TokenService] Error fetching token balance:`, error);
    return '0.0';
  }
}

/**
 * Fetch token metadata (symbol, name, decimals)
 */
export async function getTokenMetadata(
  tokenAddress: string,
  provider?: JsonRpcProvider
): Promise<{ symbol: string; name: string; decimals: number } | null> {
  const normalizedTokenAddress = tokenAddress.trim().toLowerCase();
  console.log(`[TokenService] Fetching metadata for token ${normalizedTokenAddress}`);
  
  try {
    const rpcProvider = provider || scrollProvider.getProvider();
    const tokenContract = new Contract(normalizedTokenAddress, ERC20_ABI, rpcProvider);
    
    const [symbol, name, decimals] = await Promise.all([
      tokenContract.symbol(),
      tokenContract.name(),
      tokenContract.decimals(),
    ]);
    
    return { symbol, name, decimals };
  } catch (error) {
    console.error(`[TokenService] Error fetching token metadata:`, error);
    return null;
  }
}

/**
 * Fetch balances for multiple tokens
 */
export async function getTokenBalances(
  walletAddress: string,
  tokenSymbols: string[],
  isTestnet: boolean = false
): Promise<Map<string, string>> {
  console.log(`[TokenService] Fetching balances for ${tokenSymbols.length} tokens`);
  
  const balances = new Map<string, string>();
  const provider = scrollProvider.getProvider();
  
  // Fetch all balances in parallel
  const balancePromises = tokenSymbols.map(async (symbol) => {
    const tokenInfo = getTokenInfo(symbol, isTestnet);
    if (!tokenInfo) {
      console.warn(`[TokenService] Token info not found for ${symbol}`);
      return { symbol, balance: '0.0' };
    }
    
    try {
      const balance = await getTokenBalance(tokenInfo.address, walletAddress, provider);
      return { symbol, balance };
    } catch (error) {
      console.error(`[TokenService] Error fetching balance for ${symbol}:`, error);
      return { symbol, balance: '0.0' };
    }
  });
  
  const results = await Promise.all(balancePromises);
  
  results.forEach(({ symbol, balance }) => {
    balances.set(symbol, balance);
  });
  
  return balances;
}

/**
 * Check if a token address is valid and is an ERC-20 token
 */
export async function isValidERC20Token(
  tokenAddress: string,
  provider?: JsonRpcProvider
): Promise<boolean> {
  try {
    const rpcProvider = provider || scrollProvider.getProvider();
    const normalizedTokenAddress = tokenAddress.trim().toLowerCase();
    const tokenContract = new Contract(normalizedTokenAddress, ERC20_ABI, rpcProvider);
    
    // Try to call decimals() - if it works, it's likely an ERC-20 token
    await tokenContract.decimals();
    return true;
  } catch (error) {
    return false;
  }
}
