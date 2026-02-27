import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { Activity } from '../database/database';

interface ActivityCardProps {
    activity: Activity;
    onPress?: () => void;
    expanded?: boolean;
    isFavorite?: boolean;
    hideFavoriteIcon?: boolean;
    heartPosition?: 'bottom-right' | 'header';
}

export const ActivityCard = ({ activity, onPress, expanded = false, isFavorite = false, hideFavoriteIcon = false, heartPosition = 'bottom-right' }: ActivityCardProps) => {
    const { theme } = useAppContext();

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Icebreaker': return '#3B82F6'; // blue
            case 'Team Bonding': return '#8B5CF6'; // purple
            case 'Wellness': return '#10B981'; // green
            case 'Recognition': return '#F59E0B'; // yellow
            case 'Festival': return '#EF4444'; // red
            case 'Training': return '#6366F1'; // indigo
            default: return theme.colors.primary;
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Icebreaker': return 'snowflake';
            case 'Team Bonding': return 'account-group';
            case 'Wellness': return 'leaf';
            case 'Recognition': return 'star-face';
            case 'Festival': return 'party-popper';
            case 'Training': return 'school';
            default: return 'lightbulb-on';
        }
    };

    const badgeColor = getCategoryColor(activity.category);

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            style={[
                styles.card,
                {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.lg,
                    ...theme.shadows.md
                }
            ]}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.categoryBadge, { backgroundColor: badgeColor + '20', flexShrink: 1 }]}>
                    <MaterialCommunityIcons name={getCategoryIcon(activity.category)} size={16} color={badgeColor} style={{ marginRight: 4 }} />
                    <Text
                        style={[theme.typography.caption, { color: badgeColor, fontWeight: '700' }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {activity.category.toUpperCase()}
                    </Text>
                    {isFavorite && !hideFavoriteIcon && heartPosition === 'header' && (
                        <MaterialCommunityIcons name="heart" size={14} color={theme.colors.error} style={{ marginLeft: 6 }} />
                    )}
                </View>
                <View style={styles.headerRight}>
                    <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                        {activity.duration || 'Flexible'}
                    </Text>
                </View>
            </View>

            {/* Title & Description */}
            <Text style={[theme.typography.h3, { color: theme.colors.text, marginTop: theme.spacing.sm }]}>
                {activity.name}
            </Text>
            <Text
                style={[theme.typography.body2, { color: theme.colors.textSecondary, marginTop: theme.spacing.xs }]}
                numberOfLines={expanded ? undefined : 2}
            >
                {activity.description}
            </Text>

            {/* Metadata Row */}
            <View style={[styles.metaRow, { marginTop: theme.spacing.md }]}>
                <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="account-multiple" size={16} color={theme.colors.textSecondary} />
                    <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginLeft: 4 }]}>
                        {activity.min_employees > 0 ? `${activity.min_employees}-${activity.max_employees}` : 'Any size'}
                    </Text>
                </View>
                <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="currency-usd" size={16} color={theme.colors.textSecondary} />
                    <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginLeft: 4 }]}>
                        {activity.estimated_cost && !activity.estimated_cost.includes('$') ? `${activity.estimated_cost} Budget` : 'Low Budget'}
                    </Text>
                </View>
                <View style={styles.metaItem}>
                    <MaterialCommunityIcons name={activity.indoor_outdoor === 'Indoor' ? 'home-variant' : activity.indoor_outdoor === 'Outdoor' ? 'tree' : 'map-marker-multiple'} size={16} color={theme.colors.textSecondary} />
                    <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginLeft: 4 }]}>
                        {activity.indoor_outdoor || 'Anywhere'}
                    </Text>
                </View>
                {isFavorite && !hideFavoriteIcon && heartPosition === 'bottom-right' && (
                    <View style={[styles.metaItem, { marginLeft: 'auto' }]}>
                        <MaterialCommunityIcons name="heart" size={18} color={theme.colors.error} />
                    </View>
                )}
            </View>

            {/* Expanded Details section */}
            {expanded && (
                <View style={[styles.expandedContent, { borderTopColor: theme.colors.border, paddingTop: theme.spacing.md, marginTop: theme.spacing.md }]}>
                    <Text style={[theme.typography.h4, { color: theme.colors.text, marginBottom: theme.spacing.sm }]}>Steps</Text>
                    {JSON.parse(activity.steps).map((step: string, idx: number) => (
                        <View key={idx} style={{ flexDirection: 'row', marginBottom: 6 }}>
                            <Text style={[theme.typography.body2, { color: theme.colors.primary, fontWeight: 'bold', width: 24 }]}>{idx + 1}.</Text>
                            <Text style={[theme.typography.body2, { color: theme.colors.text, flex: 1 }]}>{step}</Text>
                        </View>
                    ))}

                    <Text style={[theme.typography.h4, { color: theme.colors.text, marginTop: theme.spacing.md, marginBottom: theme.spacing.sm }]}>Materials Needed</Text>
                    {JSON.parse(activity.materials).map((item: string, idx: number) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <MaterialCommunityIcons name="circle-small" size={16} color={theme.colors.textSecondary} />
                            <Text style={[theme.typography.body2, { color: theme.colors.text }]}>{item}</Text>
                        </View>
                    ))}

                </View>
            )}

        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    expandedContent: {
        borderTopWidth: 1,
    }
});
