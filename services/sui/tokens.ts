import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUI_TYPE_ARG, MIST_PER_SUI } from '@mysten/sui/utils';
import { suiProvider } from './provider';

export interface TokenInfo {
  symbol: string;
  name: string;
  coinType: string;
  decimals: number;
  icon: string;
}

/** @deprecated Use coinType — kept for UI compatibility */
export type TokenInfoWithAddress = TokenInfo & { address: string };

export const SUI_TOKENS: Record<string, TokenInfo> = {
  SUI: {
    symbol: 'SUI',
    name: 'Sui',
    coinType: SUI_TYPE_ARG,
    decimals: 9,
    icon: '💧',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    coinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15994c3370ca1aba437173::usdc::USDC',
    decimals: 6,
    icon: '💵',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    coinType: '0xc060006111016b8a020ad5b33834904a663aaa06d0e5e6e8647625872ea7b4e0::usdt::USDT',
    decimals: 6,
    icon: '💵',
  },
  CETUS: {
    symbol: 'CETUS',
    name: 'Cetus Protocol',
    coinType: '0x6861635da1731510c6f0b7c178177d7f5b665f19674d18216841e703e085662c::cetus::CETUS',
    decimals: 9,
    icon: '🐬',
  },
  WETH: {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    coinType: '0xaf8cd5edc19c4512f4259f0bee6512798cb763a92a165546c730797b4c035119::eth::ETH',
    decimals: 8,
    icon: '⟠',
  },
};

export const SUI_TESTNET_TOKENS: Record<string, TokenInfo> = {
  SUI: {
    symbol: 'SUI',
    name: 'Sui',
    coinType: SUI_TYPE_ARG,
    decimals: 9,
    icon: '💧',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    coinType: '0xa1ec7fc00a6f40db9693ad14124d0c94ad89a8c1744a647fd279e94c9ec571a2::usdc::USDC',
    decimals: 6,
    icon: '💵',
  },
};

const CUSTOM_TOKENS_KEY = '@sui_one:custom_tokens';

function withAddress(token: TokenInfo): TokenInfoWithAddress {
  return { ...token, address: token.coinType };
}

function ensureProviderNetwork(isTestnet: boolean): void {
  const currentConfig = suiProvider.getConfig();
  const expectedNetwork = isTestnet ? 'testnet' : 'mainnet';

  if (currentConfig.network !== expectedNetwork) {
    suiProvider.switchNetwork(isTestnet);
  }
}

export function getTokenInfo(symbol: string, isTestnet: boolean = false): TokenInfo | null {
  const tokens = isTestnet ? SUI_TESTNET_TOKENS : SUI_TOKENS;
  return tokens[symbol.toUpperCase()] || null;
}

export function getAvailableTokens(isTestnet: boolean = false): string[] {
  const tokens = isTestnet ? SUI_TESTNET_TOKENS : SUI_TOKENS;
  return Object.keys(tokens);
}

function formatBalance(totalBalance: string, decimals: number): string {
  const value = Number(totalBalance) / 10 ** decimals;
  return value.toFixed(Math.min(decimals, 4));
}

export async function getTokenBalance(
  coinType: string,
  walletAddress: string,
  isTestnet: boolean = false
): Promise<string> {
  console.log(`[TokenService] Fetching balance for ${coinType} on ${isTestnet ? 'testnet' : 'mainnet'}`);

  try {
    ensureProviderNetwork(isTestnet);
    const client = suiProvider.getClient();
    const balance = await client.getBalance({ owner: walletAddress, coinType });
    const tokenInfo = Object.values(isTestnet ? SUI_TESTNET_TOKENS : SUI_TOKENS).find(
      (t) => t.coinType === coinType
    );
    const decimals = tokenInfo?.decimals ?? 9;
    const formattedBalance = formatBalance(balance.totalBalance, decimals);
    console.log(`[TokenService] Balance: ${formattedBalance}`);
    return formattedBalance;
  } catch (error: unknown) {
    console.warn(`[TokenService] Error fetching token balance for ${coinType}:`, error);
    return '0.0';
  }
}

export async function getTokenMetadata(
  coinType: string,
  isTestnet: boolean = false
): Promise<{ symbol: string; name: string; decimals: number } | null> {
  console.log(`[TokenService] Fetching metadata for ${coinType}`);

  try {
    ensureProviderNetwork(isTestnet);
    const client = suiProvider.getClient();
    const metadata = await client.getCoinMetadata({ coinType });

    if (!metadata) {
      return null;
    }

    return {
      symbol: metadata.symbol,
      name: metadata.name,
      decimals: metadata.decimals,
    };
  } catch (error: unknown) {
    console.warn(`[TokenService] Error fetching token metadata for ${coinType}:`, error);
    return null;
  }
}

export async function getTokenBalances(
  walletAddress: string,
  tokenSymbols: string[],
  isTestnet: boolean = false
): Promise<Map<string, string>> {
  console.log(`[TokenService] Fetching balances for ${tokenSymbols.length} tokens`);

  ensureProviderNetwork(isTestnet);
  const balances = new Map<string, string>();
  const allTokens = await getAllTokens(isTestnet);

  const balancePromises = tokenSymbols.map(async (symbol) => {
    const tokenInfo = allTokens[symbol.toUpperCase()] || getTokenInfo(symbol, isTestnet);
    if (!tokenInfo) {
      return { symbol, balance: '0.0' };
    }

    try {
      const balance = await getTokenBalance(tokenInfo.coinType, walletAddress, isTestnet);
      return { symbol, balance };
    } catch (error) {
      console.error(`[TokenService] Error fetching balance for ${symbol}:`, error);
      return { symbol, balance: '0.0' };
    }
  });

  const results = await Promise.all(balancePromises);
  results.forEach(({ symbol, balance }) => balances.set(symbol, balance));
  return balances;
}

export async function isValidCoinType(coinType: string, isTestnet: boolean = false): Promise<boolean> {
  try {
    ensureProviderNetwork(isTestnet);
    const metadata = await getTokenMetadata(coinType, isTestnet);
    return metadata !== null;
  } catch {
    return false;
  }
}

/** @deprecated Use isValidCoinType */
export async function isValidERC20Token(
  coinType: string,
  _provider?: unknown,
  isTestnet: boolean = false
): Promise<boolean> {
  return isValidCoinType(coinType, isTestnet);
}

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

export async function getAllTokens(isTestnet: boolean = false): Promise<Record<string, TokenInfo>> {
  const builtInTokens = isTestnet ? SUI_TESTNET_TOKENS : SUI_TOKENS;
  const customTokens = await getCustomTokens(isTestnet);
  return { ...builtInTokens, ...customTokens };
}

export async function getTokenInfoWithCustom(
  symbol: string,
  isTestnet: boolean = false
): Promise<TokenInfo | null> {
  const builtInInfo = getTokenInfo(symbol, isTestnet);
  if (builtInInfo) return builtInInfo;

  const customTokens = await getCustomTokens(isTestnet);
  return customTokens[symbol.toUpperCase()] || null;
}

export async function getAllAvailableTokens(isTestnet: boolean = false): Promise<string[]> {
  const builtInTokens = getAvailableTokens(isTestnet);
  const customTokens = await getCustomTokens(isTestnet);
  return [...builtInTokens, ...Object.keys(customTokens)];
}

export async function importTokenByAddress(
  coinType: string,
  isTestnet: boolean = false
): Promise<TokenInfoWithAddress> {
  if (!coinType.includes('::')) {
    throw new Error('Invalid coin type. Use format: 0xPACKAGE::module::Coin');
  }

  ensureProviderNetwork(isTestnet);

  const isValid = await isValidCoinType(coinType, isTestnet);
  if (!isValid) {
    throw new Error(`Address is not a valid coin type on ${isTestnet ? 'testnet' : 'mainnet'}`);
  }

  const metadata = await getTokenMetadata(coinType, isTestnet);
  if (!metadata) {
    throw new Error('Could not fetch token metadata');
  }

  const existingBuiltIn = getTokenInfo(metadata.symbol, isTestnet);
  if (existingBuiltIn && existingBuiltIn.coinType === coinType) {
    throw new Error('Token already exists in your list');
  }

  const customTokens = await getCustomTokens(isTestnet);
  const existingCustom = customTokens[metadata.symbol.toUpperCase()];
  if (existingCustom && existingCustom.coinType === coinType) {
    throw new Error('Token already exists in your list');
  }

  const tokenInfo: TokenInfo = {
    symbol: metadata.symbol,
    name: metadata.name,
    coinType,
    decimals: metadata.decimals,
    icon: '💱',
  };

  await addCustomToken(tokenInfo, isTestnet);
  return withAddress(tokenInfo);
}

export function mistToSui(mist: string | bigint): string {
  return (Number(mist) / Number(MIST_PER_SUI)).toFixed(4);
}
