import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';
import { UpdateInfo, VersionService } from '../utils/VersionService';
import { Button } from './Button';

interface UpdateModalProps {
    visible: boolean;
    updateInfo: UpdateInfo | null;
    onClose: () => void;
}

export const UpdateModal = ({ visible, updateInfo, onClose }: UpdateModalProps) => {
    const { theme } = useAppContext();

    if (!updateInfo) return null;

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
                    <View style={[styles.headerVisual, { backgroundColor: theme.colors.primary + '15' }]}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
                            <MaterialCommunityIcons name="rocket-launch" size={32} color={theme.colors.white} />
                        </View>
                        <Text style={[theme.typography.h2, { color: theme.colors.text, marginTop: 16 }]}>Update Available!</Text>
                        <Text style={[theme.typography.body1, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                            A new version of Activity Mind is ready.
                        </Text>
                    </View>

                    <View style={styles.content}>
                        {/* Version Comparison */}
                        <View style={styles.versionRow}>
                            <View style={[styles.versionBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Current</Text>
                                <Text style={[theme.typography.h4, { color: theme.colors.text }]}>v{updateInfo.currentVersion}</Text>
                            </View>
                            <MaterialCommunityIcons name="arrow-right" size={20} color={theme.colors.textSecondary} style={{ marginHorizontal: 12 }} />
                            <View style={[styles.versionBox, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]}>
                                <Text style={[theme.typography.caption, { color: theme.colors.primary }]}>Latest</Text>
                                <Text style={[theme.typography.h4, { color: theme.colors.primary }]}>v{updateInfo.latestVersion}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Footer Actions */}
                    <View style={styles.footer}>
                        <Button
                            title="Update Now"
                            onPress={() => {
                                VersionService.openDownloadPage(updateInfo.downloadUrl);
                                onClose();
                            }}
                            style={styles.actionBtn}
                        />
                        <TouchableOpacity
                            onPress={async () => {
                                await VersionService.snoozeUpdate();
                                onClose();
                            }}
                            style={styles.dismissBtn}
                        >
                            <Text style={[theme.typography.body1, { color: theme.colors.textSecondary, fontWeight: '600' }]}>Maybe Later</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const { width } = Dimensions.get('window');

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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 15,
    },
    headerVisual: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    content: {
        maxHeight: 300,
        paddingHorizontal: 24,
    },
    versionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 16,
    },
    versionBox: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        minWidth: 100,
    },
    footer: {
        padding: 24,
        paddingTop: 8,
    },
    actionBtn: {
        width: '100%',
    },
    dismissBtn: {
        marginTop: 16,
        alignItems: 'center',
        paddingVertical: 8,
    },
});
