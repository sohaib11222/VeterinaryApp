import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type Props = {
  status?: string | null;
  compact?: boolean;
};

const tones: Record<string, { foreground: string; background: string; icon: string }> = {
  PENDING: { foreground: '#8A5B00', background: colors.warningLight, icon: 'time-outline' },
  PENDING_PAYMENT: { foreground: '#8A5B00', background: colors.warningLight, icon: 'card-outline' },
  CONFIRMED: { foreground: '#106B64', background: colors.infoLight, icon: 'checkmark-circle-outline' },
  COMPLETED: { foreground: colors.primaryDark, background: colors.successLight, icon: 'checkmark-done-outline' },
  RESCHEDULED: { foreground: '#5C4A00', background: '#FFF7DB', icon: 'calendar-outline' },
  CANCELLED: { foreground: '#A51F2D', background: colors.errorLight, icon: 'close-circle-outline' },
  REJECTED: { foreground: '#A51F2D', background: colors.errorLight, icon: 'close-circle-outline' },
  NO_SHOW: { foreground: colors.textSecondary, background: colors.backgroundTertiary, icon: 'person-remove-outline' },
  MISSED: { foreground: colors.textSecondary, background: colors.backgroundTertiary, icon: 'time-outline' },
};

export function AppointmentStatusPill({ status, compact = false }: Props) {
  const normalized = String(status || 'PENDING').toUpperCase();
  const tone = tones[normalized] ?? { foreground: colors.textSecondary, background: colors.backgroundTertiary, icon: 'information-circle-outline' };
  const label = normalized.replace(/_/g, ' ');

  return (
    <View style={[styles.pill, { backgroundColor: tone.background }, compact && styles.compact]}>
      <Ionicons name={tone.icon as any} size={compact ? 12 : 14} color={tone.foreground} />
      <Text style={[styles.label, { color: tone.foreground }, compact && styles.compactLabel]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, maxWidth: 142 },
  compact: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9 },
  label: { ...typography.caption, fontWeight: '800', fontSize: 11, letterSpacing: 0.15 },
  compactLabel: { fontSize: 10 },
});
