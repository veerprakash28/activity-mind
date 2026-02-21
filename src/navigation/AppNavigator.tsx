import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

import { HomeScreen } from '../screens/HomeScreen';
import { GenerateScreen } from '../screens/GenerateScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { ActivityBankScreen } from '../screens/ActivityBankScreen';
import { AddActivityScreen } from '../screens/AddActivityScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

// Stack for Activity Bank with Add Activity
const ActivityBankStack = () => {
    const { theme } = useAppContext();
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTintColor: theme.colors.text,
                headerTitleStyle: theme.typography.h3,
            }}
        >
            <Stack.Screen name="ActivityBankList" component={ActivityBankScreen} options={{ title: 'Activity Bank', headerShown: false }} />
            <Stack.Screen name="AddActivity" component={AddActivityScreen} options={{ title: 'Add Activity' }} />
        </Stack.Navigator>
    );
};

const TabNavigator = () => {
    const { theme } = useAppContext();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: true,
                headerStyle: {
                    backgroundColor: theme.colors.surface,
                    shadowColor: theme.shadows.sm.shadowColor,
                    elevation: theme.shadows.sm.elevation,
                },
                headerTintColor: theme.colors.text,
                headerTitleStyle: theme.typography.h3,
                tabBarStyle: {
                    backgroundColor: theme.colors.surface,
                    borderTopColor: theme.colors.border,
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60,
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.iconDefault,
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={HomeScreen}
                options={({ navigation }: any) => ({
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
                    ),
                    headerTitle: 'Activity Mind',
                    headerTitleAlign: 'left' as const,
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Settings')}
                            style={{ marginRight: 16 }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialCommunityIcons name="cog-outline" size={24} color={theme.colors.iconDefault} />
                        </TouchableOpacity>
                    ),
                })}
            />
            <Tab.Screen
                name="Generate"
                // @ts-ignore
                component={GenerateScreen}
                options={{
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        <MaterialCommunityIcons name="creation" size={size + 4} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Bank"
                component={ActivityBankStack}
                options={{
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        <MaterialCommunityIcons name="book-open-variant" size={size} color={color} />
                    ),
                    headerTitle: 'Activity Bank',
                }}
            />
            <Tab.Screen
                name="Calendar"
                // @ts-ignore
                component={CalendarScreen}
                options={{
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        <MaterialCommunityIcons name="calendar-month" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Favorites"
                // @ts-ignore
                component={FavoritesScreen}
                options={{
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        <MaterialCommunityIcons name="heart" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Insights"
                // @ts-ignore
                component={InsightsScreen}
                options={{
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        <MaterialCommunityIcons name="chart-bar" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export const AppNavigator = () => {
    const { theme } = useAppContext();

    return (
        <RootStack.Navigator screenOptions={{ headerStyle: { backgroundColor: theme.colors.surface }, headerTintColor: theme.colors.text, headerTitleStyle: theme.typography.h3 }}>
            <RootStack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
            <RootStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        </RootStack.Navigator>
    );
};
