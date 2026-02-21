import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { ActivityCard } from '../components/ActivityCard';
import { getFavorites, Favorite, Activity } from '../database/database';

export const FavoritesScreen = () => {
    const { theme } = useAppContext();
    const [favorites, setFavorites] = useState<(Favorite & Activity)[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const loadFavorites = async () => {
        try {
            const data = await getFavorites();
            setFavorites(data);
        } catch (e) {
            console.error("Failed to load favorites", e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadFavorites();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadFavorites();
        setRefreshing(false);
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="heart-broken" size={64} color={theme.colors.border} />
            <Text style={[theme.typography.h2, { color: theme.colors.textSecondary, marginTop: theme.spacing.md }]}>No Favorites Yet</Text>
            <Text style={[theme.typography.body1, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.sm }]}>
                Generate activities and tap the heart icon to save them here.
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <FlatList
                data={favorites}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={renderEmpty}
                renderItem={({ item }) => (
                    <ActivityCard
                        activity={item}
                        expanded={expandedId === item.id}
                        onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    />
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    }
});
