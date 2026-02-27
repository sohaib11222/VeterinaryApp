import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { useVetHeaderSearch } from '../../contexts/VetHeaderSearchContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useFavorites } from '../../queries/favoriteQueries';
import { useAppointments } from '../../queries/appointmentQueries';
import { usePetOwnerDashboard } from '../../queries/petOwnerQueries';
import { useQueries } from '@tanstack/react-query';
import { api } from '../../api/api';
import { API_ROUTES } from '../../api/apiConfig';
import { useTranslation } from 'react-i18next';

export function PetOwnerHomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const stackNav = navigation.getParent();
  const headerSearch = useVetHeaderSearch();
  const { t } = useTranslation();
  const userId = (user as { id?: string })?.id ?? (user as { _id?: string })?._id ?? null;

  const dashboardQuery = usePetOwnerDashboard({ enabled: !!userId });
  const { data: favoritesData } = useFavorites(userId, { limit: 10 });
  const { data: appointmentsResponse } = useAppointments({ limit: 20 });

  const dashboard = useMemo(() => {
    const outer = (dashboardQuery.data as { data?: unknown })?.data ?? dashboardQuery.data;
    const d = (outer as { data?: unknown })?.data ?? outer;
    return (d as Record<string, unknown> | null) ?? null;
  }, [dashboardQuery.data]);

  const petsCount = Number((dashboard as any)?.petsCount ?? 0);
  const unreadNotificationsCount = Number((dashboard as any)?.unreadNotificationsCount ?? 0);
  const favoriteVeterinariansCount = Number((dashboard as any)?.favoriteVeterinariansCount ?? 0);
  const totalVeterinariansVisited = Number((dashboard as any)?.totalVeterinariansVisited ?? 0);
  const totalCompletedAppointments = Number((dashboard as any)?.totalCompletedAppointments ?? 0);
  const upcomingCount = Number((dashboard as any)?.upcomingAppointments?.count ?? 0);

  const favoritesList = useMemo(() => {
    const raw = (favoritesData as { data?: { favorites?: unknown[] } })?.data;
    return raw?.favorites ?? [];
  }, [favoritesData]) as { _id: string; veterinarianId?: { _id?: string } | string }[];

  const vetUserIds = useMemo(() => favoritesList.map((f) => (typeof f.veterinarianId === 'object' ? (f.veterinarianId as { _id?: string })?._id : f.veterinarianId)).filter(Boolean) as string[], [favoritesList]);

  const vetQueries = useQueries({
    queries: vetUserIds.map((vetUserId) => ({
      queryKey: ['veterinarian', 'public', vetUserId],
      queryFn: () => api.get(API_ROUTES.VETERINARIANS.PUBLIC_PROFILE(vetUserId)),
      enabled: !!vetUserId,
    })),
  });

  const favVets = useMemo(() => {
    return favoritesList.map((fav, i) => {
      const uid = vetUserIds[i];
      const q = vetQueries[i];
      const data = (q?.data as { data?: unknown })?.data ?? q?.data;
      const profile = data as Record<string, unknown> | undefined;
      const userObj = (profile?.userId ?? fav.veterinarianId) as { fullName?: string; name?: string };
      const name = userObj?.fullName ?? userObj?.name ?? t('common.veterinarian');
      const specs = profile?.specializations as { name?: string }[] | undefined;
      const title = specs?.[0]?.name ?? t('petOwnerHome.defaults.specialty');
      return { id: uid ?? fav._id, name, title };
    });
  }, [favoritesList, vetUserIds, vetQueries, t]);

  const upcomingAppointments = useMemo(() => {
    const body = appointmentsResponse as { data?: { appointments?: unknown[] } };
    const list = body?.data?.appointments ?? [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return (list as Record<string, unknown>[])
      .filter((a) => ['PENDING', 'CONFIRMED'].includes(String(a.status)) && a.appointmentDate && new Date(a.appointmentDate as string) >= startOfToday)
      .slice(0, 5)
      .map((a) => {
        const pet = a.petId as { name?: string } | undefined;
        const vet = a.veterinarianId as { userId?: { name?: string } } | undefined;
        const dateStr = a.appointmentDate ? new Date(a.appointmentDate as string).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
        const timeStr = (a.appointmentTime as string) ?? '';
        return {
          id: (a._id as string) ?? '',
          date: dateStr,
          time: timeStr,
          vet: vet?.userId?.name ?? t('common.veterinarian'),
          pet: pet?.name ?? t('common.pet'),
        };
      });
  }, [appointmentsResponse, t]);

  useFocusEffect(React.useCallback(() => {
    headerSearch?.setConfig(null);
    return () => {};
  }, []));

  return (
    <ScreenContainer padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcome}>
          <Text style={styles.welcomeLabel}>{t('petOwnerHome.welcomeBack')}</Text>
          <Text style={styles.welcomeName}>{user?.name || t('common.petOwner')}</Text>
        </View>

        {unreadNotificationsCount > 0 ? (
          <TouchableOpacity style={styles.noticeBanner} onPress={() => stackNav?.navigate('PetOwnerNotifications')} activeOpacity={0.8}>
            <Text style={styles.noticeIcon}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.noticeTitle}>
                {t('petOwnerHome.notifications.title', { count: unreadNotificationsCount })}
              </Text>
              <Text style={styles.noticeSub}>{t('petOwnerHome.notifications.subtitle')}</Text>
            </View>
            <Text style={styles.noticeChevron}>›</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.bookCta} onPress={() => stackNav?.navigate('PetOwnerSearch')} activeOpacity={0.85}>
          <View style={styles.bookCtaIconWrap}>
            <Text style={styles.bookCtaIcon}>📅</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bookCtaTitle}>{t('petOwnerHome.cta.bookAppointmentTitle')}</Text>
            <Text style={styles.bookCtaSub}>{t('petOwnerHome.cta.bookAppointmentSubtitle')}</Text>
          </View>
          <Text style={styles.bookCtaChevron}>›</Text>
        </TouchableOpacity>

        <View style={styles.statsGrid}>
          <View style={[styles.statTile, { backgroundColor: colors.primary + '10' }]}>
            <Text style={styles.statTileIcon}>🐾</Text>
            <Text style={styles.statTileValue}>{petsCount}</Text>
            <Text style={styles.statTileLabel}>{t('menu.myPets')}</Text>
          </View>
          <View style={[styles.statTile, { backgroundColor: colors.secondary + '18' }]}>
            <Text style={styles.statTileIcon}>📅</Text>
            <Text style={styles.statTileValue}>{upcomingCount}</Text>
            <Text style={styles.statTileLabel}>{t('appointments.tabs.upcoming')}</Text>
          </View>
          <View style={[styles.statTile, { backgroundColor: colors.accent + '14' }]}>
            <Text style={styles.statTileIcon}>⭐</Text>
            <Text style={styles.statTileValue}>{favoriteVeterinariansCount}</Text>
            <Text style={styles.statTileLabel}>{t('menu.favoriteVets')}</Text>
          </View>
          <View style={[styles.statTile, { backgroundColor: colors.info + '12' }]}>
            <Text style={styles.statTileIcon}>🏥</Text>
            <Text style={styles.statTileValue}>{totalVeterinariansVisited}</Text>
            <Text style={styles.statTileLabel}>{t('petOwnerHome.stats.clinicsVisited')}</Text>
          </View>
        </View>

        {dashboardQuery.isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>{t('petOwnerHome.loading')}</Text>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('petOwnerHome.sections.favorites.title')}</Text>
          <TouchableOpacity onPress={() => stackNav?.navigate('PetOwnerFavourites')}>
            <Text style={styles.seeAll}>{t('petOwnerHome.actions.viewAll')}</Text>
          </TouchableOpacity>
        </View>
        <Card>
          {favVets.length === 0 ? (
            <Text style={styles.empty}>{t('petOwnerHome.sections.favorites.empty')}</Text>
          ) : (
            favVets.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={styles.vetRow}
                onPress={() => stackNav?.navigate('PetOwnerVetProfile', { vetId: v.id })}
                activeOpacity={0.7}
              >
                <View style={styles.vetAvatar}>
                  <Text style={styles.vetAvatarText}>{v.name.charAt(0)}</Text>
                </View>
                <View style={styles.vetInfo}>
                  <Text style={styles.vetName}>{v.name}</Text>
                  <Text style={styles.vetTitle}>{v.title}</Text>
                </View>
                <TouchableOpacity onPress={() => stackNav?.navigate('PetOwnerBooking', { vetId: v.id })}>
                  <Text style={styles.calIcon}>📅</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('petOwnerHome.sections.upcoming.title')}</Text>
          <TouchableOpacity
            onPress={() => {
              try {
                navigation.navigate('PetOwnerAppointments');
              } catch {
                stackNav?.navigate('PetOwnerTabs', { screen: 'PetOwnerAppointments' });
              }
            }}
          >
            <Text style={styles.seeAll}>{t('petOwnerHome.actions.seeAll')}</Text>
          </TouchableOpacity>
        </View>
        <Card>
          {upcomingAppointments.length === 0 ? (
            <Text style={styles.empty}>{t('petOwnerHome.sections.upcoming.empty')}</Text>
          ) : (
            upcomingAppointments.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={styles.aptRow}
                onPress={() => stackNav?.navigate('PetOwnerAppointmentDetails', { appointmentId: a.id })}
                activeOpacity={0.7}
              >
                <View style={styles.aptTime}>
                  <Text style={styles.aptTimeText}>{a.time}</Text>
                  <Text style={styles.aptDateText}>{a.date}</Text>
                </View>
                <View style={styles.aptInfo}>
                  <Text style={styles.aptVet}>{a.vet}</Text>
                  <Text style={styles.aptPet}>{a.pet}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </Card>

        <Card style={styles.insightsCard}>
          <View style={styles.insightRow}>
            <View style={styles.insightLeft}>
              <Text style={styles.insightTitle}>{t('petOwnerHome.activity.title')}</Text>
              <Text style={styles.insightSub}>{t('petOwnerHome.activity.subtitle')}</Text>
            </View>
          </View>
          <View style={styles.insightStatsRow}>
            <View style={styles.insightStat}>
              <Text style={styles.insightValue}>{totalCompletedAppointments}</Text>
              <Text style={styles.insightLabel}>{t('petOwnerHome.activity.completed')}</Text>
            </View>
            <View style={styles.insightDivider} />
            <View style={styles.insightStat}>
              <Text style={styles.insightValue}>{unreadNotificationsCount}</Text>
              <Text style={styles.insightLabel}>{t('petOwnerHome.activity.newAlerts')}</Text>
            </View>
          </View>
        </Card>

        <View style={styles.quickGrid}>
          <TouchableOpacity style={styles.quickItem} onPress={() => stackNav?.navigate('PetOwnerMyPets')}>
            <Text style={styles.quickIcon}>🐾</Text>
            <Text style={styles.quickLabel}>{t('menu.myPets')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => stackNav?.navigate('PetOwnerMedicalRecords')}>
            <Text style={styles.quickIcon}>📋</Text>
            <Text style={styles.quickLabel}>{t('menu.petMedicalRecords')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => stackNav?.navigate('PetOwnerOrderHistory')}>
            <Text style={styles.quickIcon}>🛒</Text>
            <Text style={styles.quickLabel}>{t('menu.petSupplyOrders')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => stackNav?.navigate('PetOwnerClinicMap')}>
            <Text style={styles.quickIcon}>📍</Text>
            <Text style={styles.quickLabel}>{t('menu.nearbyClinics')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.xxl },
  welcome: { marginBottom: spacing.lg },
  welcomeLabel: { ...typography.bodySmall, color: colors.textSecondary },
  welcomeName: { ...typography.h1, color: colors.text },
  noticeBanner: {
    backgroundColor: colors.secondary + '22',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.secondary + '40',
  },
  noticeIcon: { fontSize: 18, marginRight: spacing.sm },
  noticeTitle: { ...typography.label, color: colors.text },
  noticeSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  noticeChevron: { ...typography.h3, color: colors.textSecondary, marginLeft: spacing.sm },
  bookCta: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookCtaIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bookCtaIcon: { fontSize: 22 },
  bookCtaTitle: { ...typography.h3, color: colors.textInverse },
  bookCtaSub: { ...typography.caption, color: 'rgba(255,255,255,0.92)', marginTop: 2 },
  bookCtaChevron: { ...typography.h2, color: 'rgba(255,255,255,0.85)', marginLeft: spacing.sm },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statTile: {
    width: '48%',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statTileIcon: { fontSize: 18, marginBottom: spacing.xs },
  statTileValue: { ...typography.h2, fontWeight: '800', color: colors.text },
  statTileLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  loadingText: { ...typography.bodySmall, color: colors.textSecondary },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { ...typography.h3 },
  seeAll: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  vetRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  vetAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight + '40', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  vetAvatarText: { ...typography.h3, color: colors.primary },
  vetInfo: { flex: 1 },
  vetName: { ...typography.body, fontWeight: '600' },
  vetTitle: { ...typography.caption, color: colors.textSecondary },
  calIcon: { fontSize: 20 },
  aptRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  aptTime: { marginRight: spacing.md, minWidth: 56, alignItems: 'center' },
  aptTimeText: { ...typography.h3, color: colors.primary },
  aptDateText: { ...typography.caption, color: colors.textSecondary },
  aptInfo: { flex: 1 },
  aptVet: { ...typography.body, fontWeight: '600' },
  aptPet: { ...typography.bodySmall, color: colors.textSecondary },
  chevron: { ...typography.h2, color: colors.textLight },
  empty: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.md },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  quickItem: { width: '48%', backgroundColor: colors.background, borderRadius: 12, padding: spacing.md, alignItems: 'center', minHeight: 88 },
  quickIcon: { fontSize: 28, marginBottom: spacing.xs },
  quickLabel: { ...typography.caption, color: colors.text, textAlign: 'center' },
  bottomSpacer: { height: spacing.xl },
  insightsCard: { marginTop: spacing.sm },
  insightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  insightLeft: { flex: 1 },
  insightTitle: { ...typography.h3 },
  insightSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  insightStatsRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  insightDivider: { width: 1, height: 36, backgroundColor: colors.borderLight },
  insightStat: { flex: 1, alignItems: 'center' },
  insightValue: { ...typography.h2, fontWeight: '800', color: colors.text },
  insightLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
