import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { StatCard } from '../components/StatCard';
import { FilterChip } from '../components/FilterChip';
import { Button } from '../components/Button';
import { ActivityCard } from '../components/ActivityCard';
import { getActivityStats, getUpcomingActivity, Activity, ActivityHistory } from '../database/database';

export const HomeScreen = () => {
    const { theme, organization } = useAppContext();
    const navigation = useNavigation();

    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({ completedThisMonth: 0 });
    const [upcoming, setUpcoming] = useState<(Activity & ActivityHistory) | null>(null);

    const loadData = async () => {
        try {
            const fetchedStats = await getActivityStats();
            setStats(fetchedStats);

            const nextActivity = await getUpcomingActivity();
            setUpcoming(nextActivity);
        } catch (e) {
            console.error("Failed to load dashboard data", e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const categories = [
        { label: 'Icebreaker', icon: 'snowflake' },
        { label: 'Team Bonding', icon: 'account-group' },
        { label: 'Wellness', icon: 'leaf' },
        { label: 'Recognition', icon: 'star-face' },
        { label: 'Festival', icon: 'party-popper' },
        { label: 'Training', icon: 'school' },
    ];

    const handleQuickFilter = (category: string) => {
        // @ts-ignore
        navigation.navigate('Generate', { preSelectedCategory: category });
    };

    // Engagement Score Logic: Target 2 activities per month is 100%
    const targetActivities = 2;
    const engagementScore = Math.min(Math.round((stats.completedThisMonth / targetActivities) * 100), 100);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Header Greeting */}
                <View style={styles.header}>
                    <Text style={[theme.typography.h1, { color: theme.colors.text }]}>
                        Hello, {organization?.companyName || 'Team'} 👋
                    </Text>
                    <Text style={[theme.typography.body1, { color: theme.colors.textSecondary, marginTop: theme.spacing.xs }]}>
                        Ready to boost your team's engagement?
                    </Text>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <StatCard
                        title="This Month"
                        value={stats.completedThisMonth.toString()}
                        icon="check-decagram"
                        color={theme.colors.success}
                    />
                    <StatCard
                        title="Engagement"
                        value={`${engagementScore}%`}
                        icon="lightning-bolt"
                        color={theme.colors.warning}
                    />
                </View>

                {/* Primary CTA */}
                <View style={[styles.ctaContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, ...theme.shadows.sm }]}>
                    <View style={styles.ctaTextContainer}>
                        <Text style={[theme.typography.h2, { color: theme.colors.text }]}>Find the perfect activity</Text>
                        <Text style={[theme.typography.body2, { color: theme.colors.textSecondary, marginTop: theme.spacing.xs, marginBottom: theme.spacing.md }]}>
                            AI-powered recommendations based on your unique team profile
                        </Text>
                    </View>
                    <Button
                        title="Generate Activity"
                        icon={<MaterialCommunityIcons name="creation" size={20} color={theme.colors.white} />}
                        // @ts-ignore
                        onPress={() => navigation.navigate('Generate')}
                        size="large"
                    />
                </View>

                {/* Upcoming Activity (if any) */}
                {upcoming ? (
                    <View style={styles.section}>
                        <Text style={[theme.typography.h3, { color: theme.colors.text, marginBottom: theme.spacing.sm }]}>Upcoming</Text>
                        <ActivityCard
                            activity={upcoming}
                            // @ts-ignore
                            onPress={() => navigation.navigate('Calendar', { date: upcoming.scheduled_date.split('T')[0] })}
                        />
                    </View>
                ) : null}

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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    ctaContainer: {
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 32,
    },
    ctaTextContainer: {
        paddingRight: 20,
    },
    section: {
        marginBottom: 32,
    },
    filterWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    }
});
