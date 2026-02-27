import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Switch,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { getImageUrl } from '../../config/api';
import { useVeterinarians } from '../../queries/veterinarianQueries';
import { useSpecializations } from '../../queries/specializationQueries';
import { useFavorites } from '../../queries/favoriteQueries';
import { useAddFavorite, useRemoveFavorite } from '../../mutations/favoriteMutations';
import { useVetHeaderRightAction } from '../../contexts/VetHeaderRightActionContext';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 12;

function renderStars(rating: number) {
  const r = Number(rating) || 0;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Text key={i} style={styles.star}>{i <= r ? '★' : '☆'}</Text>
    );
  }
  return stars;
}

export function PetOwnerSearchScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const headerRight = useVetHeaderRightAction();
  const { t } = useTranslation();

  useFocusEffect(
    React.useCallback(() => {
      headerRight?.setRightAction(
        <TouchableOpacity
          style={styles.headerMapBtn}
          onPress={() => navigation.navigate('PetOwnerClinicMap')}
          activeOpacity={0.7}
        >
          <Text style={styles.headerMapBtnIcon}>🗺️</Text>
        </TouchableOpacity>
      );
      return () => headerRight?.setRightAction(null);
    }, [headerRight, navigation])
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [showAvailability, setShowAvailability] = useState(false);
  const [page, setPage] = useState(1);
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});
  const [favoriteIdOverrides, setFavoriteIdOverrides] = useState<Record<string, string>>({});

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
    if (searchTerm?.trim()) params.search = searchTerm.trim();
    if (location?.trim()) params.city = location.trim();
    if (selectedSpec) params.specialization = selectedSpec;
    if (showAvailability) params.isAvailableOnline = true;
    return params;
  }, [searchTerm, location, selectedSpec, showAvailability, page]);

  const userId = user?.id ?? (user as { _id?: string })?._id ?? null;
  const { data: vetsData, isLoading, error } = useVeterinarians(queryParams);
  const { data: specsData } = useSpecializations();
  const { data: favoritesData } = useFavorites(userId, { limit: 500 });
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  useEffect(() => {
    setFavoriteOverrides({});
    setFavoriteIdOverrides({});
  }, [favoritesData]);

  const veterinarians = useMemo(() => {
    const raw = (vetsData as { data?: { veterinarians?: unknown[] } })?.data;
    return raw?.veterinarians ?? [];
  }, [vetsData]) as Record<string, unknown>[];

  const pagination = useMemo(() => {
    const raw = (vetsData as { data?: { pagination?: { page?: number; limit?: number; total?: number; pages?: number } } })?.data;
    return raw?.pagination ?? { page: 1, limit: PAGE_SIZE, total: 0, pages: 0 };
  }, [vetsData]);

  const specializationsList = useMemo(() => {
    const raw = (specsData as { data?: unknown })?.data ?? specsData;
    const arr = Array.isArray(raw) ? raw : (raw as { data?: unknown[] })?.data ?? [];
    return Array.isArray(arr) ? arr : [];
  }, [specsData]) as { name?: string; slug?: string; type?: string }[];

  const specializationOptions = useMemo(() => {
    return specializationsList
      .map((spec) => {
        const derivedCodeFromName = spec?.name?.toUpperCase()?.replace(/\s+/g, '_');
        const derivedCodeFromSlug = spec?.slug?.toUpperCase()?.replace(/-/g, '_');
        const code = spec?.type || derivedCodeFromSlug || derivedCodeFromName;
        if (!code) return null;
        return { code, name: spec?.name || code };
      })
      .filter(Boolean) as { code: string; name: string }[];
  }, [specializationsList]);

  const favoriteVetIds = useMemo(() => {
    const raw = (favoritesData as { data?: { favorites?: { veterinarianId?: { _id?: string }; _id?: string }[] } })?.data;
    const list = raw?.favorites ?? [];
    return new Set(
      list
        .map((f) => {
          const v = f.veterinarianId;
          return v && (typeof v === 'object' ? (v as { _id?: string })._id : v);
        })
        .filter(Boolean)
        .map(String)
    );
  }, [favoritesData]);

  const favoriteIdByVetId = useMemo(() => {
    const raw = (favoritesData as { data?: { favorites?: { veterinarianId?: { _id?: string }; _id?: string }[] } })?.data;
    const list = raw?.favorites ?? [];
    const map: Record<string, string> = {};
    list.forEach((f) => {
      const v = f.veterinarianId;
      const vid = v && (typeof v === 'object' ? (v as { _id?: string })._id : v);
      if (vid && f._id) map[String(vid)] = f._id;
    });
    return map;
  }, [favoritesData]);

  const getVetName = (vet: Record<string, unknown>) =>
    (vet?.userId as { fullName?: string; name?: string })?.fullName ??
    (vet?.userId as { name?: string })?.name ??
    t('common.veterinarian');

  const getVetImage = (vet: Record<string, unknown>) =>
    getImageUrl((vet?.userId as { profileImage?: string })?.profileImage as string) ?? null;

  const getSpecialty = (vet: Record<string, unknown>) => {
    const specs = vet?.specializations as { type?: string; name?: string }[] | undefined;
    if (!Array.isArray(specs) || specs.length === 0) return t('petOwnerSearch.defaults.specialty');
    const first = specs[0];
    const name = first?.name ?? first?.type ?? t('petOwnerSearch.defaults.specialty');
    const code = first?.type ?? first?.name;
    const opt = specializationOptions.find((o) => o.code === code);
    return opt?.name ?? name;
  };

  const getLocation = (vet: Record<string, unknown>) => {
    const clinics = vet?.clinics as { city?: string; state?: string; country?: string }[] | undefined;
    if (Array.isArray(clinics) && clinics[0]) {
      const c = clinics[0];
      return [c.city, c.state, c.country].filter(Boolean).join(', ') || t('common.na');
    }
    return t('common.na');
  };

  const getFee = (vet: Record<string, unknown>) => {
    const f = vet?.consultationFees as { online?: number; clinic?: number } | undefined;
    if (!f) return 0;
    return f.online ?? f.clinic ?? 0;
  };

  const isAvailable = (vet: Record<string, unknown>) => vet?.isAvailableOnline !== false;
  const getRating = (vet: Record<string, unknown>) => Number(vet?.ratingAvg ?? 0);
  const getRatingCount = (vet: Record<string, unknown>) => Number(vet?.ratingCount ?? 0);

  const handleFavoriteToggle = (vetUserId: string) => {
    if (!user || (user as { role?: string }).role !== 'PET_OWNER') {
      Toast.show({ type: 'info', text1: t('petOwnerSearch.toasts.loginRequired') });
      return;
    }
    const idStr = String(vetUserId);
    const currentlyFav =
      favoriteOverrides[idStr] !== undefined ? favoriteOverrides[idStr] : favoriteVetIds.has(idStr);

    if (currentlyFav) {
      const favId = favoriteIdOverrides[idStr] ?? favoriteIdByVetId[idStr];
      if (favId) {
        setFavoriteOverrides((prev) => ({ ...prev, [idStr]: false }));
        removeFavorite.mutate(favId, {
          onSuccess: () => Toast.show({ type: 'success', text1: t('petOwnerSearch.toasts.removedFromFavorites') }),
          onError: (err: { response?: { data?: { message?: string }; message?: string }; message?: string }) => {
            setFavoriteOverrides((prev) => ({ ...prev, [idStr]: true }));
            Toast.show({
              type: 'error',
              text1:
                (err?.response?.data as { message?: string })?.message ??
                err?.message ??
                t('petOwnerSearch.errors.removeFavoriteFailed'),
            });
          },
        });
      }
    } else {
      setFavoriteOverrides((prev) => ({ ...prev, [idStr]: true }));
      addFavorite.mutate(vetUserId, {
        onSuccess: (res: { success: boolean; data?: { _id?: string } }) => {
          const createdId = res?.data?._id;
          if (createdId) setFavoriteIdOverrides((prev) => ({ ...prev, [idStr]: String(createdId) }));
          Toast.show({ type: 'success', text1: t('petOwnerSearch.toasts.addedToFavorites') });
        },
        onError: (err: { response?: { data?: { message?: string }; message?: string }; message?: string }) => {
          setFavoriteOverrides((prev) => ({ ...prev, [idStr]: false }));
          Toast.show({
            type: 'error',
            text1:
              (err?.response?.data as { message?: string })?.message ??
              err?.message ??
              t('petOwnerSearch.errors.addFavoriteFailed'),
          });
        },
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocation('');
    setSelectedSpec('');
    setShowAvailability(false);
    setPage(1);
  };

  const isFav = (vetUserId: string) => {
    const idStr = String(vetUserId);
    return favoriteOverrides[idStr] !== undefined ? favoriteOverrides[idStr] : favoriteVetIds.has(idStr);
  };

  return (
    <ScreenContainer padded scroll={false}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('petOwnerSearch.placeholders.searchByName')}
          placeholderTextColor={colors.textLight}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={t('petOwnerSearch.placeholders.city')}
          placeholderTextColor={colors.textLight}
          value={location}
          onChangeText={setLocation}
        />
      </View>
      <View style={styles.filtersRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specScroll}>
          <TouchableOpacity
            style={[styles.filterChip, !selectedSpec && styles.filterChipActive]}
            onPress={() => { setSelectedSpec(''); setPage(1); }}
          >
            <Text style={[styles.filterChipText, !selectedSpec && styles.filterChipTextActive]}>{t('common.all')}</Text>
          </TouchableOpacity>
          {specializationOptions.map((o) => (
            <TouchableOpacity
              key={o.code}
              style={[styles.filterChip, selectedSpec === o.code && styles.filterChipActive]}
              onPress={() => { setSelectedSpec(o.code); setPage(1); }}
            >
              <Text style={[styles.filterChipText, selectedSpec === o.code && styles.filterChipTextActive]}>{o.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={styles.availabilityRow}>
        <Text style={styles.availabilityLabel}>{t('petOwnerSearch.filters.onlineNow')}</Text>
        <Switch
          value={showAvailability}
          onValueChange={(v) => { setShowAvailability(v); setPage(1); }}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={showAvailability ? colors.primary : colors.textLight}
        />
      </View>
      <View style={styles.clearRow}>
        <TouchableOpacity onPress={clearFilters}>
          <Text style={styles.clearText}>{t('petOwnerSearch.actions.clearFilters')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.resultCount}>
        {t('petOwnerSearch.results.showing', { total: pagination.total })}
      </Text>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            {(error as Error)?.message ?? t('petOwnerSearch.errors.loadFailed')}
          </Text>
        </View>
      )}
      {isLoading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      {!isLoading && !error && veterinarians.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>{t('petOwnerSearch.empty')}</Text>
        </View>
      )}
      {!isLoading && !error && veterinarians.length > 0 && (
        <FlatList
          data={veterinarians}
          keyExtractor={(item) => String((item?.userId as { _id?: string })?._id ?? (item as { _id?: string })?._id ?? Math.random())}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: vet }) => {
            const vetUserId = (vet?.userId as { _id?: string })?._id ?? (vet as { _id?: string })?._id;
            const idStr = vetUserId ? String(vetUserId) : '';
            const fav = !!idStr && isFav(idStr);
            return (
              <Card style={styles.vetCard}>
                <View style={styles.vetRow}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('PetOwnerVetProfile', { vetId: idStr })}
                    style={styles.vetLeft}
                  >
                    <View style={styles.avatarWrap}>
                      {getVetImage(vet) ? (
                        <Image source={{ uri: getVetImage(vet)! }} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarLetter}>{getVetName(vet).charAt(0)}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.vetInfo}>
                      <Text style={styles.vetName}>{getVetName(vet)}</Text>
                      <Text style={styles.specialty}>{getSpecialty(vet)}</Text>
                      <View style={styles.ratingRow}>
                        {renderStars(getRating(vet))}
                        <Text style={styles.ratingCount}>({getRatingCount(vet)})</Text>
                      </View>
                      <Text style={styles.location} numberOfLines={1}>📍 {getLocation(vet)}</Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.vetRight}>
                    <TouchableOpacity
                      style={[styles.favBtn, fav && styles.favBtnActive]}
                      onPress={() => handleFavoriteToggle(idStr)}
                    >
                      <Text style={styles.favIcon}>{fav ? '♥' : '♡'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.fee}>€{getFee(vet)}</Text>
                    <Text style={[styles.avail, !isAvailable(vet) && styles.availNo]}>
                      {isAvailable(vet) ? t('petOwnerSearch.status.available') : t('petOwnerSearch.status.unavailable')}
                    </Text>
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        style={styles.viewProfileBtn}
                        onPress={() => navigation.navigate('PetOwnerVetProfile', { vetId: idStr })}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.viewProfileBtnText}>{t('petOwnerSearch.actions.viewProfile')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.bookBtnTouch}
                        onPress={() => navigation.navigate('PetOwnerBooking', { vetId: idStr })}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.bookBtnTouchText}>{t('petOwnerSearch.actions.book')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Card>
            );
          }}
        />
      )}

      {!isLoading && !error && (pagination.pages ?? 0) > 1 && (
        <View style={styles.pagination}>
          <Button
            title={t('petOwnerSearch.pagination.previous')}
            variant="outline"
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={styles.pageBtn}
          />
          <Text style={styles.pageText}>
            {t('petOwnerSearch.pagination.pageOf', { page: pagination.page, pages: pagination.pages })}
          </Text>
          <Button
            title={t('petOwnerSearch.pagination.next')}
            variant="outline"
            onPress={() => setPage((p) => p + 1)}
            disabled={page >= (pagination.pages ?? 1)}
            style={styles.pageBtn}
          />
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerMapBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMapBtnIcon: { fontSize: 18, color: colors.textInverse },
  searchRow: { flexDirection: 'row', gap: spacing.sm },
  searchInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
  filtersRow: { marginBottom: spacing.sm },
  specScroll: { flexDirection: 'row', gap: spacing.xs, paddingVertical: spacing.xs },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.backgroundTertiary,
  },
  filterChipActive: { backgroundColor: colors.primary },
  filterChipText: { ...typography.caption, color: colors.textSecondary },
  filterChipTextActive: { color: colors.textInverse, fontWeight: '600' },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  availabilityLabel: { ...typography.body, color: colors.text },
  clearRow: { marginBottom: spacing.md },
  clearText: { ...typography.caption, color: colors.primary, textDecorationLine: 'underline' },
  resultCount: { ...typography.body, marginBottom: spacing.sm, color: colors.textSecondary },
  resultCountNum: { fontWeight: '700', color: colors.text },
  errorBox: { padding: spacing.md, backgroundColor: colors.errorLight, borderRadius: 8, marginBottom: spacing.md },
  errorText: { ...typography.bodySmall, color: colors.error },
  loadingBox: { padding: spacing.xl, alignItems: 'center' },
  emptyBox: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.bodySmall, textAlign: 'center' },
  listContent: { paddingBottom: spacing.xl },
  vetCard: { marginBottom: spacing.md },
  vetRow: { flexDirection: 'row', alignItems: 'flex-start' },
  vetLeft: { flex: 1, flexDirection: 'row' },
  avatarWrap: { marginRight: spacing.sm },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { ...typography.h3, color: colors.primary },
  vetInfo: { flex: 1 },
  vetName: { ...typography.h3, marginBottom: 2 },
  specialty: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  star: { fontSize: 14, color: colors.secondaryDark },
  ratingCount: { ...typography.caption, color: colors.textLight, marginLeft: 4 },
  location: { ...typography.caption, color: colors.textSecondary },
  vetRight: { alignItems: 'flex-end', minWidth: 100 },
  favBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  favBtnActive: { backgroundColor: colors.errorLight },
  favIcon: { fontSize: 18, color: colors.error },
  fee: { ...typography.caption, fontWeight: '600', marginBottom: 2, color: colors.text },
  avail: { ...typography.caption, color: colors.success, marginBottom: spacing.sm },
  availNo: { color: colors.textLight },
  actionButtonsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs, flexWrap: 'nowrap' },
  viewProfileBtn: {
    flex: 1,
    minWidth: 90,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewProfileBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  bookBtnTouch: {
    flex: 1,
    minWidth: 72,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnTouchText: { fontSize: 14, fontWeight: '600', color: colors.textInverse },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  pageBtn: { minWidth: 80 },
  pageText: { ...typography.caption, color: colors.textSecondary },
});
