import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
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
     * Schedule a reminder for an activity 30 minutes before it starts
     * @param historyId The ID of the activity history record
     * @param activityName The name of the activity
     * @param dateString The ISO string of the scheduled date
     * @returns The notification ID if scheduled, or null
     */
    scheduleActivityReminder: async (historyId: number, activityName: string, dateString: string) => {
        const scheduledDate = new Date(dateString);

        // Target time is 30 minutes before the scheduled time
        // Note: Scheduled activities are normalized to 12:00 PM local time to prevent drift
        const triggerDate = new Date(scheduledDate.getTime() - 30 * 60000);
        const now = new Date();

        if (triggerDate <= now) {
            console.log(`[NotificationService] Activity "${activityName}" is too soon (${triggerDate.toLocaleString()}), skipping reminder.`);
            return null;
        }

        console.log(`[NotificationService] Scheduling reminder for "${activityName}" at ${triggerDate.toLocaleString()}`);

        try {
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Activity Reminder 🔔",
                    body: `Your team activity "${activityName}" starts in 30 minutes!`,
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
     * Send an immediate test notification to verify permissions and setup
     */
    sendImmediateTestNotification: async () => {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Test Notification 🚀",
                    body: "Smart Reminders are working perfectly! You'll get notified 30 mins before your team activities.",
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: null, // Send immediately
            });
            return true;
        } catch (error) {
            console.error("[NotificationService] Failed to send test notification:", error);
            return false;
        }
    },

    /**
     * Add a listener for when a notification is received while the app is in the foreground
     */
    addListener: (handler: (notification: Notifications.Notification) => void) => {
        return Notifications.addNotificationReceivedListener(handler);
    },

    /**
     * Add a listener for when the user interacts with a notification
     */
    addResponseListener: (handler: (response: Notifications.NotificationResponse) => void) => {
        return Notifications.addNotificationResponseReceivedListener(handler);
    },

    /**
     * Remove a notification listener
     */
    removeListener: (subscription: Notifications.Subscription) => {
        subscription.remove();
    },

    /**
     * Cancel a scheduled notification
     * @param notificationId The ID returned by scheduleNotificationAsync
     */
    cancelActivityReminder: async (notificationId: string) => {
        if (!notificationId) return;
        try {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
            console.log(`[NotificationService] Cancelled notification: ${notificationId}`);
        } catch (error) {
            console.error("[NotificationService] Failed to cancel notification:", error);
        }
    }
};
