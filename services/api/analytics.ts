import Constants from 'expo-constants';
import { apiRequestOptional } from './client';

export async function trackAnalyticsEvent(
  eventType: string,
  eventData?: Record<string, unknown>,
  sessionId?: string
): Promise<void> {
  await apiRequestOptional('/analytics/event', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({
      eventType,
      eventData: eventData ?? {},
      sessionId,
      deviceInfo: {
        platform: Constants.platform,
      },
      appVersion: Constants.expoConfig?.version ?? 'unknown',
    }),
  });
}

export async function trackAppOpen(): Promise<void> {
  await trackAnalyticsEvent('app_open');
}

export async function trackMiniAppOpen(appId: string): Promise<void> {
  await trackAnalyticsEvent('miniapp_open', { appId });
}

export async function trackSwapComplete(details: Record<string, unknown>): Promise<void> {
  await trackAnalyticsEvent('swap_complete', details);
}
