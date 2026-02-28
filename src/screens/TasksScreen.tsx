import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Platform, Alert, Keyboard, ScrollView, KeyboardAvoidingView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useAppContext } from '../context/AppContext';
import { getTasks, addTask, updateTask, deleteTask, PersonalTask, TaskStatus } from '../database/database';
import { NotificationService } from '../utils/NotificationService';
import { TaskItem } from '../components/TaskItem';
import { Button } from '../components/Button';

const STATUSES: TaskStatus[] = ['pending', 'completed', 'blocked', 'review', 'discussion'];

export const TasksScreen = () => {
    const { theme, refreshTasksCount } = useAppContext();
    const route = useRoute();
    const navigation = useNavigation();
    const [tasks, setTasks] = useState<PersonalTask[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState<TaskStatus>('pending');
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [reminderTime, setReminderTime] = useState<Date | null>(null);
    const [clearModalVisible, setClearModalVisible] = useState(false);

    // Use a ref to track picker phase — avoids stale closure issues
    const pickerPhaseRef = useRef<'idle' | 'date' | 'time'>('idle');

    const loadTasks = async () => {
        const fetchedTasks = await getTasks();
        setTasks(fetchedTasks);
    };

    useFocusEffect(
        useCallback(() => {
            loadTasks();

            // Handle auto-edit from route params
            const params = route.params as any;
            if (params?.editTaskId) {
                const checkTasksLoaded = async () => {
                    const allTasks = await getTasks();
                    const target = allTasks.find(t => t.id === params.editTaskId);
                    if (target) {
                        handleEditTask(target);
                        // Clear the param so it doesn't reopen on next focus
                        navigation.setParams({ editTaskId: undefined } as any);
                    }
                };
                checkTasksLoaded();
            }
        }, [route.params])
    );

    const handleAddTask = async () => {
        Keyboard.dismiss();
        if (!title.trim()) {
            Alert.alert("Title Required", "Please enter a task title.");
            return;
        }

        try {
            const timeStr = reminderTime ? reminderTime.toISOString() : null;

            if (editingTask) {
                await updateTask(editingTask.id, {
                    title: title.trim(),
                    description: description.trim() || null,
                    notes: notes.trim() || null,
                    status: status,
                    priority: priority,
                    reminder_time: timeStr
                });

                if (timeStr !== editingTask.reminder_time) {
                    if (editingTask.notification_id) {
                        await NotificationService.cancelTaskReminder(editingTask.notification_id);
                    }
                    if (timeStr && status !== 'completed') {
                        const newNotifId = await NotificationService.scheduleTaskReminder(editingTask.id, title.trim(), timeStr);
                        if (newNotifId) {
                            await updateTask(editingTask.id, { notification_id: newNotifId });
                        }
                    }
                }
            } else {
                const taskId = await addTask(title.trim(), description.trim() || null, timeStr, notes.trim() || null, status, priority);

                if (timeStr && status !== 'completed') {
                    const notificationId = await NotificationService.scheduleTaskReminder(taskId, title.trim(), timeStr);
                    if (notificationId) {
                        await updateTask(taskId, { notification_id: notificationId });
                    }
                }
            }

            resetForm();
            setModalVisible(false);
            loadTasks();
            refreshTasksCount();
        } catch (e) {
            console.error("Failed to save task", e);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setNotes('');
        setStatus('pending');
        setPriority('Medium');
        setReminderTime(null);
        setEditingTask(null);
    };

    const handleToggleTask = async (task: PersonalTask) => {
        // If task is completed, toggle it back to pending.
        // If task is in ANY other status (pending, blocked, etc.), mark it as completed in one click.
        const isCurrentlyCompleted = task.status === 'completed';
        const newStatus = isCurrentlyCompleted ? 'pending' : 'completed';

        if (newStatus === 'completed' && task.notification_id) {
            await NotificationService.cancelTaskReminder(task.notification_id);
            await updateTask(task.id, { status: newStatus, notification_id: null });
        } else {
            await updateTask(task.id, { status: newStatus });
        }

        loadTasks();
        refreshTasksCount();
    };

    const handleDeleteTask = async (task: PersonalTask) => {
        if (task.notification_id) {
            await NotificationService.cancelTaskReminder(task.notification_id);
        }
        await deleteTask(task.id);
        loadTasks();
        refreshTasksCount();
    };

    const handleClearCompleted = async () => {
        const completedTasks = tasks.filter(t => t.status === 'completed');
        if (completedTasks.length === 0) return;
        for (const task of completedTasks) {
            await deleteTask(task.id);
        }
        loadTasks();
        refreshTasksCount();
        setClearModalVisible(false);
    };

    const handleEditTask = (task: PersonalTask) => {
        setEditingTask(task);
        setTitle(task.title);
        setDescription(task.description || '');
        setNotes(task.notes || '');
        setStatus(task.status);
        setPriority(task.priority || 'Medium');
        setReminderTime(task.reminder_time ? new Date(task.reminder_time) : null);
        setModalVisible(true);
    };

    // ── Android Date→Time Picker (ref-based, no stale closure) ──
    const openAndroidDateTimePicker = () => {
        pickerPhaseRef.current = 'date';
        const startDate = reminderTime || new Date();

        DateTimePickerAndroid.open({
            value: startDate,
            mode: 'date',
            is24Hour: true,
            minimumDate: new Date(),
            onChange: (event, selectedDate) => {
                if (event.type === 'dismissed') {
                    pickerPhaseRef.current = 'idle';
                    return;
                }
                if (!selectedDate) return;

                // Store selected date, then open time picker
                const chosenDate = new Date(selectedDate);
                setReminderTime(chosenDate);
                pickerPhaseRef.current = 'time';

                setTimeout(() => {
                    DateTimePickerAndroid.open({
                        value: chosenDate,
                        mode: 'time',
                        is24Hour: true,
                        onChange: (timeEvent, selectedTime) => {
                            pickerPhaseRef.current = 'idle';
                            if (timeEvent.type === 'dismissed') return;
                            if (!selectedTime) return;

                            // Combine date + time
                            const finalDate = new Date(chosenDate);
                            finalDate.setHours(selectedTime.getHours());
                            finalDate.setMinutes(selectedTime.getMinutes());
                            setReminderTime(finalDate);
                        },
                    });
                }, 200);
            },
        });
    };

    const togglePicker = () => {
        if (Platform.OS === 'android') {
            openAndroidDateTimePicker();
        } else {
            // iOS: Use Alert to let user pick a date/time
            Alert.alert(
                "Set Reminder",
                "Date & time picker is available on the device's native interface.",
                [{ text: "OK" }]
            );
        }
    };

    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const pendingCount = tasks.filter(t => t.status !== 'completed').length;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <FlatList
                data={tasks}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={
                    tasks.length > 0 ? (
                        <View style={styles.listHeader}>
                            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                                {pendingCount} PENDING · {completedCount} COMPLETED
                            </Text>
                            {completedCount > 0 && (
                                <TouchableOpacity onPress={() => setClearModalVisible(true)}>
                                    <Text style={[theme.typography.caption, { color: theme.colors.error, fontWeight: '700' }]}>CLEAR COMPLETED</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : null
                }
                renderItem={({ item }) => (
                    <TaskItem
                        task={item}
                        onToggle={() => handleToggleTask(item)}
                        onDelete={() => handleDeleteTask(item)}
                        onEdit={() => handleEditTask(item)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="clipboard-text-outline" size={64} color={theme.colors.border} />
                        <Text style={[theme.typography.body1, { color: theme.colors.textSecondary, marginTop: 16 }]}>
                            No tasks yet. Add one to get started!
                        </Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                onPress={() => setModalVisible(true)}
            >
                <MaterialCommunityIcons name="plus" size={32} color="#FFF" />
            </TouchableOpacity>

            {/* ── Add/Edit Task Modal ── */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => { setModalVisible(false); resetForm(); }}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[theme.typography.h2, { color: theme.colors.text }]}>
                                    {editingTask ? "Edit Task" : "New Task"}
                                </Text>
                                <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                                    <MaterialCommunityIcons name="close" size={24} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                <TextInput
                                    style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                                    placeholder="Task title..."
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={title}
                                    onChangeText={setTitle}
                                    autoFocus={!editingTask}
                                />

                                <TextInput
                                    style={[styles.input, styles.textArea, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                                    placeholder="Description (optional)..."
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={description}
                                    onChangeText={setDescription}
                                    multiline
                                />

                                <TextInput
                                    style={[styles.input, styles.notesArea, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                                    placeholder="Notes / comments..."
                                    placeholderTextColor={theme.colors.textSecondary}
                                    value={notes}
                                    onChangeText={setNotes}
                                    multiline
                                />

                                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginBottom: 8, marginLeft: 4 }]}>PRIORITY</Text>
                                <View style={[styles.statusScroll, { flexDirection: 'row' }]}>
                                    {(['Low', 'Medium', 'High'] as const).map(p => (
                                        <TouchableOpacity
                                            key={p}
                                            style={[
                                                styles.statusChip,
                                                {
                                                    borderColor: priority === p ? (p === 'High' ? theme.colors.error : p === 'Medium' ? theme.colors.warning : theme.colors.success) : theme.colors.border,
                                                    backgroundColor: priority === p ? (p === 'High' ? theme.colors.error + '15' : p === 'Medium' ? theme.colors.warning + '15' : theme.colors.success + '15') : 'transparent'
                                                }
                                            ]}
                                            onPress={() => setPriority(p)}
                                        >
                                            <Text style={[
                                                theme.typography.caption,
                                                { color: priority === p ? (p === 'High' ? theme.colors.error : p === 'Medium' ? theme.colors.warning : theme.colors.success) : theme.colors.textSecondary, fontWeight: priority === p ? '700' : '400' }
                                            ]}>
                                                {p}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginBottom: 8, marginLeft: 4 }]}>STATUS</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusScroll}>
                                    {STATUSES.map(s => (
                                        <TouchableOpacity
                                            key={s}
                                            style={[
                                                styles.statusChip,
                                                {
                                                    borderColor: status === s ? theme.colors.primary : theme.colors.border,
                                                    backgroundColor: status === s ? theme.colors.primary + '15' : 'transparent'
                                                }
                                            ]}
                                            onPress={() => setStatus(s)}
                                        >
                                            <Text style={[
                                                theme.typography.caption,
                                                { color: status === s ? theme.colors.primary : theme.colors.textSecondary, fontWeight: status === s ? '700' : '400' }
                                            ]}>
                                                {s.charAt(0).toUpperCase() + s.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <TouchableOpacity
                                    style={[styles.timePickerBtn, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                                    onPress={togglePicker}
                                >
                                    <MaterialCommunityIcons name="bell-outline" size={20} color={theme.colors.primary} />
                                    <Text style={[theme.typography.body2, { color: reminderTime ? theme.colors.text : theme.colors.textSecondary, marginLeft: 8, flex: 1 }]}>
                                        {reminderTime ? `Reminder: ${reminderTime.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : "Set reminder (optional)"}
                                    </Text>
                                    {reminderTime && (
                                        <TouchableOpacity onPress={() => setReminderTime(null)}>
                                            <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.textSecondary} />
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>

                                <Button
                                    title={editingTask ? "Update Task" : "Create Task"}
                                    onPress={handleAddTask}
                                    style={{ marginTop: 24, marginBottom: 40 }}
                                />
                            </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* ── Clear Completed Confirmation Modal ── */}
            <Modal
                visible={clearModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setClearModalVisible(false)}
            >
                <View style={styles.clearModalOverlay}>
                    <View style={[styles.clearModalContent, { backgroundColor: theme.colors.surface }]}>
                        <View style={[styles.clearIconCircle, { backgroundColor: theme.colors.error + '15' }]}>
                            <MaterialCommunityIcons name="delete-sweep-outline" size={32} color={theme.colors.error} />
                        </View>
                        <Text style={[theme.typography.h3, { color: theme.colors.text, marginTop: 16, textAlign: 'center' }]}>
                            Clear Completed Tasks?
                        </Text>
                        <Text style={[theme.typography.body2, { color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center' }]}>
                            {completedCount} completed {completedCount === 1 ? 'task' : 'tasks'} will be permanently deleted.
                        </Text>
                        <View style={styles.clearModalActions}>
                            <TouchableOpacity
                                style={[styles.clearModalBtn, { borderColor: theme.colors.border, borderWidth: 1 }]}
                                onPress={() => setClearModalVisible(false)}
                            >
                                <Text style={[theme.typography.body2, { color: theme.colors.text, fontWeight: '600' }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.clearModalBtn, { backgroundColor: theme.colors.error, marginLeft: 12 }]}
                                onPress={handleClearCompleted}
                            >
                                <Text style={[theme.typography.body2, { color: '#FFF', fontWeight: '600' }]}>Clear All</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        marginBottom: 14,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    notesArea: {
        height: 70,
        textAlignVertical: 'top',
    },
    timePickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    modalScroll: {
        width: '100%',
    },
    statusScroll: {
        marginBottom: 18,
        paddingBottom: 4,
    },
    statusChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1.5,
        marginRight: 8,
    },
    // ── Clear Completed Modal ──
    clearModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    clearModalContent: {
        borderRadius: 20,
        padding: 28,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 10,
    },
    clearIconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearModalActions: {
        flexDirection: 'row',
        marginTop: 24,
        width: '100%',
    },
    clearModalBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
