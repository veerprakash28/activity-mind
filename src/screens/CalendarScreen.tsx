import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '../context/AppContext';
import { getRecentHistory, ActivityHistory, Activity, markCompleted, getDb } from '../database/database';
import { ActivityCard } from '../components/ActivityCard';
import { Button } from '../components/Button';

export const CalendarScreen = ({ route }: any) => {
    const { theme } = useAppContext();

    const todayStr = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(route.params?.date || todayStr);
    const [history, setHistory] = useState<(ActivityHistory & Activity)[]>([]);
    const [markedDates, setMarkedDates] = useState<any>({});

    const loadHistory = async () => {
        try {
            // Fetch last 90 days for calendar marking
            const db = await getDb();
            const recent = await db.getAllAsync<ActivityHistory & Activity>(
                `SELECT h.*, a.* FROM activity_history h JOIN activities a ON h.activity_id = a.id ORDER BY h.scheduled_date DESC`
            );

            setHistory(recent);

            // Process for calendar dots
            const marks: any = {};
            recent.forEach(item => {
                const dateStr = item.scheduled_date.split('T')[0];
                marks[dateStr] = {
                    marked: true,
                    dotColor: item.completed ? theme.colors.success : theme.colors.primary
                };
            });

            // Ensure selected date is styled
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
            if (route.params?.date) {
                setSelectedDate(route.params.date);
            }
            loadHistory();
        }, [route.params?.date, selectedDate])
    );

    const handleDayPress = (day: any) => {
        setSelectedDate(day.dateString);
    };

    const handleMarkComplete = async (historyId: number) => {
        // In a real app we'd open a modal to ask for 1-5 rating & feedback
        await markCompleted(historyId, 5, "Great activity!");
        await loadHistory();
    };

    const selectedActivities = history.filter(h => h.scheduled_date.startsWith(selectedDate));

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={[styles.calendarWrap, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <Calendar
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
                            selectedDotColor: theme.colors.primary,
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
                                <ActivityCard activity={item} />
                                {item.completed ? (
                                    <Text style={[theme.typography.caption, { color: theme.colors.success, textAlign: 'center', marginBottom: 16, fontWeight: '700' }]}>
                                        ✓ Completed
                                    </Text>
                                ) : (
                                    <Button
                                        title="Mark as Completed"
                                        variant="secondary"
                                        onPress={() => handleMarkComplete(item.id)}
                                        style={{ marginTop: -8, marginBottom: 16 }}
                                    />
                                )}
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    calendarWrap: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 24,
        paddingBottom: 8,
    },
    agendaSection: {
        flex: 1,
    },
    emptyState: {
        padding: 32,
        alignItems: 'center',
    },
    activityWrap: {
        marginBottom: 0,
    }
});
