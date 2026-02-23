import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { getDb, ActivityHistory, Activity, markCompleted, unmarkCompleted, removeScheduledActivity, getMonthlyScheduledActivities, saveHistory } from '../database/database';
import { ActivityCard } from '../components/ActivityCard';
import { ActivityDetailModal } from '../components/ActivityDetailModal';
import { Button } from '../components/Button';
import { StatusModal, StatusType } from '../components/StatusModal';

export const CalendarScreen = ({ route }: any) => {
    const { theme } = useAppContext();
    const navigation = useNavigation<any>();

    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const [selectedDate, setSelectedDate] = useState(route?.params?.date || todayStr);
    const [history, setHistory] = useState<(ActivityHistory & Activity)[]>([]);
    const [markedDates, setMarkedDates] = useState<any>({});
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Status Modal State
    const [statusVisible, setStatusVisible] = useState(false);
    const [statusType, setStatusType] = useState<StatusType>('confirm');
    const [statusTitle, setStatusTitle] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [statusConfirmLabel, setStatusConfirmLabel] = useState('Yes');
    const [onStatusConfirm, setOnStatusConfirm] = useState<(() => void) | undefined>(undefined);

    const loadHistory = async (baseDate?: string) => {
        try {
            const targetDateStr = baseDate || selectedDate;
            const targetDate = new Date(targetDateStr);
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth();

            let promises = [];
            // Fetch activities for expanded window to cover swiping (-2 to +2 months)
            for (let i = -2; i <= 2; i++) {
                let m = month + i;
                let y = year;
                while (m < 0) { m += 12; y--; }
                while (m > 11) { m -= 12; y++; }
                promises.push(getMonthlyScheduledActivities(y, m));
            }

            const results = await Promise.all(promises);
            const allItems = results.flat();

            setHistory(allItems);

            const marks: any = {};
            allItems.forEach(item => {
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

    const handleMarkComplete = async (item: ActivityHistory & Activity) => {
        setStatusType('confirm');
        setStatusTitle('Mark as Completed');
        setStatusMessage(`Did you finish "${item.name}"? This will boost your engagement score!`);
        setStatusConfirmLabel('Yes, Completed!');
        setOnStatusConfirm(() => async () => {
            let targetId = item.id;
            if (targetId < 0) {
                targetId = await saveHistory(item.activity_id, item.scheduled_date);
            }
            await markCompleted(targetId, 5, "Great activity!");
            await loadHistory();
        });
        setStatusVisible(true);
    };

    const handleUnmarkComplete = async (item: ActivityHistory & Activity) => {
        setStatusType('confirm');
        setStatusTitle('Undo Completion');
        setStatusMessage(`Are you sure you want to mark "${item.name}" as not completed?`);
        setStatusConfirmLabel('Yes, Undo');
        setOnStatusConfirm(() => async () => {
            await unmarkCompleted(item.id);
            await loadHistory();
        });
        setStatusVisible(true);
    };

    const handleRemoveScheduled = (item: ActivityHistory & Activity) => {
        if (item.id < 0) {
            setStatusType('info');
            setStatusTitle('Recurring Activity');
            setStatusMessage(`This is a default weekly activity for your team.\nYou can mark it Complete instead!`);
            setStatusConfirmLabel('Got It');
            setOnStatusConfirm(() => () => { });
            setStatusVisible(true);
            return;
        }

        setStatusType('confirm');
        setStatusTitle('Remove Activity');
        setStatusMessage(`Remove "${item.name}" from your schedule?`);
        setStatusConfirmLabel('Remove');
        setOnStatusConfirm(() => async () => {
            await removeScheduledActivity(item.id);
            await loadHistory();
        });
        setStatusVisible(true);
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
                        onMonthChange={(month: any) => {
                            // When user swipes to a new month, load surrounding months proactively
                            loadHistory(month.dateString);
                        }}
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
                                    <View style={styles.calendarActions}>
                                        <TouchableOpacity
                                            style={[styles.completeBtn, { backgroundColor: theme.colors.success + '20', borderColor: theme.colors.success }]}
                                            onPress={() => handleUnmarkComplete(item)}
                                            activeOpacity={0.8}
                                        >
                                            <MaterialCommunityIcons name="check-circle" size={18} color={theme.colors.success} />
                                            <Text style={[theme.typography.caption, { color: theme.colors.success, marginLeft: 6, fontWeight: '700' }]}>Completed (Undo)</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.calendarActions}>
                                        <TouchableOpacity
                                            style={[styles.completeBtn, { backgroundColor: theme.colors.secondary }]}
                                            onPress={() => handleMarkComplete(item)}
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
                hideSchedule={true}
                hideSave={true}
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
    }
});
