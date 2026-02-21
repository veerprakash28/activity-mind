import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { Button } from '../components/Button';
import { FilterChip } from '../components/FilterChip';

export const SettingsScreen = ({ navigation }: any) => {
    const { theme, organization, setOrganization } = useAppContext();

    const [companyName, setCompanyName] = useState(organization?.companyName || '');
    const [employeeCount, setEmployeeCount] = useState(organization?.employeeCount?.toString() || '');
    const [workType, setWorkType] = useState<'Remote' | 'Onsite' | 'Hybrid'>(organization?.workType || 'Hybrid');
    const [budgetRange, setBudgetRange] = useState<'Low' | 'Medium' | 'High'>(organization?.budgetRange || 'Medium');
    const [industry, setIndustry] = useState(organization?.industry || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
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
            Alert.alert("Saved!", "Your organization profile has been updated.", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (e) {
            Alert.alert("Error", "Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = [styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }];
    const labelStyle = [theme.typography.caption, { color: theme.colors.textSecondary, marginBottom: 6, marginTop: 18 }];

    return (
        <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

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
                </View>

                <Text style={[theme.typography.h4, { color: theme.colors.text, marginTop: 24, marginBottom: 4 }]}>Edit Profile</Text>

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

                <Button title="Save Changes" onPress={handleSave} loading={saving} style={{ marginTop: 28, marginBottom: 40 }} />

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
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
});
