import React from 'react';
import { View, TouchableOpacity, StatusBar, Platform, StyleSheet, Text } from 'react-native';
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
import { CalendarExportScreen } from '../screens/CalendarExportScreen';
import { BrainstormScreen } from '../screens/BrainstormScreen';
import { TasksScreen } from '../screens/TasksScreen';

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
    const { theme, updateInfo, pendingTasksCount } = useAppContext();

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
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Tasks')}
                                style={{ marginRight: 16 }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <View>
                                    <MaterialCommunityIcons name="clipboard-text-outline" size={24} color={theme.colors.iconDefault} />
                                    {pendingTasksCount > 0 && (
                                        <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                                            <Text style={styles.badgeText}>{pendingTasksCount > 9 ? '9+' : pendingTasksCount}</Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Settings')}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <View>
                                    <MaterialCommunityIcons name="cog-outline" size={24} color={theme.colors.iconDefault} />
                                    {updateInfo && (
                                        <View style={[styles.dot, { backgroundColor: theme.colors.error || '#EF4444' }]} />
                                    )}
                                </View>
                            </TouchableOpacity>
                        </View>
                    ),
                })}
            />
            <Tab.Screen
                name="Generate"
                // @ts-ignore
                component={GenerateScreen}
                options={({ navigation }: any) => ({
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        <MaterialCommunityIcons name="creation" size={size + 4} color={color} />
                    ),
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Settings')}
                            style={{ marginRight: 16 }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <View>
                                <MaterialCommunityIcons name="cog-outline" size={24} color={theme.colors.iconDefault} />
                                {updateInfo && (
                                    <View style={[styles.dot, { backgroundColor: theme.colors.error || '#EF4444' }]} />
                                )}
                            </View>
                        </TouchableOpacity>
                    ),
                })}
            />
            <Tab.Screen
                name="Bank"
                component={ActivityBankStack}
                options={({ navigation }: any) => ({
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        <MaterialCommunityIcons name="book-open-variant" size={size} color={color} />
                    ),
                    headerTitle: 'Activity Bank',
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Brainstorm')}
                            style={{
                                marginRight: 16,
                                backgroundColor: theme.colors.primary,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 6,
                                borderWidth: 2,
                                borderColor: theme.colors.primary + '40',
                                elevation: 4,
                                shadowColor: theme.colors.primary,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4
                            }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialCommunityIcons name="robot" size={20} color="#FFF" />
                        </TouchableOpacity>
                    ),
                })}
            />
            <Tab.Screen
                name="Calendar"
                // @ts-ignore
                component={CalendarScreen}
                options={({ navigation }: any) => ({
                    tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                        <MaterialCommunityIcons name="calendar-month" size={size} color={color} />
                    ),
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('CalendarExport')}
                            style={{ marginRight: 16 }}
                        >
                            <MaterialCommunityIcons name="calendar-export" size={24} color={theme.colors.primary} />
                        </TouchableOpacity>
                    ),
                })}
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
        <RootStack.Navigator screenOptions={{
            headerStyle: { backgroundColor: theme.colors.surface },
            headerTintColor: theme.colors.text,
            headerTitleStyle: theme.typography.h3,
            contentStyle: { backgroundColor: theme.colors.background }
        }}>
            <RootStack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
            <RootStack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    title: 'Settings',
                    headerStyle: {
                        backgroundColor: theme.colors.surface,
                    },
                }}
            />
            <RootStack.Screen
                name="CalendarExport"
                component={CalendarExportScreen}
                options={{
                    headerShown: false,
                    animation: 'slide_from_bottom',
                }}
            />
            <RootStack.Screen
                name="Brainstorm"
                component={BrainstormScreen}
                options={{
                    title: 'AI Brainstorm',
                }}
            />
            <RootStack.Screen
                name="Tasks"
                component={TasksScreen}
                options={{
                    title: 'My Tasks',
                }}
            />
        </RootStack.Navigator>
    );
};

const styles = StyleSheet.create({
    dot: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: '#FFF',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 2,
        borderWidth: 1.5,
        borderColor: '#FFF',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
