import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { Button } from './Button';

export type StatusType = 'success' | 'error' | 'confirm' | 'info';

interface StatusModalProps {
    visible: boolean;
    type: StatusType;
    title: string;
    message: string;
    onConfirm?: () => void;
    onClose: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
}

export const StatusModal = ({
    visible,
    type,
    title,
    message,
    onConfirm,
    onClose,
    confirmLabel = 'Everything Looks Good',
    cancelLabel = 'Cancel'
}: StatusModalProps) => {
    const { theme } = useAppContext();

    const getIcon = () => {
        switch (type) {
            case 'success': return { name: 'check-circle' as const, color: '#10B981' };
            case 'error': return { name: 'alert-circle' as const, color: '#EF4444' };
            case 'confirm': return { name: 'help-circle' as const, color: '#F59E0B' };
            default: return { name: 'information' as const, color: theme.colors.primary };
        }
    };

    const icon = getIcon();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
                    {/* Visual Header */}
                    <View style={[styles.headerVisual, { backgroundColor: icon.color + '15' }]}>
                        <View style={[styles.iconCircle, { backgroundColor: icon.color }]}>
                            <MaterialCommunityIcons name={icon.name} size={32} color="#FFF" />
                        </View>
                    </View>

                    <View style={styles.content}>
                        <Text style={[theme.typography.h3, { color: theme.colors.text, textAlign: 'center' }]}>
                            {title}
                        </Text>
                        <Text style={[theme.typography.body1, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>
                            {message}
                        </Text>
                    </View>

                    <View style={styles.footer}>
                        {type === 'confirm' ? (
                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={[styles.secondaryBtn, { borderColor: theme.colors.border }]}
                                >
                                    <Text style={[theme.typography.body1, { color: theme.colors.textSecondary, fontWeight: '600' }]}>
                                        {cancelLabel}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        onConfirm?.();
                                        onClose();
                                    }}
                                    style={[styles.primaryBtn, { backgroundColor: icon.color }]}
                                >
                                    <Text style={[theme.typography.body1, { color: '#FFF', fontWeight: '700' }]}>
                                        {confirmLabel}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Button
                                title={confirmLabel}
                                onPress={onClose}
                                style={{ width: '100%', backgroundColor: icon.color }}
                            />
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 28,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    headerVisual: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
    },
    content: {
        padding: 24,
        paddingTop: 16,
    },
    footer: {
        padding: 24,
        paddingTop: 0,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    primaryBtn: {
        flex: 2,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryBtn: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
