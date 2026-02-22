import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_REMINDER_MONTH = 'last_calendar_reminder_month';

export const CalendarExportService = {
    /**
     * Schedules a reminder for the 28th of the current or next month.
     */
    scheduleMonthlyReminder: async () => {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;

        // We only want to schedule if we haven't already reminded for this month
        const lastReminded = await AsyncStorage.getItem(LAST_REMINDER_MONTH);
        if (lastReminded === currentMonth) return;

        // Target: 28th of the current month at 10:00 AM
        let targetDate = new Date(now.getFullYear(), now.getMonth(), 28, 10, 0, 0);

        // If it's already past the 28th, schedule for next month
        if (now > targetDate) {
            targetDate = new Date(now.getFullYear(), now.getMonth() + 1, 28, 10, 0, 0);
        }

        try {
            // Check if reminder already exists to avoid duplicates
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            const exists = scheduled.some(n => n.content.data?.type === 'month_end_reminder');

            if (exists) return;

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "📅 Finalize Your HR Calendar!",
                    body: "The month is ending soon. Time to review your activities and export your monthly engagement plan! ✨",
                    data: { type: 'month_end_reminder' },
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: targetDate,
                },
            });

            await AsyncStorage.setItem(LAST_REMINDER_MONTH, currentMonth);
        } catch (e) {
        }
    }
};
