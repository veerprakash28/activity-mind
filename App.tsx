import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider, useAppContext } from './src/context/AppContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { OnboardingNavigator } from './src/navigation/OnboardingNavigator';
import { initDb } from './src/database/database';
import { NotificationService } from './src/utils/NotificationService';

const MainApp = () => {
  const { theme, themeMode, isFirstLaunch, refreshCategories, preferences } = useAppContext();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const setup = async () => {
      try {
        await initDb();
        await refreshCategories(); // Sync categories once tables are created
        NotificationService.setEnabled(preferences.remindersEnabled); // Setup initial state
        await NotificationService.requestPermissions(); // Request for Smart Reminders
        setDbReady(true);
      } catch (e) {
        console.error("Database initialization failed", e);
      }
    };
    setup();

    // Notification listeners
    const notificationListener = NotificationService.addListener((notification: any) => {
      console.log("[App] Notification received in foreground:", notification);
    });

    const responseListener = NotificationService.addResponseListener((response: any) => {
      console.log("[App] Notification response received:", response);
    });

    return () => {
      NotificationService.removeListener(notificationListener);
      NotificationService.removeListener(responseListener);
    };
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={{
      dark: theme.isDark,
      colors: {
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.secondary,
      },
      fonts: DefaultTheme.fonts
    }}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      {isFirstLaunch ? <OnboardingNavigator /> : <AppNavigator />}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </SafeAreaProvider>
  );
}
