import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AccountMoreMenu, type AccountMoreMenuSection } from '../../components/common/AccountMoreMenu';
import { useVetHeaderSearch } from '../../contexts/VetHeaderSearchContext';
import { spacing } from '../../theme/spacing';
import { useTranslation } from 'react-i18next';
import { useSupportTicketUnreadCount } from '../../queries/supportTicketQueries';

function getUnreadCount(payload: unknown): number {
  const outer = (payload as { data?: unknown })?.data ?? payload;
  const data = (outer as { data?: unknown })?.data ?? outer;
  const count = Number((data as { unreadCount?: unknown })?.unreadCount ?? 0);
  return Number.isFinite(count) ? count : 0;
}

export function PetOwnerMoreScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const stackNav = navigation.getParent();
  const headerSearch = useVetHeaderSearch();
  const { t } = useTranslation();
  const supportUnread = useSupportTicketUnreadCount({ refetchInterval: 15_000 });
  const supportBadge = getUnreadCount(supportUnread.data);

  const menuSections: { title: string; items: { label: string; icon: any; screen: string; description?: string; badge?: number }[] }[] = [
    {
      title: t('more.petOwner.myPetsHealth'),
      items: [
        { label: t('menu.myPets'), icon: 'paw-outline', screen: 'PetOwnerMyPets', description: t('moreMenu.descriptions.petProfiles') },
        { label: t('menu.petMedicalRecords'), icon: 'medkit-outline', screen: 'PetOwnerMedicalRecords', description: t('moreMenu.descriptions.medicalRecords') },
        { label: t('menu.weightRecords'), icon: 'analytics-outline', screen: 'PetOwnerWeightRecords', description: t('moreMenu.descriptions.weightHistory') },
      ],
    },
    {
      title: t('more.petOwner.appointmentsFavourites'),
      items: [
        { label: t('menu.favoriteVets'), icon: 'heart-outline', screen: 'PetOwnerFavourites', description: t('moreMenu.descriptions.favouriteVets') },
        { label: t('menu.requestReschedule'), icon: 'calendar-outline', screen: 'PetOwnerRequestReschedule' },
        { label: t('menu.rescheduleRequests'), icon: 'repeat-outline', screen: 'PetOwnerRescheduleRequests' },
      ],
    },
    {
      title: t('more.petOwner.financeOrders'),
      items: [
        { label: t('menu.veterinaryInvoices'), icon: 'receipt-outline', screen: 'PetOwnerInvoices' },
        { label: t('menu.petSupplyOrders'), icon: 'bag-handle-outline', screen: 'PetOwnerOrderHistory' },
      ],
    },
    {
      title: t('more.petOwner.settingsMore'),
      items: [
        { label: 'Support tickets', icon: 'headset-outline', screen: 'PetOwnerSupportTickets', description: 'Get help and track replies', badge: supportBadge },
        { label: t('menu.nearbyClinics'), icon: 'location-outline', screen: 'PetOwnerClinicMap' },
        { label: t('menu.notifications'), icon: 'notifications-outline', screen: 'PetOwnerNotifications' },
        { label: t('menu.accountSettings'), icon: 'person-circle-outline', screen: 'PetOwnerProfileSettings' },
        { label: t('menu.language'), icon: 'language-outline', screen: 'Language' },
        { label: t('menu.changePassword'), icon: 'lock-closed-outline', screen: 'PetOwnerChangePassword' },
      ],
    },
  ];
  useFocusEffect(React.useCallback(() => {
    headerSearch?.setConfig(null);
    return () => {};
  }, [headerSearch]));

  const onMenuPress = (screen: string) => {
    if (stackNav) {
      stackNav.navigate(screen as never);
      return;
    }
    navigation.navigate(screen as never);
  };

  return (
    <ScreenContainer padded>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <AccountMoreMenu
          name={user?.name || t('petOwnerMore.defaults.petOwnerName')}
          role={t('petOwnerMore.role')}
          email={user?.email}
          avatarFallback={user?.name || t('petOwnerMore.defaults.avatarLetter')}
          accountLabel={t('moreMenu.account')}
          sections={menuSections.map((section) => ({
            title: section.title,
          items: section.items.map((item) => ({ ...item, onPress: () => onMenuPress(item.screen) })),
          })) as AccountMoreMenuSection[]}
          logoutLabel={t('common.logout')}
          onLogout={logout}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
});
