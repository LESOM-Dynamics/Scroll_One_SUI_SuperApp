// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as SystemUI from 'expo-system-ui';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { colors } from '@/theme';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { useSettingsStore } from '@/store/settingsStore';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { notificationService, type NotificationData } from '@/services/notifications/notificationService';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
// Clarity requires native linking and doesn't work in Expo Go
// Only import if available (in development builds)
let Clarity: any = null;
try {
  Clarity = require('@microsoft/react-native-clarity');
} catch (e) {
  // Clarity not available (e.g., in Expo Go) - this is expected
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  useAppInitialization();
  const { loadThemePreference } = useSettingsStore();
  const router = useRouter();

  useEffect(() => {
    loadThemePreference();
  }, [loadThemePreference]);

  // Setup notifications
  useEffect(() => {
    // Clear badge count on app open
    notificationService.clearBadgeCount();

    // Request notification permissions on app start (if enabled)
    const { notificationsEnabled } = useSettingsStore.getState();
    if (notificationsEnabled) {
      notificationService.requestPermissions();
    }

    // Setup notification listeners
    const subscriptions = notificationService.setupListeners(
      // Handle notification received while app is open
      (notification) => {
        console.log('[App] Notification received:', notification);
        const data = notification.request.content.data as NotificationData;
        
        // Trigger haptic feedback based on notification type
        if (data.type === 'transaction_confirmed') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (data.type === 'transaction_failed') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      },
      // Handle notification tap
      (response) => {
        console.log('[App] Notification tapped:', response);
        const data = response.notification.request.content.data as NotificationData;
        
        // Light haptic when tapping notification
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        if (data.transactionId) {
          // Navigate to transaction detail screen
          router.push(`/(tabs)/(wallet)/transaction/${data.transactionId}`);
        }
      }
    );

    // Cleanup listeners on unmount
    return () => {
      notificationService.removeListeners(subscriptions);
    };
  }, [router]);
  
  return (
    <>
      <AuthGuard />
      <Stack 
        screenOptions={{ 
          headerBackTitle: "Back",
          headerStyle: {
            backgroundColor: colors.background.primary,
          },
          headerTintColor: colors.text.primary,
          contentStyle: {
            backgroundColor: colors.background.primary,
          },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const { themeMode } = useSettingsStore();

  // Initialize Microsoft Clarity (only if available, not in Expo Go)
  useEffect(() => {
    if (Clarity && Clarity.initialize) {
      try {
        Clarity.initialize('urm4valmet', {
          logLevel: Clarity.LogLevel.None, // Use "LogLevel.Verbose" while testing to debug initialization issues
        });
      } catch (error) {
        console.log('[Clarity] Initialization failed (expected in Expo Go):', error);
      }
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SystemUI.setBackgroundColorAsync(colors.background.primary);
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, themeMode]);

  if (!fontsLoaded) {
    // Keep splash screen visible while fonts load
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.container}>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
