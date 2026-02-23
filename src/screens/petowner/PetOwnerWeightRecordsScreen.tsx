import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { usePets } from '../../queries/petsQueries';
import { useWeightRecords, type WeightRecordItem } from '../../queries/medicalQueries';
import { getImageUrl } from '../../config/api';

function formatDate(d: string | undefined): string {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatWeight(w: WeightRecordItem['weight']): string {
  if (!w || w.value === undefined || w.value === null) return '—';
  return `${w.value}${w.unit || ' kg'}`;
}

export function PetOwnerWeightRecordsScreen() {
  const [selectedPetId, setSelectedPetId] = useState('');
  const [page, setPage] = useState(1);

  const { data: petsResponse } = usePets();
  const pets = useMemo(() => {
    const raw = (petsResponse as { data?: { _id: string; name?: string }[] })?.data ?? (petsResponse as { _id: string; name?: string }[]);
    return Array.isArray(raw) ? raw : [];
  }, [petsResponse]);

  const listParams = useMemo(
    () => ({ page, limit: 20, ...(selectedPetId ? { petId: selectedPetId } : {}) }),
    [page, selectedPetId]
  );

  const { data: weightResponse, isLoading } = useWeightRecords(listParams);
  const payload = (weightResponse as { data?: { records?: WeightRecordItem[]; pagination?: { page?: number; limit?: number; total?: number; pages?: number } } })?.data ?? {};
  const records = payload.records ?? [];
  const pagination = payload.pagination ?? { page: 1, limit: 20, total: 0, pages: 1 };
  const latest = records.length > 0 ? records[0] : null;

  return (
    <ScreenContainer scroll padded>
      <Text style={styles.title}>Weight Records</Text>
      <Text style={styles.subtitle}>Track your pet's weight history recorded during appointments</Text>

      {pets.length > 0 && (
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Pet</Text>
          <View style={styles.petChips}>
            <TouchableOpacity style={[styles.chip, !selectedPetId && styles.chipActive]} onPress={() => setSelectedPetId('')}>
              <Text style={[styles.chipText, !selectedPetId && styles.chipTextActive]}>All Pets</Text>
            </TouchableOpacity>
            {pets.map((p) => (
              <TouchableOpacity key={p._id} style={[styles.chip, selectedPetId === p._id && styles.chipActive]} onPress={() => { setSelectedPetId(p._id); setPage(1); }}>
                <Text style={[styles.chipText, selectedPetId === p._id && styles.chipTextActive]}>{p.name || p._id}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <Card style={styles.latestCard}>
        <Text style={styles.latestTitle}>Latest Weight</Text>
        {latest ? (
          <View style={styles.latestRow}>
            {latest.petId?.photo ? (
              <View style={styles.latestPetPhoto} />
            ) : null}
            <Text style={styles.latestPetName}>{latest.petId?.name || 'Pet'}</Text>
            <Text style={styles.latestValue}>{formatWeight(latest.weight)}</Text>
            <Text style={styles.latestDate}>{formatDate(latest.date)}</Text>
          </View>
        ) : (
          <Text style={styles.muted}>No weight records yet</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>History</Text>
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : records.length === 0 ? (
          <Text style={styles.muted}>No weight records found</Text>
        ) : (
          <FlatList
            data={records}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.recordRow}>
                <Text style={styles.recordId}>#{String(item._id).slice(-6).toUpperCase()}</Text>
                <Text style={styles.recordPet}>{item.petId?.name || '—'}</Text>
                <Text style={styles.recordWeight}>{formatWeight(item.weight)}</Text>
                <Text style={styles.recordDate}>{formatDate(item.date)}</Text>
                <Text style={styles.recordBy}>{item.recordedBy?.name || '—'}</Text>
                <Text style={styles.recordNotes}>{item.notes || '—'}</Text>
              </View>
            )}
          />
        )}
        {pagination.pages && pagination.pages > 1 && (
          <View style={styles.pagination}>
            <Text style={styles.pageInfo}>Page {pagination.page} of {pagination.pages}</Text>
          </View>
        )}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h3, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  filterRow: { marginBottom: spacing.md },
  filterLabel: { ...typography.label, marginBottom: spacing.xs },
  petChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.backgroundSecondary },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...typography.bodySmall },
  chipTextActive: { color: colors.textInverse, fontWeight: '600' },
  latestCard: { marginBottom: spacing.md },
  latestTitle: { ...typography.body, fontWeight: '600', marginBottom: spacing.sm },
  latestRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  latestPetPhoto: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.backgroundTertiary },
  latestPetName: { ...typography.body, fontWeight: '600' },
  latestValue: { ...typography.h3, color: colors.primary },
  latestDate: { ...typography.caption, color: colors.textSecondary },
  sectionTitle: { ...typography.body, fontWeight: '600', marginBottom: spacing.sm },
  recordRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recordId: { ...typography.caption, width: 70 },
  recordPet: { flex: 1, minWidth: 60, ...typography.bodySmall },
  recordWeight: { ...typography.bodySmall, fontWeight: '600' },
  recordDate: { ...typography.caption },
  recordBy: { ...typography.caption, color: colors.textSecondary },
  recordNotes: { ...typography.caption, color: colors.textLight, flexBasis: '100%' },
  loading: { paddingVertical: spacing.xl, alignItems: 'center' },
  muted: { ...typography.body, color: colors.textSecondary },
  pagination: { marginTop: spacing.sm },
  pageInfo: { ...typography.caption, color: colors.textSecondary },
});
