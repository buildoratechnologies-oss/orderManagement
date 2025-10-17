// Design System for Order Management App
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const Colors = {
  // Primary Colors
  primary: '#007AFF',
  primaryLight: '#5AC8FA',
  primaryDark: '#0051D0',
  primaryGradient: ['#007AFF', '#5AC8FA'],
  
  // Secondary Colors
  secondary: '#00D2FF',
  secondaryLight: '#7BDCFF',
  secondaryDark: '#0099CC',
  
  // Status Colors
  success: '#2ECC71',
  successLight: '#58D68D',
  successDark: '#27AE60',
  
  warning: '#F39C12',
  warningLight: '#F7DC6F',
  warningDark: '#E67E22',
  
  danger: '#E74C3C',
  dangerLight: '#F1948A',
  dangerDark: '#C0392B',
  
  info: '#3498DB',
  infoLight: '#85C1E9',
  infoDark: '#2980B9',
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Gray Scale
  gray50: '#F8F9FA',
  gray100: '#F1F3F4',
  gray200: '#E8EAED',
  gray300: '#DADCE0',
  gray400: '#BDC1C6',
  gray500: '#9AA0A6',
  gray600: '#80868B',
  gray700: '#5F6368',
  gray800: '#3C4043',
  gray900: '#202124',
  
  // Background Colors
  background: '#FFFFFF',
  backgroundSecondary: '#FFFFFF',
  backgroundDark: '#F8F9FA',
  
  // Text Colors
  textPrimary: '#202124',
  textSecondary: '#5F6368',
  textTertiary: '#9AA0A6',
  textInverse: '#FFFFFF',
  
  // Border Colors
  border: '#E8EAED',
  borderLight: '#F1F3F4',
  borderDark: '#DADCE0',
  
  // Overlay Colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',
};

export const Typography = {
  // Font Sizes
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
    '6xl': 40,
  },
  
  // Font Weights
  fontWeight: {
    thin: '100',
    extraLight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
    extraBold: '800',
    black: '900',
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },
  
  // Text Styles
  textStyles: {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 38,
      color: Colors.textPrimary,
    },
    h2: {
      fontSize: 28,
      fontWeight: '600',
      lineHeight: 34,
      color: Colors.textPrimary,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 30,
      color: Colors.textPrimary,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 26,
      color: Colors.textPrimary,
    },
    h5: {
      fontSize: 18,
      fontWeight: '500',
      lineHeight: 24,
      color: Colors.textPrimary,
    },
    h6: {
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 22,
      color: Colors.textPrimary,
    },
    body1: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 22,
      color: Colors.textPrimary,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
      color: Colors.textSecondary,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
      color: Colors.textTertiary,
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 22,
      color: Colors.textInverse,
    },
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
};

export const BorderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  base: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
};

export const Layout = {
  window: {
    width,
    height,
  },
  screen: {
    horizontal: width < height ? 'portrait' : 'landscape',
    isSmallDevice: width < 375,
    isMediumDevice: width >= 375 && width < 414,
    isLargeDevice: width >= 414,
  },
  container: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
  },
  containerLarge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
};

export const Components = {
  button: {
    primary: {
      backgroundColor: Colors.primary,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.base,
      ...Shadows.base,
    },
    secondary: {
      backgroundColor: Colors.white,
      borderColor: Colors.primary,
      borderWidth: 1,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.base,
      ...Shadows.sm,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: Colors.primary,
      borderWidth: 1,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.base,
    },
    danger: {
      backgroundColor: Colors.danger,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.base,
      ...Shadows.base,
    },
  },
  card: {
    base: {
      backgroundColor: Colors.backgroundSecondary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.base,
      ...Shadows.sm,
    },
    elevated: {
      backgroundColor: Colors.backgroundSecondary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      ...Shadows.md,
    },
    interactive: {
      backgroundColor: Colors.backgroundSecondary,
      borderRadius: BorderRadius.lg,
      padding: Spacing.base,
      ...Shadows.base,
    },
  },
  input: {
    base: {
      backgroundColor: Colors.backgroundSecondary,
      borderColor: Colors.border,
      borderWidth: 1,
      borderRadius: BorderRadius.base,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      fontSize: Typography.fontSize.md,
      color: Colors.textPrimary,
    },
    focused: {
      borderColor: Colors.primary,
      borderWidth: 2,
      ...Shadows.sm,
    },
    error: {
      borderColor: Colors.danger,
      borderWidth: 2,
    },
  },
};

export const Animations = {
  timing: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  spring: {
    tension: 100,
    friction: 8,
  },
  easing: {
    easeInOut: 'ease-in-out',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    linear: 'linear',
  },
};

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Layout,
  Components,
  Animations,
};