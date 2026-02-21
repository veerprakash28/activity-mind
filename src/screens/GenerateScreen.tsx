import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppContext } from '../context/AppContext';
import { Button } from '../components/Button';
import { FilterChip } from '../components/FilterChip';
import { ActivityCard } from '../components/ActivityCard';
import { ActivityDetailModal } from '../components/ActivityDetailModal';
import { generateActivities, FilterParams, SmartEngineResult } from '../database/smartEngine';
import { saveHistory, toggleFavorite, isFavorite, Activity } from '../database/database';

export const GenerateScreen = ({ route }: any) => {
    const { theme, organization, categories, preferences } = useAppContext();

    // Filters state
    const [category, setCategory] = useState<string | undefined>(route?.params?.preSelectedCategory);
    const [duration, setDuration] = useState<string | undefined>();
    const [budgetLevel, setBudgetLevel] = useState<'Low' | 'Medium' | 'High' | undefined>();

    // Results state
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SmartEngineResult | null>(null);
    const [favoriteMap, setFavoriteMap] = useState<Record<number, boolean>>({});

    // Detail modal
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Date picker
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [schedulingActivity, setSchedulingActivity] = useState<Activity | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Auto-generate if pre-selected category is provided (from Dashboard)
    React.useEffect(() => {
        if (route?.params?.preSelectedCategory && !result && !loading) {
            handleGenerate();
        }
    }, [route?.params?.preSelectedCategory]);

    const handleGenerate = async () => {
        setLoading(true);
        const filters: FilterParams = { category, duration, budgetLevel };

        try {
            await new Promise(res => setTimeout(res, 600));
            const count = preferences.generationCount || 3;
            const generationResult = await generateActivities(organization, filters, count);
            setResult(generationResult);

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

    const handleToggleFavorite = async (activityId: number) => {
        const isFav = await toggleFavorite(activityId);
        setFavoriteMap(prev => ({ ...prev, [activityId]: isFav }));
    };

    const handleSchedulePress = (activity: Activity) => {
        setSchedulingActivity(activity);
        setSelectedDate(new Date());
        setShowDatePicker(true);
    };

    const handleDateChange = async (event: any, date?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            if (event.type === 'dismissed') {
                setSchedulingActivity(null);
                return;
            }
        }
        if (date && schedulingActivity) {
            setSelectedDate(date);
            if (Platform.OS === 'android' && event.type === 'set') {
                // On Android, picker dismisses on selection
                date.setHours(12, 0, 0, 0);
                await saveHistory(schedulingActivity.id, date.toISOString());
                Alert.alert("Scheduled!", `Activity added to ${date.toLocaleDateString()}.`);
                setSchedulingActivity(null);
            }
        }
    };

    const confirmIOSDate = async () => {
        if (schedulingActivity) {
            const date = new Date(selectedDate);
            date.setHours(12, 0, 0, 0);
            await saveHistory(schedulingActivity.id, date.toISOString());
            Alert.alert("Scheduled!", `Activity added to ${date.toLocaleDateString()}.`);
            setShowDatePicker(false);
            setSchedulingActivity(null);
        }
    };

    const openDetail = (activity: Activity) => {
        setSelectedActivity(activity);
        setModalVisible(true);
    };

    const renderFilters = () => (
        <View style={[styles.filterSection, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[theme.typography.h4, { color: theme.colors.text, marginBottom: theme.spacing.md }]}>Configure Filters</Text>

            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {categories.map(cat => (
                    <FilterChip key={cat} label={cat} selected={category === cat} onPress={() => setCategory(category === cat ? undefined : cat)} />
                ))}
            </ScrollView>

            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: theme.spacing.sm, marginBottom: theme.spacing.xs }]}>Duration</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {['15 min', '30 min', '1 hr', 'Half day'].map(dur => (
                    <FilterChip key={dur} label={dur} selected={duration === dur} onPress={() => setDuration(duration === dur ? undefined : dur)} />
                ))}
            </ScrollView>

            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: theme.spacing.sm, marginBottom: theme.spacing.xs }]}>Budget</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {(['Low', 'Medium', 'High'] as const).map(bud => (
                    <FilterChip key={bud} label={bud} selected={budgetLevel === bud} onPress={() => setBudgetLevel(budgetLevel === bud ? undefined : bud)} />
                ))}
            </ScrollView>

            <Button title="Generate Now" onPress={handleGenerate} loading={loading} style={{ marginTop: theme.spacing.lg }} />
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
                                {"Idea " + (index + 1)}
                            </Text>
                        </View>
                        <ActivityCard activity={activity} expanded={false} onPress={() => openDetail(activity)} />
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
                                onPress={() => handleSchedulePress(activity)}
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
                    onPress={handleGenerate}
                    loading={loading}
                    style={{ marginTop: theme.spacing.sm }}
                />
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {renderFilters()}
                {renderResult()}
            </ScrollView>

            {/* Activity Detail Modal */}
            <ActivityDetailModal
                activity={selectedActivity}
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                actions={selectedActivity ? (
                    <>
                        <Button
                            title={favoriteMap[selectedActivity.id] ? "Saved" : "Save"}
                            variant="outline"
                            icon={<MaterialCommunityIcons name={favoriteMap[selectedActivity.id] ? "heart" : "heart-outline"} size={18} color={theme.colors.primary} />}
                            onPress={() => handleToggleFavorite(selectedActivity.id)}
                            style={{ flex: 1 }}
                            size="small"
                        />
                        <Button
                            title="Schedule"
                            icon={<MaterialCommunityIcons name="calendar-plus" size={18} color={theme.colors.white} />}
                            onPress={() => { setModalVisible(false); handleSchedulePress(selectedActivity); }}
                            style={{ flex: 1 }}
                            size="small"
                        />
                    </>
                ) : undefined}
            />

            {/* Date Picker */}
            {showDatePicker && (
                <View>
                    <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        minimumDate={new Date()}
                        onChange={handleDateChange}
                    />
                    {Platform.OS === 'ios' && (
                        <View style={styles.iosDateActions}>
                            <Button title="Cancel" variant="ghost" onPress={() => setShowDatePicker(false)} size="small" />
                            <Button title="Confirm" onPress={confirmIOSDate} size="small" />
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    filterSection: { padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 24 },
    chipRow: { flexDirection: 'row' },
    resultContainer: { marginTop: 8 },
    aiMessage: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 16 },
    resultItem: { marginBottom: 16 },
    resultBadge: { marginBottom: 6 },
    actionRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    emptyState: { padding: 32, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    iosDateActions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 },
});
