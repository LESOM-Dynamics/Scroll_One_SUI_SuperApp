import { env } from '@/config/env';

export async function syncWalrusProfileToBackend(
  walletAddress: string,
  walrusBlobId: string,
  contentHash?: string
): Promise<void> {
  try {
    const response = await fetch(`${env.api.baseUrl}/api/walrus/profile/${walletAddress}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walrusBlobId, contentHash }),
    });

    if (!response.ok) {
      console.warn('[WalrusAPI] Backend sync failed:', response.status);
    }
  } catch (error) {
    console.warn('[WalrusAPI] Backend sync skipped:', error);
  }
}

export async function fetchWalrusProfileFromBackend(
  walletAddress: string
): Promise<{ walrusBlobId: string | null; contentHash: string | null } | null> {
  try {
    const response = await fetch(`${env.api.baseUrl}/api/walrus/profile/${walletAddress}`);
    if (!response.ok) return null;
    const json = await response.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}
