export type LayoutType = 'playful' | 'structured' | 'minimal';

export interface UITheme {
    id: string;
    name: string;
    layoutType: LayoutType;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    cardStyle: 'bordered' | 'shadow' | 'minimal';
}

export const EXPORT_UI_THEMES: UITheme[] = [
    {
        id: 'playful_modern',
        name: 'Modern Playful',
        layoutType: 'playful',
        primaryColor: '#2D3E50',
        secondaryColor: '#E8ECF1',
        accentColor: '#D89E8D', // Tan for the calendar header
        backgroundColor: '#F7F3F0', // Cream
        cardStyle: 'bordered',
    },
    {
        id: 'corporate_grid',
        name: 'Structured Pro',
        layoutType: 'structured',
        primaryColor: '#0B2C52',
        secondaryColor: '#E8ECF1',
        accentColor: '#3182CE',
        backgroundColor: '#FDFBFA',
        cardStyle: 'bordered',
    },
    {
        id: 'clean_minimal',
        name: 'Ultra Minimal',
        layoutType: 'minimal',
        primaryColor: '#1A202C',
        secondaryColor: '#F7FAFC',
        accentColor: '#4A5568',
        backgroundColor: '#FFFFFF',
        cardStyle: 'minimal',
    }
];

export const BRAND_COLOR_PRESETS = [
    '#0B2C52', // Navy
    '#3182CE', // Blue
    '#38A169', // Green
    '#D53F8C', // Pink
    '#E53E3E', // Red
    '#805AD5', // Purple
    '#DD6B20', // Orange
    '#D69E2E', // Gold
];
