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
import { useVetHeaderRightAction } from '../../contexts/VetHeaderRightActionContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useAuth } from '../../contexts/AuthContext';
import { useAppointments } from '../../queries/appointmentQueries';
import { useGetOrCreateConversation } from '../../mutations/chatMutations';
import { getImageUrl } from '../../config/api';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

type Tab = 'all' | 'upcoming' | 'cancelled' | 'completed';

interface AppointmentItem {
  _id: string;
  appointmentNumber: string;
  petName: string;
  petBreed: string;
  petImg: string | null;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  dateTime: string;
  reason: string;
  bookingType: string;
  status: string;
  appointmentDate: string | null;
  petOwnerId: string;
}

function normalizeAppointments(response: unknown): AppointmentItem[] {
  const body = response as { data?: { appointments?: unknown[] } };
  const list = Array.isArray(body?.data?.appointments) ? body.data.appointments : [];
  return list.map((item) => {
    const a = item as Record<string, unknown>;
    const pet = (a.petId as Record<string, unknown>) || {};
    const owner = (a.petOwnerId as Record<string, unknown>) || {};
    const ownerId = (owner._id as string) ?? (a.petOwnerId as string) ?? '';
    const dateStr = a.appointmentDate
      ? new Date(a.appointmentDate as string).toLocaleDateString()
      : '';
    const timeStr = (a.appointmentTime as string) || '';
    return {
      _id: (a._id as string) || '',
      appointmentNumber: (a.appointmentNumber as string) || (a._id as string) || '',
      petName: (pet.name as string) || 'Pet',
      petBreed: (pet.breed as string) || '',
      petImg: getImageUrl((pet.photo as string) || undefined) || null,
      ownerName: (owner.name as string) || (owner.fullName as string) || 'Pet Owner',
      ownerEmail: (owner.email as string) || '',
      ownerPhone: (owner.phone as string) || '',
      dateTime: `${dateStr} ${timeStr}`.trim(),
      reason: (a.reason as string) || 'Consultation',
      bookingType: (a.bookingType as string) === 'ONLINE' ? 'Video Call' : 'Clinic Visit',
      status: String((a.status as string) || '').toUpperCase(),
      appointmentDate: (a.appointmentDate as string) || null,
      petOwnerId: ownerId,
    };
  });
}

export function VetAppointmentsScreen() {
  const navigation = useNavigation<any>();
  const stackNav = navigation.getParent();
  const headerSearch = useVetHeaderSearch();
  const headerRight = useVetHeaderRightAction();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { user } = useAuth();
  const currentUserId = (user as { id?: string })?.id ?? (user as { _id?: string })?._id ?? '';
  const { data: appointmentsResponse, isLoading } = useAppointments({ limit: 50 });
  const getOrCreateConversation = useGetOrCreateConversation();

  const appointments = useMemo(
    () => normalizeAppointments(appointmentsResponse ?? {}),
    [appointmentsResponse]
  );

  const filteredByTab = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    if (activeTab === 'upcoming') {
      return appointments.filter((a) => {
        if (!['PENDING', 'CONFIRMED'].includes(a.status)) return false;
        if (!a.appointmentDate) return true;
        const d = new Date(a.appointmentDate);
        return Number.isNaN(d.getTime()) ? true : d >= startOfToday;
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
        a.petName.toLowerCase().includes(q) ||
        a.ownerName.toLowerCase().includes(q) ||
        a.appointmentNumber.toLowerCase().includes(q)
    );
  }, [filteredByTab, searchQuery]);

  const pendingRequestCount = useMemo(
    () => appointments.filter((a) => a.status === 'PENDING').length,
    [appointments]
  );

  useFocusEffect(
    React.useCallback(() => {
      headerSearch?.setConfig({
        placeholder: t('appointments.searchPlaceholderVet'),
        value: searchQuery,
        onChangeText: setSearchQuery,
      });
      headerRight?.setRightAction(
        <View style={headerStyles.actions}>
          <TouchableOpacity
            style={headerStyles.iconBtn}
            onPress={() => stackNav?.navigate('VetClinicHours')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={headerStyles.iconText}>🕐</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={headerStyles.iconBtn}
            onPress={() => stackNav?.navigate('VetPetRequests')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={headerStyles.iconText}>📋</Text>
            {pendingRequestCount > 0 && (
              <View style={headerStyles.badge}>
                <Text style={headerStyles.badgeText}>
                  {pendingRequestCount > 99 ? '99+' : pendingRequestCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      );
      return () => {
        headerSearch?.setConfig(null);
        headerRight?.setRightAction(null);
      };
    }, [searchQuery, stackNav, headerSearch, headerRight, pendingRequestCount, t])
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: t('appointments.tabs.all') },
    { key: 'upcoming', label: t('appointments.tabs.upcoming') },
    { key: 'cancelled', label: t('appointments.tabs.cancelled') },
    { key: 'completed', label: t('appointments.tabs.completed') },
  ];

  const openDetail = (id: string) => {
    stackNav?.navigate('VetAppointmentDetails', { appointmentId: id });
  };

  const openChat = async (item: AppointmentItem) => {
    if (item.status !== 'CONFIRMED' || !currentUserId) return;
    const { petOwnerId: ownerId, _id: aptId, ownerName } = item;
    if (!ownerId || !aptId) {
      Toast.show({ type: 'error', text1: t('appointments.errors.cannotOpenChat') });
      return;
    }
    try {
      const res = await getOrCreateConversation.mutateAsync({
        veterinarianId: currentUserId,
        petOwnerId: ownerId,
        appointmentId: aptId,
      });
      const conv = (res as { _id?: string; data?: { _id?: string } })?.data ?? (res as { _id?: string });
      const conversationId = conv?._id;
      if (!conversationId) {
        Toast.show({ type: 'error', text1: t('appointments.errors.couldNotOpenChat') });
        return;
      }
      stackNav?.navigate('VetChatDetail', {
        conversationId: String(conversationId),
        conversationType: 'VETERINARIAN_PET_OWNER',
        petOwnerId: ownerId,
        appointmentId: aptId,
        title: ownerName,
        subtitle: t('appointments.actions.chat'),
      });
    } catch (err) {
      Toast.show({ type: 'error', text1: (err as { message?: string })?.message ?? t('appointments.errors.couldNotOpenChat') });
    }
  };

  const renderItem = ({ item }: { item: AppointmentItem }) => (
    <TouchableOpacity activeOpacity={0.8} onPress={() => openDetail(item._id)}>
      <Card style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.petBlock}>
            {item.petImg ? (
              <Image source={{ uri: item.petImg }} style={styles.petImage} />
            ) : (
              <View style={styles.petImagePlaceholder}>
                <Text style={styles.petImageLetter}>{item.petName.charAt(0) || '?'}</Text>
              </View>
            )}
            <View style={styles.petInfo}>
              <Text style={styles.appointmentNumber}>{item.appointmentNumber}</Text>
              <Text style={styles.petName}>
                {item.petName}
                {item.petBreed ? ` (${item.petBreed})` : ''}
              </Text>
              <Text style={styles.ownerLabel}>{t('appointments.labels.owner')}: {item.ownerName}</Text>
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
          <Text style={styles.dateTimeText}>🕐 {item.dateTime}</Text>
        </View>
        <View style={styles.badgeRow}>
          <View style={styles.badgeReason}>
            <Text style={styles.badgeTextSmall}>{item.reason}</Text>
          </View>
          <View
            style={[
              styles.typeBadge,
              item.bookingType === 'Video Call' ? styles.typeVideo : styles.typeVisit,
            ]}
          >
            <Text style={styles.badgeTextSmall}>{item.bookingType}</Text>
          </View>
        </View>
        <View style={styles.contactRow}>
          <Text style={styles.contactText}>✉ {item.ownerEmail}</Text>
          <Text style={styles.contactText}>📞 {item.ownerPhone}</Text>
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
          <TouchableOpacity style={styles.viewBtn} onPress={() => openDetail(item._id)}>
            <Text style={styles.viewBtnText}>{t('appointments.actions.view')}</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const emptyMessages: Record<Tab, string> = {
    all: t('appointments.empty.all'),
    upcoming: t('appointments.empty.upcoming'),
    cancelled: t('appointments.empty.cancelled'),
    completed: t('appointments.empty.completed'),
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
  petBlock: { flexDirection: 'row', flex: 1, minWidth: 0 },
  petImage: { width: 56, height: 56, borderRadius: 12, marginRight: spacing.sm },
  petImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '30',
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petImageLetter: { ...typography.h3, color: colors.primary },
  petInfo: { flex: 1, minWidth: 0 },
  appointmentNumber: { ...typography.caption, color: colors.textSecondary, marginBottom: 2 },
  petName: { ...typography.body, fontWeight: '600' },
  ownerLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
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
  chatBtn: {},
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

const headerStyles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconText: { fontSize: 18 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
