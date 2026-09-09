import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { AccountMoreMenu, type AccountMoreMenuSection } from '../../components/common/AccountMoreMenu';
import { useVetHeaderSearch } from '../../contexts/VetHeaderSearchContext';
import { useVetHeaderRightAction } from '../../contexts/VetHeaderRightActionContext';
import { spacing } from '../../theme/spacing';
import { useTranslation } from 'react-i18next';
import { useVeterinarianProfile } from '../../queries/veterinarianQueries';
import { getImageUrl } from '../../config/api';

export function VetMoreScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const stackNav = navigation.getParent();
  const headerSearch = useVetHeaderSearch();
  const headerRight = useVetHeaderRightAction();
  const { t } = useTranslation();
  const profileQuery = useVeterinarianProfile();
  const profilePayload: any = profileQuery.data;
  const veterinarianProfile = profilePayload?.data?.data ?? profilePayload?.data ?? profilePayload ?? {};
  const profileUser = veterinarianProfile?.userId ?? veterinarianProfile?.user ?? {};
  const profileImage = profileUser?.profileImage ?? veterinarianProfile?.profileImage ?? user?.profileImage;

  const setHeaderSearchConfig = headerSearch?.setConfig;
  const setHeaderRightAction = headerRight?.setRightAction;

  const menuSections: { title: string; items: { label: string; icon: any; screen: string; description?: string }[] }[] = [
    {
      title: t('more.vet.practice'),
      items: [
        { label: t('menu.petRequests'), icon: 'document-text-outline', screen: 'VetPetRequests', description: t('moreMenu.descriptions.petRequests') },
        { label: t('menu.clinicHours'), icon: 'time-outline', screen: 'VetClinicHours', description: t('moreMenu.descriptions.clinicHours') },
        { label: t('menu.myPetsPatients'), icon: 'paw-outline', screen: 'VetMyPets', description: t('moreMenu.descriptions.patientProfiles') },
        { label: t('menu.vaccinations'), icon: 'medkit-outline', screen: 'VetVaccinations', description: t('moreMenu.descriptions.vaccinations') },
        { label: t('menu.reviews'), icon: 'star-outline', screen: 'VetReviews' },
        { label: t('menu.rescheduleRequests'), icon: 'calendar-outline', screen: 'VetRescheduleRequests' },
      ],
    },
    {
      title: t('more.vet.financeInvoices'),
      items: [
        { label: t('menu.invoices'), icon: 'receipt-outline', screen: 'VetInvoices', description: t('moreMenu.descriptions.invoices') },
        { label: t('menu.paymentSettings'), icon: 'card-outline', screen: 'VetPaymentSettings', description: t('moreMenu.descriptions.paymentSettings') },
      ],
    },
    {
      title: t('more.vet.contentSettings'),
      items: [
        { label: t('menu.clinicAnnouncements'), icon: 'megaphone-outline', screen: 'VetAnnouncements' },
        { label: t('menu.subscription'), icon: 'ribbon-outline', screen: 'VetSubscription' },
        { label: t('menu.profileSettings'), icon: 'person-circle-outline', screen: 'VetProfileSettings', description: t('moreMenu.descriptions.vetProfile') },
        { label: t('menu.notifications'), icon: 'notifications-outline', screen: 'VetNotifications' },
        { label: t('menu.language'), icon: 'language-outline', screen: 'Language' },
        { label: t('menu.changePassword'), icon: 'lock-closed-outline', screen: 'VetChangePassword' },
      ],
    },
  ];

  // More tab: no header search, no right icons
  useFocusEffect(
    React.useCallback(() => {
      setHeaderSearchConfig?.(null);
      setHeaderRightAction?.(null);
      return () => {};
    }, [setHeaderSearchConfig, setHeaderRightAction])
  );

  const onMenuPress = (screen: string) => {
    stackNav?.navigate(screen as never);
  };

  return (
    <ScreenContainer padded>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <AccountMoreMenu
          name={user?.name || t('common.veterinarian')}
          role={t('common.veterinarian')}
          email={user?.email}
          avatar={profileImage ? { uri: getImageUrl(profileImage) ?? profileImage } : null}
          avatarFallback={user?.name || 'V'}
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
