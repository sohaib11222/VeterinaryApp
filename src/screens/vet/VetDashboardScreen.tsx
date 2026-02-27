import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Pressable } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { useVetHeaderSearch } from '../../contexts/VetHeaderSearchContext';
import { useVetHeaderRightAction } from '../../contexts/VetHeaderRightActionContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useVetDashboard } from '../../queries/vetQueries';
import { useWeeklySchedule } from '../../queries/scheduleQueries';
import * as SecureStore from 'expo-secure-store';
import { useTranslation } from 'react-i18next';

const VET_ONBOARDING_REQUIRED_KEY = 'vet_onboarding_required';

export function VetDashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const stackNav = navigation.getParent();
  const headerSearch = useVetHeaderSearch();
  const headerRight = useVetHeaderRightAction();

  const dashboardQuery = useVetDashboard();
  const scheduleQuery = useWeeklySchedule();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showTimingsModal, setShowTimingsModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const dashboard = useMemo(() => {
    const outer = (dashboardQuery.data as { data?: unknown })?.data ?? dashboardQuery.data;
    const d = (outer as { data?: unknown })?.data ?? outer;
    return (d as Record<string, unknown> | null) ?? null;
  }, [dashboardQuery.data]);

  const todayCount = Number((dashboard as any)?.todayAppointments?.count ?? 0);
  const weeklyCount = Number((dashboard as any)?.weeklyAppointments?.count ?? 0);
  const upcomingCount = Number((dashboard as any)?.upcomingAppointments?.count ?? 0);
  const totalPetOwners = Number((dashboard as any)?.totalPetOwners ?? 0);
  const earnings = Number((dashboard as any)?.earningsFromAppointments ?? 0);
  const unreadMessages = Number((dashboard as any)?.unreadMessagesCount ?? 0);
  const unreadNotifications = Number((dashboard as any)?.unreadNotificationsCount ?? 0);
  const profileStrength = Number((dashboard as any)?.profileStrength ?? 0);
  const ratingAvg = Number((dashboard as any)?.rating?.average ?? 0);
  const ratingCount = Number((dashboard as any)?.rating?.count ?? 0);
  const hasActiveSubscription = Boolean((dashboard as any)?.subscription?.hasActiveSubscription ?? false);
  const expiresInDays = (dashboard as any)?.subscription?.expiresInDays as number | null | undefined;

  const todayAppointments = useMemo(() => {
    const list = (dashboard as any)?.todayAppointments?.appointments;
    return Array.isArray(list) ? list : [];
  }, [dashboard]);

  const hasAnyWeeklySlot = useMemo(() => {
    const outer = (scheduleQuery.data as any)?.data ?? scheduleQuery.data;
    const payload = outer?.data ?? outer;
    const days = payload?.days ?? [];
    if (!Array.isArray(days)) return false;
    return days.some((d: any) => Array.isArray(d?.timeSlots) && d.timeSlots.length > 0);
  }, [scheduleQuery.data]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (dashboardQuery.isLoading || scheduleQuery.isLoading) return;
      if (!user || user.role !== 'VETERINARIAN') return;

      let onboardingRequired = false;
      try {
        onboardingRequired = (await SecureStore.getItemAsync(VET_ONBOARDING_REQUIRED_KEY)) === '1';
      } catch {
        onboardingRequired = false;
      }

      if (!onboardingRequired) {
        if (!cancelled) {
          setShowProfileModal(false);
          setShowTimingsModal(false);
          setShowSubscriptionModal(false);
        }
        return;
      }

      const profileCompleted = Boolean((dashboard as any)?.profileCompleted === true);

      if (!profileCompleted) {
        if (!cancelled) {
          setShowProfileModal(true);
          setShowTimingsModal(false);
          setShowSubscriptionModal(false);
        }
        return;
      }

      if (!hasAnyWeeklySlot) {
        if (!cancelled) {
          setShowProfileModal(false);
          setShowTimingsModal(true);
          setShowSubscriptionModal(false);
        }
        return;
      }

      if (!hasActiveSubscription) {
        if (!cancelled) {
          setShowProfileModal(false);
          setShowTimingsModal(false);
          setShowSubscriptionModal(true);
        }
        return;
      }

      try {
        await SecureStore.deleteItemAsync(VET_ONBOARDING_REQUIRED_KEY);
      } catch {
        // ignore
      }

      if (!cancelled) {
        setShowProfileModal(false);
        setShowTimingsModal(false);
        setShowSubscriptionModal(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dashboardQuery.isLoading, scheduleQuery.isLoading, user, dashboard, hasAnyWeeklySlot, hasActiveSubscription]);

  // Dashboard: no header search, no right icons
  useFocusEffect(
    React.useCallback(() => {
      headerSearch?.setConfig(null);
      headerRight?.setRightAction(null);
      return () => {};
    }, [])
  );

  const stats = [
    { label: t('vetDashboard.stats.todayAppointments'), value: String(todayCount), icon: '📅', color: colors.primary },
    { label: t('vetDashboard.stats.thisWeek'), value: String(weeklyCount), icon: '📈', color: colors.accent },
    { label: t('vetDashboard.stats.earnings'), value: earnings ? String(Math.round(earnings)) : '0', icon: '💰', color: colors.secondaryDark },
    { label: t('vetDashboard.stats.patients'), value: String(totalPetOwners), icon: '🐾', color: colors.info },
  ];

  const quickLinks = [
    { label: t('menu.petRequests'), icon: '📋', screen: 'VetPetRequests' as const },
    { label: t('menu.clinicHours'), icon: '🕐', screen: 'VetClinicHours' as const },
    { label: t('menu.myPets'), icon: '🐾', screen: 'VetMyPets' as const },
    { label: t('menu.vaccinations'), icon: '💉', screen: 'VetVaccinations' as const },
    { label: t('menu.reviews'), icon: '⭐', screen: 'VetReviews' as const },
    { label: t('menu.invoices'), icon: '📄', screen: 'VetInvoices' as const },
  ];

  return (
    <ScreenContainer padded>
      <Modal visible={showProfileModal} transparent animationType="fade">
        <Pressable style={styles.onboardingOverlay} onPress={() => setShowProfileModal(false)}>
          <Pressable style={styles.onboardingModal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.onboardingTitle}>Profile Incomplete</Text>
            <Text style={styles.onboardingBody}>
              To start accepting appointments, please complete your profile by filling in the required information.
            </Text>
            <View style={styles.onboardingActions}>
              <TouchableOpacity style={styles.onboardingBtnSecondary} onPress={() => setShowProfileModal(false)}>
                <Text style={styles.onboardingBtnSecondaryText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.onboardingBtnPrimary}
                onPress={() => {
                  setShowProfileModal(false);
                  stackNav?.navigate('VetProfileSettings');
                }}
              >
                <Text style={styles.onboardingBtnPrimaryText}>Complete Profile Now</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showTimingsModal} transparent animationType="fade">
        <Pressable style={styles.onboardingOverlay} onPress={() => setShowTimingsModal(false)}>
          <Pressable style={styles.onboardingModal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.onboardingTitle}>Add Available Timings</Text>
            <Text style={styles.onboardingBody}>
              Before you can receive appointments, please add at least one available time slot in your schedule.
            </Text>
            <View style={styles.onboardingActions}>
              <TouchableOpacity style={styles.onboardingBtnSecondary} onPress={() => setShowTimingsModal(false)}>
                <Text style={styles.onboardingBtnSecondaryText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.onboardingBtnPrimary}
                onPress={() => {
                  setShowTimingsModal(false);
                  stackNav?.navigate('VetClinicHours');
                }}
              >
                <Text style={styles.onboardingBtnPrimaryText}>Add Timings Now</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showSubscriptionModal} transparent animationType="fade">
        <Pressable style={styles.onboardingOverlay} onPress={() => setShowSubscriptionModal(false)}>
          <Pressable style={styles.onboardingModal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.onboardingTitle}>Buy Subscription Plan</Text>
            <Text style={styles.onboardingBody}>
              To allow pet owners to book appointments, please purchase a subscription plan.
            </Text>
            <View style={styles.onboardingActions}>
              <TouchableOpacity style={styles.onboardingBtnSecondary} onPress={() => setShowSubscriptionModal(false)}>
                <Text style={styles.onboardingBtnSecondaryText}>I'll Do It Later</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.onboardingBtnPrimary}
                onPress={() => {
                  setShowSubscriptionModal(false);
                  stackNav?.navigate('VetSubscription');
                }}
              >
                <Text style={styles.onboardingBtnPrimaryText}>View Plans Now</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Welcome */}
        <View style={styles.welcome}>
          <Text style={styles.welcomeLabel}>{t('vetDashboard.welcomeBack')}</Text>
          <Text style={styles.welcomeName}>{user?.name || t('common.veterinarian')}</Text>
        </View>

        {(unreadMessages > 0 || unreadNotifications > 0) && (
          <Card style={styles.alertCard}>
            <View style={styles.alertRow}>
              <Text style={styles.alertIcon}>🔔</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>{t('vetDashboard.updates.title')}</Text>
                <Text style={styles.alertSub}>
                  {unreadMessages > 0 ? t('vetDashboard.updates.unreadMessages', { count: unreadMessages }) : ''}
                  {unreadMessages > 0 && unreadNotifications > 0 ? ' · ' : ''}
                  {unreadNotifications > 0 ? t('vetDashboard.updates.unreadNotifications', { count: unreadNotifications }) : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => stackNav?.navigate('VetNotifications')} activeOpacity={0.7}>
                <Text style={styles.alertCta}>{t('common.view')}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {!hasActiveSubscription ? (
          <TouchableOpacity style={styles.subBanner} activeOpacity={0.85} onPress={() => stackNav?.navigate('VetSubscription')}>
            <Text style={styles.subIcon}>✨</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.subTitle}>{t('vetDashboard.subscription.upgradeTitle')}</Text>
              <Text style={styles.subSub}>{t('vetDashboard.subscription.upgradeSubtitle')}</Text>
            </View>
            <Text style={styles.subChevron}>›</Text>
          </TouchableOpacity>
        ) : expiresInDays != null ? (
          <Card style={styles.subActiveCard}>
            <Text style={styles.subActiveTitle}>{t('vetDashboard.subscription.activeTitle')}</Text>
            <Text style={styles.subActiveSub}>{t('vetDashboard.subscription.expiresIn', { count: expiresInDays })}</Text>
          </Card>
        ) : null}

        {dashboardQuery.isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>{t('vetDashboard.loading')}</Text>
          </View>
        ) : null}

        {/* Stats row – modern cards */}
        <View style={styles.statsGrid}>
          {stats.map((s, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: s.color + '2' }]}>
              <View style={[styles.statIconWrap, { backgroundColor: s.color + '2' }]}>
                <Text style={styles.statIcon}>{s.icon}</Text>
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel} numberOfLines={2}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Card style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileTitle}>{t('vetDashboard.profile.strengthTitle')}</Text>
              <Text style={styles.profileSub}>{t('vetDashboard.profile.strengthSubtitle')}</Text>
            </View>
            <Text style={styles.profilePct}>{Math.round(profileStrength)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, profileStrength))}%` }]} />
          </View>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingLeft}>⭐ {ratingAvg.toFixed(1)} ({ratingCount})</Text>
            <TouchableOpacity onPress={() => stackNav?.navigate('VetReviews')} activeOpacity={0.7}>
              <Text style={styles.ratingLink}>{t('vetDashboard.profile.viewReviews')}</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Today's appointments */}
        <Card style={styles.todayCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('vetDashboard.today.title')}</Text>
            <TouchableOpacity onPress={() => navigation.getParent()?.navigate('VetAppointments')}>
              <Text style={styles.seeAll}>{t('vetDashboard.today.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          {todayAppointments.length === 0 ? (
            <Text style={styles.emptyText}>{t('vetDashboard.today.empty')}</Text>
          ) : (
            todayAppointments.map((apt: any, idx: number) => {
              const petName = apt?.petId?.name ? String(apt.petId.name) : t('common.pet');
              const species = apt?.petId?.species ? String(apt.petId.species) : '';
              const owner = apt?.petOwnerId?.name ? String(apt.petOwnerId.name) : t('common.petOwner');
              const time = apt?.appointmentTime ? String(apt.appointmentTime) : '—';
              const subtitle = species ? `${owner} · ${species}` : owner;
              return (
                <TouchableOpacity
                  key={String(apt?._id ?? idx)}
                  style={[styles.appointmentRow, idx === todayAppointments.length - 1 && styles.appointmentRowLast]}
                  activeOpacity={0.7}
                  onPress={() => stackNav?.navigate('VetAppointmentDetails', { appointmentId: String(apt?._id ?? '') })}
                >
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeText}>{time}</Text>
                  </View>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.petName}>{petName}</Text>
                    <Text style={styles.ownerName}>{subtitle}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              );
            })
          )}
        </Card>

        {/* Quick access */}
        <Text style={styles.quickSectionTitle}>{t('vetDashboard.quick.title')}</Text>
        <View style={styles.quickGrid}>
          {quickLinks.map((link, i) => (
            <TouchableOpacity key={i} style={styles.quickItem} activeOpacity={0.7} onPress={() => stackNav?.navigate(link.screen)}>
              <View style={styles.quickIconWrap}>
                <Text style={styles.quickIcon}>{link.icon}</Text>
              </View>
              <Text style={styles.quickLabel} numberOfLines={1}>{link.label}</Text>
            </TouchableOpacity>
          ))}
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
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  loadingText: { ...typography.bodySmall, color: colors.textSecondary },
  alertCard: { marginBottom: spacing.md },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  alertIcon: { fontSize: 18 },
  alertTitle: { ...typography.label, color: colors.text },
  alertSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  alertCta: { ...typography.label, color: colors.primary },
  subBanner: {
    backgroundColor: colors.primary + '12',
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '28',
  },
  subIcon: { fontSize: 18, marginRight: spacing.sm },
  subTitle: { ...typography.label },
  subSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  subChevron: { ...typography.h3, color: colors.textSecondary, marginLeft: spacing.sm },
  subActiveCard: { marginBottom: spacing.md },
  subActiveTitle: { ...typography.label },
  onboardingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  onboardingModal: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.lg,
  },
  onboardingTitle: { ...typography.h3, marginBottom: spacing.sm },
  onboardingBody: { ...typography.bodySmall, color: colors.textSecondary },
  onboardingActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  onboardingBtnSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingBtnSecondaryText: { ...typography.label, color: colors.text },
  onboardingBtnPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingBtnPrimaryText: { ...typography.label, color: colors.textInverse },
  subActiveSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    width: '48%',
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    // elevation: 2,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statIcon: { fontSize: 20 },
  statValue: { ...typography.h2, fontWeight: '700' },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  profileCard: { marginBottom: spacing.md },
  profileTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  profileTitle: { ...typography.h3 },
  profileSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  profilePct: { ...typography.h3, color: colors.primary },
  progressTrack: {
    marginTop: spacing.md,
    height: 10,
    borderRadius: 10,
    backgroundColor: colors.borderLight,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  ratingRow: { marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingLeft: { ...typography.bodySmall, color: colors.textSecondary },
  ratingLink: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  todayCard: { marginBottom: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.h3, marginBottom: 0 },
  seeAll: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  appointmentRowLast: { borderBottomWidth: 0 },
  timeBadge: {
    backgroundColor: colors.primaryLight + '25',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 10,
    marginRight: spacing.md,
    minWidth: 52,
    alignItems: 'center',
  },
  timeText: { ...typography.label, color: colors.primary, fontWeight: '600' },
  appointmentInfo: { flex: 1 },
  petName: { ...typography.body, fontWeight: '600' },
  ownerName: { ...typography.caption, color: colors.textSecondary },
  chevron: { ...typography.h3, color: colors.textLight },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.md },
  quickSectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickItem: {
    width: '31%',
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 92,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  quickIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickIcon: { fontSize: 24 },
  quickLabel: { ...typography.caption, color: colors.text, textAlign: 'center', fontWeight: '500' },
  bottomSpacer: { height: spacing.xl },
});
