import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { getDb, Activity, ActivityHistory } from '../database/database';

const screenWidth = Dimensions.get('window').width;

export const InsightsScreen = () => {
    const { theme } = useAppContext();
    const [history, setHistory] = useState<(ActivityHistory & Activity)[]>([]);
    const [totalActivities, setTotalActivities] = useState(0);
    const [totalFavorites, setTotalFavorites] = useState(0);

    const loadData = async () => {
        try {
            const db = await getDb();
            const data = await db.getAllAsync<ActivityHistory & Activity>(
                `SELECT h.*, a.* FROM activity_history h JOIN activities a ON h.activity_id = a.id WHERE h.completed = 1 ORDER BY h.scheduled_date ASC`
            );
            setHistory(data);

            const actCount = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM activities`);
            setTotalActivities(actCount?.count || 0);

            const favCount = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM favorites`);
            setTotalFavorites(favCount?.count || 0);
        } catch (e) {
            console.error("Failed to load insights", e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    // Group by Category for bar chart
    const categoryCounts = history.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const barData = {
        labels: Object.keys(categoryCounts).length > 0 ? Object.keys(categoryCounts).map(l => l.substring(0, 5)) : ['N/A'],
        datasets: [
            { data: Object.keys(categoryCounts).length > 0 ? Object.values(categoryCounts) : [0] }
        ]
    };

    // Group completed activities by month for line chart (real data only)
    const monthCounts: Record<string, number> = {};
    const monthLabels: string[] = [];
    const now = new Date();

    // Build last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleString('default', { month: 'short' });
        monthLabels.push(label);
        monthCounts[key] = 0;
    }

    // Count completed activities per month
    for (const item of history) {
        const d = new Date(item.scheduled_date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (key in monthCounts) {
            monthCounts[key]++;
        }
    }

    const lineData = {
        labels: monthLabels,
        datasets: [
            {
                data: Object.values(monthCounts).length > 0 ? Object.values(monthCounts) : [0, 0, 0, 0, 0, 0],
                color: (opacity = 1) => theme.colors.primary,
                strokeWidth: 2
            }
        ],
        legend: ["Completed Activities"]
    };

    const chartConfig = {
        backgroundGradientFrom: theme.colors.surface,
        backgroundGradientTo: theme.colors.surface,
        color: (opacity = 1) => theme.colors.primary,
        labelColor: (opacity = 1) => theme.colors.textSecondary,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: theme.colors.primary
        }
    };

    // Dynamic AI suggestion based on real data
    const getAiSuggestion = () => {
        if (history.length === 0) {
            return "You haven't completed any activities yet. Start by generating and scheduling your first activity!";
        }

        const allCategories = ['Icebreaker', 'Team Bonding', 'Wellness', 'Training', 'Recognition', 'Festival'];
        const usedCategories = Object.keys(categoryCounts);
        const missingCategories = allCategories.filter(c => !usedCategories.includes(c));

        if (missingCategories.length > 0) {
            return `You haven't tried any ${missingCategories[0]} activities yet. Consider adding one to keep your engagement diverse!`;
        }

        // Find least used category
        const leastUsed = Object.entries(categoryCounts).sort((a, b) => a[1] - b[1])[0];
        return `Your team loves ${Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0][0]} activities! Try adding more ${leastUsed[0]} activities for better balance.`;
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={[styles.statBox, { backgroundColor: theme.colors.primaryLight }]}>
                        <Text style={[theme.typography.h2, { color: theme.colors.primary }]}>{history.length}</Text>
                        <Text style={[theme.typography.caption, { color: theme.colors.primary }]}>Completed</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: theme.colors.secondaryLight }]}>
                        <Text style={[theme.typography.h2, { color: theme.colors.secondary }]}>{totalActivities}</Text>
                        <Text style={[theme.typography.caption, { color: theme.colors.secondary }]}>In Bank</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: '#FEF3C7' }]}>
                        <Text style={[theme.typography.h2, { color: '#D97706' }]}>{totalFavorites}</Text>
                        <Text style={[theme.typography.caption, { color: '#D97706' }]}>Favorites</Text>
                    </View>
                </View>

                {/* AI Card */}
                <View style={[styles.aiCard, { backgroundColor: theme.colors.secondaryLight, borderColor: theme.colors.secondary + '40', borderWidth: 1 }]}>
                    <View style={styles.aiHeader}>
                        <MaterialCommunityIcons name="brain" size={24} color={theme.colors.secondary} />
                        <Text style={[theme.typography.h3, { color: theme.colors.secondary, marginLeft: 8 }]}>AI Insights</Text>
                    </View>
                    <Text style={[theme.typography.body1, { color: theme.colors.text, marginTop: theme.spacing.sm }]}>
                        {getAiSuggestion()}
                    </Text>
                </View>

                {/* Line Chart */}
                <View style={styles.chartContainer}>
                    <Text style={[theme.typography.h3, { color: theme.colors.text, marginBottom: theme.spacing.md }]}>Monthly Activity</Text>
                    <View style={[styles.chartWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <LineChart
                            data={lineData}
                            width={screenWidth - 64}
                            height={220}
                            chartConfig={chartConfig}
                            bezier
                            style={{ borderRadius: 16 }}
                        />
                    </View>
                </View>

                {/* Bar Chart */}
                <View style={styles.chartContainer}>
                    <Text style={[theme.typography.h3, { color: theme.colors.text, marginBottom: theme.spacing.md }]}>Popular Categories</Text>
                    <View style={[styles.chartWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                        <BarChart
                            data={barData}
                            width={screenWidth - 64}
                            height={220}
                            yAxisLabel=""
                            yAxisSuffix=""
                            chartConfig={chartConfig}
                            style={{ borderRadius: 16 }}
                            fromZero
                        />
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
        padding: 16,
        paddingBottom: 40,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
    },
    statBox: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    aiCard: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 32,
    },
    aiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chartContainer: {
        marginBottom: 32,
    },
    chartWrapper: {
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
    }
});
