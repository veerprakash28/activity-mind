import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { ActivityCard } from '../components/ActivityCard';
import { ActivityDetailModal } from '../components/ActivityDetailModal';
import { getFavorites, toggleFavorite, Favorite, Activity } from '../database/database';
import { Button } from '../components/Button';

export const FavoritesScreen = () => {
    const { theme } = useAppContext();
    const [favorites, setFavorites] = useState<(Favorite & Activity)[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

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

    const handleRemoveFavorite = async (activityId: number) => {
        await toggleFavorite(activityId);
        loadFavorites();
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
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <FlatList
                data={favorites}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={renderEmpty}
                renderItem={({ item }) => (
                    <ActivityCard
                        activity={item}
                        expanded={false}
                        hideFavoriteIcon={true}
                        onPress={() => { setSelectedActivity(item); setModalVisible(true); }}
                    />
                )}
            />

            <ActivityDetailModal
                activity={selectedActivity}
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onUpdate={loadFavorites}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: { padding: 16, flexGrow: 1 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
});
