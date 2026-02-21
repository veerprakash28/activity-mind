import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { Activity } from '../database/database';

interface ActivityDetailModalProps {
    activity: Activity | null;
    visible: boolean;
    onClose: () => void;
    actions?: React.ReactNode;
}

export const ActivityDetailModal = ({ activity, visible, onClose, actions }: ActivityDetailModalProps) => {
    const { theme } = useAppContext();

    if (!activity) return null;

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Icebreaker': return '#3B82F6';
            case 'Team Bonding': return '#8B5CF6';
            case 'Wellness': return '#10B981';
            case 'Recognition': return '#F59E0B';
            case 'Festival': return '#EF4444';
            case 'Training': return '#6366F1';
            default: return theme.colors.primary;
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Icebreaker': return 'snowflake';
            case 'Team Bonding': return 'account-group';
            case 'Wellness': return 'leaf';
            case 'Recognition': return 'star-face';
            case 'Festival': return 'party-popper';
            case 'Training': return 'school';
            default: return 'lightbulb-on';
        }
    };

    const badgeColor = getCategoryColor(activity.category);
    let steps: string[] = [];
    let materials: string[] = [];
    try {
        steps = JSON.parse(activity.steps);
        materials = JSON.parse(activity.materials);
    } catch (e) { }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
                    {/* Header */}
                    <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                        <Text style={[theme.typography.h3, { color: theme.colors.text, flex: 1 }]}>Activity Details</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
                        {/* Category Badge */}
                        <View style={[styles.categoryBadge, { backgroundColor: badgeColor + '20' }]}>
                            <MaterialCommunityIcons name={getCategoryIcon(activity.category) as any} size={18} color={badgeColor} style={{ marginRight: 6 }} />
                            <Text style={[theme.typography.caption, { color: badgeColor, fontWeight: '700' }]}>
                                {activity.category.toUpperCase()}
                            </Text>
                        </View>

                        {/* Title */}
                        <Text style={[theme.typography.h2, { color: theme.colors.text, marginTop: 12 }]}>
                            {activity.name}
                        </Text>

                        {/* Description */}
                        <Text style={[theme.typography.body1, { color: theme.colors.textSecondary, marginTop: 8, lineHeight: 22 }]}>
                            {activity.description}
                        </Text>

                        {/* Quick Info Grid */}
                        <View style={[styles.infoGrid, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                            <View style={styles.infoItem}>
                                <MaterialCommunityIcons name="clock-outline" size={18} color={theme.colors.primary} />
                                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 4 }]}>Duration</Text>
                                <Text style={[theme.typography.body2, { color: theme.colors.text, fontWeight: '600' }]}>{activity.duration}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <MaterialCommunityIcons name="currency-usd" size={18} color={theme.colors.primary} />
                                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 4 }]}>Budget</Text>
                                <Text style={[theme.typography.body2, { color: theme.colors.text, fontWeight: '600' }]}>{activity.estimated_cost}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <MaterialCommunityIcons name="account-multiple" size={18} color={theme.colors.primary} />
                                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 4 }]}>Team Size</Text>
                                <Text style={[theme.typography.body2, { color: theme.colors.text, fontWeight: '600' }]}>{activity.min_employees}-{activity.max_employees}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <MaterialCommunityIcons name="signal-cellular-3" size={18} color={theme.colors.primary} />
                                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 4 }]}>Difficulty</Text>
                                <Text style={[theme.typography.body2, { color: theme.colors.text, fontWeight: '600' }]}>{activity.difficulty}</Text>
                            </View>
                        </View>

                        {/* Extra Info */}
                        <View style={[styles.extraRow, { borderColor: theme.colors.border }]}>
                            <View style={styles.extraItem}>
                                <MaterialCommunityIcons name="timer-sand" size={16} color={theme.colors.textSecondary} />
                                <Text style={[theme.typography.body2, { color: theme.colors.textSecondary, marginLeft: 6 }]}>Prep: {activity.prep_time}</Text>
                            </View>
                            <View style={styles.extraItem}>
                                <MaterialCommunityIcons name={activity.indoor_outdoor === 'Indoor' ? 'home-variant' : activity.indoor_outdoor === 'Outdoor' ? 'tree' : 'map-marker-multiple'} size={16} color={theme.colors.textSecondary} />
                                <Text style={[theme.typography.body2, { color: theme.colors.textSecondary, marginLeft: 6 }]}>{activity.indoor_outdoor}</Text>
                            </View>
                            <View style={styles.extraItem}>
                                <MaterialCommunityIcons name={activity.remote_compatible ? 'wifi' : 'wifi-off'} size={16} color={theme.colors.textSecondary} />
                                <Text style={[theme.typography.body2, { color: theme.colors.textSecondary, marginLeft: 6 }]}>{activity.remote_compatible ? 'Remote OK' : 'Onsite Only'}</Text>
                            </View>
                        </View>

                        {/* Steps */}
                        {steps.length > 0 && (
                            <View style={styles.section}>
                                <Text style={[theme.typography.h4, { color: theme.colors.text, marginBottom: 10 }]}>Steps</Text>
                                {steps.map((step: string, idx: number) => (
                                    <View key={idx} style={styles.stepRow}>
                                        <View style={[styles.stepNumber, { backgroundColor: theme.colors.primaryLight }]}>
                                            <Text style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: '700' }]}>{idx + 1}</Text>
                                        </View>
                                        <Text style={[theme.typography.body2, { color: theme.colors.text, flex: 1, lineHeight: 20 }]}>{step}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Materials */}
                        {materials.length > 0 && (
                            <View style={styles.section}>
                                <Text style={[theme.typography.h4, { color: theme.colors.text, marginBottom: 10 }]}>Materials Needed</Text>
                                {materials.map((item: string, idx: number) => (
                                    <View key={idx} style={styles.materialRow}>
                                        <MaterialCommunityIcons name="checkbox-blank-circle" size={6} color={theme.colors.textSecondary} />
                                        <Text style={[theme.typography.body2, { color: theme.colors.text, marginLeft: 10 }]}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>

                    {/* Actions */}
                    {actions ? (
                        <View style={[styles.actionBar, { borderTopColor: theme.colors.border }]}>
                            {actions}
                        </View>
                    ) : null}
                </View>
            </View>
        </Modal>
    );
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.15)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        maxHeight: SCREEN_HEIGHT * 0.85,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    modalContent: {
        padding: 20,
        paddingBottom: 30,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 20,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    infoItem: {
        width: '50%',
        alignItems: 'center',
        paddingVertical: 10,
    },
    extraRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        gap: 16,
    },
    extraItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    section: {
        marginTop: 24,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    stepNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        marginTop: 2,
    },
    materialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    actionBar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        gap: 10,
    },
});
