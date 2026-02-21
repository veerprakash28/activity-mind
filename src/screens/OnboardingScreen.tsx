import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppContext } from '../context/AppContext';
import { Button } from '../components/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const OnboardingScreen = () => {
    const { theme, setOrganization } = useAppContext();

    const [step, setStep] = useState(1);
    const [companyName, setCompanyName] = useState('');
    const [employeeCount, setEmployeeCount] = useState('');
    const [workType, setWorkType] = useState<'Remote' | 'Onsite' | 'Hybrid' | null>(null);
    const [budgetRange, setBudgetRange] = useState<'Low' | 'Medium' | 'High' | null>(null);
    const [industry, setIndustry] = useState('');

    const handleNext = () => {
        if (step < 5) setStep(step + 1);
        else handleComplete();
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleComplete = async () => {
        await setOrganization({
            companyName,
            employeeCount: parseInt(employeeCount) || 0,
            workType: workType || 'Hybrid',
            budgetRange: budgetRange || 'Medium',
            industry
        });
    };

    const isNextDisabled = () => {
        if (step === 1) return companyName.trim() === '';
        if (step === 2) return employeeCount.trim() === '' || isNaN(parseInt(employeeCount));
        if (step === 3) return workType === null;
        if (step === 4) return budgetRange === null;
        if (step === 5) return industry.trim() === '';
        return false;
    };

    const renderStepIndicator = () => {
        return (
            <View style={styles.stepIndicatorContainer}>
                {[1, 2, 3, 4, 5].map(s => (
                    <View
                        key={s}
                        style={[
                            styles.stepDot,
                            { backgroundColor: s <= step ? theme.colors.primary : theme.colors.border }
                        ]}
                    />
                ))}
            </View>
        );
    };

    const renderOption = (
        label: string,
        value: string,
        selectedValue: string | null,
        onSelect: (val: any) => void,
        icon: string
    ) => {
        const isSelected = value === selectedValue;
        return (
            <TouchableOpacity
                style={[
                    styles.optionCard,
                    {
                        backgroundColor: isSelected ? theme.colors.primaryLight : theme.colors.surface,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    }
                ]}
                onPress={() => onSelect(value)}
                activeOpacity={0.7}
            >
                <MaterialCommunityIcons
                    name={icon as any}
                    size={24}
                    color={isSelected ? theme.colors.primary : theme.colors.iconDefault}
                    style={{ marginBottom: theme.spacing.sm }}
                />
                <Text style={[theme.typography.button, { color: isSelected ? theme.colors.primary : theme.colors.text }]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderContent = () => {
        switch (step) {
            case 1:
                return (
                    <View style={styles.content}>
                        <MaterialCommunityIcons name="office-building" size={48} color={theme.colors.primary} style={styles.icon} />
                        <Text style={[theme.typography.h1, { color: theme.colors.text }]}>Welcome setup</Text>
                        <Text style={[theme.typography.body1, { color: theme.colors.textSecondary, marginTop: theme.spacing.sm, marginBottom: theme.spacing.xl }]}>
                            Let's tailor ActivityMind to your organization. What's your company name?
                        </Text>
                        <TextInput
                            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
                            placeholder="e.g. Acme Corp"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={companyName}
                            onChangeText={setCompanyName}
                            autoFocus
                        />
                    </View>
                );
            case 2:
                return (
                    <View style={styles.content}>
                        <MaterialCommunityIcons name="account-group" size={48} color={theme.colors.secondary} style={styles.icon} />
                        <Text style={[theme.typography.h1, { color: theme.colors.text }]}>Team Size</Text>
                        <Text style={[theme.typography.body1, { color: theme.colors.textSecondary, marginTop: theme.spacing.sm, marginBottom: theme.spacing.xl }]}>
                            How many employees are in your organization or team?
                        </Text>
                        <TextInput
                            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
                            placeholder="e.g. 50"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={employeeCount}
                            onChangeText={setEmployeeCount}
                            keyboardType="number-pad"
                            autoFocus
                        />
                    </View>
                );
            case 3:
                return (
                    <View style={styles.content}>
                        <MaterialCommunityIcons name="laptop" size={48} color={theme.colors.primary} style={styles.icon} />
                        <Text style={[theme.typography.h1, { color: theme.colors.text }]}>Work Type</Text>
                        <Text style={[theme.typography.body1, { color: theme.colors.textSecondary, marginTop: theme.spacing.sm, marginBottom: theme.spacing.xl }]}>
                            How does your team primarily work?
                        </Text>
                        <View style={{ gap: theme.spacing.md }}>
                            {renderOption('Fully Remote', 'Remote', workType, setWorkType, 'home-city')}
                            {renderOption('Fully Onsite', 'Onsite', workType, setWorkType, 'office-building-marker')}
                            {renderOption('Hybrid', 'Hybrid', workType, setWorkType, 'transit-connection')}
                        </View>
                    </View>
                );
            case 4:
                return (
                    <View style={styles.content}>
                        <MaterialCommunityIcons name="piggy-bank" size={48} color={theme.colors.secondary} style={styles.icon} />
                        <Text style={[theme.typography.h1, { color: theme.colors.text }]}>Activity Budget</Text>
                        <Text style={[theme.typography.body1, { color: theme.colors.textSecondary, marginTop: theme.spacing.sm, marginBottom: theme.spacing.xl }]}>
                            What is your typical budget per activity?
                        </Text>
                        <View style={{ gap: theme.spacing.md }}>
                            {renderOption('Low Budget ($)', 'Low', budgetRange, setBudgetRange, 'currency-usd')}
                            {renderOption('Medium Budget ($$)', 'Medium', budgetRange, setBudgetRange, 'wallet')}
                            {renderOption('High Budget ($$$)', 'High', budgetRange, setBudgetRange, 'cash-multiple')}
                        </View>
                    </View>
                );
            case 5:
                return (
                    <View style={styles.content}>
                        <MaterialCommunityIcons name="domain" size={48} color={theme.colors.primary} style={styles.icon} />
                        <Text style={[theme.typography.h1, { color: theme.colors.text }]}>Industry</Text>
                        <Text style={[theme.typography.body1, { color: theme.colors.textSecondary, marginTop: theme.spacing.sm, marginBottom: theme.spacing.xl }]}>
                            Almost done! What industry are you in?
                        </Text>
                        <TextInput
                            style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
                            placeholder="e.g. Technology, Healthcare"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={industry}
                            onChangeText={setIndustry}
                            autoFocus
                        />
                    </View>
                );
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.header}>
                    {step > 1 ? (
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    ) : <View style={styles.backButton} />}
                    {renderStepIndicator()}
                    <View style={styles.backButton} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    {renderContent()}
                </ScrollView>

                <View style={[styles.footer, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
                    <Button
                        title={step === 5 ? "Complete Setup" : "Continue"}
                        onPress={handleNext}
                        disabled={isNextDisabled()}
                        size='large'
                        style={{ width: '100%' }}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    stepIndicatorContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    stepDot: {
        width: 32,
        height: 4,
        borderRadius: 2,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
    },
    content: {
        flex: 1,
        paddingTop: 20,
    },
    icon: {
        marginBottom: 24,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
    },
    optionCard: {
        borderWidth: 2,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
    }
});
