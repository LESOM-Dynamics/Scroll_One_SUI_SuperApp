import { env } from '@/config/env';
import { getApiToken } from '@/services/api/client';

export async function syncWalrusProfileToBackend(
  walletAddress: string,
  walrusBlobId: string,
  contentHash?: string
): Promise<void> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = await getApiToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
      `${env.api.baseUrl}/api/v1/walrus/profile/${walletAddress}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({ walrusBlobId, contentHash }),
      }
    );

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
    const response = await fetch(
      `${env.api.baseUrl}/api/v1/walrus/profile/${walletAddress}`
    );
    if (!response.ok) return null;
    const json = await response.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}
