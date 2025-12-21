import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setThemeMode, type ThemeMode } from '@/theme/colors';

const NETWORK_PREFERENCE_KEY = '@scroll_one:network_preference';
const THEME_PREFERENCE_KEY = '@scroll_one:theme_mode';
const BIOMETRIC_PREFERENCE_KEY = '@scroll_one:biometric_auth_enabled';
const MOCK_DATA_PREFERENCE_KEY = '@scroll_one:use_mock_data';

interface SettingsState {
  isTestnet: boolean;
  isLoading: boolean;
  themeMode: ThemeMode;
  kycSharingEnabled: boolean;
  biometricAuthEnabled: boolean;
  useMockData: boolean;

  setNetwork: (isTestnet: boolean) => Promise<void>;
  loadNetworkPreference: () => Promise<void>;

  setTheme: (mode: ThemeMode) => Promise<void>;
  loadThemePreference: () => Promise<void>;

  setKycSharingEnabled: (enabled: boolean) => void;

  setBiometricAuthEnabled: (enabled: boolean) => Promise<void>;
  loadBiometricPreference: () => Promise<void>;

  setUseMockData: (enabled: boolean) => Promise<void>;
  loadMockDataPreference: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  isTestnet: false, // Default to mainnet
  isLoading: true,
  themeMode: 'light',
  kycSharingEnabled: false,
  biometricAuthEnabled: false,
  useMockData: false,

  setNetwork: async (isTestnet: boolean) => {
    try {
      await AsyncStorage.setItem(NETWORK_PREFERENCE_KEY, JSON.stringify(isTestnet));
      set({ isTestnet });
      console.log('[SettingsStore] Network preference saved:', isTestnet ? 'Testnet' : 'Mainnet');
    } catch (error) {
      console.error('[SettingsStore] Error saving network preference:', error);
    }
  },
  
  loadNetworkPreference: async () => {
    try {
      const stored = await AsyncStorage.getItem(NETWORK_PREFERENCE_KEY);
      if (stored !== null) {
        const isTestnet = JSON.parse(stored);
        set({ isTestnet, isLoading: false });
        console.log('[SettingsStore] Network preference loaded:', isTestnet ? 'Testnet' : 'Mainnet');
      } else {
        set({ isLoading: false });
        console.log('[SettingsStore] No network preference found, using default (Mainnet)');
      }
    } catch (error) {
      console.error('[SettingsStore] Error loading network preference:', error);
      set({ isLoading: false });
    }
  },

  setTheme: async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, mode);
      setThemeMode(mode);
      set({ themeMode: mode });
      console.log('[SettingsStore] Theme preference saved:', mode);
    } catch (error) {
      console.error('[SettingsStore] Error saving theme preference:', error);
    }
  },
  loadThemePreference: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
      const mode: ThemeMode = stored === 'dark' ? 'dark' : 'light';
      setThemeMode(mode);
      set({ themeMode: mode });
      console.log('[SettingsStore] Theme preference loaded:', mode);
    } catch (error) {
      console.error('[SettingsStore] Error loading theme preference:', error);
      // Fallback to light
      setThemeMode('light');
      set({ themeMode: 'light' });
    }
  },

  setKycSharingEnabled: (enabled: boolean) => {
    set({ kycSharingEnabled: enabled });
    console.log('[SettingsStore] KYC sharing preference set to:', enabled);
  },

  setBiometricAuthEnabled: async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(BIOMETRIC_PREFERENCE_KEY, JSON.stringify(enabled));
      set({ biometricAuthEnabled: enabled });
      console.log('[SettingsStore] Biometric auth preference set to:', enabled);
    } catch (error) {
      console.error('[SettingsStore] Error saving biometric preference:', error);
    }
  },

  loadBiometricPreference: async () => {
    try {
      const stored = await AsyncStorage.getItem(BIOMETRIC_PREFERENCE_KEY);
      if (stored !== null) {
        const enabled = JSON.parse(stored);
        set({ biometricAuthEnabled: enabled });
        console.log('[SettingsStore] Biometric auth preference loaded:', enabled);
      } else {
        console.log('[SettingsStore] No biometric preference found, defaulting to disabled');
      }
    } catch (error) {
      console.error('[SettingsStore] Error loading biometric preference:', error);
    }
  },

  setUseMockData: async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(MOCK_DATA_PREFERENCE_KEY, JSON.stringify(enabled));
      set({ useMockData: enabled });
      console.log('[SettingsStore] Mock data preference saved:', enabled);
    } catch (error) {
      console.error('[SettingsStore] Error saving mock data preference:', error);
    }
  },

  loadMockDataPreference: async () => {
    try {
      const stored = await AsyncStorage.getItem(MOCK_DATA_PREFERENCE_KEY);
      if (stored !== null) {
        const enabled = JSON.parse(stored);
        set({ useMockData: enabled });
        console.log('[SettingsStore] Mock data preference loaded:', enabled);
      } else {
        console.log('[SettingsStore] No mock data preference found, defaulting to disabled');
      }
    } catch (error) {
      console.error('[SettingsStore] Error loading mock data preference:', error);
    }
  },
}));
