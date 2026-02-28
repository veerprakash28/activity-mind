import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PersonalTask } from '../database/database';
import { useAppContext } from '../context/AppContext';

interface TaskItemProps {
    task: PersonalTask;
    onToggle: () => void;
    onDelete: () => void;
    onEdit?: () => void;
}

export const TaskItem = ({ task, onToggle, onDelete, onEdit }: TaskItemProps) => {
    const { theme } = useAppContext();
    const isCompleted = task.status === 'completed';

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'blocked': return theme.colors.error;
            case 'review': return theme.colors.warning;
            case 'discussion': return theme.colors.primary;
            case 'completed': return theme.colors.success;
            default: return theme.colors.textSecondary;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'blocked': return 'block-helper';
            case 'review': return 'eye-outline';
            case 'discussion': return 'message-text-outline';
            default: return 'circle-outline';
        }
    };

    const priorityColor = task.priority === 'High' ? theme.colors.error : task.priority === 'Medium' ? theme.colors.warning : theme.colors.success;

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: theme.colors.surface,
                borderColor: isCompleted ? theme.colors.border + '60' : theme.colors.border,
                borderRadius: 16,
            }
        ]}>
            {/* Top row: checkbox + title + status */}
            <View style={styles.topRow}>
                <TouchableOpacity
                    style={styles.checkArea}
                    onPress={onToggle}
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons
                        name={isCompleted ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                        size={24}
                        color={isCompleted ? theme.colors.success : theme.colors.textSecondary}
                    />
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                    <Text style={[
                        theme.typography.body1,
                        {
                            color: isCompleted ? theme.colors.textSecondary : theme.colors.text,
                            textDecorationLine: isCompleted ? 'line-through' : 'none',
                            fontWeight: '600',
                        }
                    ]}>
                        {task.title}
                    </Text>
                </View>

                {task.status !== 'pending' && task.status !== 'completed' && (
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '15', borderColor: getStatusColor(task.status) }]}>
                        <MaterialCommunityIcons name={getStatusIcon(task.status)} size={10} color={getStatusColor(task.status)} />
                        <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}> {task.status.toUpperCase()}</Text>
                    </View>
                )}
            </View>

            {/* Description */}
            {task.description ? (
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 4, marginLeft: 38 }]} numberOfLines={1}>
                    {task.description}
                </Text>
            ) : null}

            {/* Notes */}
            {task.notes ? (
                <View style={[styles.notesContainer, { borderLeftColor: theme.colors.primary + '40', marginLeft: 38 }]}>
                    <MaterialCommunityIcons name="note-text-outline" size={12} color={theme.colors.textSecondary} />
                    <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginLeft: 4, fontStyle: 'italic', flex: 1 }]} numberOfLines={2}>
                        {task.notes}
                    </Text>
                </View>
            ) : null}

            {/* Bottom row: badges + actions */}
            <View style={styles.bottomRow}>
                <View style={styles.badges}>
                    {task.priority && (
                        <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '12' }]}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: priorityColor, marginRight: 4 }} />
                            <Text style={[styles.priorityText, { color: priorityColor }]}>
                                {task.priority}
                            </Text>
                        </View>
                    )}
                    {task.reminder_time && (
                        <View style={[styles.timeBadge, { backgroundColor: theme.colors.primaryLight || theme.colors.primary + '10' }]}>
                            <MaterialCommunityIcons name="clock-outline" size={11} color={theme.colors.primary} />
                            <Text style={{ color: theme.colors.primary, marginLeft: 3, fontWeight: '500', fontSize: 10 }}>
                                {new Date(task.reminder_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.actions}>
                    {onEdit && (
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: theme.colors.primary + '08' }]}
                            onPress={onEdit}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialCommunityIcons name="pencil-outline" size={16} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: theme.colors.error + '08' }]}
                        onPress={onDelete}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <MaterialCommunityIcons name="delete-outline" size={16} color={theme.colors.error} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 14,
        borderWidth: 1,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkArea: {
        paddingRight: 10,
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    notesContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 6,
        paddingLeft: 10,
        borderLeftWidth: 3,
        paddingVertical: 4,
        paddingRight: 4,
        borderRadius: 4,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        marginLeft: 34,
    },
    badges: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        flex: 1,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        padding: 6,
        borderRadius: 8,
        marginLeft: 6,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        marginLeft: 8,
    },
    statusText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.3,
    }
});
