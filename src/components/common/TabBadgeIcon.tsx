import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface TabBadgeIconProps {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  badge?: number;
}

/**
 * A compact shared tab-bar attention indicator. Counts deliberately stay out of
 * the bottom navigation: a single dot communicates that an item needs attention
 * without making the tab bar noisy or changing its layout on narrow devices.
 */
export function TabBadgeIcon({ name, focused, badge = 0 }: TabBadgeIconProps) {
  return (
    <View style={styles.wrap}>
      <Ionicons name={name} size={21} color={focused ? colors.tabActive : colors.tabInactive} />
      {badge > 0 ? <View style={styles.badge} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 28, height: 25, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', right: 0, top: 0, width: 8, height: 8, borderRadius: 7, backgroundColor: colors.error, borderWidth: 1.5, borderColor: colors.backgroundCard },
});
