import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NotificationService } from '../utils/NotificationService';

/**
 * Handles navigation when a notification is tapped
 */
export const NotificationHandler = () => {
    const navigation = useNavigation<any>();

    useEffect(() => {
        // Handle notification responses (when user taps on a notification)
        const subscription = NotificationService.addResponseListener((response) => {
            const data = response.notification.request.content.data;

            if (data?.type === 'task') {
                navigation.navigate('Tasks');
            } else if (data?.historyId) {
                // Future: Navigate to specific activity detail if needed
                navigation.navigate('Calendar');
            }
        });

        return () => {
            NotificationService.removeListener(subscription);
        };
    }, [navigation]);

    return null; // This component doesn't render anything
};
