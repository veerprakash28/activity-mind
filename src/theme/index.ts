export const colors = {
    primary: '#2563EB', // Blue
    secondary: '#7C3AED', // Purple
    white: '#FFFFFF',
    black: '#000000',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    error: '#EF4444',
    transparent: 'transparent',

    light: {
        background: '#F8FAFC', // Soft modern background
        surface: '#FFFFFF', // Cards, sheets
        text: '#0F172A',
        textSecondary: '#64748B',
        border: '#E2E8F0',
        iconDefault: '#64748B',
        primaryLight: '#EFF6FF',
        secondaryLight: '#F5F3FF',
    },

    dark: {
        background: '#0F172A', // Deep slate
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
    md: 12, // User requested rounded cards
    lg: 20,
    xl: 32,
    pill: 9999,
};

// Based on typical modern app specs
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

export const shadows = {
    light: {
        sm: {
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
        },
        md: { // User requested soft shadows
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 4,
        },
        lg: {
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 20,
            elevation: 8,
        }
    },
    dark: {
        sm: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.3,
            shadowRadius: 2,
            elevation: 2,
        },
        md: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 4,
        },
        lg: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,
            shadowRadius: 20,
            elevation: 8,
        }
    }
};

export type ThemeType = 'light' | 'dark';

export const getTheme = (mode: ThemeType) => ({
    colors: {
        ...colors,
        ...colors[mode],
    },
    spacing,
    radius,
    typography,
    shadows: shadows[mode],
    isDark: mode === 'dark'
});

export type Theme = ReturnType<typeof getTheme>;
