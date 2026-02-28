import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { StatCard } from '../components/StatCard';
import { FilterChip } from '../components/FilterChip';
import { Button } from '../components/Button';
import { ActivityCard } from '../components/ActivityCard';
import { TaskItem } from '../components/TaskItem';
import { ActivityDetailModal } from '../components/ActivityDetailModal';
import { UpdateModal } from '../components/UpdateModal';
import { getActivityStats, getUpcomingActivity, Activity, ActivityHistory, getDb, normalizeDate, getPendingTasks, PersonalTask, updateTask, deleteTask } from '../database/database';
import { NotificationService } from '../utils/NotificationService';
import { VersionService } from '../utils/VersionService';

export const HomeScreen = () => {
    const { theme, organization, preferences, categories: dynamicCategories, updateInfo, checkUpdate, pendingTasksCount, refreshTasksCount } = useAppContext();
    const navigation = useNavigation();

    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ completedThisMonth: 0 });
    const [upcoming, setUpcoming] = useState<(Activity & ActivityHistory) | null>(null);
    const [pendingTasks, setPendingTasks] = useState<PersonalTask[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [isUpcomingFavorite, setIsUpcomingFavorite] = useState(false);

    // Update Checker State (controlled via AppContext)
    const [updateModalVisible, setUpdateModalVisible] = useState(false);

    const loadData = async () => {
        try {
            const fetchedStats = await getActivityStats();
            setStats(fetchedStats);

            // Fetch upcoming with all activity fields
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

            if (next) {
                const favResult = await db.getFirstAsync(`SELECT id FROM favorites WHERE activity_id = ?`, [next.id]);
                setIsUpcomingFavorite(!!favResult);
            }

            setUpcoming(next ?? null);

            // Fetch tasks
            const tasks = await getPendingTasks(3);
            setPendingTasks(tasks);
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


                {/* Upcoming */}
                {upcoming && (
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
                            isFavorite={isUpcomingFavorite}
                            onPress={() => setModalVisible(true)}
                        />
                    </View>
                )}

                {/* My Tasks */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[theme.typography.h3, { color: theme.colors.text }]}>
                            {"My Tasks " + (pendingTasksCount > 0 ? "(" + pendingTasksCount + ")" : "")}
                        </Text>
                        <TouchableOpacity onPress={() => (navigation as any).navigate('Tasks')}>
                            <Text style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: '700' }]}>VIEW ALL</Text>
                        </TouchableOpacity>
                    </View>

                    {pendingTasks.length > 0 ? (
                        pendingTasks.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onToggle={async () => {
                                    const isCurrentlyCompleted = task.status === 'completed';
                                    const newStatus = isCurrentlyCompleted ? 'pending' : 'completed';
                                    if (newStatus === 'completed' && task.notification_id) {
                                        await NotificationService.cancelTaskReminder(task.notification_id);
                                        await updateTask(task.id, { status: 'completed', notification_id: null });
                                    } else {
                                        await updateTask(task.id, { status: newStatus as any });
                                    }
                                    loadData();
                                    refreshTasksCount();
                                }}
                                onDelete={async () => {
                                    if (task.notification_id) {
                                        await NotificationService.cancelTaskReminder(task.notification_id);
                                    }
                                    await deleteTask(task.id);
                                    loadData();
                                    refreshTasksCount();
                                }}
                                onEdit={() => (navigation as any).navigate('Tasks', { editTaskId: task.id })}
                            />
                        ))
                    ) : (
                        <TouchableOpacity
                            style={[styles.emptyTaskCta, { borderColor: theme.colors.border + '40' }]}
                            onPress={() => (navigation as any).navigate('Tasks')}
                        >
                            <MaterialCommunityIcons name="plus-circle-outline" size={24} color={theme.colors.textSecondary} />
                            <Text style={[theme.typography.body2, { color: theme.colors.textSecondary, marginLeft: 8 }]}>
                                No pending tasks. Add a planning task?
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

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
                hideSchedule={true}
                onUpdate={loadData}
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
    emptyTaskCta: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
});
