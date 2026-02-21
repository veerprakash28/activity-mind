import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { getAllActivities, deleteActivity, Activity } from '../database/database';
import { ActivityCard } from '../components/ActivityCard';
import { FilterChip } from '../components/FilterChip';

export const ActivityBankScreen = ({ navigation }: any) => {
    const { theme } = useAppContext();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

    const loadActivities = async () => {
        try {
            const data = await getAllActivities();
            setActivities(data);
        } catch (e) {
            console.error("Failed to load activities", e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadActivities();
        }, [])
    );

    const handleDelete = (activity: Activity) => {
        Alert.alert(
            "Delete Activity",
            `Are you sure you want to delete "${activity.name}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await deleteActivity(activity.id);
                        loadActivities();
                    }
                }
            ]
        );
    };

    const categories = ['Icebreaker', 'Team Bonding', 'Wellness', 'Training', 'Recognition', 'Festival'];

    const filteredActivities = activities.filter(a => {
        const matchesSearch = !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || a.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const customCount = activities.filter(a => a.is_custom === 1).length;
    const builtInCount = activities.filter(a => a.is_custom === 0).length;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.iconDefault} />
                <TextInput
                    style={[styles.searchInput, { color: theme.colors.text }]}
                    placeholder="Search activities..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.iconDefault} />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Category Filter */}
            <FlatList
                horizontal
                data={categories}
                keyExtractor={item => item}
                showsHorizontalScrollIndicator={false}
                style={styles.categoryRow}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                renderItem={({ item }) => (
                    <FilterChip
                        label={item}
                        selected={selectedCategory === item}
                        onPress={() => setSelectedCategory(selectedCategory === item ? undefined : item)}
                    />
                )}
            />

            {/* Stats */}
            <View style={[styles.statsBar, { borderBottomColor: theme.colors.border }]}>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                    {filteredActivities.length} activities · {builtInCount} built-in · {customCount} custom
                </Text>
            </View>

            {/* Activity List */}
            <FlatList
                data={filteredActivities}
                keyExtractor={item => String(item.id)}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.cardWrapper}>
                        <ActivityCard activity={item} expanded={false} />
                        <View style={styles.cardActions}>
                            {item.is_custom === 1 && (
                                <TouchableOpacity
                                    style={[styles.deleteBtn, { borderColor: theme.colors.error + '40' }]}
                                    onPress={() => handleDelete(item)}
                                >
                                    <MaterialCommunityIcons name="delete-outline" size={18} color={theme.colors.error} />
                                    <Text style={[theme.typography.caption, { color: theme.colors.error, marginLeft: 4 }]}>Delete</Text>
                                </TouchableOpacity>
                            )}
                            <View style={[styles.badge, { backgroundColor: item.is_custom ? theme.colors.secondaryLight : theme.colors.primaryLight }]}>
                                <Text style={[theme.typography.caption, { color: item.is_custom ? theme.colors.secondary : theme.colors.primary, fontWeight: '600' }]}>
                                    {item.is_custom ? 'Custom' : 'Built-in'}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="magnify-close" size={48} color={theme.colors.iconDefault} />
                        <Text style={[theme.typography.body1, { color: theme.colors.textSecondary, marginTop: 12, textAlign: 'center' }]}>
                            No activities match your search.
                        </Text>
                    </View>
                }
            />

            {/* Floating Add Button */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('AddActivity')}
                activeOpacity={0.8}
            >
                <MaterialCommunityIcons name="plus" size={28} color={theme.colors.white} />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
    },
    categoryRow: {
        marginTop: 12,
        minHeight: 48,
    },
    statsBar: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    cardWrapper: {
        marginBottom: 16,
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 6,
        gap: 8,
    },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
    },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
    }
});
