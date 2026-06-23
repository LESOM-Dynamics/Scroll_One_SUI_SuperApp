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
      <Stack.Screen
        name="developer-settings"
        options={{
          headerShown: true,
          presentation: 'card',
          title: 'Developer Settings',
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          headerShown: true,
          presentation: 'card',
          title: 'Edit Profile',
        }}
      />
    </Stack>
  );
}
