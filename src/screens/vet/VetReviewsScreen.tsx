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
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useVetReviews } from '../../queries/vetQueries';
import { getImageUrl } from '../../config/api';

function Stars({ n }: { n: number }) {
  return <Text style={styles.stars}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</Text>;
}

type ReviewItem = {
  _id: string;
  rating?: number;
  reviewText?: string;
  createdAt?: string;
  petOwnerId?: { name?: string; fullName?: string; profileImage?: string } | string;
  petId?: { name?: string; species?: string } | string;
  veterinarianReply?: string;
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function normalizeReviews(response: unknown): ReviewItem[] {
  const data = (response as { data?: { reviews?: ReviewItem[] }; reviews?: ReviewItem[] })?.data
    ?? (response as { reviews?: ReviewItem[] });
  const list = data?.reviews ?? [];
  return Array.isArray(list) ? list : [];
}

export function VetReviewsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');

  const { data: reviewsResponse, isLoading, error } = useVetReviews({ limit: 100 });
  const reviews = useMemo(() => normalizeReviews(reviewsResponse ?? {}), [reviewsResponse]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matchSearch = !q || reviews.some((r) => {
      const owner = typeof r.petOwnerId === 'object' ? (r.petOwnerId?.name ?? r.petOwnerId?.fullName) : '';
      const pet = typeof r.petId === 'object' ? r.petId?.name : '';
      return String(owner).toLowerCase().includes(q) || String(pet).toLowerCase().includes(q);
    });
    return reviews.filter((r) => {
      const matchSearchInner = !q ||
        String(typeof r.petOwnerId === 'object' ? (r.petOwnerId?.name ?? r.petOwnerId?.fullName) : '').toLowerCase().includes(q) ||
        String(typeof r.petId === 'object' ? r.petId?.name : '').toLowerCase().includes(q);
      const matchRating = filterRating === 'all' || (r.rating ?? 0) === filterRating;
      return matchSearchInner && matchRating;
    });
  }, [reviews, searchQuery, filterRating]);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length).toFixed(1)
    : '0';
  const ratingCounts = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: reviews.filter((r) => (r.rating ?? 0) === n).length,
  }));

  const ownerName = (r: ReviewItem) =>
    typeof r.petOwnerId === 'object' ? (r.petOwnerId?.fullName ?? r.petOwnerId?.name ?? 'Pet owner') : 'Pet owner';
  const petName = (r: ReviewItem) =>
    typeof r.petId === 'object' ? (r.petId?.name ?? 'Pet') : 'Pet';

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
        <Text style={styles.errorText}>{(error as { message?: string })?.message ?? 'Failed to load reviews'}</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded>
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by owner or pet..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.avgRating}>{avgRating}</Text>
          <View>
            <Stars n={Math.round(parseFloat(avgRating))} />
            <Text style={styles.reviewCount}>{reviews.length} reviews</Text>
          </View>
        </View>
        {ratingCounts.map(({ n, count }) => (
          <TouchableOpacity
            key={n}
            style={styles.ratingRow}
            onPress={() => setFilterRating(filterRating === n ? 'all' : n)}
          >
            <Text style={styles.ratingLabel}>{n} star</Text>
            <View style={[styles.ratingBarBg, count === 0 && styles.ratingBarEmpty]}>
              <View
                style={[
                  styles.ratingBarFill,
                  { width: `${reviews.length ? (count / reviews.length) * 100 : 0}%` },
                ]}
              />
            </View>
            <Text style={styles.ratingCount}>{count}</Text>
          </TouchableOpacity>
        ))}
      </Card>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterRating === 'all' && styles.filterChipActive]}
          onPress={() => setFilterRating('all')}
        >
          <Text style={[styles.filterChipText, filterRating === 'all' && styles.filterChipTextActive]}>All</Text>
        </TouchableOpacity>
        {[5, 4, 3, 2, 1].map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.filterChip, filterRating === n && styles.filterChipActive]}
            onPress={() => setFilterRating(n)}
          >
            <Text style={[styles.filterChipText, filterRating === n && styles.filterChipTextActive]}>{n} ★</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item._id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const ownerObj = typeof item.petOwnerId === 'object' ? item.petOwnerId : null;
          const imageUri = ownerObj?.profileImage ? getImageUrl(ownerObj.profileImage) : null;
          return (
          <Card style={styles.card}>
            <View style={styles.reviewRow}>
              <View style={styles.avatarWrap}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{ownerName(item).charAt(0)}</Text>
                  </View>
                )}
              </View>
              <View style={styles.reviewBody}>
                <View style={styles.reviewTop}>
                  <Stars n={item.rating ?? 0} />
                  <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                </View>
                <Text style={styles.owner}>{ownerName(item)}</Text>
                <Text style={styles.petName}>Pet: {petName(item)}</Text>
                <Text style={styles.comment}>{item.reviewText || '—'}</Text>
                {item.veterinarianReply ? (
                  <Text style={styles.repliedBadge}>✓ Replied</Text>
                ) : (
                  <Button title="Reply" variant="outline" onPress={() => {}} style={styles.replyBtn} />
                )}
              </View>
            </View>
          </Card>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No reviews match</Text>
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
  summaryCard: { marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  avgRating: { ...typography.h1, color: colors.primary },
  reviewCount: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingLabel: { ...typography.caption, width: 48 },
  ratingBarBg: { flex: 1, height: 8, backgroundColor: colors.backgroundTertiary, borderRadius: 4, overflow: 'hidden' },
  ratingBarEmpty: { opacity: 0.5 },
  ratingBarFill: { height: '100%', backgroundColor: colors.secondaryDark, borderRadius: 4 },
  ratingCount: { ...typography.caption, width: 24, textAlign: 'right' },
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 20, backgroundColor: colors.backgroundTertiary },
  filterChipActive: { backgroundColor: colors.primary },
  filterChipText: { ...typography.label, color: colors.textSecondary },
  filterChipTextActive: { color: colors.textInverse },
  list: { paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.sm },
  reviewRow: { flexDirection: 'row', alignItems: 'flex-start' },
  avatarWrap: { marginRight: spacing.md },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight + '40', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 48, height: 48, borderRadius: 24 },
  avatarText: { ...typography.h3, color: colors.primary },
  reviewBody: { flex: 1, minWidth: 0 },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  stars: { color: colors.secondaryDark, fontSize: 18 },
  date: { ...typography.caption, color: colors.textSecondary },
  owner: { ...typography.label },
  petName: { ...typography.caption, color: colors.textSecondary },
  comment: { ...typography.body, marginTop: 4 },
  repliedBadge: { ...typography.caption, color: colors.success, marginTop: spacing.sm },
  replyBtn: { marginTop: spacing.sm },
  empty: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
});
