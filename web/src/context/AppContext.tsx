'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ThemeType, getTheme, Theme, CustomColors } from '../theme';
import { getUniqueCategories, renameCategory as renameCategoryDb, getPendingTasksCount, initDb } from '../database/db';

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
  theme: Theme;
  themeMode: ThemeType;
  preferences: Preferences;
  setThemePreference: (mode: ThemeType | 'system') => void;
  setGenerationCount: (count: number) => Promise<void>;
  setMonthlyTarget: (target: number) => Promise<void>;
  setRemindersEnabled: (enabled: boolean) => Promise<void>;
  setReminderTime: (time: string) => Promise<void>;
  pendingTasksCount: number;
  refreshTasksCount: () => Promise<void>;
  customColors: CustomColors;
  setCustomColors: (colors: CustomColors) => Promise<void>;
  isFirstLaunch: boolean;
  setIsFirstLaunch: (value: boolean) => void;
  organization: Organization | null;
  setOrganization: (org: Organization) => void;
  unlockPro: () => void;
  categories: string[];
  refreshCategories: () => Promise<void>;
  renameCategory: (oldName: string, newName: string) => Promise<void>;
  dbReady: boolean;
}

const AppContext = createContext<AppContextData | undefined>(undefined);

const PREFS_KEY = '@ActivityMind_Prefs';
const ORG_KEY = '@ActivityMind_Org';
const FIRST_LAUNCH_KEY = '@ActivityMind_FirstLaunch';
const CUSTOM_COLORS_KEY = '@ActivityMind_CustomColors';

function getSystemTheme(): ThemeType {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
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
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);
  const [systemTheme, setSystemTheme] = useState<ThemeType>('light');

  // Listen for system theme changes
  useEffect(() => {
    setSystemTheme(getSystemTheme());
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load from localStorage
        const prefsJson = localStorage.getItem(PREFS_KEY);
        const orgJson = localStorage.getItem(ORG_KEY);
        const firstLaunchStr = localStorage.getItem(FIRST_LAUNCH_KEY);
        const colorsJson = localStorage.getItem(CUSTOM_COLORS_KEY);

        if (prefsJson) {
          const loadedPrefs = JSON.parse(prefsJson);
          setPreferences(prev => ({ ...prev, ...loadedPrefs }));
        }
        if (orgJson) setOrganizationState(JSON.parse(orgJson));
        if (firstLaunchStr === 'false') setIsFirstLaunchState(false);
        if (colorsJson) setCustomColorsState(JSON.parse(colorsJson));

        // Initialize IndexedDB
        await initDb();
        setDbReady(true);

        // Load categories
        const cats = await getUniqueCategories();
        setCategories(cats);

        // Load task count
        const count = await getPendingTasksCount();
        setPendingTasksCount(count);
      } catch (e) {
        console.error('Failed to load app data', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const setThemePreference = useCallback(async (theme: ThemeType | 'system') => {
    const newPrefs = { ...preferences, theme };
    setPreferences(newPrefs);
    localStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
  }, [preferences]);

  const setGenerationCount = useCallback(async (count: number) => {
    const newPrefs = { ...preferences, generationCount: count };
    setPreferences(newPrefs);
    localStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
  }, [preferences]);

  const setMonthlyTarget = useCallback(async (target: number) => {
    const newPrefs = { ...preferences, monthlyTarget: target };
    setPreferences(newPrefs);
    localStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
  }, [preferences]);

  const setRemindersEnabled = useCallback(async (enabled: boolean) => {
    const newPrefs = { ...preferences, remindersEnabled: enabled };
    setPreferences(newPrefs);
    localStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
  }, [preferences]);

  const setReminderTime = useCallback(async (time: string) => {
    const newPrefs = { ...preferences, reminderTime: time };
    setPreferences(newPrefs);
    localStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
  }, [preferences]);

  const setOrganization = useCallback(async (org: Organization) => {
    setOrganizationState(org);
    localStorage.setItem(ORG_KEY, JSON.stringify(org));
    setIsFirstLaunch(false);
  }, []);

  const setIsFirstLaunch = useCallback(async (val: boolean) => {
    setIsFirstLaunchState(val);
    localStorage.setItem(FIRST_LAUNCH_KEY, val ? 'true' : 'false');
  }, []);

  const setCustomColors = useCallback(async (colors: CustomColors) => {
    setCustomColorsState(colors);
    localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(colors));
  }, []);

  const unlockPro = useCallback(async () => {
    const newPrefs = { ...preferences, isPro: true };
    setPreferences(newPrefs);
    localStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
  }, [preferences]);

  const refreshCategories = useCallback(async () => {
    const cats = await getUniqueCategories();
    setCategories(cats);
  }, []);

  const renameCategory = useCallback(async (oldName: string, newName: string) => {
    await renameCategoryDb(oldName, newName);
    await refreshCategories();
  }, [refreshCategories]);

  const refreshTasksCount = useCallback(async () => {
    const count = await getPendingTasksCount();
    setPendingTasksCount(count);
  }, []);

  const activeThemeMode = preferences.theme === 'system'
    ? systemTheme
    : preferences.theme;

  const themeObj = getTheme(activeThemeMode, customColors);

  // Apply theme to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', activeThemeMode);
      document.documentElement.style.setProperty('--color-primary', themeObj.colors.primary);
      document.documentElement.style.setProperty('--color-secondary', themeObj.colors.secondary);
      document.documentElement.style.setProperty('--color-background', themeObj.colors.background);
      document.documentElement.style.setProperty('--color-surface', themeObj.colors.surface);
      document.documentElement.style.setProperty('--color-text', themeObj.colors.text);
      document.documentElement.style.setProperty('--color-text-secondary', themeObj.colors.textSecondary);
      document.documentElement.style.setProperty('--color-border', themeObj.colors.border);
      document.documentElement.style.setProperty('--color-primary-light', themeObj.colors.primaryLight);
      document.documentElement.style.setProperty('--color-secondary-light', themeObj.colors.secondaryLight);
      document.documentElement.style.setProperty('--color-success', themeObj.colors.success);
      document.documentElement.style.setProperty('--color-warning', themeObj.colors.warning);
      document.documentElement.style.setProperty('--color-error', themeObj.colors.error);
      document.documentElement.style.setProperty('--color-icon-default', themeObj.colors.iconDefault);
    }
  }, [activeThemeMode, themeObj]);

  if (isLoading) {
    return null;
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
        pendingTasksCount,
        refreshTasksCount,
        dbReady,
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
