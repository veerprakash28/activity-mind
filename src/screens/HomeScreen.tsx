import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { StatCard } from '../components/StatCard';
import { FilterChip } from '../components/FilterChip';
import { Button } from '../components/Button';
import { ActivityCard } from '../components/ActivityCard';
import { ActivityDetailModal } from '../components/ActivityDetailModal';
import { UpdateModal } from '../components/UpdateModal';
import { getActivityStats, getUpcomingActivity, Activity, ActivityHistory, getDb, normalizeDate } from '../database/database';
import { VersionService, UpdateInfo } from '../utils/VersionService';

export const HomeScreen = () => {
    const { theme, organization, preferences, categories: dynamicCategories, updateInfo, checkUpdate } = useAppContext();
    const navigation = useNavigation();

    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ completedThisMonth: 0 });
    const [upcoming, setUpcoming] = useState<(Activity & ActivityHistory) | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Update Checker State (controlled via AppContext)
    const [updateModalVisible, setUpdateModalVisible] = useState(false);

    const loadData = async () => {
        try {
            const fetchedStats = await getActivityStats();
            setStats(fetchedStats);

            // Fetch upcoming with all activity fields (explicit select to avoid name collisions)
            const db = await getDb();
            const now = normalizeDate(new Date());
            const next = await db.getFirstAsync<Activity & ActivityHistory>(
                `SELECT h.id as historyId, h.scheduled_date, h.completed, a.*
    FROM activity_history h 
                 JOIN activities a ON h.activity_id = a.id 
                 WHERE h.scheduled_date >= ? AND h.completed = 0 
                 ORDER BY h.scheduled_date ASC LIMIT 1`,
                [now]
            );
            setUpcoming(next ?? null);
        } catch (e) {
            console.error("Failed to load dashboard data", e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
            checkUpdate();
        }, [])
    );

    useEffect(() => {
        if (updateInfo?.hasUpdate) {
            const checkSnooze = async () => {
                const shouldShow = await VersionService.shouldShowModal();
                if (shouldShow) {
                    setUpdateModalVisible(true);
                }
            };
            checkSnooze();
        }
    }, [updateInfo]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const getCategoryIcon = (label: string): any => {
        const mapping: Record<string, string> = {
            'Icebreaker': 'snowflake',
            'Team Bonding': 'account-group',
            'Wellness': 'leaf',
            'Recognition': 'star-face',
            'Festival': 'party-popper',
            'Training': 'school',
            'Sports': 'trophy',
            'Food': 'food-apple',
        };
        return mapping[label] || 'tag-outline';
    };

    const categories = dynamicCategories.slice(0, 8).map(cat => ({
        label: cat,
        icon: getCategoryIcon(cat)
    }));

    const handleQuickFilter = (category: string) => {
        // @ts-ignore
        navigation.navigate('Generate', { preSelectedCategory: category });
    };

    const targetActivities = preferences.monthlyTarget || 2;
    const engagementScore = Math.min(Math.round((stats.completedThisMonth / targetActivities) * 100), 100);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[theme.typography.h1, { color: theme.colors.text }]}>
                        {"Hello, " + (organization?.companyName || 'Team') + " 👋"}
                    </Text>
                    <Text style={[theme.typography.body1, { color: theme.colors.textSecondary, marginTop: theme.spacing.xs }]}>
                        Ready to boost your team's engagement?
                    </Text>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <StatCard title="This Month" value={stats.completedThisMonth.toString()} icon="check-decagram" color={theme.colors.success} />
                    <StatCard title="Engagement" value={engagementScore + "%"} icon="lightning-bolt" color={theme.colors.warning} />
                </View>

                {/* Primary CTA */}
                <View style={[styles.ctaContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, ...theme.shadows.sm }]}>
                    <View style={styles.ctaTextContainer}>
                        <Text style={[theme.typography.h2, { color: theme.colors.text }]}>Find the perfect activity</Text>
                        <Text style={[theme.typography.body2, { color: theme.colors.textSecondary, marginTop: theme.spacing.xs, marginBottom: theme.spacing.md }]}>
                            Recommendations based on your unique team profile
                        </Text>
                    </View>
                    <Button
                        title="Generate Activity"
                        icon={<MaterialCommunityIcons name="creation" size={20} color={theme.colors.white} />}
                        // @ts-ignore
                        onPress={() => navigation.navigate('Generate')}
                        size="large"
                    />
                </View>

                {/* Upcoming */}
                {upcoming ? (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[theme.typography.h3, { color: theme.colors.text }]}>Upcoming</Text>
                            <View style={[styles.dateBadge, { backgroundColor: theme.colors.primaryLight }]}>
                                <MaterialCommunityIcons name="calendar" size={14} color={theme.colors.primary} />
                                <Text style={[theme.typography.caption, { color: theme.colors.primary, marginLeft: 4, fontWeight: '700' }]}>
                                    {new Date(upcoming.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </Text>
                            </View>
                        </View>
                        <ActivityCard
                            activity={upcoming}
                            onPress={() => setModalVisible(true)}
                        />
                    </View>
                ) : null}

                {/* Quick Filters */}
                <View style={styles.section}>
                    <Text style={[theme.typography.h3, { color: theme.colors.text, marginBottom: theme.spacing.sm }]}>Quick Explore</Text>
                    <View style={styles.filterWrap}>
                        {categories.map(cat => (
                            <FilterChip
                                key={cat.label}
                                label={cat.label}
                                icon={cat.icon}
                                selected={false}
                                onPress={() => handleQuickFilter(cat.label)}
                            />
                        ))}
                    </View>
                </View>

            </ScrollView>

            <ActivityDetailModal
                activity={upcoming}
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
            />

            <UpdateModal
                visible={updateModalVisible}
                updateInfo={updateInfo}
                onClose={() => setUpdateModalVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    header: { marginBottom: 24 },
    statsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
    ctaContainer: { padding: 24, borderRadius: 20, borderWidth: 1, marginBottom: 32 },
    ctaTextContainer: { paddingRight: 20 },
    section: { marginBottom: 32 },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    filterWrap: { flexDirection: 'row', flexWrap: 'wrap' },
});
