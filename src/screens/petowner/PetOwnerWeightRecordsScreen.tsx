import React, { useMemo, useState } from 'react';
import { AppImage } from '../../components/common/AppImage';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { usePets } from '../../queries/petsQueries';
import { useWeightRecords, type WeightRecordItem } from '../../queries/medicalQueries';
import { getImageUrl } from '../../config/api';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export function PetOwnerWeightRecordsScreen() {
  const { t, i18n } = useTranslation();

  const formatDate = (d: string | undefined): string => {
    if (!d) return t('common.na');
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return t('common.na');
    return dt.toLocaleDateString(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatWeight = (w: WeightRecordItem['weight']): string => {
    if (!w || w.value === undefined || w.value === null) return t('common.na');
    return `${w.value}${w.unit || t('petOwnerWeightRecords.defaults.unitKg')}`;
  };

  const [selectedPetId, setSelectedPetId] = useState('');
  const [page, setPage] = useState(1);

  const { data: petsResponse } = usePets();
  const pets = useMemo(() => {
    const outer = petsResponse as { data?: unknown } | undefined;
    const raw = outer?.data ?? petsResponse;
    if (!Array.isArray(raw)) return [];
    return raw
      .map((p) => p as { _id?: string; name?: string })
      .filter((p) => typeof p?._id === 'string' && p._id.length > 0)
      .map((p) => ({ _id: p._id as string, name: p.name }));
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
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="analytics" size={23} color={colors.primaryDark} /></View>
        <View style={styles.heroCopy}>
          <Text style={styles.title}>{t('petOwnerWeightRecords.title')}</Text>
          <Text style={styles.subtitle}>{t('petOwnerWeightRecords.subtitle')}</Text>
        </View>
      </View>

      {pets.length > 0 && (
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>{t('petOwnerWeightRecords.filters.pet')}</Text>
          <View style={styles.petChips}>
            <TouchableOpacity style={[styles.chip, !selectedPetId && styles.chipActive]} onPress={() => setSelectedPetId('')}>
              <Text style={[styles.chipText, !selectedPetId && styles.chipTextActive]}>{t('petOwnerWeightRecords.filters.allPets')}</Text>
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
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderIcon}><Ionicons name="pulse-outline" size={18} color={colors.primary} /></View>
          <Text style={styles.latestTitle}>{t('petOwnerWeightRecords.latest.title')}</Text>
        </View>
        {latest ? (
          <View style={styles.latestRow}>
            {getImageUrl(latest.petId?.photo) ? (
              <AppImage source={{ uri: getImageUrl(latest.petId?.photo) as string }} style={styles.latestPetPhoto} />
            ) : null}
            <View style={styles.latestCopy}>
              <Text style={styles.latestPetName}>{latest.petId?.name || t('petOwnerWeightRecords.defaults.pet')}</Text>
              <Text style={styles.latestDate}>{formatDate(latest.date)}</Text>
            </View>
            <View style={styles.latestValueWrap}>
              <Text style={styles.latestValue}>{formatWeight(latest.weight)}</Text>
              <Text style={styles.latestValueCaption}>{t('petOwnerWeightRecords.latest.title')}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.muted}>{t('petOwnerWeightRecords.empty.latest')}</Text>
        )}
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderIcon}><Ionicons name="time-outline" size={18} color={colors.primary} /></View>
          <Text style={styles.sectionTitle}>{t('petOwnerWeightRecords.history.title')}</Text>
        </View>
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : records.length === 0 ? (
          <Text style={styles.muted}>{t('petOwnerWeightRecords.empty.history')}</Text>
        ) : (
          <FlatList
            data={records}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.recordRow}>
                <View style={styles.timelineDot}><Ionicons name="analytics-outline" size={15} color={colors.primary} /></View>
                <View style={styles.recordMain}>
                  <View style={styles.recordTop}>
                    <Text style={styles.recordPet}>{item.petId?.name || t('common.na')}</Text>
                    <Text style={styles.recordWeight}>{formatWeight(item.weight)}</Text>
                  </View>
                  <View style={styles.recordMeta}>
                    <Text style={styles.recordDate}>{formatDate(item.date)}</Text>
                    <Text style={styles.recordId}>#{String(item._id).slice(-6).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.recordBy}>{item.recordedBy?.name || t('common.na')}</Text>
                  {item.notes ? <Text style={styles.recordNotes}>{item.notes}</Text> : null}
                </View>
              </View>
            )}
          />
        )}
        {Number(pagination.pages ?? 0) > 1 && (
          <View style={styles.pagination}>
            <Text style={styles.pageInfo}>{t('petOwnerWeightRecords.pagination.pageOf', { page: pagination.page, pages: pagination.pages })}</Text>
          </View>
        )}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successLight, borderRadius: 18, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.primaryLight + '28' },
  heroIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondaryLight, marginRight: spacing.md },
  heroCopy: { flex: 1 },
  title: { ...typography.h3, color: colors.primaryDark },
  subtitle: { ...typography.caption, color: colors.primaryDark, opacity: 0.72, marginTop: 3 },
  filterRow: { marginBottom: spacing.md },
  filterLabel: { ...typography.label, marginBottom: spacing.xs },
  petChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.backgroundSecondary },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...typography.bodySmall },
  chipTextActive: { color: colors.textInverse, fontWeight: '600' },
  latestCard: { marginBottom: spacing.md, borderWidth: 1, borderColor: colors.borderLight },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  cardHeaderIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '18', marginRight: spacing.sm },
  latestTitle: { ...typography.label, color: colors.text },
  latestRow: { flexDirection: 'row', alignItems: 'center' },
  latestPetPhoto: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.backgroundTertiary, marginRight: spacing.sm },
  latestCopy: { flex: 1 },
  latestPetName: { ...typography.label, color: colors.text },
  latestValueWrap: { alignItems: 'flex-end', paddingLeft: spacing.sm },
  latestValue: { ...typography.h3, color: colors.primaryDark },
  latestValueCaption: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  latestDate: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: { ...typography.label, color: colors.text },
  recordRow: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexDirection: 'row' },
  timelineDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '18', marginRight: spacing.sm },
  recordMain: { flex: 1, minWidth: 0 },
  recordTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  recordMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 3 },
  recordId: { ...typography.caption, color: colors.textLight },
  recordPet: { ...typography.label, color: colors.text, flex: 1 },
  recordWeight: { ...typography.label, color: colors.primaryDark },
  recordDate: { ...typography.caption, color: colors.textSecondary },
  recordBy: { ...typography.caption, color: colors.textSecondary, marginTop: 3 },
  recordNotes: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 5 },
  loading: { paddingVertical: spacing.xl, alignItems: 'center' },
  muted: { ...typography.body, color: colors.textSecondary },
  pagination: { marginTop: spacing.sm },
  pageInfo: { ...typography.caption, color: colors.textSecondary },
});
