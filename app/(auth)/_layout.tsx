import { Stack } from 'expo-router';
import { colors } from '@/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background.primary,
        },
      }}
    >
      <Stack.Screen name="signup" />
      <Stack.Screen name="login" />
    </Stack>
  );
}
