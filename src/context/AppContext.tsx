import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeType, getTheme, Theme } from '../theme';

interface Organization {
    companyName: string;
    employeeCount: number;
    workType: 'Remote' | 'Onsite' | 'Hybrid';
    budgetRange: 'Low' | 'Medium' | 'High';
    industry: string;
}

interface Preferences {
    theme: ThemeType | 'system';
    isPro: boolean;
}

interface AppContextData {
    // Theme
    theme: Theme;
    themeMode: ThemeType;
    preferences: Preferences;
    setThemePreference: (mode: ThemeType | 'system') => void;

    // App State
    isFirstLaunch: boolean;
    setIsFirstLaunch: (value: boolean) => void;

    // Org
    organization: Organization | null;
    setOrganization: (org: Organization) => void;

    // Pro Status
    unlockPro: () => void;
}

const AppContext = createContext<AppContextData | undefined>(undefined);

const PREFS_KEY = '@ActivityMind_Prefs';
const ORG_KEY = '@ActivityMind_Org';
const FIRST_LAUNCH_KEY = '@ActivityMind_FirstLaunch';

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const systemColorScheme = useColorScheme() as ThemeType;
    const [preferences, setPreferences] = useState<Preferences>({ theme: 'system', isPro: false });
    const [organization, setOrganizationState] = useState<Organization | null>(null);
    const [isFirstLaunch, setIsFirstLaunchState] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState(true);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [prefsJson, orgJson, firstLaunchStr] = await Promise.all([
                    AsyncStorage.getItem(PREFS_KEY),
                    AsyncStorage.getItem(ORG_KEY),
                    AsyncStorage.getItem(FIRST_LAUNCH_KEY)
                ]);

                if (prefsJson) setPreferences(JSON.parse(prefsJson));
                if (orgJson) setOrganizationState(JSON.parse(orgJson));
                if (firstLaunchStr === 'false') setIsFirstLaunchState(false);

            } catch (e) {
                console.error('Failed to load app data', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const setThemePreference = async (theme: ThemeType | 'system') => {
        const newPrefs = { ...preferences, theme };
        setPreferences(newPrefs);
        await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
    };

    const setOrganization = async (org: Organization) => {
        setOrganizationState(org);
        await AsyncStorage.setItem(ORG_KEY, JSON.stringify(org));
        setIsFirstLaunch(false); // Once org is set, it's no longer first launch
    };

    const setIsFirstLaunch = async (val: boolean) => {
        setIsFirstLaunchState(val);
        await AsyncStorage.setItem(FIRST_LAUNCH_KEY, val ? 'true' : 'false');
    };

    const unlockPro = async () => {
        const newPrefs = { ...preferences, isPro: true };
        setPreferences(newPrefs);
        await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
    };

    const activeThemeMode = preferences.theme === 'system'
        ? (systemColorScheme || 'light')
        : preferences.theme;

    const themeObj = getTheme(activeThemeMode);

    if (isLoading) {
        return null; // Or a splash screen
    }

    return (
        <AppContext.Provider
            value={{
                theme: themeObj,
                themeMode: activeThemeMode,
                preferences,
                setThemePreference,
                isFirstLaunch,
                setIsFirstLaunch,
                organization,
                setOrganization,
                unlockPro
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
