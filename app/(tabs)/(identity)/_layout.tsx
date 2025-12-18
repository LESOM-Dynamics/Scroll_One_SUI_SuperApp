import React from 'react';
import { Stack } from 'expo-router';

export default function IdentityLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="preferences" 
        options={{
          headerShown: true,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="privacy-security"
        options={{
          headerShown: true,
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
