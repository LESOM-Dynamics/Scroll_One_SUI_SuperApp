import { isValidSuiAddress, normalizeSuiAddress } from '@mysten/sui/utils';
import { MIST_PER_SUI } from '@mysten/sui/utils';

/**
 * Validate Sui address
 */
export function isValidAddress(address: string): boolean {
  return isValidSuiAddress(address);
}

/**
 * Normalize Sui address
 */
export function normalizeAddress(address: string): string {
  try {
    return normalizeSuiAddress(address);
  } catch {
    return address;
  }
}

/**
 * Shorten address for display
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

/**
 * Format mist to SUI
 */
export function formatEther(value: string | bigint): string {
  try {
    return (Number(value) / Number(MIST_PER_SUI)).toFixed(9);
  } catch {
    return '0';
  }
}

/**
 * Parse SUI to mist
 */
export function parseEther(value: string): bigint {
  try {
    const [whole, fraction = ''] = value.split('.');
    const paddedFraction = `${fraction}000000000`.slice(0, 9);
    return BigInt(whole) * MIST_PER_SUI + BigInt(paddedFraction);
  } catch {
    return BigInt(0);
  }
}

/**
 * Sleep/delay utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry utility
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await sleep(delay * (i + 1));
      }
    }
  }
  
  throw lastError!;
}

/**
 * Pagination helper
 */
export function getPaginationParams(query: any): {
  page: number;
  limit: number;
  offset: number;
} {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}
