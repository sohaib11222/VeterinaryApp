import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { getImageUrl } from '../../config/api';
import { PetOwnerStackParamList } from '../../navigation/types';
import { useVeterinarianPublicProfile } from '../../queries/veterinarianQueries';
import { useReviewsByVeterinarian } from '../../queries/reviewQueries';
import { useFavorites } from '../../queries/favoriteQueries';
import { useAddFavorite, useRemoveFavorite } from '../../mutations/favoriteMutations';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

type Route = RouteProp<PetOwnerStackParamList, 'PetOwnerVetProfile'>;

function renderStars(rating: number) {
  const r = Number(rating) || 0;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(<Text key={i} style={styles.star}>{i <= r ? '★' : '☆'}</Text>);
  }
  return stars;
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

export function PetOwnerVetProfileScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { t } = useTranslation();
  const vetId = route.params?.vetId ?? '';

  const { data: profileRes, isLoading } = useVeterinarianPublicProfile(vetId);
  const { data: reviewsRes } = useReviewsByVeterinarian(vetId);
  const userId = (user as { id?: string })?.id ?? (user as { _id?: string })?._id ?? null;
  const { data: favoritesData } = useFavorites(userId, { limit: 500 });
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const profile = useMemo(() => {
    const raw = (profileRes as { data?: unknown })?.data ?? profileRes;
    return raw as Record<string, unknown> | null;
  }, [profileRes]);

  const reviewsPayload = useMemo(() => (reviewsRes as { data?: unknown })?.data ?? reviewsRes, [reviewsRes]) as { reviews?: Record<string, unknown>[]; pagination?: { total?: number } } | null;
  const reviews = reviewsPayload?.reviews ?? [];
  const reviewCount = reviewsPayload?.pagination?.total ?? Number(profile?.ratingCount ?? 0);

  const favoriteVetIds = useMemo(() => {
    const raw = (favoritesData as { data?: { favorites?: { veterinarianId?: { _id?: string } }[] } })?.data;
    const list = raw?.favorites ?? [];
    return new Set(list.map((f) => (f.veterinarianId && (typeof f.veterinarianId === 'object' ? (f.veterinarianId as { _id?: string })._id : f.veterinarianId))).filter(Boolean).map(String));
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

  const vetUserId = (profile?.userId as { _id?: string })?._id ?? vetId;
  const isFavorited = vetUserId ? favoriteVetIds.has(String(vetUserId)) : false;

  const name = profile?.userId
    ? (profile.userId as { fullName?: string; name?: string }).fullName ?? (profile.userId as { name?: string }).name ?? t('common.veterinarian')
    : t('common.veterinarian');
  const image = getImageUrl((profile?.userId as { profileImage?: string })?.profileImage as string);
  const title = (profile?.title as string) ?? t('petOwnerVetProfile.defaults.title');
  const email = (profile?.userId as { email?: string })?.email;
  const phone = (profile?.userId as { phone?: string })?.phone;
  const specializations = (profile?.specializations ?? []) as { name?: string; type?: string }[];
  const specialtyName = specializations[0]
    ? (typeof specializations[0] === 'object' ? specializations[0].name ?? specializations[0].type : specializations[0])
    : t('petOwnerVetProfile.defaults.specialty');
  const rating = Number(profile?.ratingAvg ?? 0);
  const ratingCountNum = Number(profile?.ratingCount ?? 0);
  const fees = profile?.consultationFees as { online?: number; clinic?: number } | undefined;
  const feeOnline = fees?.online ?? 0;
  const feeClinic = fees?.clinic ?? 0;
  const available = profile?.isAvailableOnline !== false;
  const clinics = (profile?.clinics ?? []) as { name?: string; address?: string; city?: string; state?: string; country?: string; phone?: string }[];
  const firstClinic = clinics[0];
  const locationParts = firstClinic ? [firstClinic.address, firstClinic.city, firstClinic.state, firstClinic.country].filter(Boolean) : [];
  const location = locationParts.length ? locationParts.join(', ') : t('common.na');

  const biography = (profile?.biography as string) ?? '';
  const experience = (profile?.experience ?? []) as { hospital?: string; designation?: string; fromYear?: string; toYear?: string }[];
  const education = (profile?.education ?? []) as { degree?: string; college?: string; year?: string }[];
  const awards = (profile?.awards ?? []) as { title?: string; year?: string }[];
  const services = (profile?.services ?? []) as { name?: string; price?: number }[];
  const memberships = (profile?.memberships ?? []) as { name?: string }[];

  const experienceYears = useMemo(() => {
    const y = Number((profile?.experienceYears as number) ?? 0);
    if (y > 0) return y;
    if (!experience.length) return 0;
    const currentYear = new Date().getFullYear();
    const years = experience.map((e) => parseInt(String(e?.fromYear), 10)).filter((n) => !Number.isNaN(n));
    if (!years.length) return 0;
    return Math.max(0, currentYear - Math.min(...years));
  }, [profile?.experienceYears, experience]);

  const recommendPercent = useMemo(() => (rating >= 4.5 ? 94 : rating >= 4 ? 85 : rating >= 3.5 ? 75 : 60), [rating]);

  const handleFavoriteToggle = () => {
    if (!user || (user as { role?: string }).role !== 'PET_OWNER') {
      Toast.show({ type: 'info', text1: t('petOwnerVetProfile.toasts.loginRequired') });
      return;
    }
    const idStr = String(vetUserId);
    if (isFavorited) {
      const favId = favoriteIdByVetId[idStr];
      if (favId) {
        removeFavorite.mutate(favId, {
          onSuccess: () => Toast.show({ type: 'success', text1: t('petOwnerVetProfile.toasts.removedFromFavorites') }),
          onError: (err: unknown) =>
            Toast.show({
              type: 'error',
              text1: (err as { message?: string })?.message ?? t('petOwnerVetProfile.errors.removeFavoriteFailed'),
            }),
        });
      }
    } else {
      addFavorite.mutate(vetUserId, {
        onSuccess: () => Toast.show({ type: 'success', text1: t('petOwnerVetProfile.toasts.addedToFavorites') }),
        onError: (err: unknown) =>
          Toast.show({
            type: 'error',
            text1: (err as { message?: string })?.message ?? t('petOwnerVetProfile.errors.addFavoriteFailed'),
          }),
      });
    }
  };

  if (isLoading || !profile) {
    return (
      <ScreenContainer padded>
        <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Card>
          <View style={styles.header}>
            {image ? <Image source={{ uri: image }} style={styles.avatar} /> : (
              <View style={styles.avatarPlaceholder}><Text style={styles.avatarLetter}>{name.charAt(0)}</Text></View>
            )}
            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{name}</Text>
                <TouchableOpacity style={[styles.favBtn, isFavorited && styles.favBtnActive]} onPress={handleFavoriteToggle}>
                  <Text style={styles.favIcon}>{isFavorited ? '♥' : '♡'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.specialty}>{specialtyName}</Text>
              <Text style={styles.title}>{title}</Text>
              <View style={styles.ratingRow}>{renderStars(rating)}<Text style={styles.ratingCount}>({ratingCountNum})</Text></View>
              <Text style={[styles.avail, !available && styles.availNo]}>
                {available ? t('petOwnerVetProfile.status.available') : t('petOwnerVetProfile.status.unavailable')}
              </Text>
              <Text style={styles.location}>📍 {location}</Text>
              {email ? <Text style={styles.contact} onPress={() => Linking.openURL(`mailto:${email}`)}>✉ {email}</Text> : null}
              {phone ? <Text style={styles.contact} onPress={() => Linking.openURL(`tel:${phone}`)}>📞 {phone}</Text> : null}
            </View>
          </View>
          <View style={styles.feesRow}>
            <Text style={styles.feeLabel}>{t('petOwnerVetProfile.fees.online', { amount: feeOnline })}</Text>
            <Text style={styles.feeLabel}>{t('petOwnerVetProfile.fees.clinic', { amount: feeClinic })}</Text>
          </View>
        </Card>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{reviewCount > 0 ? `${reviewCount}+` : '0'}</Text>
            <Text style={styles.statLabel}>{t('petOwnerVetProfile.stats.reviews')}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{experienceYears}</Text>
            <Text style={styles.statLabel}>{t('petOwnerVetProfile.stats.yearsExperience')}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{recommendPercent}%</Text>
            <Text style={styles.statLabel}>{t('petOwnerVetProfile.stats.recommend')}</Text>
          </View>
        </View>

        {biography ? (
          <Card>
            <SectionTitle title={t('petOwnerVetProfile.sections.bio')} />
            <Text style={styles.bodyText}>{biography}</Text>
          </Card>
        ) : null}

        {services.length > 0 && (
          <Card>
            <SectionTitle title={t('petOwnerVetProfile.sections.services')} />
            {services.slice(0, 5).map((s, idx) => (
              <View key={idx} style={styles.serviceRow}>
                <Text style={styles.serviceName}>{s?.name ?? t('petOwnerVetProfile.defaults.service')}</Text>
                <Text style={styles.servicePrice}>{s?.price != null ? `€${s.price}` : t('common.na')}</Text>
              </View>
            ))}
          </Card>
        )}

        {experience.length > 0 && (
          <Card>
            <SectionTitle title={t('petOwnerVetProfile.sections.experience')} />
            {experience.map((exp, idx) => (
              <View key={idx} style={styles.expItem}>
                <Text style={styles.expTitle}>{exp?.hospital ?? t('petOwnerVetProfile.defaults.hospital')}</Text>
                {exp?.designation ? <Text style={styles.expSub}>{exp.designation}</Text> : null}
                <Text style={styles.expDates}>
                  {exp?.fromYear && exp?.toYear
                    ? `${exp.fromYear} - ${exp.toYear}`
                    : exp?.fromYear
                      ? t('petOwnerVetProfile.since', { year: exp.fromYear })
                      : t('common.na')}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {education.length > 0 && (
          <Card>
            <SectionTitle title={t('petOwnerVetProfile.sections.education')} />
            {education.map((edu, idx) => (
              <View key={idx} style={styles.expItem}>
                <Text style={styles.expTitle}>{edu?.degree ?? t('petOwnerVetProfile.defaults.degree')}</Text>
                {edu?.college ? <Text style={styles.expSub}>{edu.college}</Text> : null}
                {edu?.year ? <Text style={styles.expDates}>{edu.year}</Text> : null}
              </View>
            ))}
          </Card>
        )}

        {awards.length > 0 && (
          <Card>
            <SectionTitle title={t('petOwnerVetProfile.sections.awards')} />
            {awards.map((a, idx) => (
              <View key={idx} style={styles.expItem}>
                <Text style={styles.expTitle}>{a?.title ?? t('petOwnerVetProfile.defaults.award')}</Text>
                {a?.year ? <Text style={styles.expDates}>{a.year}</Text> : null}
              </View>
            ))}
          </Card>
        )}

        {specializations.length > 0 && (
          <Card>
            <SectionTitle title={t('petOwnerVetProfile.sections.speciality')} />
            {specializations.map((s, idx) => (
              <Text key={idx} style={styles.bodyText}>{typeof s === 'object' ? (s?.name ?? s?.type) : s}</Text>
            ))}
          </Card>
        )}

        {clinics.length > 0 && (
          <Card>
            <SectionTitle title={t('petOwnerVetProfile.sections.clinics')} />
            {clinics.map((c, idx) => (
              <View key={idx} style={styles.clinicItem}>
                <Text style={styles.expTitle}>{c?.name ?? t('petOwnerVetProfile.defaults.clinic')}</Text>
                <Text style={styles.expSub}>{[c?.address, c?.city, c?.state, c?.country].filter(Boolean).join(', ') || t('common.na')}</Text>
                {c?.phone ? <Text style={styles.contact} onPress={() => Linking.openURL(`tel:${c.phone}`)}>📞 {c.phone}</Text> : null}
              </View>
            ))}
          </Card>
        )}

        {memberships.length > 0 && (
          <Card>
            <SectionTitle title={t('petOwnerVetProfile.sections.memberships')} />
            {memberships.map((m, idx) => (
              <Text key={idx} style={styles.bodyText}>• {m?.name ?? t('common.na')}</Text>
            ))}
          </Card>
        )}

        <Card>
          <SectionTitle title={t('petOwnerVetProfile.sections.reviews')} />
          {reviews.length === 0 ? (
            <Text style={styles.muted}>{t('petOwnerVetProfile.reviews.empty')}</Text>
          ) : (
            reviews.map((r) => {
              const reviewer = r?.petOwnerId as { fullName?: string; name?: string; profileImage?: string } | undefined;
              const reviewerName = reviewer?.fullName ?? reviewer?.name ?? t('common.petOwner');
              const reviewerImage = getImageUrl(reviewer?.profileImage as string);
              return (
                <View key={String(r._id)} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    {reviewerImage ? <Image source={{ uri: reviewerImage }} style={styles.reviewAvatar} /> : <View style={styles.reviewAvatarPlaceholder}><Text style={styles.reviewAvatarLetter}>{reviewerName.charAt(0)}</Text></View>}
                    <View style={styles.reviewMeta}>
                      <Text style={styles.reviewerName}>{reviewerName}</Text>
                      <View style={styles.ratingRow}>{renderStars(Number(r?.rating ?? 0))}</View>
                    </View>
                  </View>
                  {r?.reviewText ? <Text style={styles.reviewText}>{String(r.reviewText)}</Text> : null}
                </View>
              );
            })
          )}
        </Card>

        <Button title={t('petOwnerVetProfile.actions.bookAppointment')} onPress={() => navigation.navigate('PetOwnerBooking', { vetId })} style={styles.bookBtn} />
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: { padding: spacing.xl, alignItems: 'center' },
  scrollContent: { paddingBottom: spacing.xl },
  header: { flexDirection: 'row', marginBottom: spacing.md },
  avatar: { width: 96, height: 96, borderRadius: 48, marginRight: spacing.md },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarLetter: { ...typography.h2, color: colors.primary },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  name: { ...typography.h2, flex: 1 },
  favBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.backgroundTertiary, alignItems: 'center', justifyContent: 'center' },
  favBtnActive: { backgroundColor: colors.errorLight },
  favIcon: { fontSize: 20, color: colors.error },
  specialty: { ...typography.body, color: colors.textSecondary, marginBottom: 2 },
  title: { ...typography.caption, color: colors.textLight, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  star: { fontSize: 16, color: colors.secondaryDark },
  ratingCount: { ...typography.caption, color: colors.textLight, marginLeft: 4 },
  avail: { ...typography.caption, color: colors.success, marginBottom: 2 },
  availNo: { color: colors.textLight },
  location: { ...typography.caption, color: colors.textSecondary, marginBottom: 2 },
  contact: { ...typography.caption, color: colors.primary, marginBottom: 2 },
  feesRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  feeLabel: { ...typography.body, fontWeight: '600' },
  bookBtn: { marginTop: spacing.lg },
  bottomSpacer: { height: spacing.xl },
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  bodyText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs },
  muted: { ...typography.body, color: colors.textLight },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statBox: { flex: 1, backgroundColor: colors.backgroundTertiary, borderRadius: 12, padding: spacing.sm, alignItems: 'center' },
  statValue: { ...typography.h3 },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  serviceName: { ...typography.body },
  servicePrice: { ...typography.body, fontWeight: '600' },
  expItem: { marginBottom: spacing.sm },
  expTitle: { ...typography.body, fontWeight: '600' },
  expSub: { ...typography.caption, color: colors.textSecondary },
  expDates: { ...typography.caption, color: colors.textLight },
  clinicItem: { marginBottom: spacing.sm },
  reviewItem: { marginBottom: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  reviewHeader: { flexDirection: 'row', marginBottom: spacing.xs },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: spacing.sm },
  reviewAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  reviewAvatarLetter: { ...typography.caption, color: colors.primary },
  reviewMeta: { flex: 1 },
  reviewerName: { ...typography.body, fontWeight: '600' },
  reviewText: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
