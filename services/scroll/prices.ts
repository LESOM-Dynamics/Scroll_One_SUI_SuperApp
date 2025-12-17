const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
}

// Cache for prices to avoid excessive API calls
let priceCache: Map<string, { price: number; change24h: number; timestamp: number }> = new Map();
const CACHE_DURATION = 60000; // 1 minute

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

export async function getETHPrice(): Promise<TokenPrice> {
  try {
    // Check cache first
    const cached = await getCachedPrice('ETH');
    if (cached) {
      return { symbol: 'ETH', price: cached.price, change24h: cached.change24h };
    }

    // Fetch from CoinGecko
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true`
    );
    
    const data = await response.json();
    
    if (data.ethereum) {
      const price = data.ethereum.usd;
      const change24h = data.ethereum.usd_24h_change || 0;
      
      // Cache the result
      setCachedPrice('ETH', price, change24h);
      
      return { symbol: 'ETH', price, change24h };
    }
    
    // Fallback to default values
    return { symbol: 'ETH', price: 2500, change24h: 0 };
  } catch (error) {
    console.error('[PriceService] Error fetching ETH price:', error);
    // Return cached value or fallback
    const cached = await getCachedPrice('ETH');
    if (cached) {
      return { symbol: 'ETH', price: cached.price, change24h: cached.change24h };
    }
    return { symbol: 'ETH', price: 2500, change24h: 0 };
  }
}

export async function getTokenPrice(symbol: string): Promise<TokenPrice> {
  // Map token symbols to CoinGecko IDs
  const tokenMap: Record<string, string> = {
    'ETH': 'ethereum',
    'USDC': 'usd-coin',
    'WBTC': 'wrapped-bitcoin',
    'USDT': 'tether',
  };
  
  const coinId = tokenMap[symbol.toUpperCase()];
  if (!coinId) {
    console.warn(`[PriceService] Unknown token symbol: ${symbol}`);
    return { symbol, price: 0, change24h: 0 };
  }
  
  try {
    // Check cache first
    const cached = await getCachedPrice(symbol);
    if (cached) {
      return { symbol, price: cached.price, change24h: cached.change24h };
    }
    
    // Fetch from CoinGecko
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
    );
    
    const data = await response.json();
    
    if (data[coinId]) {
      const price = data[coinId].usd;
      const change24h = data[coinId].usd_24h_change || 0;
      
      // Cache the result
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
