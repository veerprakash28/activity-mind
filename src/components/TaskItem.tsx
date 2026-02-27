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

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: theme.colors.surface,
                borderColor: isCompleted ? theme.colors.border + '60' : theme.colors.border,
                borderRadius: 16,
            }
        ]}>
            {/* Checkbox */}
            <TouchableOpacity
                style={styles.checkArea}
                onPress={onToggle}
                activeOpacity={0.7}
            >
                <MaterialCommunityIcons
                    name={isCompleted ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                    size={26}
                    color={isCompleted ? theme.colors.success : theme.colors.textSecondary}
                />
            </TouchableOpacity>

            {/* Main content */}
            <View style={styles.content}>
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

                {task.description ? (
                    <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 3 }]} numberOfLines={1}>
                        {task.description}
                    </Text>
                ) : null}

                {task.notes ? (
                    <View style={[styles.notesContainer, { borderLeftColor: theme.colors.primary + '40' }]}>
                        <MaterialCommunityIcons name="note-text-outline" size={12} color={theme.colors.textSecondary} />
                        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginLeft: 4, fontStyle: 'italic', flex: 1 }]} numberOfLines={2}>
                            {task.notes}
                        </Text>
                    </View>
                ) : null}

                {task.reminder_time && (
                    <View style={[styles.timeBadge, { backgroundColor: theme.colors.primaryLight || theme.colors.primary + '10' }]}>
                        <MaterialCommunityIcons name="clock-outline" size={12} color={theme.colors.primary} />
                        <Text style={[theme.typography.caption, { color: theme.colors.primary, marginLeft: 4, fontWeight: '500' }]}>
                            {new Date(task.reminder_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                )}
            </View>

            {/* Right side: status badge + actions */}
            <View style={styles.rightSide}>
                {task.status !== 'pending' && task.status !== 'completed' && (
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '15', borderColor: getStatusColor(task.status) }]}>
                        <MaterialCommunityIcons name={getStatusIcon(task.status)} size={10} color={getStatusColor(task.status)} />
                        <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}> {task.status.toUpperCase()}</Text>
                    </View>
                )}
                <View style={styles.actions}>
                    {onEdit && (
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: theme.colors.primary + '08' }]}
                            onPress={onEdit}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: theme.colors.error + '08' }]}
                        onPress={onDelete}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <MaterialCommunityIcons name="delete-outline" size={18} color={theme.colors.error} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderWidth: 1,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    checkArea: {
        paddingRight: 14,
    },
    content: {
        flex: 1,
    },
    timeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
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
    rightSide: {
        alignItems: 'flex-end',
        marginLeft: 8,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    actionBtn: {
        padding: 7,
        borderRadius: 10,
        marginLeft: 6,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    }
});
