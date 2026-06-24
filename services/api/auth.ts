import { signMessage } from '@/services/sui/wallet';
import { apiRequest, clearApiToken, setApiToken } from './client';
import type { AuthSession } from './types';

export async function authenticateWithBackend(walletAddress: string): Promise<AuthSession | null> {
  try {
    const messageData = await apiRequest<{ message: string }>(
      '/auth/wallet/message',
      {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ walletAddress }),
      }
    );

    const signature = await signMessage(messageData.message);

    const session = await apiRequest<AuthSession>('/auth/wallet/verify', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({
        walletAddress,
        message: messageData.message,
        signature,
      }),
    });

    await setApiToken(session.token);
    return session;
  } catch (error) {
    console.warn('[ApiAuth] Backend authentication failed:', error);
    await clearApiToken();
    return null;
  }
}

export async function validateBackendSession(): Promise<boolean> {
  try {
    await apiRequest<{ valid: boolean }>('/auth/session/validate');
    return true;
  } catch {
    return false;
  }
}

export async function logoutFromBackend(): Promise<void> {
  try {
    await apiRequest<{ success: boolean }>('/auth/session', { method: 'DELETE' });
  } catch {
    // ignore logout errors
  } finally {
    await clearApiToken();
  }
}
