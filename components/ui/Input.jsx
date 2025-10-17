import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/theme';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  leftIcon,
  rightIcon,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  style = {},
  containerStyle = {},
  inputStyle = {},
  labelStyle = {},
  errorStyle = {},
  variant = 'default',
  size = 'medium',
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus && onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur && onBlur(e);
  };

  const getContainerStyle = () => {
    const baseStyle = {
      marginBottom: Spacing.base,
    };

    return {
      ...baseStyle,
      ...containerStyle,
    };
  };

  const getInputContainerStyle = () => {
    const baseStyle = {
      flexDirection: 'row',
      alignItems: multiline ? 'flex-start' : 'center',
      backgroundColor: Colors.backgroundSecondary,
      borderRadius: BorderRadius.base,
      borderWidth: 1,
    };

    const sizeStyles = {
      small: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        minHeight: 36,
      },
      medium: {
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.md,
        minHeight: 48,
      },
      large: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.base,
        minHeight: 56,
      },
    };

    const variantStyles = {
      default: {
        borderColor: error ? Colors.danger : (isFocused ? Colors.primary : Colors.border),
        backgroundColor: Colors.backgroundSecondary,
      },
      filled: {
        borderColor: 'transparent',
        backgroundColor: Colors.gray100,
      },
      outlined: {
        borderColor: error ? Colors.danger : (isFocused ? Colors.primary : Colors.border),
        backgroundColor: 'transparent',
        borderWidth: 2,
      },
    };

    const stateStyles = {
      ...(isFocused && !error && Shadows.sm),
      ...(error && { borderColor: Colors.danger, borderWidth: 2 }),
      ...(!editable && { backgroundColor: Colors.gray100, opacity: 0.6 }),
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...stateStyles,
      ...style,
    };
  };

  const getInputStyle = () => {
    const baseStyle = {
      flex: 1,
      color: Colors.textPrimary,
      fontSize: Typography.fontSize.md,
      fontWeight: Typography.fontWeight.normal,
    };

    const sizeStyles = {
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

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...(multiline && {
        paddingTop: Spacing.sm,
        textAlignVertical: 'top',
      }),
      ...inputStyle,
    };
  };

  const getLabelStyle = () => ({
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    ...labelStyle,
  });

  const getErrorStyle = () => ({
    fontSize: Typography.fontSize.sm,
    color: Colors.danger,
    marginTop: Spacing.xs,
    ...errorStyle,
  });

  const getHelperTextStyle = () => ({
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  });

  return (
    <View style={getContainerStyle()}>
      {label && <Text style={getLabelStyle()}>{label}</Text>}
      
      <View style={getInputContainerStyle()}>
        {leftIcon && (
          <View style={styles.iconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={getInputStyle()}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity style={styles.iconContainer}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={getErrorStyle()}>{error}</Text>}
      {!error && helperText && <Text style={getHelperTextStyle()}>{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    padding: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Input;