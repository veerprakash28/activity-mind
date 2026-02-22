import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { addCustomActivity, updateActivity, Activity } from '../database/database';
import { Button } from '../components/Button';
import { FilterChip } from '../components/FilterChip';

export const AddActivityScreen = ({ route, navigation }: any) => {
    const { theme, categories, refreshCategories } = useAppContext();
    const editingActivity = route.params?.activity as Activity | undefined;

    const [name, setName] = useState(editingActivity?.name || '');
    const [description, setDescription] = useState(editingActivity?.description || '');
    const [category, setCategory] = useState(editingActivity?.category || 'Icebreaker');
    const [steps, setSteps] = useState(editingActivity ? JSON.parse(editingActivity.steps).join('\n') : '');
    const [materials, setMaterials] = useState(editingActivity ? JSON.parse(editingActivity.materials).join('\n') : '');
    const [duration, setDuration] = useState(editingActivity?.duration || '30 min');
    const [budget, setBudget] = useState<'Low' | 'Medium' | 'High'>(editingActivity?.estimated_cost as any || 'Low');
    const [difficulty, setDifficulty] = useState(editingActivity?.difficulty || 'Easy');
    const [prepTime, setPrepTime] = useState(editingActivity?.prep_time || 'None');
    const [remoteCompatible, setRemoteCompatible] = useState(editingActivity ? editingActivity.remote_compatible === 1 : true);
    const [saving, setSaving] = useState(false);

    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Required", "Please enter an activity name.");
            return;
        }
        if (!description.trim()) {
            Alert.alert("Required", "Please enter a description.");
            return;
        }

        setSaving(true);
        try {
            const toTitleCase = (str: string) => {
                return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            };

            const stepsArray = steps.split('\n').filter((s: string) => s.trim());
            const materialsArray = materials.split('\n').filter((m: string) => m.trim());

            const rawCategory = showNewCategoryInput ? newCategoryName.trim() : category;
            const finalCategory = toTitleCase(rawCategory);

            if (showNewCategoryInput && !newCategoryName.trim()) {
                Alert.alert("Required", "Please enter a new category name.");
                setSaving(false);
                return;
            }

            if (editingActivity) {
                await updateActivity(editingActivity.id, {
                    name: name.trim(),
                    description: description.trim(),
                    category: finalCategory,
                    steps: JSON.stringify(stepsArray.length > 0 ? stepsArray : ["No specific steps provided"]),
                    materials: JSON.stringify(materialsArray.length > 0 ? materialsArray : ["None"]),
                    estimated_cost: budget,
                    duration,
                    difficulty,
                    prep_time: prepTime,
                    remote_compatible: remoteCompatible ? 1 : 0,
                });
            } else {
                await addCustomActivity({
                    name: name.trim(),
                    description: description.trim(),
                    category: finalCategory,
                    steps: JSON.stringify(stepsArray.length > 0 ? stepsArray : ["No specific steps provided"]),
                    materials: JSON.stringify(materialsArray.length > 0 ? materialsArray : ["None"]),
                    estimated_cost: budget,
                    duration,
                    difficulty,
                    prep_time: prepTime,
                    min_employees: 2,
                    max_employees: 500,
                    indoor_outdoor: 'Both',
                    remote_compatible: remoteCompatible ? 1 : 0,
                });
            }

            await refreshCategories();

            Alert.alert(
                editingActivity ? "Updated!" : "Saved!",
                editingActivity ? "Activity changes have been saved." : "Your custom activity has been added to the bank.",
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } catch (e) {
            Alert.alert("Error", "Failed to save activity.");
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = [styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }];
    const labelStyle = [theme.typography.caption, { color: theme.colors.textSecondary, marginBottom: 4, marginTop: 16 }];

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >

                    <Text style={labelStyle}>Activity Name *</Text>
                    <TextInput
                        style={inputStyle}
                        placeholder="e.g. Team Karaoke Night"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={name}
                        onChangeText={setName}
                    />

                    <Text style={labelStyle}>Description *</Text>
                    <TextInput
                        style={[...inputStyle, { height: 80 }]}
                        placeholder="What is this activity about?"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        textAlignVertical="top"
                    />

                    <Text style={labelStyle}>Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {categories.map(cat => (
                            <FilterChip
                                key={cat}
                                label={cat}
                                selected={category === cat && !showNewCategoryInput}
                                onPress={() => { setCategory(cat); setShowNewCategoryInput(false); }}
                            />
                        ))}
                        <FilterChip
                            label="+ Add New"
                            selected={showNewCategoryInput}
                            onPress={() => setShowNewCategoryInput(true)}
                        />
                    </ScrollView>

                    {showNewCategoryInput && (
                        <TextInput
                            style={[inputStyle, { marginTop: 10 }]}
                            placeholder="Enter new category name (e.g. Food)"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={newCategoryName}
                            onChangeText={setNewCategoryName}
                            autoFocus
                        />
                    )}

                    <Text style={labelStyle}>Steps (one per line)</Text>
                    <TextInput
                        style={[...inputStyle, { height: 100 }]}
                        placeholder={"Step 1: Gather the team\nStep 2: Explain the rules\nStep 3: Have fun!"}
                        placeholderTextColor={theme.colors.textSecondary}
                        value={steps}
                        onChangeText={setSteps}
                        multiline
                        textAlignVertical="top"
                    />

                    <Text style={labelStyle}>Materials (one per line)</Text>
                    <TextInput
                        style={[...inputStyle, { height: 60 }]}
                        placeholder={"Microphone\nSpeaker"}
                        placeholderTextColor={theme.colors.textSecondary}
                        value={materials}
                        onChangeText={setMaterials}
                        multiline
                        textAlignVertical="top"
                    />

                    <Text style={labelStyle}>Duration</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {['15 min', '30 min', '1 hr', 'Half day'].map(dur => (
                            <FilterChip key={dur} label={dur} selected={duration === dur} onPress={() => setDuration(dur)} />
                        ))}
                    </ScrollView>

                    <Text style={labelStyle}>Budget</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {(['Low', 'Medium', 'High'] as const).map(b => (
                            <FilterChip key={b} label={b} selected={budget === b} onPress={() => setBudget(b)} />
                        ))}
                    </ScrollView>

                    <Text style={labelStyle}>Difficulty</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {['Easy', 'Medium', 'Hard'].map(d => (
                            <FilterChip key={d} label={d} selected={difficulty === d} onPress={() => setDifficulty(d)} />
                        ))}
                    </ScrollView>

                    <Text style={labelStyle}>Prep Time</Text>
                    <TextInput
                        style={inputStyle}
                        placeholder="e.g. 30 min, 1 hr, None"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={prepTime}
                        onChangeText={setPrepTime}
                    />

                    <Text style={labelStyle}>Remote Compatible</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <FilterChip label="Yes" selected={remoteCompatible} onPress={() => setRemoteCompatible(true)} />
                        <FilterChip label="No" selected={!remoteCompatible} onPress={() => setRemoteCompatible(false)} />
                    </ScrollView>

                    <Button
                        title={editingActivity ? "Save Changes" : "Save Activity"}
                        onPress={handleSave}
                        loading={saving}
                        style={{ marginTop: 24, marginBottom: 40 }}
                    />

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 60,
    },
    headerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
    },
});
