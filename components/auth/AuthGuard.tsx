import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useWalletStore } from '@/store/walletStore';
import { useSettingsStore } from '@/store/settingsStore';

export function AuthGuard() {
  const segments = useSegments();
  const router = useRouter();
  const { address, isUnlocked } = useWalletStore();
  const { isLoading: settingsLoading } = useSettingsStore();

  useEffect(() => {
    // Wait for settings to load before checking auth state
    if (settingsLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    // If no wallet exists, redirect to signup
    if (!address && !inAuthGroup) {
      router.replace('/(auth)/signup');
      return;
    }

    // If wallet exists but is locked, redirect to login
    if (address && !isUnlocked && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    // If wallet is unlocked and user is in auth screens, redirect to tabs
    if (address && isUnlocked && inAuthGroup) {
      router.replace('/(tabs)');
      return;
    }
  }, [segments, address, isUnlocked, settingsLoading, router]);

  return null;
}


