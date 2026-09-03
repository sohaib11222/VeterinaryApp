import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AccountMoreMenu, type AccountMoreMenuSection } from '../../components/common/AccountMoreMenu';
import { useVetHeaderSearch } from '../../contexts/VetHeaderSearchContext';
import { spacing } from '../../theme/spacing';
import { useTranslation } from 'react-i18next';
import { usePharmacyPendingPrescriptionCount } from '../../queries/productPrescriptionRequestQueries';
import { useUnreadChatCount } from '../../queries/chatQueries';

function unreadCount(payload: unknown, key: 'pendingCount' | 'unreadCount'): number {
  const outer = (payload as { data?: unknown })?.data ?? payload;
  const inner = (outer as { data?: unknown })?.data ?? outer;
  const number = Number((inner as Record<string, unknown>)?.[key]);
  return Number.isFinite(number) ? number : 0;
}

export function PharmacyMoreScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const headerSearch = useVetHeaderSearch();
  const isParapharmacy = user?.role === 'PARAPHARMACY';
  const { t } = useTranslation();
  const pendingPrescriptions = usePharmacyPendingPrescriptionCount({ enabled: !isParapharmacy, refetchInterval: 30_000 });
  const unreadChat = useUnreadChatCount({ refetchInterval: 30_000 });
  const prescriptionBadge = unreadCount(pendingPrescriptions.data, 'pendingCount');
  const chatBadge = unreadCount(unreadChat.data, 'unreadCount');

  const menuSections = [
    {
      title: isParapharmacy ? t('moreMenu.parapharmacySettings') : t('moreMenu.pharmacySettings'),
      items: [
        { label: t('menu.profile'), icon: 'storefront-outline', screen: 'PharmacyProfile' as const, description: t('moreMenu.descriptions.storeProfile') },
        ...(!isParapharmacy ? [{ label: t('menu.subscription'), icon: 'ribbon-outline', screen: 'PharmacySubscription' as const, description: t('moreMenu.descriptions.subscription') }] : []),
        { label: t('menu.payouts'), icon: 'wallet-outline', screen: 'PharmacyPayouts' as const, description: t('moreMenu.descriptions.payouts') },
        ...(!isParapharmacy ? [{ label: 'Prescription requests', icon: 'document-text-outline' as const, screen: 'PharmacyPrescriptionRequests' as const, description: 'Review medicine approvals', badge: prescriptionBadge }] : []),
        { label: 'Admin messages', icon: 'chatbubble-ellipses-outline', screen: 'PharmacyAdminChat' as const, description: 'Contact platform support', badge: chatBadge },
      ],
    },
    {
      title: t('moreMenu.preferences'),
      items: [
        { label: t('menu.notifications'), icon: 'notifications-outline', screen: 'PharmacyNotifications' as const },
        { label: t('menu.language'), icon: 'language-outline', screen: 'Language' as const },
        { label: t('menu.changePassword'), icon: 'lock-closed-outline', screen: 'PharmacyChangePassword' as const },
      ],
    },
  ];

  useFocusEffect(React.useCallback(() => {
    headerSearch?.setConfig(null);
    return () => {};
  }, [headerSearch]));

  return (
    <ScreenContainer padded>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <AccountMoreMenu
          name={user?.name || (isParapharmacy ? t('more.pharmacy.parapharmacy') : t('more.pharmacy.pharmacy'))}
          role={isParapharmacy ? t('more.pharmacy.parapharmacy') : t('more.pharmacy.pharmacy')}
          email={user?.email}
          avatarFallback={user?.name || t('pharmacyMore.avatarFallback')}
          accountLabel={t('moreMenu.account')}
          sections={menuSections.map((section) => ({
            title: section.title,
            items: section.items.map((item) => ({ ...item, onPress: () => navigation.navigate(item.screen) })),
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
