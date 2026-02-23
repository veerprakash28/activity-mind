import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, RefreshControl, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppContext } from '../context/AppContext';
import { Button } from '../components/Button';
import { FilterChip } from '../components/FilterChip';
import { ActivityCard } from '../components/ActivityCard';
import { ActivityDetailModal } from '../components/ActivityDetailModal';
import { StatusModal, StatusType } from '../components/StatusModal';
import { generateActivities, FilterParams, SmartEngineResult } from '../database/smartEngine';
import { saveHistory, toggleFavorite, isFavorite, Activity, normalizeDate } from '../database/database';

export const GenerateScreen = ({ route, navigation }: any) => {
    const { theme, organization, categories, preferences, setGenerationCount } = useAppContext();

    // Filters state
    const [category, setCategory] = useState<string | undefined>(route?.params?.preSelectedCategory);
    const [duration, setDuration] = useState<string | undefined>();
    const [budgetLevel, setBudgetLevel] = useState<'Low' | 'Medium' | 'High' | undefined>();

    // Results state
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [result, setResult] = useState<SmartEngineResult | null>(null);
    const [favoriteMap, setFavoriteMap] = useState<Record<number, boolean>>({});

    // Detail modal
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // AI Settings modal
    const [settingsVisible, setSettingsVisible] = useState(false);
    const [genCountPref, setGenCountPref] = useState(preferences.generationCount || 3);

    // Date picker
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [schedulingActivity, setSchedulingActivity] = useState<Activity | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Status Modal State
    const [statusVisible, setStatusVisible] = useState(false);
    const [statusType, setStatusType] = useState<StatusType>('success');
    const [statusTitle, setStatusTitle] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [onStatusConfirm, setOnStatusConfirm] = useState<(() => void) | undefined>(undefined);

    // Handle navigation params
    React.useEffect(() => {
        if (route?.params?.openSettings) {
            setSettingsVisible(true);
            // Clear param so it doesn't open again on re-focus
            navigation.setParams({ openSettings: undefined });
        }

        const newCat = route?.params?.preSelectedCategory;
        if (newCat) {
            setCategory(newCat);
            setResult(null);
            handleGenerate(newCat);
            navigation.setParams({ preSelectedCategory: undefined });
        }
    }, [route?.params?.openSettings, route?.params?.preSelectedCategory]);

    // Add Reset button to header
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: -4 }}>
                    {(category || duration || budgetLevel) && (
                        <TouchableOpacity
                            onPress={clearFilters}
                            style={{ marginRight: 16 }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialCommunityIcons name="refresh" size={24} color={theme.colors.danger} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        onPress={() => setSettingsVisible(true)}
                        style={{ marginRight: 20 }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <MaterialCommunityIcons name="cog-outline" size={24} color={theme.colors.iconDefault} />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation, category, duration, budgetLevel, theme.colors.danger, theme.colors.iconDefault]);

    const handleGenerate = async (overrideCategory?: string, isRefresh = false) => {
        if (isRefresh) setIsRefreshing(true);
        else setLoading(true);

        const finalCategory = overrideCategory || category;
        const filters: FilterParams = { category: finalCategory, duration, budgetLevel };

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
            setStatusType('error');
            setStatusTitle('Error');
            setStatusMessage('Could not generate activities. Please check your connection.');
            setStatusVisible(true);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const clearFilters = () => {
        setCategory(undefined);
        setDuration(undefined);
        setBudgetLevel(undefined);
        setResult(null);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Reset everything on pull-to-refresh
        clearFilters();
        await new Promise(res => setTimeout(res, 500));
        setIsRefreshing(false);
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
        if (date && schedulingActivity && Platform.OS === 'android' && event.type === 'set') {
            // On Android, picker dismisses on selection
            await saveHistory(schedulingActivity.id, date.toISOString());
            setStatusType('success');
            setStatusTitle('Scheduled!');
            setStatusMessage(`Activity added to ${date.toLocaleDateString()}.`);
            setStatusVisible(true);
            setSchedulingActivity(null);
        }
    };

    const confirmIOSDate = async () => {
        if (schedulingActivity) {
            await saveHistory(schedulingActivity.id, selectedDate.toISOString());
            setStatusType('success');
            setStatusTitle('Scheduled!');
            setStatusMessage(`Activity added to ${selectedDate.toLocaleDateString()}.`);
            setStatusVisible(true);
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
            <View style={styles.filterHeader}>
                <Text style={[theme.typography.h4, { color: theme.colors.text, marginBottom: 4 }]}>Configure Filters</Text>
            </View>

            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginBottom: theme.spacing.xs, marginTop: 12 }]}>Category</Text>
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

            <Button title="Generate Now" onPress={() => handleGenerate()} loading={loading} style={{ marginTop: theme.spacing.lg }} />
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
                        <ActivityCard
                            activity={activity}
                            expanded={false}
                            isFavorite={!!favoriteMap[activity.id]}
                            onPress={() => openDetail(activity)}
                        />
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
                    onPress={() => handleGenerate()}
                    loading={loading}
                    style={{ marginTop: theme.spacing.sm }}
                />
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={[theme.colors.primary]}
                        tintColor={theme.colors.primary}
                    />
                }
            >
                {renderFilters()}
                {renderResult()}
            </ScrollView>

            {/* Activity Detail Modal */}
            <ActivityDetailModal
                activity={selectedActivity}
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                hideSchedule={true}
                hideSave={true}
            />

            {/* AI Preferences Modal */}
            <Modal
                visible={settingsVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setSettingsVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.settingsModal, { backgroundColor: theme.colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[theme.typography.h3, { color: theme.colors.text }]}>Generation Settings</Text>
                            <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ padding: 20 }}>
                            <Text style={[theme.typography.h4, { color: theme.colors.text }]}>Ideas per Generation</Text>
                            <Text style={[theme.typography.body2, { color: theme.colors.textSecondary, marginBottom: 16, marginTop: 4 }]}>
                                How many team engagement ideas should the AI brainstorm for you at once?
                            </Text>
                            <View style={styles.chipRow}>
                                {[1, 2, 3, 4, 5, 6].map(num => (
                                    <FilterChip
                                        key={num}
                                        label={num.toString()}
                                        selected={genCountPref === num}
                                        onPress={() => setGenCountPref(num)}
                                    />
                                ))}
                            </View>

                            <Button
                                title="Save Preferences"
                                onPress={async () => {
                                    await setGenerationCount(genCountPref);
                                    setSettingsVisible(false);
                                }}
                                style={{ marginTop: 24 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

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

            <StatusModal
                visible={statusVisible}
                type={statusType}
                title={statusTitle}
                message={statusMessage}
                onConfirm={onStatusConfirm}
                onClose={() => setStatusVisible(false)}
            />
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
    filterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resultItem: { marginBottom: 16 },
    resultBadge: { marginBottom: 6 },
    actionRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    emptyState: { padding: 32, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    iosDateActions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    settingsModal: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
});
