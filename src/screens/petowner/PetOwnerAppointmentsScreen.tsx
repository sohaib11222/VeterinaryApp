import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { useVetHeaderSearch } from '../../contexts/VetHeaderSearchContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useAppointments } from '../../queries/appointmentQueries';
import { useGetOrCreateConversation } from '../../mutations/chatMutations';
import { getImageUrl } from '../../config/api';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

type Tab = 'all' | 'upcoming' | 'cancelled' | 'completed';

interface AppointmentCardItem {
  _id: string;
  appointmentId: string;
  appointmentNumber: string;
  doctor: string;
  doctorImg: string | null;
  date: string;
  reason: string;
  bookingType: string;
  bookingTypeLabel: string;
  status: string;
  email: string;
  phone: string;
  pet: string;
  veterinarianId: string;
  petOwnerId: string;
}

function normalizeAppointments(
  response: unknown,
  t: (key: string, options?: Record<string, unknown>) => string
): AppointmentCardItem[] {
  const body = response as { data?: { appointments?: unknown[] } };
  const list = Array.isArray(body?.data?.appointments) ? body.data.appointments : [];
  return list.map((item) => {
    const a = item as Record<string, unknown>;
    const vet = (a.veterinarianId as Record<string, unknown>) || {};
    const vetId = (vet._id as string) ?? (a.veterinarianId as string) ?? '';
    const ownerId = (a.petOwnerId as Record<string, unknown>)?._id
      ? String((a.petOwnerId as Record<string, unknown>)._id)
      : (a.petOwnerId as string) ?? '';
    const pet = (a.petId as Record<string, unknown>) || {};
    const dateStr = a.appointmentDate
      ? new Date(a.appointmentDate as string).toLocaleDateString()
      : '';
    const timeStr = (a.appointmentTime as string) || '';
    const id = (a._id as string) || '';
    return {
      _id: id,
      appointmentId: id,
      appointmentNumber: (a.appointmentNumber as string) || id,
      doctor:
        (vet.name as string) ||
        (vet.fullName as string) ||
        (vet.email as string) ||
        t('common.veterinarian'),
      doctorImg: getImageUrl((vet.profileImage as string) || undefined) || null,
      date: `${dateStr} ${timeStr}`.trim(),
      reason: (a.reason as string) || t('petOwnerAppointmentDetail.defaults.consultation'),
      bookingType: (a.bookingType as string) || '',
      bookingTypeLabel:
        (a.bookingType as string) === 'ONLINE'
          ? t('petOwnerAppointmentDetail.bookingTypes.videoCall')
          : t('petOwnerAppointmentDetail.bookingTypes.clinicVisit'),
      status: String((a.status as string) || '').toUpperCase(),
      email: (vet.email as string) || '',
      phone: (vet.phone as string) || '',
      pet: (pet.name as string)
        ? `${pet.name as string}${(pet.breed as string) ? ` (${pet.breed})` : ''}`
        : t('common.pet'),
      veterinarianId: vetId,
      petOwnerId: ownerId,
    };
  });
}

export function PetOwnerAppointmentsScreen() {
  const navigation = useNavigation<any>();
  const stackNav = navigation.getParent();
  const headerSearch = useVetHeaderSearch();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: appointmentsResponse, isLoading } = useAppointments({ limit: 50 });
  const getOrCreateConversation = useGetOrCreateConversation();

  const appointments = useMemo(
    () => normalizeAppointments(appointmentsResponse ?? {}, t),
    [appointmentsResponse, t, i18n.language]
  );

  const filteredByTab = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    if (activeTab === 'upcoming') {
      return appointments.filter((a) => {
        if (!['PENDING', 'CONFIRMED'].includes(a.status)) return false;
        return true;
      });
    }
    if (activeTab === 'cancelled') {
      return appointments.filter((a) =>
        ['CANCELLED', 'REJECTED', 'NO_SHOW'].includes(a.status)
      );
    }
    if (activeTab === 'completed') {
      return appointments.filter((a) => a.status === 'COMPLETED');
    }
    return appointments;
  }, [appointments, activeTab]);

  const list = useMemo(() => {
    if (!searchQuery.trim()) return filteredByTab;
    const q = searchQuery.toLowerCase();
    return filteredByTab.filter(
      (a) =>
        a.doctor.toLowerCase().includes(q) ||
        a.pet.toLowerCase().includes(q) ||
        a.appointmentNumber.toLowerCase().includes(q)
    );
  }, [filteredByTab, searchQuery]);

  useFocusEffect(
    React.useCallback(() => {
      headerSearch?.setConfig({
        placeholder: t('appointments.searchPlaceholderPetOwner'),
        value: searchQuery,
        onChangeText: setSearchQuery,
      });
      return () => headerSearch?.setConfig(null);
    }, [searchQuery, headerSearch, t])
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: t('appointments.tabs.all') },
    { key: 'upcoming', label: t('appointments.tabs.upcoming') },
    { key: 'cancelled', label: t('appointments.tabs.cancelled') },
    { key: 'completed', label: t('appointments.tabs.completed') },
  ];

  const openDetail = (appointmentId: string) => {
    stackNav?.navigate('PetOwnerAppointmentDetails', { appointmentId });
  };

  const openChat = async (item: AppointmentCardItem) => {
    if (item.status !== 'CONFIRMED') return;
    const { veterinarianId: vetId, petOwnerId: ownerId, appointmentId: aptId, doctor, doctorImg } = item;
    if (!vetId || !ownerId || !aptId) {
      Toast.show({ type: 'error', text1: t('appointments.errors.cannotOpenChat') });
      return;
    }
    try {
      const res = await getOrCreateConversation.mutateAsync({
        veterinarianId: vetId,
        petOwnerId: ownerId,
        appointmentId: aptId,
      });
      const conv = (res as { _id?: string; data?: { _id?: string } })?.data ?? (res as { _id?: string });
      const conversationId = conv?._id;
      if (!conversationId) {
        Toast.show({ type: 'error', text1: t('appointments.errors.couldNotOpenChat') });
        return;
      }
      stackNav?.navigate('PetOwnerChatDetail', {
        conversationId: String(conversationId),
        veterinarianId: vetId,
        petOwnerId: ownerId,
        appointmentId: aptId,
        conversationType: 'VETERINARIAN_PET_OWNER',
        title: doctor,
        subtitle: t('appointments.actions.chat'),
        peerImageUri: doctorImg ?? undefined,
      });
    } catch (err) {
      Toast.show({ type: 'error', text1: (err as { message?: string })?.message ?? t('appointments.errors.couldNotOpenChat') });
    }
  };

  const renderItem = ({ item }: { item: AppointmentCardItem }) => (
    <TouchableOpacity activeOpacity={0.8} onPress={() => openDetail(item.appointmentId)}>
      <Card style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.vetBlock}>
            {item.doctorImg ? (
              <Image source={{ uri: item.doctorImg }} style={styles.vetImage} />
            ) : (
              <View style={styles.vetImagePlaceholder}>
                <Text style={styles.vetImageLetter}>
                  {item.doctor?.charAt(0) || t('petOwnerAppointmentDetail.defaults.vetAvatarLetter')}
                </Text>
              </View>
            )}
            <View style={styles.vetInfo}>
              <Text style={styles.appointmentNumber}>{item.appointmentNumber}</Text>
              <Text style={styles.vetName}>{item.doctor}</Text>
              <Text style={styles.petLabel}>{t('appointments.labels.pet')}: {item.pet}</Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              item.status === 'COMPLETED' && styles.badgeCompleted,
              (item.status === 'CANCELLED' || item.status === 'REJECTED' || item.status === 'NO_SHOW') &&
                styles.badgeCancelled,
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.dateTimeRow}>
          <Text style={styles.dateTimeText}>🕐 {item.date}</Text>
        </View>
        <View style={styles.badgeRow}>
          <View style={styles.badgeReason}>
            <Text style={styles.badgeTextSmall}>{item.reason}</Text>
          </View>
          <View
            style={[
              styles.typeBadge,
              item.bookingType === 'ONLINE' ? styles.typeVideo : styles.typeVisit,
            ]}
          >
            <Text style={styles.badgeTextSmall}>{item.bookingTypeLabel}</Text>
          </View>
        </View>
        <View style={styles.contactRow}>
          <Text style={styles.contactText}>✉ {item.email}</Text>
          <Text style={styles.contactText}>📞 {item.phone}</Text>
        </View>
        <View style={styles.actionRow}>
          {item.status === 'CONFIRMED' && (
            <TouchableOpacity
              style={[styles.viewBtn, styles.chatBtn]}
              onPress={(e) => {
                e?.stopPropagation?.();
                openChat(item);
              }}
              disabled={getOrCreateConversation.isPending}
            >
              {/* <Text style={styles.chatBtnIcon}>💬</Text> */}
              <Text style={styles.viewBtnText}>{t('appointments.actions.chat')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.viewBtn} onPress={() => openDetail(item.appointmentId)}>
            <Text style={styles.viewBtnText}>{t('appointments.actions.view')}</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const emptyMessages: Record<Tab, string> = {
    all: t('appointments.empty.petOwnerAll'),
    upcoming: t('appointments.empty.petOwnerUpcoming'),
    cancelled: t('appointments.empty.petOwnerCancelled'),
    completed: t('appointments.empty.petOwnerCompleted'),
  };

  return (
    <ScreenContainer padded>
      <View style={styles.tabs}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('appointments.loading')}</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>{emptyMessages[activeTab]}</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 12,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: 10 },
  tabActive: {
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: { ...typography.label, color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  loading: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  loadingText: { ...typography.bodySmall, color: colors.textSecondary },
  listContent: { paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.sm },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  vetBlock: { flexDirection: 'row', flex: 1, minWidth: 0 },
  vetImage: { width: 56, height: 56, borderRadius: 12, marginRight: spacing.sm },
  vetImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '30',
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vetImageLetter: { ...typography.h3, color: colors.primary },
  vetInfo: { flex: 1, minWidth: 0 },
  appointmentNumber: { ...typography.caption, color: colors.textSecondary, marginBottom: 2 },
  vetName: { ...typography.body, fontWeight: '600' },
  petLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.secondaryLight + '80',
  },
  badgeCompleted: { backgroundColor: colors.successLight },
  badgeCancelled: { backgroundColor: colors.errorLight },
  statusText: { ...typography.caption, fontWeight: '600', fontSize: 11 },
  dateTimeRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  dateTimeText: { ...typography.bodySmall, color: colors.textSecondary },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.xs },
  badgeReason: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primaryLight + '25',
  },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeVideo: { backgroundColor: colors.info + '25' },
  typeVisit: { backgroundColor: colors.success + '25' },
  badgeTextSmall: { fontSize: 12, fontWeight: '600', color: colors.text },
  contactRow: { marginTop: spacing.sm, gap: 2 },
  contactText: { ...typography.caption, color: colors.textSecondary },
  actionRow: { marginTop: spacing.sm, flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  chatBtn: { marginRight: 0 },
  chatBtnIcon: { marginRight: 4 },
  viewBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  viewBtnText: { ...typography.bodySmall, color: colors.textInverse, fontWeight: '600' },
  empty: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: spacing.sm },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
});
