import * as SecureStore from 'expo-secure-store';
import { env } from '@/config/env';
import type { ApiResponse } from './types';

const API_TOKEN_KEY = 'sui_api_token';

export function getApiBaseUrl(): string {
  return `${env.api.baseUrl}/api/v1`;
}

export async function getApiToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(API_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setApiToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(API_TOKEN_KEY, token);
}

export async function clearApiToken(): Promise<void> {
  await SecureStore.deleteItemAsync(API_TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (auth) {
    const token = await getApiToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...rest,
    headers: requestHeaders,
  });

  const json = (await response.json().catch(() => ({}))) as ApiResponse<T>;

  if (!response.ok) {
    if (response.status === 401 && auth) {
      await clearApiToken();
    }
    throw new ApiError(
      json.error?.message ?? `Request failed (${response.status})`,
      json.error?.code ?? 'REQUEST_FAILED',
      response.status
    );
  }

  if (json.data === undefined) {
    throw new ApiError('Empty API response', 'EMPTY_RESPONSE', response.status);
  }

  return json.data;
}

export async function apiRequestOptional<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T | null> {
  try {
    return await apiRequest<T>(path, options);
  } catch (error) {
    console.warn('[ApiClient] Request skipped:', path, error);
    return null;
  }
}
