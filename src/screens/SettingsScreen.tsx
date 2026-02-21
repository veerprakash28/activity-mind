import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { Button } from '../components/Button';
import { FilterChip } from '../components/FilterChip';

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

export const SettingsScreen = ({ navigation }: any) => {
    const { theme, organization, setOrganization, customColors, setCustomColors } = useAppContext();

    const [activeTab, setActiveTab] = useState<'org' | 'theme'>('org');

    // Org fields
    const [companyName, setCompanyName] = useState(organization?.companyName || '');
    const [employeeCount, setEmployeeCount] = useState(organization?.employeeCount?.toString() || '');
    const [workType, setWorkType] = useState<'Remote' | 'Onsite' | 'Hybrid'>(organization?.workType || 'Hybrid');
    const [budgetRange, setBudgetRange] = useState<'Low' | 'Medium' | 'High'>(organization?.budgetRange || 'Medium');
    const [industry, setIndustry] = useState(organization?.industry || '');

    // Theme fields
    const [selectedPrimary, setSelectedPrimary] = useState(customColors.primary || '#2563EB');
    const [selectedSecondary, setSelectedSecondary] = useState(customColors.secondary || '#7C3AED');
    const [primaryHex, setPrimaryHex] = useState(customColors.primary || '#2563EB');
    const [secondaryHex, setSecondaryHex] = useState(customColors.secondary || '#7C3AED');

    const [saving, setSaving] = useState(false);

    // Detect unsaved changes
    const hasOrgChanges = useMemo(() => {
        if (!organization) return companyName.trim() !== '' || employeeCount.trim() !== '' || industry.trim() !== '';
        return (
            companyName !== (organization.companyName || '') ||
            employeeCount !== (organization.employeeCount?.toString() || '') ||
            workType !== (organization.workType || 'Hybrid') ||
            budgetRange !== (organization.budgetRange || 'Medium') ||
            industry !== (organization.industry || '')
        );
    }, [companyName, employeeCount, workType, budgetRange, industry, organization]);

    const hasThemeChanges = useMemo(() => {
        return (
            selectedPrimary !== (customColors.primary || '#2563EB') ||
            selectedSecondary !== (customColors.secondary || '#7C3AED')
        );
    }, [selectedPrimary, selectedSecondary, customColors]);

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

    const handleSaveOrg = async () => {
        if (!companyName.trim()) {
            Alert.alert("Required", "Please enter your company name.");
            return;
        }
        setSaving(true);
        try {
            await setOrganization({
                companyName: companyName.trim(),
                employeeCount: parseInt(employeeCount) || 0,
                workType,
                budgetRange,
                industry: industry.trim(),
            });
            Alert.alert("Saved!", "Organization profile updated.");
        } catch (e) {
            Alert.alert("Error", "Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveTheme = async () => {
        if (!isValidHex(selectedPrimary)) {
            Alert.alert("Invalid Color", "Primary color must be a valid hex code (e.g. #2563EB).");
            return;
        }
        if (!isValidHex(selectedSecondary)) {
            Alert.alert("Invalid Color", "Secondary color must be a valid hex code (e.g. #7C3AED).");
            return;
        }
        setSaving(true);
        try {
            await setCustomColors({ primary: selectedPrimary, secondary: selectedSecondary });
            Alert.alert("Saved!", "Theme colors updated. The app will now use your custom colors.");
        } catch (e) {
            Alert.alert("Error", "Failed to save theme.");
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
                    title={hasThemeChanges ? "Apply Colors" : "Applied"}
                    onPress={handleSaveTheme}
                    loading={saving}
                    disabled={!hasThemeChanges}
                    style={{ marginTop: 16, width: '100%' }}
                    size="small"
                />
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
});
