import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeType, getTheme, Theme, CustomColors } from '../theme';
import { getUniqueCategories, renameCategory as renameCategoryDb } from '../database/database';
import { VersionService, UpdateInfo } from '../utils/VersionService';

interface Organization {
    companyName: string;
    employeeCount: number;
    workType: 'Remote' | 'Onsite' | 'Hybrid';
    budgetRange: 'Low' | 'Medium' | 'High';
    industry: string;
    tagline?: string;
    orgLogoUri?: string;
}

interface Preferences {
    theme: ThemeType | 'system';
    isPro: boolean;
    generationCount: number;
    monthlyTarget: number;
    remindersEnabled: boolean;
    reminderTime: string;
}

interface AppContextData {
    // Theme
    theme: Theme;
    themeMode: ThemeType;
    preferences: Preferences;
    setThemePreference: (mode: ThemeType | 'system') => void;
    setGenerationCount: (count: number) => Promise<void>;
    setMonthlyTarget: (target: number) => Promise<void>;
    setRemindersEnabled: (enabled: boolean) => Promise<void>;
    setReminderTime: (time: string) => Promise<void>;

    // Custom Colors
    customColors: CustomColors;
    setCustomColors: (colors: CustomColors) => Promise<void>;

    // App State
    isFirstLaunch: boolean;
    setIsFirstLaunch: (value: boolean) => void;

    // Org
    organization: Organization | null;
    setOrganization: (org: Organization) => void;

    // Pro Status
    unlockPro: () => void;

    // Categories
    categories: string[];
    refreshCategories: () => Promise<void>;
    renameCategory: (oldName: string, newName: string) => Promise<void>;

    // Update info
    updateInfo: UpdateInfo | null;
    checkUpdate: () => Promise<void>;
}

const AppContext = createContext<AppContextData | undefined>(undefined);

const PREFS_KEY = '@ActivityMind_Prefs';
const ORG_KEY = '@ActivityMind_Org';
const FIRST_LAUNCH_KEY = '@ActivityMind_FirstLaunch';
const CUSTOM_COLORS_KEY = '@ActivityMind_CustomColors';

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const systemColorScheme = useColorScheme() as ThemeType;
    const [preferences, setPreferences] = useState<Preferences>({
        theme: 'system',
        isPro: false,
        generationCount: 3,
        monthlyTarget: 2,
        remindersEnabled: true,
        reminderTime: '09:00'
    });
    const [organization, setOrganizationState] = useState<Organization | null>(null);
    const [isFirstLaunch, setIsFirstLaunchState] = useState<boolean>(true);
    const [customColors, setCustomColorsState] = useState<CustomColors>({});
    const [categories, setCategories] = useState<string[]>([]);
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [prefsJson, orgJson, firstLaunchStr, colorsJson] = await Promise.all([
                    AsyncStorage.getItem(PREFS_KEY),
                    AsyncStorage.getItem(ORG_KEY),
                    AsyncStorage.getItem(FIRST_LAUNCH_KEY),
                    AsyncStorage.getItem(CUSTOM_COLORS_KEY),
                ]);

                if (prefsJson) {
                    const loadedPrefs = JSON.parse(prefsJson);
                    setPreferences(prev => ({ ...prev, ...loadedPrefs }));
                }
                if (orgJson) setOrganizationState(JSON.parse(orgJson));
                if (firstLaunchStr === 'false') setIsFirstLaunchState(false);
                if (colorsJson) setCustomColorsState(JSON.parse(colorsJson));

                // Load initial categories
                const cats = await getUniqueCategories();
                setCategories(cats);

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

    const setGenerationCount = async (count: number) => {
        const newPrefs = { ...preferences, generationCount: count };
        setPreferences(newPrefs);
        await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
    };

    const setMonthlyTarget = async (target: number) => {
        const newPrefs = { ...preferences, monthlyTarget: target };
        setPreferences(newPrefs);
        await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
    };

    const setRemindersEnabled = async (enabled: boolean) => {
        const newPrefs = { ...preferences, remindersEnabled: enabled };
        setPreferences(newPrefs);
        await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
    };

    const setReminderTime = async (time: string) => {
        const newPrefs = { ...preferences, reminderTime: time };
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

    const setCustomColors = async (colors: CustomColors) => {
        setCustomColorsState(colors);
        await AsyncStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(colors));
    };

    const unlockPro = async () => {
        const newPrefs = { ...preferences, isPro: true };
        setPreferences(newPrefs);
        await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
    };

    const refreshCategories = async () => {
        const cats = await getUniqueCategories();
        setCategories(cats);
    };

    const renameCategory = async (oldName: string, newName: string) => {
        await renameCategoryDb(oldName, newName);
        await refreshCategories();
    };

    const checkUpdate = async () => {
        const info = await VersionService.checkForUpdates();
        if (info?.hasUpdate) {
            setUpdateInfo(info);
        }
    };

    const activeThemeMode = preferences.theme === 'system'
        ? (systemColorScheme || 'light')
        : preferences.theme;

    const themeObj = getTheme(activeThemeMode, customColors);

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
                customColors,
                setCustomColors,
                isFirstLaunch,
                setIsFirstLaunch,
                organization,
                setOrganization,
                unlockPro,
                categories,
                refreshCategories,
                renameCategory,
                setGenerationCount,
                setMonthlyTarget,
                setRemindersEnabled,
                setReminderTime,
                updateInfo,
                checkUpdate
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
