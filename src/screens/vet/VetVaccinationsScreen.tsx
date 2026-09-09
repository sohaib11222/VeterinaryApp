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
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useVaccinations } from '../../queries/medicalQueries';
import { useTranslation } from 'react-i18next';
import { ResponsiveFilterChips } from '../../components/common/ResponsiveFilterChips';

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
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="medkit-outline" size={23} color={colors.primaryDark} /></View>
        <View style={styles.heroCopy}><Text style={styles.heroTitle}>{t('menu.vaccinations')}</Text><Text style={styles.heroText}>{t('vetVaccinations.recordCount', { count: vaccinations.length })}</Text></View>
        <View style={styles.heroCount}><Text style={styles.heroCountText}>{vaccinations.length}</Text></View>
      </View>
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={19} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('vetVaccinations.searchPlaceholder')}
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <ResponsiveFilterChips
        width={148}
        bottomSpacing={spacing.xs}
        value={filterVaccine}
        onChange={setFilterVaccine}
        accessibilityLabel="Filter vaccination records by vaccine type"
        options={[{ value: 'all', label: t('vetVaccinations.filters.all') }, ...vaccineTypes.map((value) => ({ value, label: value }))]}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        style={styles.listContainer}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const petName = item.petId?.name ?? t('common.pet');
          const breed = item.petId?.breed ?? '';
          const ownerName = item.petOwnerId?.name ?? '—';
          const vaccineType = item.vaccinationType ?? t('vetVaccinations.labels.vaccination');
          const status = getStatus(item);
          const statusText = statusLabel(status);
          const isDueSoon = status === 'Due soon';
          const isOverdue = status === 'Overdue';
          return (
            <Card style={styles.card}>
              <View style={styles.topRow}>
                <View style={styles.petHeading}><View style={styles.petAvatar}><Text style={styles.petInitial}>{petName.charAt(0)}</Text></View><View><Text style={styles.petName}>{petName}</Text><Text style={styles.breed}>{[breed, item.petId?.species].filter(Boolean).join(' · ') || '—'}</Text></View></View>
                <View style={[styles.statusBadge, isDueSoon && styles.statusDue, isOverdue && styles.statusOverdue]}>
                  <Text style={styles.statusText}>{statusText}</Text>
                </View>
              </View>
              <View style={styles.ownerRow}><Ionicons name="person-outline" size={14} color={colors.textSecondary} /><Text style={styles.owner}>{t('vetVaccinations.labels.owner')}: {ownerName}</Text></View>
              <View style={styles.vaccinePanel}><View style={styles.vaccineIcon}><Ionicons name="medical-outline" size={18} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.vaccineLabel}>{t('vetVaccinations.labels.vaccination')}</Text><Text style={styles.vaccine}>{vaccineType}</Text></View>{item.doseNumber ? <View style={styles.dosePill}><Text style={styles.doseText}>#{item.doseNumber}</Text></View> : null}</View>
              <View style={styles.dateGrid}><View style={styles.dateCell}><Text style={styles.dateLabel}>{t('vetVaccinations.labels.given')}</Text><Text style={styles.date}>{formatDate(item.vaccinationDate)}</Text></View><View style={styles.dateCell}><Text style={styles.dateLabel}>{t('vetVaccinations.labels.nextDue')}</Text><Text style={styles.date}>{item.nextDueDate ? formatDate(item.nextDueDate) : '—'}</Text></View></View>
              {item.batchNumber ? <Text style={styles.batch}>{t('vetVaccinations.batch', { value: item.batchNumber })}</Text> : null}
              {item.notes ? <View style={styles.notesRow}><Ionicons name="document-text-outline" size={14} color={colors.textSecondary} /><Text style={styles.notes}>{item.notes}</Text></View> : null}
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
  hero: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 18, backgroundColor: colors.successLight, borderWidth: 1, borderColor: colors.primaryLight + '25', marginBottom: spacing.md },
  heroIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondaryLight, marginRight: spacing.md },
  heroCopy: { flex: 1 }, heroTitle: { ...typography.h3, color: colors.primaryDark }, heroText: { ...typography.caption, color: colors.primaryDark, opacity: 0.72, marginTop: 3 }, heroCount: { minWidth: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryDark }, heroCountText: { ...typography.label, color: colors.textInverse },
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
  listContainer: { flex: 1 },
  list: { paddingTop: 0, paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.borderLight },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  petHeading: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  petAvatar: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.primaryLight + '20', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm }, petInitial: { ...typography.label, color: colors.primary },
  petName: { ...typography.body, fontWeight: '700' }, breed: { ...typography.caption, color: colors.textSecondary, marginTop: 1 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm }, owner: { ...typography.bodySmall, color: colors.textSecondary },
  vaccinePanel: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm, borderRadius: 13, backgroundColor: colors.backgroundSecondary, marginTop: spacing.sm }, vaccineIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: colors.primaryLight + '16', marginRight: spacing.sm }, vaccineLabel: { ...typography.caption, color: colors.textSecondary }, vaccine: { ...typography.label, color: colors.primaryDark, marginTop: 1 }, dosePill: { backgroundColor: colors.primaryLight + '1A', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8 }, doseText: { ...typography.caption, color: colors.primaryDark, fontWeight: '800' },
  dateGrid: { flexDirection: 'row', marginTop: spacing.sm, gap: spacing.sm }, dateCell: { flex: 1, padding: spacing.sm, borderRadius: 10, backgroundColor: colors.backgroundSecondary }, dateLabel: { ...typography.caption, color: colors.textSecondary }, date: { ...typography.bodySmall, color: colors.text, fontWeight: '600', marginTop: 2 }, batch: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm }, notesRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: spacing.sm }, notes: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.successLight },
  statusDue: { backgroundColor: colors.warningLight },
  statusOverdue: { backgroundColor: colors.errorLight },
  statusText: { fontSize: 12, fontWeight: '600' },
  empty: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
});
