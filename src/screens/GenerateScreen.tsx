import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { Button } from '../components/Button';
import { FilterChip } from '../components/FilterChip';
import { ActivityCard } from '../components/ActivityCard';
import { generateActivities, FilterParams, SmartEngineResult } from '../database/smartEngine';
import { saveHistory, toggleFavorite, isFavorite } from '../database/database';

export const GenerateScreen = ({ route }: any) => {
    const { theme, organization } = useAppContext();

    // Filters state
    const [category, setCategory] = useState<string | undefined>(route?.params?.preSelectedCategory);
    const [duration, setDuration] = useState<string | undefined>();
    const [budgetLevel, setBudgetLevel] = useState<'Low' | 'Medium' | 'High' | undefined>();

    // Results state
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SmartEngineResult | null>(null);
    const [favoriteMap, setFavoriteMap] = useState<Record<number, boolean>>({});

    const handleGenerate = async () => {
        setLoading(true);

        const filters: FilterParams = {
            category,
            duration,
            budgetLevel,
        };

        try {
            // Add slight delay to simulate "AI thinking" for UX
            await new Promise(res => setTimeout(res, 600));

            const generationResult = await generateActivities(organization, filters, 3);
            setResult(generationResult);

            // Check favorite status for all results
            const favMap: Record<number, boolean> = {};
            for (const act of generationResult.activities) {
                favMap[act.id] = await isFavorite(act.id);
            }
            setFavoriteMap(favMap);
        } catch (e) {
            Alert.alert("Error", "Could not generate activities.");
        } finally {
            setLoading(false);
        }
    };

    const handleShuffle = () => {
        handleGenerate(); // Just re-run generation with same filters
    };

    const handleToggleFavorite = async (activityId: number) => {
        const isFav = await toggleFavorite(activityId);
        setFavoriteMap(prev => ({ ...prev, [activityId]: isFav }));
    };

    const handleAddToCalendar = async (activityId: number) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 0, 0, 0);

        await saveHistory(activityId, tomorrow.toISOString());
        Alert.alert("Scheduled!", "Added to your calendar for tomorrow.");
    };

    const renderFilters = () => (
        <View style={[styles.filterSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[theme.typography.h4, { color: theme.colors.text, marginBottom: theme.spacing.md }]}>Configure Filters</Text>

            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {['Icebreaker', 'Team Bonding', 'Wellness', 'Training', 'Recognition', 'Festival'].map(cat => (
                    <FilterChip
                        key={cat}
                        label={cat}
                        selected={category === cat}
                        onPress={() => setCategory(category === cat ? undefined : cat)}
                    />
                ))}
            </ScrollView>

            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: theme.spacing.sm, marginBottom: theme.spacing.xs }]}>Duration</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {['15 min', '30 min', '1 hr', 'Half day'].map(dur => (
                    <FilterChip
                        key={dur}
                        label={dur}
                        selected={duration === dur}
                        onPress={() => setDuration(duration === dur ? undefined : dur)}
                    />
                ))}
            </ScrollView>

            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: theme.spacing.sm, marginBottom: theme.spacing.xs }]}>Budget</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {['Low', 'Medium', 'High'].map(bud => (
                    <FilterChip
                        key={bud}
                        label={bud}
                        selected={budgetLevel === bud}
                        // @ts-ignore
                        onPress={() => setBudgetLevel(budgetLevel === bud ? undefined : bud)}
                    />
                ))}
            </ScrollView>

            <Button
                title="Generate Now"
                onPress={handleGenerate}
                loading={loading}
                style={{ marginTop: theme.spacing.lg }}
            />
        </View>
    );

    const renderResult = () => {
        if (!result) return null;

        if (result.activities.length === 0) {
            return (
                <View style={[styles.emptyState, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.warning} />
                    <Text style={[theme.typography.h3, { color: theme.colors.text, marginTop: theme.spacing.md, textAlign: 'center' }]}>No Matches Found</Text>
                    <Text style={[theme.typography.body2, { color: theme.colors.textSecondary, marginTop: theme.spacing.sm, textAlign: 'center' }]}>{result.message}</Text>
                </View>
            );
        }

        return (
            <View style={styles.resultContainer}>
                <View style={[styles.aiMessage, { backgroundColor: theme.colors.primaryLight }]}>
                    <MaterialCommunityIcons name="robot-outline" size={24} color={theme.colors.primary} />
                    <Text style={[theme.typography.body2, { color: theme.colors.primary, marginLeft: theme.spacing.sm, flex: 1, fontWeight: '600' }]}>
                        {result.message}
                    </Text>
                </View>

                {result.activities.map((activity, index) => (
                    <View key={activity.id} style={styles.resultItem}>
                        <View style={styles.resultBadge}>
                            <Text style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: '700' }]}>
                                Idea {index + 1}
                            </Text>
                        </View>
                        <ActivityCard activity={activity} expanded={false} />
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.actionBtn, { borderColor: theme.colors.border }]}
                                onPress={() => handleToggleFavorite(activity.id)}
                            >
                                <MaterialCommunityIcons
                                    name={favoriteMap[activity.id] ? "heart" : "heart-outline"}
                                    size={20}
                                    color={favoriteMap[activity.id] ? theme.colors.error : theme.colors.iconDefault}
                                />
                                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginLeft: 4 }]}>
                                    {favoriteMap[activity.id] ? 'Saved' : 'Save'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, { borderColor: theme.colors.border }]}
                                onPress={() => handleAddToCalendar(activity.id)}
                            >
                                <MaterialCommunityIcons name="calendar-plus" size={20} color={theme.colors.primary} />
                                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginLeft: 4 }]}>Schedule</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                <Button
                    title="Shuffle / Get New Ideas"
                    variant="outline"
                    icon={<MaterialCommunityIcons name="shuffle-variant" size={20} color={theme.colors.primary} />}
                    onPress={handleShuffle}
                    loading={loading}
                    style={{ marginTop: theme.spacing.sm }}
                />
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {renderFilters()}
                {renderResult()}
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
    filterSection: {
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 24,
    },
    chipRow: {
        flexDirection: 'row',
    },
    resultContainer: {
        marginTop: 8,
    },
    aiMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    resultItem: {
        marginBottom: 16,
    },
    resultBadge: {
        marginBottom: 6,
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 8,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    emptyState: {
        padding: 32,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
