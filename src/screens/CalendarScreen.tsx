import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { getDb, ActivityHistory, Activity, markCompleted } from '../database/database';
import { ActivityCard } from '../components/ActivityCard';
import { ActivityDetailModal } from '../components/ActivityDetailModal';
import { Button } from '../components/Button';

export const CalendarScreen = ({ route }: any) => {
    const { theme } = useAppContext();

    const todayStr = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(route?.params?.date || todayStr);
    const [history, setHistory] = useState<(ActivityHistory & Activity)[]>([]);
    const [markedDates, setMarkedDates] = useState<any>({});
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const loadHistory = async () => {
        try {
            const db = await getDb();
            const recent = await db.getAllAsync<ActivityHistory & Activity>(
                `SELECT h.*, a.name, a.description, a.category, a.duration, a.steps, a.materials, a.estimated_cost, a.difficulty, a.prep_time, a.min_employees, a.max_employees, a.indoor_outdoor, a.remote_compatible, a.is_custom FROM activity_history h JOIN activities a ON h.activity_id = a.id ORDER BY h.scheduled_date DESC`
            );

            setHistory(recent);

            const marks: any = {};
            recent.forEach(item => {
                const dateStr = item.scheduled_date.split('T')[0];
                marks[dateStr] = {
                    marked: true,
                    dotColor: item.completed ? theme.colors.success : theme.colors.primary
                };
            });

            marks[selectedDate] = {
                ...marks[selectedDate],
                selected: true,
                selectedColor: theme.colors.primaryLight,
                selectedTextColor: theme.colors.primary
            };

            setMarkedDates(marks);
        } catch (e) {
            console.error("Failed to load history", e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [selectedDate])
    );

    const handleDayPress = (day: any) => {
        setSelectedDate(day.dateString);
    };

    const handleMarkComplete = async (historyId: number) => {
        await markCompleted(historyId, 5, "Great activity!");
        await loadHistory();
    };

    const handleRemoveScheduled = (item: ActivityHistory & Activity) => {
        Alert.alert(
            "Remove Scheduled Activity",
            `Remove "${item.name}" from ${item.scheduled_date.split('T')[0]}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        const db = await getDb();
                        await db.runAsync(`DELETE FROM activity_history WHERE id = ?`, [item.id]);
                        await loadHistory();
                    }
                }
            ]
        );
    };

    const selectedActivities = history.filter(h => h.scheduled_date.startsWith(selectedDate));

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={[styles.calendarWrap, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <Calendar
                        key={theme.isDark ? 'dark-calendar' : 'light-calendar'}
                        current={selectedDate}
                        onDayPress={handleDayPress}
                        markedDates={markedDates}
                        theme={{
                            backgroundColor: theme.colors.surface,
                            calendarBackground: theme.colors.surface,
                            textSectionTitleColor: theme.colors.textSecondary,
                            selectedDayBackgroundColor: theme.colors.primary,
                            selectedDayTextColor: theme.colors.white,
                            todayTextColor: theme.colors.primary,
                            dayTextColor: theme.colors.text,
                            textDisabledColor: theme.colors.border,
                            dotColor: theme.colors.primary,
                            selectedDotColor: theme.colors.white,
                            arrowColor: theme.colors.primary,
                            monthTextColor: theme.colors.text,
                            indicatorColor: theme.colors.primary,
                        }}
                    />
                </View>

                <View style={styles.agendaSection}>
                    <Text style={[theme.typography.h3, { color: theme.colors.text, marginBottom: theme.spacing.md }]}>
                        {selectedDate === todayStr ? 'Today' : selectedDate}
                    </Text>

                    {selectedActivities.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={[theme.typography.body1, { color: theme.colors.textSecondary }]}>
                                No activities scheduled.
                            </Text>
                        </View>
                    ) : (
                        selectedActivities.map(item => (
                            <View key={item.id} style={styles.activityWrap}>
                                <ActivityCard activity={item as any} onPress={() => { setSelectedActivity(item as any); setModalVisible(true); }} />
                                {item.completed ? (
                                    <Text style={[theme.typography.caption, { color: theme.colors.success, textAlign: 'center', marginBottom: 16, fontWeight: '700' }]}>
                                        {"✓ Completed"}
                                    </Text>
                                ) : (
                                    <View style={styles.calendarActions}>
                                        <TouchableOpacity
                                            style={[styles.completeBtn, { backgroundColor: theme.colors.secondary }]}
                                            onPress={() => handleMarkComplete(item.id)}
                                            activeOpacity={0.8}
                                        >
                                            <MaterialCommunityIcons name="check-circle-outline" size={18} color={theme.colors.white} />
                                            <Text style={[theme.typography.caption, { color: theme.colors.white, marginLeft: 6, fontWeight: '600' }]}>Mark Complete</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.removeScheduleBtn, { borderColor: theme.colors.error + '50', backgroundColor: theme.colors.error + '10' }]}
                                            onPress={() => handleRemoveScheduled(item)}
                                            activeOpacity={0.8}
                                        >
                                            <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.colors.error} />
                                            <Text style={[theme.typography.caption, { color: theme.colors.error, marginLeft: 6, fontWeight: '600' }]}>Remove</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            <ActivityDetailModal
                activity={selectedActivity}
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 16 },
    calendarWrap: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 24, paddingBottom: 8 },
    agendaSection: { flex: 1 },
    emptyState: { padding: 32, alignItems: 'center' },
    activityWrap: { marginBottom: 0 },
    calendarActions: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 16, gap: 10 },
    completeBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 10, borderRadius: 12,
    },
    removeScheduleBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1,
    },
});
