import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../context/AppContext';

interface FilterChipProps {
    label: string;
    selected: boolean;
    onPress: () => void;
    icon?: string;
}

export const FilterChip = ({ label, selected, onPress, icon }: FilterChipProps) => {
    const { theme } = useAppContext();

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={[
                styles.chip,
                {
                    backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                    borderRadius: theme.radius.pill,
                }
            ]}
        >
            {icon && (
                <MaterialCommunityIcons
                    // @ts-ignore
                    name={icon}
                    size={16}
                    color={selected ? theme.colors.white : theme.colors.textSecondary}
                    style={{ marginRight: 6 }}
                />
            )}
            <Text
                style={[
                    theme.typography.body2,
                    {
                        color: selected ? theme.colors.white : theme.colors.text,
                        fontWeight: selected ? '600' : '400',
                    }
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        marginRight: 8,
        marginBottom: 8,
    },
});
