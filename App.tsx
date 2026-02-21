import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';

import { AppProvider, useAppContext } from './src/context/AppContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { OnboardingNavigator } from './src/navigation/OnboardingNavigator';
import { initDb } from './src/database/database';

const MainApp = () => {
  const { theme, themeMode, isFirstLaunch } = useAppContext();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const setup = async () => {
      try {
        await initDb();
        setDbReady(true);
      } catch (e) {
        console.error("Database initialization failed", e);
      }
    };
    setup();
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
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
