const lightPalette = {
  background: {
    primary: '#FAFAFA',
    secondary: '#FFFFFF',
    tertiary: '#FFFFFF',
    elevated: '#FFFFFF',
  },
  surface: '#FFFFFF',
  border: {
    subtle: '#E5E7EB',
    medium: '#E5E7EB',
    strong: '#CBD5F5',
    chrome: '#E5E7EB',
  },
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    tertiary: '#94A3B8',
    muted: '#94A3B8',
    disabled: '#CBD5E1',
  },
  accent: {
    primary: '#6E56CF',
    secondary: '#4C3DF2',
    neonGreen: '#6E56CF',
    electricBlue: '#4C3DF2',
    purple: '#6E56CF',
    cyan: '#4C3DF2',
  },
  status: {
    success: '#16A34A',
    warning: '#F59E0B',
    error: '#DC2626',
    info: '#4C3DF2',
  },
  overlay: {
    soft: 'rgba(15,23,42,0.04)',
    light: 'rgba(15,23,42,0.08)',
    medium: 'rgba(15,23,42,0.12)',
  },
  glass: {
    background: 'rgba(255,255,255,0.9)',
    border: 'rgba(148,163,184,0.35)',
  },
} as const;

const darkPalette: typeof lightPalette = {
  background: {
    primary: '#020617',
    secondary: '#020617',
    tertiary: '#020617',
    elevated: '#020617',
  },
  surface: '#020617',
  border: {
    subtle: '#1E293B',
    medium: '#334155',
    strong: '#4B5563',
    chrome: '#1E293B',
  },
  text: {
    primary: '#E5E7EB',
    secondary: '#9CA3AF',
    tertiary: '#6B7280',
    muted: '#6B7280',
    disabled: '#4B5563',
  },
  accent: {
    primary: '#A5B4FC',
    secondary: '#818CF8',
    neonGreen: '#A5B4FC',
    electricBlue: '#818CF8',
    purple: '#A5B4FC',
    cyan: '#818CF8',
  },
  status: {
    success: '#22C55E',
    warning: '#FACC15',
    error: '#F97373',
    info: '#818CF8',
  },
  overlay: {
    soft: 'rgba(15,23,42,0.4)',
    light: 'rgba(15,23,42,0.6)',
    medium: 'rgba(15,23,42,0.8)',
  },
  glass: {
    background: 'rgba(15,23,42,0.9)',
    border: 'rgba(148,163,184,0.35)',
  },
};

export type ThemeMode = 'light' | 'dark';

export const colors: typeof lightPalette = { ...lightPalette };

let currentMode: ThemeMode = 'light';

export function setThemeMode(mode: ThemeMode) {
  currentMode = mode;
  const palette = mode === 'dark' ? darkPalette : lightPalette;

  // Shallow merge preserving object identity so components re-read values
  Object.assign(colors.background, palette.background);
  Object.assign(colors.border, palette.border);
  Object.assign(colors.text, palette.text);
  Object.assign(colors.accent, palette.accent);
  Object.assign(colors.status, palette.status);
  Object.assign(colors.overlay, palette.overlay);
  Object.assign(colors.glass, palette.glass);
  colors.surface = palette.surface;
}

export function getThemeMode(): ThemeMode {
  return currentMode;
}

export type Colors = typeof lightPalette;
