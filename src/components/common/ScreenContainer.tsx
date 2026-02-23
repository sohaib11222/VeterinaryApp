import React from 'react';
import { View, StyleSheet, ScrollView, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../../theme/spacing';

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export function ScreenContainer({
  children,
  scroll = false,
  padded = true,
  style,
  contentContainerStyle,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left + (padded ? spacing.md : 0),
    paddingRight: insets.right + (padded ? spacing.md : 0),
  };

  if (scroll) {
    return (
      <ScrollView
        style={[styles.container, padding, style]}
        contentContainerStyle={[styles.content, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, padding, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
});
