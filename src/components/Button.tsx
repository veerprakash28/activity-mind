import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useAppContext } from '../context/AppContext';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
}

export const Button = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    style,
    textStyle,
    icon,
}: ButtonProps) => {
    const { theme } = useAppContext();

    // Dynamic Styles based on variant
    const getBackgroundColor = () => {
        if (disabled) return theme.colors.border;
        switch (variant) {
            case 'primary': return theme.colors.primary;
            case 'secondary': return theme.colors.secondary;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            default: return theme.colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return theme.colors.textSecondary;
        switch (variant) {
            case 'primary': return theme.colors.white;
            case 'secondary': return theme.colors.white;
            case 'outline': return theme.colors.primary;
            case 'ghost': return theme.colors.primary;
            default: return theme.colors.white;
        }
    };

    const getBorderColor = () => {
        if (variant === 'outline') return disabled ? theme.colors.border : theme.colors.primary;
        return 'transparent';
    };

    const borderStyle = variant === 'outline' ? { borderWidth: 1, borderColor: getBorderColor() } : {};

    const sizeStyles = {
        small: { paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.sm, borderRadius: theme.radius.sm },
        medium: { paddingVertical: theme.spacing.md, paddingHorizontal: theme.spacing.lg, borderRadius: theme.radius.md },
        large: { paddingVertical: theme.spacing.lg, paddingHorizontal: theme.spacing.xl, borderRadius: theme.radius.lg },
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
            style={[
                styles.container,
                { backgroundColor: getBackgroundColor() },
                borderStyle,
                sizeStyles[size],
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <>
                    {icon && <React.Fragment>{icon}</React.Fragment>}
                    <Text style={[
                        styles.text,
                        theme.typography.button,
                        { color: getTextColor() },
                        textStyle,
                        icon ? { marginLeft: theme.spacing.sm } : {}
                    ]}>
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        textAlign: 'center',
    },
});
