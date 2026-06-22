const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
}

let priceCache: Map<string, { price: number; change24h: number; timestamp: number }> = new Map();
const CACHE_DURATION = 60000;

async function getCachedPrice(symbol: string): Promise<{ price: number; change24h: number } | null> {
  const cached = priceCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { price: cached.price, change24h: cached.change24h };
  }
  return null;
}

function setCachedPrice(symbol: string, price: number, change24h: number) {
  priceCache.set(symbol, { price, change24h, timestamp: Date.now() });
}

export async function getSUIPrice(): Promise<TokenPrice> {
  try {
    const cached = await getCachedPrice('SUI');
    if (cached) {
      return { symbol: 'SUI', price: cached.price, change24h: cached.change24h };
    }

    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=sui&vs_currencies=usd&include_24hr_change=true`
    );

    const data = await response.json();

    if (data.sui) {
      const price = data.sui.usd;
      const change24h = data.sui.usd_24h_change || 0;
      setCachedPrice('SUI', price, change24h);
      return { symbol: 'SUI', price, change24h };
    }

    return { symbol: 'SUI', price: 2.5, change24h: 0 };
  } catch (error) {
    console.error('[PriceService] Error fetching SUI price:', error);
    const cached = await getCachedPrice('SUI');
    if (cached) {
      return { symbol: 'SUI', price: cached.price, change24h: cached.change24h };
    }
    return { symbol: 'SUI', price: 2.5, change24h: 0 };
  }
}

/** @deprecated Use getSUIPrice */
export async function getETHPrice(): Promise<TokenPrice> {
  return getSUIPrice();
}

export async function getTokenPrice(symbol: string): Promise<TokenPrice> {
  const tokenMap: Record<string, string> = {
    SUI: 'sui',
    USDC: 'usd-coin',
    USDT: 'tether',
    WETH: 'weth',
    CETUS: 'cetus-protocol',
  };

  const coinId = tokenMap[symbol.toUpperCase()];
  if (!coinId) {
    console.warn(`[PriceService] Unknown token symbol: ${symbol}`);
    return { symbol, price: 0, change24h: 0 };
  }

  try {
    const cached = await getCachedPrice(symbol);
    if (cached) {
      return { symbol, price: cached.price, change24h: cached.change24h };
    }

    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
    );

    const data = await response.json();

    if (data[coinId]) {
      const price = data[coinId].usd;
      const change24h = data[coinId].usd_24h_change || 0;
      setCachedPrice(symbol, price, change24h);
      return { symbol, price, change24h };
    }

    return { symbol, price: 0, change24h: 0 };
  } catch (error) {
    console.error(`[PriceService] Error fetching ${symbol} price:`, error);
    const cached = await getCachedPrice(symbol);
    if (cached) {
      return { symbol, price: cached.price, change24h: cached.change24h };
    }
    return { symbol, price: 0, change24h: 0 };
  }
}
