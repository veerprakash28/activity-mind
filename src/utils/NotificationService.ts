import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
let _enabled = true;
let _reminderTime = '09:00';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const NotificationService = {
    /**
     * Set whether notifications are globally enabled for the app
     */
    setEnabled: (enabled: boolean) => {
        _enabled = enabled;
    },

    /**
     * Check if notifications are globally enabled
     */
    isEnabled: () => _enabled,

    /**
     * Set the global preferred reminder time
     */
    setReminderTime: (time: string) => {
        _reminderTime = time || '09:00';
    },

    /**
     * Request notification permissions from the user
     */
    requestPermissions: async () => {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        return finalStatus === 'granted';
    },

    /**
     * Schedule a reminder for an activity at the preferred time on the day it occurs
     */
    scheduleActivityReminder: async (historyId: number, activityName: string, dateString: string) => {
        if (!_enabled) {
            return null;
        }

        const scheduledDate = new Date(dateString);

        // Calculate trigger time based on preferred reminder time
        const [hours, minutes] = (_reminderTime || '09:00').split(':').map(Number);
        const triggerDate = new Date(scheduledDate);
        triggerDate.setHours(hours, minutes, 0, 0);

        const now = new Date();

        // If normalized date is "today" but the time has already passed, we can't schedule it for today.
        // However, for testing, we might want to schedule it 1 minute from now if it's for today.
        // For the real app logic: If it's in the past, we skip.
        if (triggerDate <= now) {
            return null;
        }


        try {
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Activity Reminder 🔔",
                    body: `Your team activity "${activityName}" is coming up!`,
                    data: { historyId },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: triggerDate,
                } as any,
            });

            return notificationId;
        } catch (error) {
            console.error("[NotificationService] Failed to schedule notification:", error);
            return null;
        }
    },

    /**
     * Cancel all scheduled notifications (useful for rescheduling)
     */
    cancelAllScheduledNotifications: async () => {
        try {
            await Notifications.cancelAllScheduledNotificationsAsync();
        } catch (error) {
            console.error("[NotificationService] Failed to cancel all notifications:", error);
        }
    },

    /**
     * Add a listener for when a notification is received
     */
    addListener: (handler: (notification: Notifications.Notification) => void) => {
        return Notifications.addNotificationReceivedListener(handler);
    },

    /**
     * Add a listener for interaction
     */
    addResponseListener: (handler: (response: Notifications.NotificationResponse) => void) => {
        return Notifications.addNotificationResponseReceivedListener(handler);
    },

    /**
     * Remove a listener
     */
    removeListener: (subscription: Notifications.Subscription) => {
        subscription.remove();
    },

    /**
     * Cancel a specific reminder
     */
    cancelActivityReminder: async (notificationId: string) => {
        if (!notificationId) return;
        try {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
        } catch (error) {
            // Silently fail if ID is invalid or already fired
        }
    }
};
