import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useVaccinations } from '../../queries/medicalQueries';
import { useTranslation } from 'react-i18next';

type VaccinationItem = {
  _id: string;
  vaccinationType?: string;
  vaccinationDate?: string;
  nextDueDate?: string | null;
  petId?: { _id: string; name?: string; species?: string; breed?: string } | null;
  petOwnerId?: { _id: string; name?: string } | null;
  doseNumber?: number | null;
  batchNumber?: string | null;
  notes?: string | null;
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function normalizeVaccinations(response: unknown): VaccinationItem[] {
  const body = response as { data?: { vaccinations?: VaccinationItem[] }; vaccinations?: VaccinationItem[] };
  const data = body?.data ?? body;
  const list = data?.vaccinations ?? [];
  return Array.isArray(list) ? list : [];
}

export function VetVaccinationsScreen() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVaccine, setFilterVaccine] = useState<string>('all');

  const { data: vaccinationsResponse, isLoading, error } = useVaccinations({ limit: 100 });
  const vaccinations = useMemo(() => normalizeVaccinations(vaccinationsResponse ?? {}), [vaccinationsResponse]);

  const vaccineTypes = useMemo(() => Array.from(new Set(vaccinations.map((v) => v.vaccinationType ?? 'Other').filter(Boolean))), [vaccinations]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return vaccinations.filter((v) => {
      const petName = (v.petId?.name ?? '').toLowerCase();
      const ownerName = (v.petOwnerId?.name ?? '').toLowerCase();
      const matchSearch = !q || petName.includes(q) || ownerName.includes(q);
      const type = v.vaccinationType ?? 'Other';
      const matchVaccine = filterVaccine === 'all' || type === filterVaccine;
      return matchSearch && matchVaccine;
    });
  }, [vaccinations, searchQuery, filterVaccine]);

  const getStatus = (v: VaccinationItem): string => {
    if (!v.nextDueDate) return 'Up to date';
    const due = new Date(v.nextDueDate);
    const now = new Date();
    if (due < now) return 'Overdue';
    const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    if (daysLeft <= 30) return 'Due soon';
    return 'Up to date';
  };

  const statusLabel = (raw: string) => {
    if (raw === 'Overdue') return t('vetVaccinations.status.overdue');
    if (raw === 'Due soon') return t('vetVaccinations.status.dueSoon');
    return t('vetVaccinations.status.upToDate');
  };

  if (isLoading) {
    return (
      <ScreenContainer padded>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer padded>
        <Text style={styles.errorText}>
          {(error as { message?: string })?.message ?? t('vetVaccinations.errors.loadFailed')}
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded>
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('vetVaccinations.searchPlaceholder')}
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterVaccine === 'all' && styles.filterChipActive]}
          onPress={() => setFilterVaccine('all')}
        >
          <Text style={[styles.filterChipText, filterVaccine === 'all' && styles.filterChipTextActive]}>{t('vetVaccinations.filters.all')}</Text>
        </TouchableOpacity>
        {vaccineTypes.map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.filterChip, filterVaccine === v && styles.filterChipActive]}
            onPress={() => setFilterVaccine(v)}
          >
            <Text style={[styles.filterChipText, filterVaccine === v && styles.filterChipTextActive]}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const petName = item.petId?.name ?? t('common.pet');
          const breed = item.petId?.breed ?? '';
          const ownerName = item.petOwnerId?.name ?? '—';
          const vaccineType = item.vaccinationType ?? t('vetVaccinations.labels.vaccination');
          const status = getStatus(item);
          const statusText = statusLabel(status);
          const isDueSoon = status === 'Due soon' || status === 'Overdue';
          return (
            <Card style={styles.card}>
              <View style={styles.topRow}>
                <Text style={styles.petName}>{petName}{breed ? ` (${breed})` : ''}</Text>
                <View style={[styles.statusBadge, isDueSoon && styles.statusDue]}>
                  <Text style={styles.statusText}>{statusText}</Text>
                </View>
              </View>
              <Text style={styles.owner}>{t('vetVaccinations.labels.owner')}: {ownerName}</Text>
              <Text style={styles.vaccine}>💉 {vaccineType}</Text>
              <Text style={styles.date}>{t('vetVaccinations.labels.given')}: {formatDate(item.vaccinationDate)}</Text>
              <Text style={styles.nextDue}>{t('vetVaccinations.labels.nextDue')}: {item.nextDueDate ? formatDate(item.nextDueDate) : '—'}</Text>
              {item.notes ? <Text style={styles.notes}>{t('vetVaccinations.labels.note')}: {item.notes}</Text> : null}
            </Card>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('vetVaccinations.empty')}</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  errorText: { ...typography.body, color: colors.error },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    minHeight: 44,
  },
  searchIcon: { marginRight: spacing.sm, fontSize: 16 },
  searchInput: { flex: 1, ...typography.body, paddingVertical: spacing.sm },
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 20, backgroundColor: colors.backgroundTertiary },
  filterChipActive: { backgroundColor: colors.primary },
  filterChipText: { ...typography.label, color: colors.textSecondary },
  filterChipTextActive: { color: colors.textInverse },
  list: { paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.sm },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  petName: { ...typography.body, fontWeight: '600' },
  owner: { ...typography.caption, color: colors.textSecondary },
  vaccine: { ...typography.h3, color: colors.primary, marginTop: spacing.xs },
  date: { ...typography.bodySmall, marginTop: 4 },
  nextDue: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  notes: { ...typography.caption, color: colors.textLight, marginTop: 2, fontStyle: 'italic' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.successLight },
  statusDue: { backgroundColor: colors.warningLight },
  statusText: { fontSize: 12, fontWeight: '600' },
  empty: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
});
