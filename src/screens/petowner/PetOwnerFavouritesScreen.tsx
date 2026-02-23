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

function renderStars(rating: number) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(<Text key={i} style={starStyle.star}>{i <= (rating || 0) ? '★' : '☆'}</Text>);
  }
  return stars;
}

const starStyle = StyleSheet.create({
  star: { fontSize: 14, color: colors.secondaryDark },
});

export function PetOwnerFavouritesScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
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
      const name = userObj?.fullName ?? userObj?.name ?? 'Veterinarian';
      const image = getImageUrl(userObj?.profileImage) ?? null;
      const speciality = (profile?.specializations as { name?: string }[])?.[0]?.name ?? 'Veterinary';
      const clinics = (profile?.clinics ?? []) as { address?: string; city?: string; state?: string; country?: string }[];
      const firstClinic = clinics[0];
      const location = firstClinic
        ? ([firstClinic.address, firstClinic.city, firstClinic.state, firstClinic.country].filter(Boolean).join(', ') || '—')
        : '—';
      const rating = Number(profile?.ratingAvg ?? 0);
      const fees = profile?.consultationFees as { online?: number; clinic?: number } | undefined;
      const fee = fees?.online ?? fees?.clinic ?? 0;
      const available = (profile as { isAvailableOnline?: boolean })?.isAvailableOnline !== false;
      return { ...fav, vetUserId, name, image, speciality, location, rating, fee, available };
    });
  }, [favorites, vetProfileByUserId]);

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
      onSuccess: () => Toast.show({ type: 'success', text1: 'Removed from favorites' }),
      onError: (err: { response?: { data?: { message?: string } }; message?: string }) =>
        Toast.show({ type: 'error', text1: (err?.response?.data as { message?: string })?.message ?? err?.message ?? 'Failed to remove' }),
    });
  };

  return (
    <ScreenContainer padded>
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search favourites..."
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
          <Text style={styles.emptyText}>Failed to load favorites.</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>♥</Text>
          <Text style={styles.emptyTitle}>No favourites yet</Text>
          <Text style={styles.emptyText}>Add veterinarians from the search page to see them here.</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate('PetOwnerSearch')}>
            <Text style={styles.browseButtonText}>Find Veterinarians</Text>
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
              <TouchableOpacity style={styles.favouriteButton} onPress={() => handleRemove(item._id)}>
                <Text style={styles.favouriteIcon}>♥</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.vetInfo} onPress={() => navigation.navigate('PetOwnerVetProfile', { vetId: item.vetUserId ?? '' })}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.name?.charAt(0) ?? 'V'}</Text>
                  </View>
                )}
                <View style={styles.vetDetails}>
                  <View style={styles.nameRow}>
                    <Text style={styles.vetName}>{item.name}</Text>
                    <Text style={styles.verified}>✓</Text>
                  </View>
                  <Text style={styles.speciality}>{item.speciality}</Text>
                  <View style={styles.ratingRow}>
                    <View style={styles.stars}>{renderStars(item.rating)}</View>
                    <Text style={styles.ratingText}>{Number(item.rating).toFixed(1)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>📍</Text>
                    <Text style={styles.infoText}>{item.location ?? '—'}</Text>
                  </View>
                  {typeof (item as { fee?: number }).fee === 'number' && (item as { fee?: number }).fee > 0 ? (
                    <Text style={styles.feeText}>€{(item as { fee: number }).fee} consultation</Text>
                  ) : null}
                  <Text style={[styles.availText, (item as { available?: boolean }).available === false && styles.availNo]}>
                    {(item as { available?: boolean }).available !== false ? 'Available' : 'Unavailable'}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.viewProfileButton} onPress={() => navigation.navigate('PetOwnerVetProfile', { vetId: item.vetUserId ?? '' })}>
                  <Text style={styles.viewProfileButtonText}>View profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bookButton} onPress={() => navigation.navigate('PetOwnerBooking', { vetId: item.vetUserId ?? '' })}>
                  <Text style={styles.bookButtonText}>Book now</Text>
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
    marginBottom: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { marginRight: 8, fontSize: 18 },
  searchInput: { flex: 1, marginLeft: 0, fontSize: 14, color: colors.text, padding: 0 },
  listContent: { paddingBottom: spacing.xxl },
  favouriteCard: {
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  favouriteButton: { position: 'absolute', top: spacing.sm, right: spacing.sm, zIndex: 1, padding: 4 },
  favouriteIcon: { fontSize: 20, color: colors.error },
  vetInfo: { flexDirection: 'row', marginBottom: spacing.sm },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: spacing.sm,
    backgroundColor: colors.primaryLight + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: 80, height: 80, borderRadius: 40, marginRight: spacing.sm },
  avatarText: { ...typography.h2, color: colors.primary },
  vetDetails: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  vetName: { fontSize: 18, fontWeight: '600', color: colors.text, marginRight: 6 },
  verified: { fontSize: 16, color: colors.success },
  speciality: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stars: { flexDirection: 'row', marginRight: 6 },
  ratingText: { fontSize: 14, color: colors.textSecondary },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  infoIcon: { marginRight: 4 },
  infoText: { fontSize: 13, color: colors.textSecondary },
  feeText: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 4 },
  availText: { fontSize: 12, color: colors.success, marginTop: 2 },
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
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewProfileButtonText: { fontSize: 14, fontWeight: '600', color: colors.text },
  bookButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: { fontSize: 14, fontWeight: '600', color: colors.textInverse },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, color: colors.textLight, marginBottom: spacing.sm },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 },
  browseButton: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  browseButtonText: { fontSize: 16, fontWeight: '600', color: colors.textInverse },
});
