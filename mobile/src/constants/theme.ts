import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1C1B19',
    background: '#FAF8F5',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F1ECE3',
    textSecondary: '#756F66',
    primary: '#453E85',
    danger: '#C1443A',
    border: '#E4DFD5',
  },
  dark: {
    text: '#F3F1EC',
    background: '#131214',
    backgroundElement: '#1D1C1F',
    backgroundSelected: '#28262A',
    textSecondary: '#9C978F',
    primary: '#6C63B5',
    danger: '#E2726A',
    border: '#2D2B2F',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
