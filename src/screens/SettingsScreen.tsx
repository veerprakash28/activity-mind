import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity, Switch, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppContext } from '../context/AppContext';
import { Button } from '../components/Button';
import { FilterChip } from '../components/FilterChip';
import { VersionService, UpdateInfo } from '../utils/VersionService';
import { UpdateModal } from '../components/UpdateModal';
import { useFocusEffect } from '@react-navigation/native';
import { StatusModal, StatusType } from '../components/StatusModal';
import { NotificationService } from '../utils/NotificationService';

const COLOR_PRESETS = [
    { label: 'Blue', value: '#2563EB' },
    { label: 'Indigo', value: '#4F46E5' },
    { label: 'Purple', value: '#7C3AED' },
    { label: 'Pink', value: '#EC4899' },
    { label: 'Rose', value: '#F43F5E' },
    { label: 'Red', value: '#EF4444' },
    { label: 'Orange', value: '#F97316' },
    { label: 'Amber', value: '#F59E0B' },
    { label: 'Emerald', value: '#10B981' },
    { label: 'Teal', value: '#14B8A6' },
    { label: 'Cyan', value: '#06B6D4' },
    { label: 'Sky', value: '#0EA5E9' },
];

const isValidHex = (hex: string) => /^#([0-9A-Fa-f]{6})$/.test(hex);

const formatTime12h = (time24: string) => {
    if (!time24) return '09:00 AM';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    const mStr = m.toString().padStart(2, '0');
    return `${h12}:${mStr} ${ampm}`;
};

export const SettingsScreen = ({ navigation }: any) => {
    const { theme, preferences, setThemePreference, setGenerationCount, setMonthlyTarget, setRemindersEnabled, setReminderTime, organization, setOrganization, customColors, setCustomColors, categories, renameCategory, updateInfo, checkUpdate } = useAppContext();

    const [activeTab, setActiveTab] = useState<'org' | 'theme'>('org');

    // Org fields
    const [companyName, setCompanyName] = useState(organization?.companyName || '');
    const [employeeCount, setEmployeeCount] = useState(organization?.employeeCount?.toString() || '');
    const [workType, setWorkType] = useState<'Remote' | 'Onsite' | 'Hybrid'>(organization?.workType || 'Hybrid');
    const [budgetRange, setBudgetRange] = useState<'Low' | 'Medium' | 'High'>(organization?.budgetRange || 'Medium');
    const [industry, setIndustry] = useState(organization?.industry || '');

    // Theme fields
    const [themeModePref, setThemeModePref] = useState(preferences.theme);
    const [selectedPrimary, setSelectedPrimary] = useState(customColors.primary || '#2563EB');
    const [selectedSecondary, setSelectedSecondary] = useState(customColors.secondary || '#7C3AED');
    const [primaryHex, setPrimaryHex] = useState(customColors.primary || '#2563EB');
    const [secondaryHex, setSecondaryHex] = useState(customColors.secondary || '#7C3AED');
    const [monthlyTargetPref, setMonthlyTargetPref] = useState(preferences.monthlyTarget || 2);

    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [saving, setSaving] = useState(false);

    // Status Modal State
    const [statusVisible, setStatusVisible] = useState(false);
    const [statusType, setStatusType] = useState<StatusType>('success');
    const [statusTitle, setStatusTitle] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [statusConfirmLabel, setStatusConfirmLabel] = useState('OK');
    const [onStatusConfirm, setOnStatusConfirm] = useState<(() => void) | undefined>(undefined);

    // Update state (modal visibility only, data from context)
    const [updateModalVisible, setUpdateModalVisible] = useState(false);

    // Time picker state
    const [showTimePicker, setShowTimePicker] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            checkUpdate();
        }, [])
    );

    // Detect unsaved changes
    const hasOrgChanges = useMemo(() => {
        const baseChanges = !organization ? (companyName.trim() !== '' || employeeCount.trim() !== '' || industry.trim() !== '') : (
            companyName !== (organization.companyName || '') ||
            employeeCount !== (organization.employeeCount?.toString() || '') ||
            workType !== (organization.workType || 'Hybrid') ||
            budgetRange !== (organization.budgetRange || 'Medium') ||
            industry !== (organization.industry || '') ||
            monthlyTargetPref !== preferences.monthlyTarget
        );
        return baseChanges;
    }, [companyName, employeeCount, workType, budgetRange, industry, organization, monthlyTargetPref, preferences.monthlyTarget]);

    const hasThemeChanges = useMemo(() => {
        return (
            themeModePref !== preferences.theme ||
            selectedPrimary !== (customColors.primary || '#2563EB') ||
            selectedSecondary !== (customColors.secondary || '#7C3AED')
        );
    }, [themeModePref, selectedPrimary, selectedSecondary, customColors, preferences.theme]);

    const hasUnsavedChanges = activeTab === 'org' ? hasOrgChanges : hasThemeChanges;

    const handlePrimaryHexChange = (text: string) => {
        let hex = text;
        if (!hex.startsWith('#')) hex = '#' + hex;
        setPrimaryHex(hex);
        if (isValidHex(hex)) setSelectedPrimary(hex.toUpperCase());
    };

    const handleSecondaryHexChange = (text: string) => {
        let hex = text;
        if (!hex.startsWith('#')) hex = '#' + hex;
        setSecondaryHex(hex);
        if (isValidHex(hex)) setSelectedSecondary(hex.toUpperCase());
    };

    const selectPrimaryPreset = (color: string) => {
        setSelectedPrimary(color);
        setPrimaryHex(color);
    };

    const selectSecondaryPreset = (color: string) => {
        setSelectedSecondary(color);
        setSecondaryHex(color);
    };

    const handleRenameCategory = async (oldName: string) => {
        if (!newCategoryName.trim() || newCategoryName.trim() === oldName) {
            setEditingCategory(null);
            return;
        }

        setSaving(true);
        try {
            await renameCategory(oldName, newCategoryName.trim());
            setStatusType('success');
            setStatusTitle('Success');
            setStatusMessage(`Category renamed to "${newCategoryName.trim()}"`);
            setStatusVisible(true);
            setEditingCategory(null);
            setNewCategoryName('');
        } catch (e) {
            setStatusType('error');
            setStatusTitle('Error');
            setStatusMessage('Failed to rename category.');
            setStatusVisible(true);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveOrg = async () => {
        if (!companyName.trim()) {
            setStatusType('error');
            setStatusTitle('Required');
            setStatusMessage('Please enter your company name.');
            setStatusVisible(true);
            return;
        }
        setSaving(true);
        try {
            await Promise.all([
                setOrganization({
                    companyName: companyName.trim(),
                    employeeCount: parseInt(employeeCount) || 0,
                    workType,
                    budgetRange,
                    industry: industry.trim(),
                }),
                setMonthlyTarget(monthlyTargetPref)
            ]);
            setStatusType('success');
            setStatusTitle('Saved!');
            setStatusMessage('Organization profile and preferences updated.');
            setStatusVisible(true);
        } catch (e) {
            setStatusType('error');
            setStatusTitle('Error');
            setStatusMessage('Failed to save changes.');
            setStatusVisible(true);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveTheme = async () => {
        if (!isValidHex(selectedPrimary)) {
            setStatusType('error');
            setStatusTitle('Invalid Color');
            setStatusMessage('Primary color must be a valid hex code (e.g. #2563EB).');
            setStatusVisible(true);
            return;
        }
        if (!isValidHex(selectedSecondary)) {
            setStatusType('error');
            setStatusTitle('Invalid Color');
            setStatusMessage('Secondary color must be a valid hex code (e.g. #7C3AED).');
            setStatusVisible(true);
            return;
        }
        setSaving(true);
        try {
            await Promise.all([
                setThemePreference(themeModePref),
                setCustomColors({ primary: selectedPrimary, secondary: selectedSecondary })
            ]);
            setStatusType('success');
            setStatusTitle('Saved!');
            setStatusMessage('Theme settings updated.');
            setStatusVisible(true);
        } catch (e) {
            setStatusType('error');
            setStatusTitle('Error');
            setStatusMessage('Failed to save theme settings.');
            setStatusVisible(true);
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = [styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }];
    const labelStyle = [theme.typography.caption, { color: theme.colors.textSecondary, marginBottom: 6, marginTop: 18 }];

    const renderColorSwatch = (color: string, isSelected: boolean, onPress: () => void) => (
        <TouchableOpacity
            key={color}
            onPress={onPress}
            style={[
                styles.colorSwatch,
                { backgroundColor: color },
                isSelected && styles.colorSwatchSelected,
                isSelected && { borderColor: theme.colors.text },
            ]}
        >
            {isSelected ? (
                <MaterialCommunityIcons name="check" size={16} color="#FFF" />
            ) : null}
        </TouchableOpacity>
    );

    const renderOrgTab = () => (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Update available tile */}
            {updateInfo && (
                <TouchableOpacity
                    onPress={() => setUpdateModalVisible(true)}
                    style={[styles.updateTile, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]}
                >
                    <View style={[styles.updateIcon, { backgroundColor: theme.colors.primary }]}>
                        <MaterialCommunityIcons name="rocket-launch" size={18} color="#FFF" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[theme.typography.body1, { color: theme.colors.text, fontWeight: '700' }]}>Update Available!</Text>
                        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Version v{updateInfo.latestVersion} is ready to download.</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            )}

            {/* Profile Card with Save */}
            <View style={[styles.profileCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={[styles.avatarCircle, { backgroundColor: theme.colors.primaryLight }]}>
                    <MaterialCommunityIcons name="office-building" size={32} color={theme.colors.primary} />
                </View>
                <Text style={[theme.typography.h3, { color: theme.colors.text, marginTop: 12 }]}>
                    {organization?.companyName || 'Your Organization'}
                </Text>
                <Text style={[theme.typography.body2, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                    {(organization?.employeeCount || 0) + " employees · " + (organization?.industry || 'Industry')}
                </Text>
                <Button
                    title={hasOrgChanges ? "Save Changes" : "Saved"}
                    onPress={handleSaveOrg}
                    loading={saving}
                    disabled={!hasOrgChanges}
                    style={{ marginTop: 16, width: '100%' }}
                    size="small"
                />
            </View>

            <Text style={labelStyle}>Company Name</Text>
            <TextInput style={inputStyle} value={companyName} onChangeText={setCompanyName} placeholder="e.g. Acme Corp" placeholderTextColor={theme.colors.textSecondary} />

            <Text style={labelStyle}>Employee Count</Text>
            <TextInput style={inputStyle} value={employeeCount} onChangeText={setEmployeeCount} placeholder="e.g. 50" placeholderTextColor={theme.colors.textSecondary} keyboardType="number-pad" />

            <Text style={labelStyle}>Work Type</Text>
            <View style={styles.chipRow}>
                {(['Remote', 'Onsite', 'Hybrid'] as const).map(w => (
                    <FilterChip key={w} label={w} selected={workType === w} onPress={() => setWorkType(w)} />
                ))}
            </View>

            <Text style={labelStyle}>Budget Range</Text>
            <View style={styles.chipRow}>
                {(['Low', 'Medium', 'High'] as const).map(b => (
                    <FilterChip key={b} label={b} selected={budgetRange === b} onPress={() => setBudgetRange(b)} />
                ))}
            </View>

            <Text style={labelStyle}>Industry</Text>
            <TextInput style={inputStyle} value={industry} onChangeText={setIndustry} placeholder="e.g. Technology" placeholderTextColor={theme.colors.textSecondary} />

            <View style={{ marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                <Text style={[theme.typography.h4, { color: theme.colors.text }]}>AI Preferences</Text>
                <Text style={[theme.typography.body2, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                    Customize goals and activity suggestions
                </Text>

                <Text style={[theme.typography.h4, { color: theme.colors.text, marginTop: 20 }]}>Monthly Activity Goal</Text>
                <View style={[styles.chipRow, { marginTop: 10 }]}>
                    {[1, 2, 3, 4, 8, 12].map(num => (
                        <FilterChip
                            key={num}
                            label={num + " / mo"}
                            selected={monthlyTargetPref === num}
                            onPress={() => setMonthlyTargetPref(num)}
                        />
                    ))}
                </View>

            </View>

            <View style={{ marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, marginRight: 16 }}>
                        <Text style={[theme.typography.h4, { color: theme.colors.text }]}>Smart Reminders</Text>
                        <Text style={[theme.typography.body2, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                            Get notified 30 minutes before your scheduled team activities.
                        </Text>
                    </View>
                    <Switch
                        value={preferences.remindersEnabled}
                        onValueChange={(val) => {
                            setRemindersEnabled(val);
                            NotificationService.setEnabled(val);
                        }}
                        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                        thumbColor={Platform.OS === 'ios' ? undefined : (preferences.remindersEnabled ? '#FFF' : '#f4f3f4')}
                    />
                </View>

                {preferences.remindersEnabled && (
                    <TouchableOpacity
                        onPress={() => setShowTimePicker(true)}
                        style={[styles.timeRow, { marginTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.border + '40', paddingTop: 16, width: '100%' }]}
                    >
                        <View style={{ flex: 1, paddingRight: 12 }}>
                            <Text style={[theme.typography.h4, { color: theme.colors.text }]}>Reminder Time</Text>
                            <Text style={[theme.typography.body2, { color: theme.colors.textSecondary, marginTop: 2 }]} numberOfLines={2}>
                                You will be nudged at this time on the day of the activity.
                            </Text>
                        </View>
                        <View style={[styles.timeBadge, { backgroundColor: theme.colors.primaryLight, flexShrink: 0 }]}>
                            <Text style={[theme.typography.body1, { color: theme.colors.primary, fontWeight: '700' }]}>
                                {formatTime12h(preferences.reminderTime)}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}

                {showTimePicker && (
                    <DateTimePicker
                        value={(() => {
                            const [h, m] = (preferences.reminderTime || '09:00').split(':').map(Number);
                            const d = new Date();
                            d.setHours(h, m, 0, 0);
                            return d;
                        })()}
                        mode="time"
                        is24Hour={false}
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, date) => {
                            setShowTimePicker(Platform.OS === 'ios');
                            if (date && (event.type === 'set' || Platform.OS === 'ios')) {
                                const hours = date.getHours().toString().padStart(2, '0');
                                const minutes = date.getMinutes().toString().padStart(2, '0');
                                const timeString = `${hours}:${minutes}`;
                                setReminderTime(timeString);
                                NotificationService.setReminderTime(timeString);
                            }
                        }}
                    />
                )}
            </View>

            <View style={{ marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
                <Text style={[theme.typography.h4, { color: theme.colors.text }]}>Manage Categories</Text>
                <Text style={[theme.typography.body2, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                    Tap a category to rename it across all your activities.
                </Text>

                <View style={[styles.chipRow, { marginTop: 12, gap: 8 }]}>
                    {categories.map(cat => (
                        <View key={cat} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {editingCategory === cat ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.primary, paddingLeft: 10 }}>
                                    <TextInput
                                        style={[styles.smallInput, { color: theme.colors.text }]}
                                        value={newCategoryName}
                                        onChangeText={setNewCategoryName}
                                        autoFocus
                                        placeholder="New Name"
                                        placeholderTextColor={theme.colors.textSecondary}
                                    />
                                    <TouchableOpacity onPress={() => handleRenameCategory(cat)} style={{ padding: 8 }}>
                                        <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setEditingCategory(null)} style={{ padding: 8 }}>
                                        <MaterialCommunityIcons name="close" size={20} color={theme.colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => { setEditingCategory(cat); setNewCategoryName(cat); }}
                                    style={[styles.categoryTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                                >
                                    <Text style={[theme.typography.body2, { color: theme.colors.text }]}>{cat}</Text>
                                    <MaterialCommunityIcons name="pencil-outline" size={14} color={theme.colors.textSecondary} style={{ marginLeft: 6 }} />
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );

    const renderThemeTab = () => (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Preview + Save */}
            <View style={[styles.previewCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginBottom: 10 }]}>Preview</Text>
                <View style={styles.previewRow}>
                    <View style={[styles.previewBox, { backgroundColor: selectedPrimary }]}>
                        <Text style={[theme.typography.caption, { color: '#FFF', fontWeight: '700' }]}>Primary</Text>
                    </View>
                    <View style={[styles.previewBox, { backgroundColor: selectedSecondary }]}>
                        <Text style={[theme.typography.caption, { color: '#FFF', fontWeight: '700' }]}>Secondary</Text>
                    </View>
                </View>
                <Button
                    title={hasThemeChanges ? "Apply Theme" : "Theme Applied"}
                    onPress={handleSaveTheme}
                    loading={saving}
                    disabled={!hasThemeChanges}
                    style={{ marginTop: 16, width: '100%' }}
                    size="small"
                />
            </View>

            {/* Theme Mode */}
            <Text style={[theme.typography.h4, { color: theme.colors.text, marginTop: 20 }]}>Appearance</Text>
            <View style={[styles.chipRow, { marginTop: 10 }]}>
                {(['light', 'dark', 'system'] as const).map(mode => (
                    <FilterChip
                        key={mode}
                        label={mode.charAt(0).toUpperCase() + mode.slice(1)}
                        selected={themeModePref === mode}
                        onPress={() => setThemeModePref(mode)}
                    />
                ))}
            </View>


            {/* Primary Color */}
            <Text style={[theme.typography.h4, { color: theme.colors.text, marginTop: 20 }]}>Primary Color</Text>
            <View style={styles.hexRow}>
                <View style={[styles.hexPreview, { backgroundColor: isValidHex(primaryHex) ? primaryHex : '#CCC' }]} />
                <TextInput
                    style={[styles.hexInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                    value={primaryHex}
                    onChangeText={handlePrimaryHexChange}
                    placeholder="#2563EB"
                    placeholderTextColor={theme.colors.textSecondary}
                    autoCapitalize="characters"
                    maxLength={7}
                />
            </View>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 8, marginBottom: 6 }]}>Or pick a preset:</Text>
            <View style={styles.swatchRow}>
                {COLOR_PRESETS.map(c => renderColorSwatch(c.value, selectedPrimary === c.value, () => selectPrimaryPreset(c.value)))}
            </View>

            {/* Secondary Color */}
            <Text style={[theme.typography.h4, { color: theme.colors.text, marginTop: 24 }]}>Secondary Color</Text>
            <View style={styles.hexRow}>
                <View style={[styles.hexPreview, { backgroundColor: isValidHex(secondaryHex) ? secondaryHex : '#CCC' }]} />
                <TextInput
                    style={[styles.hexInput, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
                    value={secondaryHex}
                    onChangeText={handleSecondaryHexChange}
                    placeholder="#7C3AED"
                    placeholderTextColor={theme.colors.textSecondary}
                    autoCapitalize="characters"
                    maxLength={7}
                />
            </View>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 8, marginBottom: 6 }]}>Or pick a preset:</Text>
            <View style={styles.swatchRow}>
                {COLOR_PRESETS.map(c => renderColorSwatch(c.value, selectedSecondary === c.value, () => selectSecondaryPreset(c.value)))}
            </View>
        </ScrollView>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Tabs */}
            <View style={[styles.tabRow, { borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'org' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('org')}
                >
                    <MaterialCommunityIcons name="office-building" size={18} color={activeTab === 'org' ? theme.colors.primary : theme.colors.textSecondary} />
                    <Text style={[theme.typography.body2, { color: activeTab === 'org' ? theme.colors.primary : theme.colors.textSecondary, marginLeft: 6, fontWeight: activeTab === 'org' ? '600' : '400' }]}>
                        Organization
                    </Text>
                    {hasOrgChanges ? <View style={[styles.unsavedDot, { backgroundColor: theme.colors.warning }]} /> : null}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'theme' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
                    onPress={() => setActiveTab('theme')}
                >
                    <MaterialCommunityIcons name="palette" size={18} color={activeTab === 'theme' ? theme.colors.primary : theme.colors.textSecondary} />
                    <Text style={[theme.typography.body2, { color: activeTab === 'theme' ? theme.colors.primary : theme.colors.textSecondary, marginLeft: 6, fontWeight: activeTab === 'theme' ? '600' : '400' }]}>
                        Theme Colors
                    </Text>
                    {hasThemeChanges ? <View style={[styles.unsavedDot, { backgroundColor: theme.colors.warning }]} /> : null}
                </TouchableOpacity>
            </View>

            {/* Unsaved Banner */}
            {hasUnsavedChanges ? (
                <View style={[styles.unsavedBanner, { backgroundColor: theme.colors.warning + '18' }]}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={16} color={theme.colors.warning} />
                    <Text style={[theme.typography.caption, { color: theme.colors.warning, marginLeft: 6, fontWeight: '600' }]}>
                        You have unsaved changes
                    </Text>
                </View>
            ) : null}

            {activeTab === 'org' ? renderOrgTab() : renderThemeTab()}

            <UpdateModal
                visible={updateModalVisible}
                updateInfo={updateInfo}
                onClose={() => setUpdateModalVisible(false)}
            />

            <StatusModal
                visible={statusVisible}
                type={statusType}
                title={statusTitle}
                message={statusMessage}
                confirmLabel={statusConfirmLabel}
                onConfirm={onStatusConfirm}
                onClose={() => setStatusVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabRow: { flexDirection: 'row', borderBottomWidth: 1 },
    tab: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, paddingBottom: 10,
    },
    unsavedDot: {
        width: 8, height: 8, borderRadius: 4, marginLeft: 6,
    },
    unsavedBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 8,
    },
    scrollContent: { padding: 20, paddingBottom: 40 },
    profileCard: {
        alignItems: 'center', padding: 24, borderRadius: 20, borderWidth: 1,
    },
    avatarCircle: {
        width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
    },
    input: {
        borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
    previewCard: {
        padding: 20, borderRadius: 20, borderWidth: 1,
    },
    previewRow: { flexDirection: 'row', gap: 12 },
    previewBox: {
        flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    },
    swatchRow: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4,
    },
    colorSwatch: {
        width: 36, height: 36, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
    },
    colorSwatchSelected: { borderWidth: 3 },
    hexRow: {
        flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10,
    },
    hexPreview: {
        width: 40, height: 40, borderRadius: 12,
    },
    hexInput: {
        flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
        fontSize: 15, fontFamily: 'monospace',
    },
    categoryTile: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 12, borderWidth: 1,
    },
    smallInput: {
        height: 40, width: 120, fontSize: 14,
    },
    updateTile: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 20,
    },
    updateIcon: {
        width: 36, height: 36, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
});
