import { Transaction } from '@mysten/sui/transactions';
import { normalizeSuiAddress } from '@mysten/sui/utils';
import { createDeepBookClient } from './deepbookClient';
import { getKeypairOrThrow } from './wallet';

export interface DeepBookSwapPair {
  poolKey: string;
  sellingBase: boolean;
  fromSymbol: string;
  toSymbol: string;
}

export interface DeepBookSwapQuote {
  poolKey: string;
  fromSymbol: string;
  toSymbol: string;
  fromAmount: number;
  toAmount: number;
  deepRequired: number;
  sellingBase: boolean;
  priceLabel: string;
}

export interface DeepBookSwapResult {
  digest: string;
  fromSymbol: string;
  toSymbol: string;
  fromAmount: string;
  toAmount: string;
}

const SWAP_PAIRS: Record<
  string,
  { mainnet: string; testnet: string; base: string; quote: string }
> = {
  'SUI-USDC': { mainnet: 'SUI_USDC', testnet: 'SUI_DBUSDC', base: 'SUI', quote: 'USDC' },
  'USDC-SUI': { mainnet: 'SUI_USDC', testnet: 'SUI_DBUSDC', base: 'SUI', quote: 'USDC' },
  'DEEP-SUI': { mainnet: 'DEEP_SUI', testnet: 'DEEP_SUI', base: 'DEEP', quote: 'SUI' },
  'SUI-DEEP': { mainnet: 'DEEP_SUI', testnet: 'DEEP_SUI', base: 'DEEP', quote: 'SUI' },
  'DEEP-USDC': { mainnet: 'DEEP_USDC', testnet: 'DEEP_DBUSDC', base: 'DEEP', quote: 'USDC' },
  'USDC-DEEP': { mainnet: 'DEEP_USDC', testnet: 'DEEP_DBUSDC', base: 'DEEP', quote: 'USDC' },
  'USDT-USDC': { mainnet: 'USDT_USDC', testnet: 'DBUSDT_DBUSDC', base: 'USDT', quote: 'USDC' },
  'USDC-USDT': { mainnet: 'USDT_USDC', testnet: 'DBUSDT_DBUSDC', base: 'USDT', quote: 'USDC' },
};

export function getDeepBookSwapTokens(isTestnet: boolean): string[] {
  if (isTestnet) {
    return ['SUI', 'USDC', 'DEEP', 'USDT'];
  }
  return ['SUI', 'USDC', 'DEEP', 'USDT'];
}

export function resolveDeepBookPair(
  fromSymbol: string,
  toSymbol: string,
  isTestnet: boolean
): DeepBookSwapPair | null {
  const from = fromSymbol.toUpperCase();
  const to = toSymbol.toUpperCase();
  if (from === to) return null;

  const key = `${from}-${to}`;
  const pair = SWAP_PAIRS[key];
  if (!pair) return null;

  const poolKey = isTestnet ? pair.testnet : pair.mainnet;
  const sellingBase = from === pair.base;

  return {
    poolKey,
    sellingBase,
    fromSymbol: from,
    toSymbol: to,
  };
}

export async function getDeepBookSwapQuote(
  fromSymbol: string,
  toSymbol: string,
  fromAmount: number,
  isTestnet: boolean,
  address: string
): Promise<DeepBookSwapQuote | null> {
  if (!fromAmount || fromAmount <= 0) return null;

  const pair = resolveDeepBookPair(fromSymbol, toSymbol, isTestnet);
  if (!pair) return null;

  const client = createDeepBookClient(address);

  try {
    if (pair.sellingBase) {
      const result = await client.deepbook.getQuoteQuantityOut(pair.poolKey, fromAmount);
      const priceLabel = `1 ${pair.fromSymbol} ≈ ${(result.quoteOut / fromAmount).toFixed(6)} ${pair.toSymbol}`;
      return {
        poolKey: pair.poolKey,
        fromSymbol: pair.fromSymbol,
        toSymbol: pair.toSymbol,
        fromAmount,
        toAmount: result.quoteOut,
        deepRequired: result.deepRequired,
        sellingBase: true,
        priceLabel,
      };
    }

    const result = await client.deepbook.getBaseQuantityOut(pair.poolKey, fromAmount);
    const priceLabel = `1 ${pair.fromSymbol} ≈ ${(result.baseOut / fromAmount).toFixed(6)} ${pair.toSymbol}`;
    return {
      poolKey: pair.poolKey,
      fromSymbol: pair.fromSymbol,
      toSymbol: pair.toSymbol,
      fromAmount,
      toAmount: result.baseOut,
      deepRequired: result.deepRequired,
      sellingBase: false,
      priceLabel,
    };
  } catch (error) {
    console.error('[DeepBook] Quote error:', error);
    return null;
  }
}

export async function executeDeepBookSwap(
  fromSymbol: string,
  toSymbol: string,
  fromAmount: number,
  isTestnet: boolean,
  slippageBps: number = 50
): Promise<DeepBookSwapResult> {
  const keypair = await getKeypairOrThrow();
  const address = normalizeSuiAddress(keypair.toSuiAddress());
  const client = createDeepBookClient(address);

  const quote = await getDeepBookSwapQuote(fromSymbol, toSymbol, fromAmount, isTestnet, address);
  if (!quote) {
    throw new Error('No DeepBook liquidity pool for this pair');
  }

  const minOut = quote.toAmount * (1 - slippageBps / 10000);
  const tx = new Transaction();

  const [baseOut, quoteOut, deepOut] = client.deepbook.deepBook.swapExactQuantity({
    poolKey: quote.poolKey,
    amount: fromAmount,
    deepAmount: quote.deepRequired,
    minOut,
    isBaseToCoin: quote.sellingBase,
  })(tx);

  tx.transferObjects([baseOut, quoteOut, deepOut], address);

  const result = await keypair.signAndExecuteTransaction({
    transaction: tx,
    client: client.core,
  });

  if (!result.digest) {
    throw new Error('DeepBook swap failed: no transaction digest');
  }

  return {
    digest: result.digest,
    fromSymbol: quote.fromSymbol,
    toSymbol: quote.toSymbol,
    fromAmount: String(fromAmount),
    toAmount: quote.toAmount.toFixed(6),
  };
}
