export const colors = {
  primary: '#2563EB',
  secondary: '#7C3AED',
  white: '#FFFFFF',
  black: '#000000',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  error: '#EF4444',
  transparent: 'transparent',

  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    iconDefault: '#64748B',
    primaryLight: '#EFF6FF',
    secondaryLight: '#F5F3FF',
  },

  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#334155',
    iconDefault: '#94A3B8',
    primaryLight: 'rgba(37, 99, 235, 0.15)',
    secondaryLight: 'rgba(124, 58, 237, 0.15)',
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  xl: 32,
  pill: 9999,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5 },
  h3: { fontSize: 20, fontWeight: '600' as const },
  h4: { fontSize: 18, fontWeight: '600' as const },
  body1: { fontSize: 16, fontWeight: '400' as const },
  body2: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  button: { fontSize: 16, fontWeight: '600' as const },
};

export type ThemeType = 'light' | 'dark';

export interface CustomColors {
  primary?: string;
  secondary?: string;
}

export const getTheme = (mode: ThemeType, customColors?: CustomColors) => {
  const primary = customColors?.primary || colors.primary;
  const secondary = customColors?.secondary || colors.secondary;

  const modeColors = colors[mode];
  const primaryLight = mode === 'dark'
    ? primary + '26'
    : primary + '18';
  const secondaryLight = mode === 'dark'
    ? secondary + '26'
    : secondary + '18';

  return {
    colors: {
      ...colors,
      ...modeColors,
      primary,
      secondary,
      primaryLight,
      secondaryLight,
    },
    spacing,
    radius,
    typography,
    isDark: mode === 'dark'
  };
};

export type Theme = ReturnType<typeof getTheme>;
