import React, { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { AccountMoreMenu, type AccountMoreMenuSection } from '../../components/common/AccountMoreMenu';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { getImageUrl } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { useMyPetSitterProfile } from '../../queries/petSitterQueries';
import { useSupportTicketUnreadCount } from '../../queries/supportTicketQueries';
import { spacing } from '../../theme/spacing';

const unwrap = (response: any) => response?.data?.data ?? response?.data ?? response;
const unread = (response: any) => Number(response?.data?.data?.unreadCount ?? response?.data?.unreadCount ?? response?.unreadCount ?? 0) || 0;

export function PetSitterMoreScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>(); const stack = navigation.getParent(); const { user, logout } = useAuth(); const profileQuery = useMyPetSitterProfile(); const supportQuery = useSupportTicketUnreadCount({ refetchInterval: 15_000 });
  const sitter = useMemo(() => unwrap(profileQuery.data), [profileQuery.data]);
  const sections = [{ title: t('petSitter.more.careProfile'), items: [{ label: t('petSitter.more.profile'), icon: 'person-circle-outline', screen: 'PetSitterProfile', description: t('petSitter.more.profileText') }, { label: t('petSitter.more.availability'), icon: 'paw-outline', screen: 'PetSitterProfile', description: t('petSitter.more.availabilityText') }] }, { title: t('petSitter.more.supportSettings'), items: [{ label: t('petSitter.more.support'), icon: 'headset-outline', screen: 'PetSitterSupportTickets', description: t('petSitter.more.supportText'), badge: unread(supportQuery.data) }, { label: t('petSitter.more.notifications'), icon: 'notifications-outline', screen: 'PetSitterNotifications', description: t('petSitter.more.notificationsText') }, { label: t('petSitter.more.language'), icon: 'language-outline', screen: 'Language' }, { label: t('petSitter.more.changePassword'), icon: 'lock-closed-outline', screen: 'PetSitterChangePassword', description: t('petSitter.more.changePasswordText') }] }];
  return <ScreenContainer padded><ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><AccountMoreMenu name={sitter?.name ?? sitter?.fullName ?? user?.name ?? t('petSitter.more.role')} role={t('petSitter.more.role')} email={user?.email} avatar={sitter?.profileImage ? { uri: getImageUrl(sitter.profileImage) ?? sitter.profileImage } : null} avatarFallback={user?.name ?? 'S'} accountLabel={t('petSitter.more.account')} sections={sections.map((section) => ({ title: section.title, items: section.items.map((item) => ({ ...item, onPress: () => stack?.navigate(item.screen) })) })) as AccountMoreMenuSection[]} logoutLabel={t('petSitter.more.logout')} onLogout={logout} /></ScrollView></ScreenContainer>;
}
const styles = StyleSheet.create({ scroll: { flex: 1 }, content: { paddingBottom: spacing.xxl } });
