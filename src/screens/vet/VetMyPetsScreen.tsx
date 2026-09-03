import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useAppointments } from '../../queries/appointmentQueries';
import { getImageUrl } from '../../config/api';
import { useTranslation } from 'react-i18next';
import { ResponsiveFilterChips } from '../../components/common/ResponsiveFilterChips';

type PetRow = {
  id: string;
  petId: string;
  petName: string;
  petImg: string | null;
  breed: string;
  species: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  lastVisit: string | null;
  dateAdded: string | null;
  hasActive: boolean;
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function derivePetsFromAppointments(response: unknown): PetRow[] {
  const body = response as { data?: { appointments?: unknown[] } };
  const list = Array.isArray(body?.data?.appointments) ? body.data.appointments : [];
  const map = new Map<string, {
    petId: string;
    petName: string;
    petImg: string | null;
    breed: string;
    species: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    dates: string[];
    hasActive: boolean;
  }>();

  for (const a of list as Record<string, unknown>[]) {
    const pet = (a.petId as Record<string, unknown>) || {};
    const owner = (a.petOwnerId as Record<string, unknown>) || {};
    const petId = (pet._id as string) ?? (a.petId as string) ?? '';
    if (!petId) continue;

    const appointmentDate = (a.appointmentDate as string) || null;
    const status = String((a.status as string) ?? '').toUpperCase();
    const hasActive = ['PENDING', 'CONFIRMED'].includes(status);
    const photo = (pet.photo as string) || null;

    if (!map.has(petId)) {
      map.set(petId, {
        petId,
        petName: (pet.name as string) || 'Pet',
        petImg: photo,
        breed: (pet.breed as string) || '',
        species: (pet.species as string) || '',
        ownerName: (owner.name as string) || (owner.fullName as string) || 'Pet Owner',
        ownerEmail: (owner.email as string) || '',
        ownerPhone: (owner.phone as string) || '',
        dates: appointmentDate ? [appointmentDate] : [],
        hasActive,
      });
    } else {
      const row = map.get(petId)!;
      if (appointmentDate) row.dates.push(appointmentDate);
      if (hasActive) row.hasActive = true;
    }
  }

  return Array.from(map.entries()).map((entry) => {
    const id = entry[0];
    const row = entry[1];
    const dates = row.dates.filter(Boolean).map((d) => new Date(d).getTime());
    const lastVisit = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : null;
    const dateAdded = dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : null;
    return {
      id,
      petId: row.petId,
      petName: row.petName,
      petImg: row.petImg,
      breed: row.breed,
      species: row.species,
      ownerName: row.ownerName,
      ownerEmail: row.ownerEmail,
      ownerPhone: row.ownerPhone,
      lastVisit,
      dateAdded,
      hasActive: row.hasActive,
    };
  });
}

function normalizeSpecies(s: string): string {
  const t = (s || '').trim().toLowerCase();
  if (t === 'dog') return 'Dog';
  if (t === 'cat') return 'Cat';
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
}

export function VetMyPetsScreen() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'active' | 'inactive'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecies, setFilterSpecies] = useState<string>('all');

  const { data: appointmentsResponse, isLoading, error } = useAppointments({ limit: 200 });
  const pets = useMemo(() => derivePetsFromAppointments(appointmentsResponse ?? {}), [appointmentsResponse]);

  const speciesOptions = useMemo(() => {
    const set = new Set<string>();
    pets.forEach((p) => {
      const n = normalizeSpecies(p.species);
      if (n) set.add(n);
    });
    return ['all', ...Array.from(set).sort()];
  }, [pets]);

  const list = useMemo(() => {
    const byTab = tab === 'active' ? pets.filter((p) => p.hasActive) : pets.filter((p) => !p.hasActive);
    const q = searchQuery.trim().toLowerCase();
    return byTab.filter((p) => {
      const matchSearch = !q ||
        p.petName.toLowerCase().includes(q) ||
        p.ownerName.toLowerCase().includes(q);
      const matchSpecies = filterSpecies === 'all' || normalizeSpecies(p.species) === filterSpecies;
      return matchSearch && matchSpecies;
    });
  }, [pets, tab, searchQuery, filterSpecies]);

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
          {(error as { message?: string })?.message ?? t('pets.errors.loadFailed')}
        </Text>
      </ScreenContainer>
    );
  }

  const renderItem = ({ item }: { item: PetRow }) => {
    const imageUri = item.petImg ? getImageUrl(item.petImg) : null;
    return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Text style={styles.avatarText}>{item.petName.charAt(0)}</Text>
          )}
        </View>
        <View style={styles.info}>
          <View style={styles.topRow}>
            <View style={styles.petNameRow}><Text style={styles.petName}>{item.petName}</Text><View style={styles.liveDot} /></View>
            <View style={styles.speciesBadge}>
              <Text style={styles.speciesText}>{normalizeSpecies(item.species) || '—'}</Text>
            </View>
          </View>
          <Text style={styles.breed}>{item.breed || '—'}</Text>
          <View style={styles.ownerRow}><Ionicons name="person-outline" size={14} color={colors.textSecondary} /><Text style={styles.owner}>{t('pets.labels.owner')}: {item.ownerName}</Text></View>
          <View style={styles.metaRow}>
            <View style={styles.metaPill}><Ionicons name="calendar-outline" size={13} color={colors.primary} /><Text style={styles.meta}>{t('pets.labels.lastVisit')}: {formatDate(item.lastVisit)}</Text></View>
            <View style={styles.metaPill}><Ionicons name="time-outline" size={13} color={colors.textSecondary} /><Text style={styles.meta}>{t('pets.labels.added')}: {formatDate(item.dateAdded)}</Text></View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={19} color={colors.textLight} />
      </View>
    </Card>
  );
  };

  return (
    <ScreenContainer padded>
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="paw-outline" size={23} color={colors.primaryDark} /></View>
        <View style={styles.heroCopy}><Text style={styles.heroTitle}>{t('menu.myPets')}</Text><Text style={styles.heroText}>{t('pets.count', { count: pets.length })}</Text></View>
        <View style={styles.heroCount}><Text style={styles.heroCountText}>{pets.length}</Text></View>
      </View>
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={19} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('pets.searchPlaceholder')}
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'active' && styles.tabActive]} onPress={() => setTab('active')}>
          <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>{t('pets.tabs.active')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'inactive' && styles.tabActive]} onPress={() => setTab('inactive')}>
          <Text style={[styles.tabText, tab === 'inactive' && styles.tabTextActive]}>{t('pets.tabs.inactive')}</Text>
        </TouchableOpacity>
      </View>
      <ResponsiveFilterChips
        width={116}
        value={filterSpecies}
        onChange={setFilterSpecies}
        accessibilityLabel="Filter pets by species"
        options={speciesOptions.map((value) => ({ value, label: value === 'all' ? t('pets.filters.all') : value }))}
      />
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('pets.empty')}</Text>
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
  heroCopy: { flex: 1 },
  heroTitle: { ...typography.h3, color: colors.primaryDark },
  heroText: { ...typography.caption, color: colors.primaryDark, opacity: 0.72, marginTop: 3 },
  heroCount: { minWidth: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryDark },
  heroCountText: { ...typography.label, color: colors.textInverse },
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
  tabs: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 12,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: colors.background, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  tabText: { ...typography.label, color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  list: { paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.borderLight },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.primaryLight + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { ...typography.h3, color: colors.primary },
  info: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  petNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 },
  petName: { ...typography.body, fontWeight: '600' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  speciesBadge: { backgroundColor: colors.primaryLight + '30', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  speciesText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  breed: { ...typography.caption, color: colors.textSecondary },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  owner: { ...typography.bodySmall, color: colors.textSecondary },
  metaRow: { marginTop: spacing.sm, gap: 5 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { ...typography.caption, color: colors.textLight },
  chevron: { ...typography.h2, color: colors.textLight },
  viewBtn: {
    marginTop: spacing.sm,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  viewBtnText: { ...typography.bodySmall, color: colors.textInverse, fontWeight: '600' },
  empty: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
});
