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
  height?: number;
  lineCount?: number;
  bottomSpacing?: number;
  accessibilityLabel?: string;
}

/**
 * Shared mobile filter control. Every option has an explicit width so label
 * length never alters the layout; overflow remains safely horizontally scrollable.
 */
export function ResponsiveFilterChips({ options, value, onChange, width = 132, height = 38, lineCount = 1, bottomSpacing = spacing.sm, accessibilityLabel }: ResponsiveFilterChipsProps) {
  const containerHeight = height + spacing.xs + bottomSpacing;
  return <ScrollView horizontal style={[styles.scroll, { height: containerHeight }]} showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, { paddingBottom: bottomSpacing }]} accessibilityLabel={accessibilityLabel}>
    {options.map((option) => {
      const selected = option.value === value;
      return <TouchableOpacity key={option.value || '__all'} style={[styles.chip, { width, height }, selected && styles.selected]} onPress={() => onChange(option.value)} accessibilityRole="button" accessibilityState={{ selected }}>
        <Text numberOfLines={lineCount} ellipsizeMode="tail" style={[styles.label, selected && styles.selectedLabel]}>{option.label}</Text>
      </TouchableOpacity>;
    })}
  </ScrollView>;
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, flexShrink: 0 },
  row: { gap: spacing.sm, paddingTop: spacing.xs, paddingRight: spacing.md },
  chip: { height: 38, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.background },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { ...typography.caption, color: colors.textSecondary, fontWeight: '800', textAlign: 'center' },
  selectedLabel: { color: colors.textInverse },
});
