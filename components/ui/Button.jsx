import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Components } from '../../styles/theme';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style = {},
  textStyle = {},
  gradient = false,
  gradientColors,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.md,
    };

    // Size variations
    const sizeStyles = {
      small: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        minHeight: 36,
      },
      medium: {
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.base,
        minHeight: 48,
      },
      large: {
        paddingHorizontal: Spacing['2xl'],
        paddingVertical: Spacing.lg,
        minHeight: 56,
      },
    };

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: Colors.primary,
        ...Shadows.base,
      },
      secondary: {
        backgroundColor: Colors.white,
        borderColor: Colors.primary,
        borderWidth: 1,
        ...Shadows.sm,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderColor: Colors.primary,
        borderWidth: 1,
      },
      danger: {
        backgroundColor: Colors.danger,
        ...Shadows.base,
      },
      success: {
        backgroundColor: Colors.success,
        ...Shadows.base,
      },
      warning: {
        backgroundColor: Colors.warning,
        ...Shadows.base,
      },
      info: {
        backgroundColor: Colors.info,
        ...Shadows.base,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(fullWidth && { width: '100%' }),
      ...(disabled && {
        opacity: 0.5,
        ...Shadows.none,
      }),
      ...style,
    };
  };

  const getTextStyle = () => {
    const baseTextStyle = {
      fontWeight: Typography.fontWeight.semiBold,
      textAlign: 'center',
    };

    const sizeTextStyles = {
      small: {
        fontSize: Typography.fontSize.sm,
      },
      medium: {
        fontSize: Typography.fontSize.md,
      },
      large: {
        fontSize: Typography.fontSize.lg,
      },
    };

    const variantTextStyles = {
      primary: {
        color: Colors.textInverse,
      },
      secondary: {
        color: Colors.primary,
      },
      ghost: {
        color: Colors.primary,
      },
      danger: {
        color: Colors.textInverse,
      },
      success: {
        color: Colors.textInverse,
      },
      warning: {
        color: Colors.textInverse,
      },
      info: {
        color: Colors.textInverse,
      },
    };

    return {
      ...baseTextStyle,
      ...sizeTextStyles[size],
      ...variantTextStyles[variant],
      ...textStyle,
    };
  };

  const renderContent = () => (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator
          size={size === 'small' ? 'small' : 'small'}
          color={variant === 'secondary' || variant === 'ghost' ? Colors.primary : Colors.white}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <View style={[styles.iconContainer, { marginRight: Spacing.sm }]}>
              {icon}
            </View>
          )}
          <Text style={getTextStyle()}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <View style={[styles.iconContainer, { marginLeft: Spacing.sm }]}>
              {icon}
            </View>
          )}
        </>
      )}
    </View>
  );

  if (gradient && (variant === 'primary' || variant === 'danger' || variant === 'success' || variant === 'warning' || variant === 'info')) {
    const defaultGradientColors = {
      primary: Colors.primaryGradient,
      danger: [Colors.danger, Colors.dangerDark],
      success: [Colors.success, Colors.successDark],
      warning: [Colors.warning, Colors.warningDark],
      info: [Colors.info, Colors.infoDark],
    };

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[getButtonStyle(), { backgroundColor: 'transparent' }]}
        {...props}
      >
        <LinearGradient
          colors={gradientColors || defaultGradientColors[variant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: BorderRadius.md },
          ]}
        />
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={getButtonStyle()}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;