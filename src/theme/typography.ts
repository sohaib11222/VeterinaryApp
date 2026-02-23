import { Platform } from 'react-native';
import { colors } from './colors';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  // Headings – bold, clear
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  // Body
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.text,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: colors.textLight,
  },
  // Labels / buttons
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textInverse,
  },
};
