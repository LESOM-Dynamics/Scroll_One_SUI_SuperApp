// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
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

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  useAppInitialization();
  const { loadThemePreference } = useSettingsStore();

  useEffect(() => {
    loadThemePreference();
  }, [loadThemePreference]);
  
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
