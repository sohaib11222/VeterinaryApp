import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export type FilterChipOption = { value: string; label: string };

interface ResponsiveFilterChipsProps {
  options: FilterChipOption[];
  value: string;
  onChange: (value: string) => void;
  width?: number;
  accessibilityLabel?: string;
}

/**
 * Shared mobile filter control. Every option has an explicit width so label
 * length never alters the layout; overflow remains safely horizontally scrollable.
 */
export function ResponsiveFilterChips({ options, value, onChange, width = 132, accessibilityLabel }: ResponsiveFilterChipsProps) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} accessibilityLabel={accessibilityLabel}>
    {options.map((option) => {
      const selected = option.value === value;
      return <TouchableOpacity key={option.value || '__all'} style={[styles.chip, { width }, selected && styles.selected]} onPress={() => onChange(option.value)} accessibilityRole="button" accessibilityState={{ selected }}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.label, selected && styles.selectedLabel]}>{option.label}</Text>
      </TouchableOpacity>;
    })}
  </ScrollView>;
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingTop: spacing.xs, paddingBottom: spacing.md, paddingRight: spacing.md },
  chip: { height: 38, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.background },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { ...typography.caption, color: colors.textSecondary, fontWeight: '800', textAlign: 'center' },
  selectedLabel: { color: colors.textInverse },
});
