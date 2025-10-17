import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '../../styles/theme';

const Card = ({
  children,
  variant = 'base',
  onPress,
  style = {},
  contentStyle = {},
  disabled = false,
  ...props
}) => {
  const getCardStyle = () => {
    const baseStyle = {
      backgroundColor: Colors.backgroundSecondary,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
    };

    const variantStyles = {
      base: {
        padding: Spacing.base,
        ...Shadows.sm,
      },
      elevated: {
        padding: Spacing.lg,
        ...Shadows.md,
      },
      interactive: {
        padding: Spacing.base,
        ...Shadows.base,
      },
      flat: {
        padding: Spacing.base,
        backgroundColor: Colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.none,
      },
      outlined: {
        padding: Spacing.base,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.none,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
      ...(disabled && { opacity: 0.6 }),
      ...style,
    };
  };

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.95}
        style={getCardStyle()}
        {...props}
      >
        <View style={contentStyle}>
          {children}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={getCardStyle()} {...props}>
      <View style={contentStyle}>
        {children}
      </View>
    </View>
  );
};

export default Card;