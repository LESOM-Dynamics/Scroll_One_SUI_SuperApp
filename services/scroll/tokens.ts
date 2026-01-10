import { Contract, formatUnits, JsonRpcProvider, isAddress } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
// Token addresses verified from ScrollScan (https://scrollscan.com)
export const SCROLL_TOKENS: Record<string, TokenInfo> = {
  // Mainnet tokens
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4', // Verified on ScrollScan
    decimals: 6,
    icon: '💵',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether',
    address: '0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df', // Verified on ScrollScan (https://scrollscan.com)
    decimals: 6,
    icon: '💵',
  },
  SCR: {
    symbol: 'SCR',
    name: 'Scroll',
    address: '0xd29687c813D741E2F938F4aC377128810E217b1b', // Scroll governance token
    decimals: 18,
    icon: '🪙',
  },
  USX: {
    symbol: 'USX',
    name: 'USX',
    address: '0x3b005fefC63Ca7c8d25eE21FbA3787229ba4CF03', // Verified on ScrollScan (https://scrollscan.com)
    decimals: 18,
    icon: '💵',
  },
  WBTC: {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: '0x3C1BCa5a656e69edCD0D4E36BEbb3FcDAcA60Cf1', // Verified on ScrollScan (https://scrollscan.com)
    decimals: 8,
    icon: '₿',
  },
  DAI: {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0xcA77eB3fEFe3725Dc33bccB54eDEFc3D9f764f97', // Verified on ScrollScan (https://scrollscan.com)
    decimals: 18,
    icon: '💱',
  },
};

// Storage key for custom tokens
const CUSTOM_TOKENS_KEY = '@scroll_one:custom_tokens';

// Testnet token addresses (Scroll Sepolia)
// Note: Verify these addresses on ScrollScan testnet (https://sepolia.scrollscan.com)
export const SCROLL_TESTNET_TOKENS: Record<string, TokenInfo> = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xCe65b41c68F71a64f464273b02035D12daD32281', // UnVerified TODO: Update with real testnet address from ScrollScan
    decimals: 6,
    icon: '💵',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether',
    address: '0xffd2ece82f7959ae184d10fe17865d27b4f0fb94', // TODO: Update with real testnet address from ScrollScan
    decimals: 6,
    icon: '💵',
  },
  WETH: {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: '0x5300000000000000000000000000000000000004', // Verified on ScrollScan (https://scrollscan.com)
    decimals: 8,
    icon: '⟠',
  },
};

/**
 * Ensure provider is on the correct network
 */
function ensureProviderNetwork(isTestnet: boolean): JsonRpcProvider {
  const currentConfig = scrollProvider.getConfig();
  const expectedChainId = isTestnet ? 534351 : 534352;
  
  if (currentConfig.chainId !== expectedChainId) {
    scrollProvider.switchNetwork(isTestnet);
  }
  
  return scrollProvider.getProvider();
}

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
  provider?: JsonRpcProvider,
  isTestnet: boolean = false
): Promise<string> {
  const normalizedTokenAddress = tokenAddress.trim().toLowerCase();
  console.log(`[TokenService] Fetching balance for token ${normalizedTokenAddress} on ${isTestnet ? 'testnet' : 'mainnet'}`);
  
  try {
    // Ensure provider is on correct network if not provided
    const rpcProvider = provider || ensureProviderNetwork(isTestnet);
    
    // Verify contract exists at address
    let code: string;
    try {
      code = await rpcProvider.getCode(normalizedTokenAddress);
      if (code === '0x' || !code) {
        console.warn(`[TokenService] No contract found at ${normalizedTokenAddress} on ${isTestnet ? 'testnet' : 'mainnet'}`);
        return '0.0';
      }
    } catch (codeError: any) {
      console.warn(`[TokenService] Error checking contract code at ${normalizedTokenAddress}:`, codeError.message);
      return '0.0';
    }
    
    const tokenContract = new Contract(normalizedTokenAddress, ERC20_ABI, rpcProvider);
    
    // Fetch balance and decimals in parallel with timeout handling
    let balance: bigint;
    let decimals: number;
    
    try {
      [balance, decimals] = await Promise.all([
        tokenContract.balanceOf(walletAddress),
        tokenContract.decimals(),
      ]);
    } catch (callError: any) {
      // If the call fails, it might be that the contract doesn't implement ERC-20 properly
      // or the RPC is having issues - return 0.0 gracefully
      console.warn(`[TokenService] Contract call failed for ${normalizedTokenAddress}:`, callError.message || callError.code);
      return '0.0';
    }
    
    // Format balance using token decimals
    const formattedBalance = formatUnits(balance, decimals);
    
    console.log(`[TokenService] Balance: ${formattedBalance} (decimals: ${decimals})`);
    return formattedBalance;
  } catch (error: any) {
    // Log error but return 0.0 gracefully - don't break the app
    console.warn(`[TokenService] Error fetching token balance for ${normalizedTokenAddress}:`, {
      message: error.message,
      code: error.code,
      reason: error.reason,
      network: isTestnet ? 'testnet' : 'mainnet',
    });
    return '0.0';
  }
}

/**
 * Fetch token metadata (symbol, name, decimals)
 */
export async function getTokenMetadata(
  tokenAddress: string,
  provider?: JsonRpcProvider,
  isTestnet: boolean = false
): Promise<{ symbol: string; name: string; decimals: number } | null> {
  const normalizedTokenAddress = tokenAddress.trim().toLowerCase();
  console.log(`[TokenService] Fetching metadata for token ${normalizedTokenAddress} on ${isTestnet ? 'testnet' : 'mainnet'}`);
  
  try {
    // Ensure provider is on correct network if not provided
    const rpcProvider = provider || ensureProviderNetwork(isTestnet);
    
    // Verify contract exists at address
    let code: string;
    try {
      code = await rpcProvider.getCode(normalizedTokenAddress);
      if (code === '0x' || !code) {
        console.warn(`[TokenService] No contract found at ${normalizedTokenAddress} on ${isTestnet ? 'testnet' : 'mainnet'}`);
        return null;
      }
    } catch (codeError: any) {
      console.warn(`[TokenService] Error checking contract code at ${normalizedTokenAddress}:`, codeError.message);
      return null;
    }
    
    const tokenContract = new Contract(normalizedTokenAddress, ERC20_ABI, rpcProvider);
    
    let symbol: string;
    let name: string;
    let decimals: number;
    
    try {
      [symbol, name, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.name(),
        tokenContract.decimals(),
      ]);
    } catch (callError: any) {
      console.warn(`[TokenService] Contract call failed for ${normalizedTokenAddress}:`, callError.message || callError.code);
      return null;
    }
    
    return { symbol, name, decimals };
  } catch (error: any) {
    console.warn(`[TokenService] Error fetching token metadata for ${normalizedTokenAddress}:`, {
      message: error.message,
      code: error.code,
      reason: error.reason,
      network: isTestnet ? 'testnet' : 'mainnet',
    });
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
  console.log(`[TokenService] Fetching balances for ${tokenSymbols.length} tokens on ${isTestnet ? 'testnet' : 'mainnet'}`);
  
  // Ensure provider is on correct network before fetching
  const provider = ensureProviderNetwork(isTestnet);
  
  const balances = new Map<string, string>();
  
  // Get all tokens (built-in + custom) for balance fetching
  const allTokens = await getAllTokens(isTestnet);
  
  // Fetch all balances in parallel
  const balancePromises = tokenSymbols.map(async (symbol) => {
    const tokenInfo = allTokens[symbol.toUpperCase()] || getTokenInfo(symbol, isTestnet);
    if (!tokenInfo) {
      console.warn(`[TokenService] Token info not found for ${symbol}`);
      return { symbol, balance: '0.0' };
    }
    
    try {
      const balance = await getTokenBalance(tokenInfo.address, walletAddress, provider, isTestnet);
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
  provider?: JsonRpcProvider,
  isTestnet: boolean = false
): Promise<boolean> {
  try {
    // Ensure provider is on correct network if not provided
    const rpcProvider = provider || ensureProviderNetwork(isTestnet);
    const normalizedTokenAddress = tokenAddress.trim().toLowerCase();
    
    // First check if contract exists
    const code = await rpcProvider.getCode(normalizedTokenAddress);
    if (code === '0x') {
      return false;
    }
    
    const tokenContract = new Contract(normalizedTokenAddress, ERC20_ABI, rpcProvider);
    
    // Try to call decimals() - if it works, it's likely an ERC-20 token
    await tokenContract.decimals();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get custom tokens from storage
 */
export async function getCustomTokens(isTestnet: boolean = false): Promise<Record<string, TokenInfo>> {
  try {
    const key = isTestnet ? `${CUSTOM_TOKENS_KEY}_testnet` : `${CUSTOM_TOKENS_KEY}_mainnet`;
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    return {};
  } catch (error) {
    console.error('[TokenService] Error loading custom tokens:', error);
    return {};
  }
}

/**
 * Save custom token to storage
 */
export async function addCustomToken(token: TokenInfo, isTestnet: boolean = false): Promise<void> {
  try {
    const key = isTestnet ? `${CUSTOM_TOKENS_KEY}_testnet` : `${CUSTOM_TOKENS_KEY}_mainnet`;
    const customTokens = await getCustomTokens(isTestnet);
    customTokens[token.symbol.toUpperCase()] = token;
    await AsyncStorage.setItem(key, JSON.stringify(customTokens));
    console.log('[TokenService] Custom token added:', token.symbol);
  } catch (error) {
    console.error('[TokenService] Error saving custom token:', error);
    throw error;
  }
}

/**
 * Remove custom token from storage
 */
export async function removeCustomToken(symbol: string, isTestnet: boolean = false): Promise<void> {
  try {
    const key = isTestnet ? `${CUSTOM_TOKENS_KEY}_testnet` : `${CUSTOM_TOKENS_KEY}_mainnet`;
    const customTokens = await getCustomTokens(isTestnet);
    delete customTokens[symbol.toUpperCase()];
    await AsyncStorage.setItem(key, JSON.stringify(customTokens));
    console.log('[TokenService] Custom token removed:', symbol);
  } catch (error) {
    console.error('[TokenService] Error removing custom token:', error);
    throw error;
  }
}

/**
 * Get all tokens (built-in + custom)
 */
export async function getAllTokens(isTestnet: boolean = false): Promise<Record<string, TokenInfo>> {
  const builtInTokens = isTestnet ? SCROLL_TESTNET_TOKENS : SCROLL_TOKENS;
  const customTokens = await getCustomTokens(isTestnet);
  return { ...builtInTokens, ...customTokens };
}

/**
 * Get token info (checks built-in first, then custom)
 */
export async function getTokenInfoWithCustom(symbol: string, isTestnet: boolean = false): Promise<TokenInfo | null> {
  // Check built-in first
  const builtInInfo = getTokenInfo(symbol, isTestnet);
  if (builtInInfo) return builtInInfo;
  
  // Check custom tokens
  const customTokens = await getCustomTokens(isTestnet);
  return customTokens[symbol.toUpperCase()] || null;
}

/**
 * Get available token symbols (built-in + custom)
 */
export async function getAllAvailableTokens(isTestnet: boolean = false): Promise<string[]> {
  const builtInTokens = getAvailableTokens(isTestnet);
  const customTokens = await getCustomTokens(isTestnet);
  return [...builtInTokens, ...Object.keys(customTokens)];
}

/**
 * Import token by address - fetches metadata and adds to custom tokens
 */
export async function importTokenByAddress(
  tokenAddress: string,
  isTestnet: boolean = false
): Promise<TokenInfo> {
  // Validate address format
  if (!isAddress(tokenAddress)) {
    throw new Error('Invalid token address');
  }

  // Ensure provider is on correct network
  ensureProviderNetwork(isTestnet);

  // Validate it's an ERC-20 token
  const isValid = await isValidERC20Token(tokenAddress, undefined, isTestnet);
  if (!isValid) {
    throw new Error(`Address is not a valid ERC-20 token on ${isTestnet ? 'testnet' : 'mainnet'}`);
  }

  // Fetch token metadata
  const metadata = await getTokenMetadata(tokenAddress, undefined, isTestnet);
  if (!metadata) {
    throw new Error('Could not fetch token metadata');
  }

  // Check if token already exists (built-in or custom)
  const existingBuiltIn = getTokenInfo(metadata.symbol, isTestnet);
  if (existingBuiltIn && existingBuiltIn.address.toLowerCase() === tokenAddress.toLowerCase()) {
    throw new Error('Token already exists in your list');
  }

  const customTokens = await getCustomTokens(isTestnet);
  const existingCustom = customTokens[metadata.symbol.toUpperCase()];
  if (existingCustom && existingCustom.address.toLowerCase() === tokenAddress.toLowerCase()) {
    throw new Error('Token already exists in your list');
  }

  // Create token info
  const tokenInfo: TokenInfo = {
    symbol: metadata.symbol,
    name: metadata.name,
    address: tokenAddress,
    decimals: metadata.decimals,
    icon: '💱', // Default icon, user can customize later if needed
  };

  // Save to custom tokens
  await addCustomToken(tokenInfo, isTestnet);

  return tokenInfo;
}
