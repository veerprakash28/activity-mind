import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: string;
    color?: string;
    subtitle?: string;
}

export const StatCard = ({ title, value, icon, color, subtitle }: StatCardProps) => {
    const { theme } = useAppContext();
    const iconColor = color || theme.colors.primary;

    return (
        <View style={[
            styles.card,
            {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.lg,
                ...theme.shadows.sm
            }
        ]}>
            <View style={[styles.iconWrapper, { backgroundColor: iconColor + '15' }]}>
                <MaterialCommunityIcons name={icon as any} size={24} color={iconColor} />
            </View>

            <Text style={[theme.typography.h2, { color: theme.colors.text, marginTop: theme.spacing.sm }]}>
                {value}
            </Text>
            <Text style={[theme.typography.body2, { color: theme.colors.textSecondary, marginTop: 2 }]}>
                {title}
            </Text>

            {subtitle && (
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: theme.spacing.xs }]}>
                    {subtitle}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flex: 1,
        padding: 16,
        borderWidth: 1,
        minWidth: 140, // Ensure cards don't shrink too much in row
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
