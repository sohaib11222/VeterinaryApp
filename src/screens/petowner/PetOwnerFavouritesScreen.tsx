import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { getImageUrl } from '../../config/api';
import { useFavorites } from '../../queries/favoriteQueries';
import { useRemoveFavorite } from '../../mutations/favoriteMutations';
import { useQueries } from '@tanstack/react-query';
import { api } from '../../api/api';
import { API_ROUTES } from '../../api/apiConfig';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

function renderStars(rating: number) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(<Ionicons key={i} name={i <= (rating || 0) ? 'star' : 'star-outline'} size={14} color={colors.secondaryDark} />);
  }
  return stars;
}

export function PetOwnerFavouritesScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const userId = (user as { id?: string })?.id ?? (user as { _id?: string })?._id ?? null;

  const { data: favoritesData, isLoading, error } = useFavorites(userId, { limit: 500 });
  const removeFavorite = useRemoveFavorite();

  const favorites = useMemo(() => {
    const raw = (favoritesData as { data?: { favorites?: unknown[] } })?.data;
    return raw?.favorites ?? [];
  }, [favoritesData]) as { _id: string; veterinarianId?: { _id?: string } | string }[];

  const vetUserIds = useMemo(() => {
    return favorites
      .map((f) => {
        const v = f.veterinarianId;
        return v && (typeof v === 'object' ? (v as { _id?: string })._id : v);
      })
      .filter(Boolean) as string[];
  }, [favorites]);

  const vetQueries = useQueries({
    queries: vetUserIds.map((vetUserId) => ({
      queryKey: ['veterinarian', 'public', vetUserId],
      queryFn: () => api.get(API_ROUTES.VETERINARIANS.PUBLIC_PROFILE(vetUserId)),
      enabled: !!vetUserId,
    })),
  });

  const vetProfileByUserId = useMemo(() => {
    const map: Record<string, Record<string, unknown>> = {};
    vetQueries.forEach((q, i) => {
      const uid = vetUserIds[i];
      if (!uid) return;
      const data = (q.data as { data?: unknown })?.data ?? q.data;
      if (data) map[String(uid)] = data as Record<string, unknown>;
    });
    return map;
  }, [vetQueries, vetUserIds]);

  const favoritesWithDetails = useMemo(() => {
    return favorites.map((fav) => {
      const vetUser = fav.veterinarianId;
      const vetUserId = vetUser && (typeof vetUser === 'object' ? (vetUser as { _id?: string })._id : vetUser);
      const profile = vetUserId ? vetProfileByUserId[String(vetUserId)] : null;
      const userObj = (profile?.userId ?? vetUser) as { fullName?: string; name?: string; profileImage?: string };
      const name = userObj?.fullName ?? userObj?.name ?? t('common.veterinarian');
      const image = getImageUrl(userObj?.profileImage) ?? null;
      const speciality = (profile?.specializations as { name?: string }[])?.[0]?.name ?? t('petOwnerFavourites.defaults.specialty');
      const clinics = (profile?.clinics ?? []) as { address?: string; city?: string; state?: string; country?: string }[];
      const firstClinic = clinics[0];
      const location = firstClinic
        ? ([firstClinic.address, firstClinic.city, firstClinic.state, firstClinic.country].filter(Boolean).join(', ') || t('common.na'))
        : t('common.na');
      const rating = Number(profile?.ratingAvg ?? 0);
      const fees = profile?.consultationFees as { online?: number; clinic?: number } | undefined;
      const fee = fees?.online ?? fees?.clinic ?? 0;
      const available = (profile as { isAvailableOnline?: boolean })?.isAvailableOnline !== false;
      return { ...fav, vetUserId, name, image, speciality, location, rating, fee, available };
    });
  }, [favorites, vetProfileByUserId, t]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return favoritesWithDetails;
    const q = searchQuery.toLowerCase();
    return favoritesWithDetails.filter(
      (f) =>
        (f.name || '').toLowerCase().includes(q) ||
        (f.speciality || '').toLowerCase().includes(q) ||
        (f.location || '').toLowerCase().includes(q)
    );
  }, [favoritesWithDetails, searchQuery]);

  const handleRemove = (favoriteId: string) => {
    removeFavorite.mutate(favoriteId, {
      onSuccess: () => Toast.show({ type: 'success', text1: t('petOwnerFavourites.toasts.removedFromFavorites') }),
      onError: (err: { response?: { data?: { message?: string } }; message?: string }) =>
        Toast.show({
          type: 'error',
          text1: (err?.response?.data as { message?: string })?.message ?? err?.message ?? t('petOwnerFavourites.errors.removeFailed'),
        }),
    });
  };

  return (
    <ScreenContainer padded>
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="heart" size={21} color={colors.error} /></View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>{t('menu.favoriteVets')}</Text>
          <Text style={styles.heroText}>{t('petOwnerFavourites.empty.subtitle')}</Text>
        </View>
        <View style={styles.heroCount}><Text style={styles.heroCountText}>{filtered.length}</Text></View>
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={19} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('petOwnerFavourites.searchPlaceholder')}
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('petOwnerFavourites.errors.loadFailed')}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}><Ionicons name="heart-outline" size={36} color={colors.primary} /></View>
          <Text style={styles.emptyTitle}>{t('petOwnerFavourites.empty.title')}</Text>
          <Text style={styles.emptyText}>{t('petOwnerFavourites.empty.subtitle')}</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate('PetOwnerSearch')}>
            <Text style={styles.browseButtonText}>{t('petOwnerBooking.actions.findVeterinarians')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.favouriteCard}>
              <TouchableOpacity style={styles.favouriteButton} onPress={() => handleRemove(item._id)} accessibilityRole="button">
                <Ionicons name="heart" size={20} color={colors.error} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.vetInfo} onPress={() => navigation.navigate('PetOwnerVetProfile', { vetId: item.vetUserId ?? '' })}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name?.charAt(0) ?? t('petOwnerFavourites.defaults.vetAvatarLetter')}</Text>
                  </View>
                )}
                <View style={styles.vetDetails}>
                  <View style={styles.nameRow}>
                    <Text style={styles.vetName}>{item.name}</Text>
                    <Ionicons name="checkmark-circle" size={17} color={colors.primary} />
                  </View>
                  <Text style={styles.speciality}>{item.speciality}</Text>
                  <View style={styles.ratingRow}>
                    <View style={styles.stars}>{renderStars(item.rating)}</View>
                    <Text style={styles.ratingText}>{Number(item.rating).toFixed(1)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={15} color={colors.textSecondary} style={styles.infoIcon} />
                    <Text style={styles.infoText}>{item.location ?? t('common.na')}</Text>
                  </View>
                  {(() => {
                    const fee = (item as { fee?: number }).fee;
                    return typeof fee === 'number' && fee > 0 ? (
                      <Text style={styles.feeText}>{t('petOwnerFavourites.feeConsultation', { amount: fee })}</Text>
                    ) : null;
                  })()}
                  <Text style={[styles.availText, (item as { available?: boolean }).available === false && styles.availNo]}>
                    {(item as { available?: boolean }).available !== false ? t('petOwnerSearch.status.available') : t('petOwnerSearch.status.unavailable')}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.viewProfileButton} onPress={() => navigation.navigate('PetOwnerVetProfile', { vetId: item.vetUserId ?? '' })}>
                  <Text style={styles.viewProfileButtonText}>{t('petOwnerSearch.actions.viewProfile')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bookButton} onPress={() => navigation.navigate('PetOwnerBooking', { vetId: item.vetUserId ?? '' })}>
                  <Text style={styles.bookButtonText}>{t('petOwnerFavourites.actions.bookNow')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hero: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.errorLight + 'A6', borderWidth: 1, borderColor: colors.error + '1D', borderRadius: 18, padding: spacing.md, marginBottom: spacing.md },
  heroIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, marginRight: spacing.sm },
  heroCopy: { flex: 1, minWidth: 0 },
  heroTitle: { ...typography.h3, color: colors.text },
  heroText: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  heroCount: { minWidth: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.error },
  heroCountText: { ...typography.label, color: colors.textInverse },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, marginLeft: 0, fontSize: 14, color: colors.text, padding: 0 },
  listContent: { paddingBottom: spacing.xxl },
  favouriteCard: {
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  favouriteButton: { position: 'absolute', top: spacing.md, right: spacing.md, zIndex: 1, width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.errorLight + 'B5' },
  vetInfo: { flexDirection: 'row', marginBottom: spacing.md, paddingRight: spacing.xl },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginRight: spacing.md,
    backgroundColor: colors.primaryLight + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: 72, height: 72, borderRadius: 18, marginRight: spacing.md },
  avatarText: { ...typography.h2, color: colors.primary },
  vetDetails: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  vetName: { fontSize: 17, fontWeight: '700', color: colors.text, marginRight: 6 },
  speciality: { fontSize: 13, color: colors.primary, fontWeight: '600', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stars: { flexDirection: 'row', marginRight: 6 },
  ratingText: { fontSize: 14, color: colors.textSecondary },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  infoIcon: { marginRight: 4 },
  infoText: { fontSize: 13, color: colors.textSecondary },
  feeText: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 4 },
  availText: { alignSelf: 'flex-start', fontSize: 11, color: colors.primaryDark, fontWeight: '700', marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: colors.successLight },
  availNo: { color: colors.textLight },
  addedOn: { fontSize: 12, color: colors.textLight, marginTop: 8 },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  viewProfileButton: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    minHeight: 42,
    justifyContent: 'center',
    borderRadius: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewProfileButtonText: { fontSize: 14, fontWeight: '600', color: colors.text },
  bookButton: {
    flex: 1,
    backgroundColor: colors.primary,
    minHeight: 42,
    justifyContent: 'center',
    borderRadius: 11,
    alignItems: 'center',
  },
  bookButtonText: { fontSize: 14, fontWeight: '600', color: colors.textInverse },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '18', marginBottom: spacing.md },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  browseButton: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  browseButtonText: { fontSize: 16, fontWeight: '600', color: colors.textInverse },
});
