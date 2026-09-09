import React from 'react';
import { KeyboardAvoidingView, Platform, View, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../../theme/spacing';

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  /** `none` lets a screen supply a measured keyboard inset; other screens retain the existing avoidance mode. */
  keyboardAvoidance?: 'default' | 'native-resize' | 'none';
  /** Override bottom safe-area padding when a screen manages its own keyboard inset. */
  bottomInset?: number;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollRef?: React.RefObject<ScrollView | null>;
}

export function ScreenContainer({
  children,
  scroll = false,
  padded = true,
  keyboardAvoidance = 'default',
  bottomInset,
  style,
  contentContainerStyle,
  scrollRef,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top,
    paddingBottom: bottomInset ?? insets.bottom,
    paddingLeft: insets.left + (padded ? spacing.md : 0),
    paddingRight: insets.right + (padded ? spacing.md : 0),
  };

  const content = scroll ? (
    <ScrollView
      ref={scrollRef}
      style={[styles.container, padding, style]}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.container, padding, style]}>{children}</View>
  );

  // Android's window is already resized by `softwareKeyboardLayoutMode: resize`.
  // Wrapping chat in a second height-based avoider caused composer gaps or overlap.
  if (keyboardAvoidance === 'none' || (keyboardAvoidance === 'native-resize' && Platform.OS === 'android')) return content;

  return (
    <KeyboardAvoidingView style={styles.keyboardAvoider} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {content}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardAvoider: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
});
