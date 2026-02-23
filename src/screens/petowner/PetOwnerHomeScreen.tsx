import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
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
import { useQueries } from '@tanstack/react-query';
import { api } from '../../api/api';
import { API_ROUTES } from '../../api/apiConfig';
import { getImageUrl } from '../../config/api';

export function PetOwnerHomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const stackNav = navigation.getParent();
  const headerSearch = useVetHeaderSearch();
  const userId = (user as { id?: string })?.id ?? (user as { _id?: string })?._id ?? null;

  const { data: favoritesData } = useFavorites(userId, { limit: 10 });
  const { data: appointmentsResponse } = useAppointments({ limit: 20 });

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
      const name = userObj?.fullName ?? userObj?.name ?? 'Veterinarian';
      const specs = profile?.specializations as { name?: string }[] | undefined;
      const title = specs?.[0]?.name ?? 'Veterinary';
      return { id: uid ?? fav._id, name, title };
    });
  }, [favoritesList, vetUserIds, vetQueries]);

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
          vet: vet?.userId?.name ?? 'Veterinarian',
          pet: pet?.name ?? 'Pet',
        };
      });
  }, [appointmentsResponse]);

  useFocusEffect(React.useCallback(() => {
    headerSearch?.setConfig(null);
    return () => {};
  }, []));

  return (
    <ScreenContainer scroll padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcome}>
          <Text style={styles.welcomeLabel}>Welcome back</Text>
          <Text style={styles.welcomeName}>{user?.name || 'Pet Owner'}</Text>
        </View>

        <TouchableOpacity style={styles.bookCta} onPress={() => stackNav?.navigate('PetOwnerSearch')}>
          <Text style={styles.bookCtaIcon}>📅</Text>
          <Text style={styles.bookCtaTitle}>Book a new Pet Appointment</Text>
          <Text style={styles.bookCtaSub}>Find a veterinarian</Text>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Favorite Veterinarians</Text>
          <TouchableOpacity onPress={() => stackNav?.navigate('PetOwnerFavourites')}>
            <Text style={styles.seeAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <Card>
          {favVets.length === 0 ? (
            <Text style={styles.empty}>No favorite vets. Find one from search.</Text>
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
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('PetOwnerAppointments')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <Card>
          {upcomingAppointments.length === 0 ? (
            <Text style={styles.empty}>No upcoming appointments</Text>
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

        <View style={styles.quickGrid}>
          <TouchableOpacity style={styles.quickItem} onPress={() => stackNav?.navigate('PetOwnerMyPets')}>
            <Text style={styles.quickIcon}>🐾</Text>
            <Text style={styles.quickLabel}>My Pets</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => stackNav?.navigate('PetOwnerMedicalRecords')}>
            <Text style={styles.quickIcon}>📋</Text>
            <Text style={styles.quickLabel}>Medical Records</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => stackNav?.navigate('PetOwnerOrderHistory')}>
            <Text style={styles.quickIcon}>🛒</Text>
            <Text style={styles.quickLabel}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickItem} onPress={() => stackNav?.navigate('PetOwnerClinicMap')}>
            <Text style={styles.quickIcon}>📍</Text>
            <Text style={styles.quickLabel}>Nearby Clinics</Text>
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
  bookCta: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookCtaIcon: { fontSize: 32, marginRight: spacing.md },
  bookCtaTitle: { ...typography.h3, color: colors.textInverse, flex: 1 },
  bookCtaSub: { ...typography.caption, color: 'rgba(255,255,255,0.9)' },
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
});
