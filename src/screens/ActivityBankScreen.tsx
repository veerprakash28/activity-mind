import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { getAllActivities, deleteActivity, Activity } from '../database/database';
import { ActivityCard } from '../components/ActivityCard';
import { ActivityDetailModal } from '../components/ActivityDetailModal';
import { FilterChip } from '../components/FilterChip';
import { Button } from '../components/Button';
import { StatusModal, StatusType } from '../components/StatusModal';

export const ActivityBankScreen = ({ navigation }: any) => {
    const { theme, categories } = useAppContext();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
    const [activeTab, setActiveTab] = useState<'built-in' | 'custom'>('built-in');
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Status Modal State
    const [statusVisible, setStatusVisible] = useState(false);
    const [statusType, setStatusType] = useState<StatusType>('confirm');
    const [statusTitle, setStatusTitle] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [statusConfirmLabel, setStatusConfirmLabel] = useState('Delete');
    const [onStatusConfirm, setOnStatusConfirm] = useState<(() => void) | undefined>(undefined);

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
        setStatusType('confirm');
        setStatusTitle('Delete Activity');
        setStatusMessage(`Are you sure you want to delete "${activity.name}"? This action cannot be undone.`);
        setStatusConfirmLabel('Delete');
        setOnStatusConfirm(() => async () => {
            await deleteActivity(activity.id);
            loadActivities();
        });
        setStatusVisible(true);
    };

    const builtInActivities = activities.filter(a => a.is_custom === 0);
    const customActivities = activities.filter(a => a.is_custom === 1);
    const currentList = activeTab === 'built-in' ? builtInActivities : customActivities;

    const filteredActivities = currentList.filter(a => {
        const matchesSearch = !searchQuery ||
            a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = !selectedCategory || a.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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

            {/* Category Filters */}
            <View style={styles.categoryFilterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                    <FilterChip
                        label="All"
                        selected={selectedCategory === undefined}
                        onPress={() => setSelectedCategory(undefined)}
                    />
                    {categories.map(cat => (
                        <FilterChip
                            key={cat}
                            label={cat}
                            selected={selectedCategory === cat}
                            onPress={() => setSelectedCategory(selectedCategory === cat ? undefined : cat)}
                        />
                    ))}
                </ScrollView>
            </View>

            {/* Tabs */}
            <View style={[styles.tabRow, { borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'built-in' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('built-in')}
                >
                    <MaterialCommunityIcons name="book-open-variant" size={18} color={activeTab === 'built-in' ? theme.colors.primary : theme.colors.textSecondary} />
                    <Text style={[theme.typography.body2, { color: activeTab === 'built-in' ? theme.colors.primary : theme.colors.textSecondary, marginLeft: 6, fontWeight: activeTab === 'built-in' ? '600' : '400' }]}>
                        {"Built-in (" + builtInActivities.length + ")"}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'custom' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('custom')}
                >
                    <MaterialCommunityIcons name="account-edit" size={18} color={activeTab === 'custom' ? theme.colors.primary : theme.colors.textSecondary} />
                    <Text style={[theme.typography.body2, { color: activeTab === 'custom' ? theme.colors.primary : theme.colors.textSecondary, marginLeft: 6, fontWeight: activeTab === 'custom' ? '600' : '400' }]}>
                        {"Custom (" + customActivities.length + ")"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Activity List */}
            <FlatList
                data={filteredActivities}
                keyExtractor={item => String(item.id)}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.cardWrapper}>
                        <ActivityCard activity={item} expanded={false} onPress={() => { setSelectedActivity(item); setModalVisible(true); }} />
                        {activeTab === 'custom' ? (
                            <View style={styles.cardActionOverlay}>
                                <TouchableOpacity
                                    style={[styles.cardActionButton, { backgroundColor: theme.colors.primary }]}
                                    onPress={() => navigation.navigate('AddActivity', { activity: item })}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <MaterialCommunityIcons name="pencil-outline" size={16} color={theme.colors.white} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.cardActionButton, { backgroundColor: theme.colors.error }]}
                                    onPress={() => handleDelete(item)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <MaterialCommunityIcons name="trash-can-outline" size={16} color={theme.colors.white} />
                                </TouchableOpacity>
                            </View>
                        ) : null}
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name={activeTab === 'custom' ? 'plus-circle-outline' : 'magnify-close'} size={48} color={theme.colors.iconDefault} />
                        <Text style={[theme.typography.body1, { color: theme.colors.textSecondary, marginTop: 12, textAlign: 'center' }]}>
                            {activeTab === 'custom' ? 'No custom activities yet. Tap + to add one!' : 'No activities match your search.'}
                        </Text>
                    </View>
                }
            />

            {/* Floating Add Button (show on Custom tab) */}
            {activeTab === 'custom' ? (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                    onPress={() => navigation.navigate('AddActivity')}
                    activeOpacity={0.8}
                >
                    <MaterialCommunityIcons name="plus" size={28} color={theme.colors.white} />
                </TouchableOpacity>
            ) : null}

            {/* Detail Modal */}
            <ActivityDetailModal
                activity={selectedActivity}
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                actions={selectedActivity?.is_custom ? (
                    <>
                        <Button
                            title="Edit Details"
                            variant="outline"
                            icon={<MaterialCommunityIcons name="pencil-outline" size={18} color={theme.colors.primary} />}
                            onPress={() => {
                                setModalVisible(false);
                                navigation.navigate('AddActivity', { activity: selectedActivity });
                            }}
                            style={{ flex: 1 }}
                            size="small"
                        />
                        <Button
                            title="Delete"
                            variant="outline"
                            icon={<MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.colors.error} />}
                            onPress={() => {
                                setModalVisible(false);
                                // Ensure selectedActivity is not null before passing to handleDelete
                                if (selectedActivity) {
                                    handleDelete(selectedActivity);
                                }
                            }}
                            style={{ flex: 1, borderColor: theme.colors.error }}
                            size="small"
                        />
                    </>
                ) : undefined}
            />

            <StatusModal
                visible={statusVisible}
                type={statusType}
                title={statusTitle}
                message={statusMessage}
                confirmLabel={statusConfirmLabel}
                onConfirm={onStatusConfirm}
                onClose={() => setStatusVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    searchContainer: {
        flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12,
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
    },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
    tabRow: {
        flexDirection: 'row', borderBottomWidth: 1, marginTop: 8,
    },
    tab: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, paddingBottom: 10,
    },
    categoryFilterContainer: {
        marginTop: 12,
    },
    categoryScroll: {
        paddingHorizontal: 16,
    },
    listContent: { padding: 16, paddingBottom: 80 },
    cardWrapper: { marginBottom: 16, position: 'relative' },
    cardActionOverlay: {
        position: 'absolute', bottom: 26, right: 10,
        flexDirection: 'row', gap: 8,
    },
    cardActionButton: {
        width: 32, height: 32, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41,
    },
    emptyState: { alignItems: 'center', paddingTop: 60 },
    fab: {
        position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28,
        alignItems: 'center', justifyContent: 'center', elevation: 6,
        shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.27, shadowRadius: 4.65,
    },
});
