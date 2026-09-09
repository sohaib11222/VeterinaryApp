import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PetSitterTabParamList } from './types';
import { VetHeader } from '../components/common/VetHeader';
import { TabBadgeIcon } from '../components/common/TabBadgeIcon';
import { PetSitterDashboardScreen } from '../screens/petsitter/PetSitterDashboardScreen';
import { PetSitterMessagesScreen } from '../screens/petsitter/PetSitterMessagesScreen';
import { PetSitterMoreScreen } from '../screens/petsitter/PetSitterMoreScreen';
import { useConversations } from '../queries/chatQueries';
import { useUnreadNotificationsCount } from '../queries/notificationQueries';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator<PetSitterTabParamList>();
const count = (response: any) => Number(response?.data?.data?.unreadCount ?? response?.data?.unreadCount ?? response?.unreadCount ?? 0) || 0;
export function PetSitterTabNavigator() {
  const { t } = useTranslation();
  const labels: Record<string, { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }> = { PetSitterDashboard: { title: t('petSitter.tabs.dashboard'), subtitle: t('petSitter.tabs.dashboardSubtitle'), icon: 'home-outline' }, PetSitterChats: { title: t('petSitter.tabs.chats'), subtitle: t('petSitter.tabs.chatsSubtitle'), icon: 'chatbubbles-outline' }, PetSitterMore: { title: t('petSitter.tabs.more'), subtitle: t('petSitter.tabs.moreSubtitle'), icon: 'grid-outline' } };
  const conversations = useConversations({ limit: 50 }, { refetchInterval: 15_000 }); const notifications = useUnreadNotificationsCount({ refetchInterval: 15_000 }); const list = conversations.data?.data?.conversations ?? conversations.data?.conversations ?? []; const chatBadge = Array.isArray(list) ? list.reduce((total: number, item: any) => total + (Number(item?.unreadCount) || 0), 0) : 0;
  return <Tab.Navigator screenOptions={({ route }) => { const meta = labels[route.name]; const badge = route.name === 'PetSitterChats' ? chatBadge : route.name === 'PetSitterMore' ? count(notifications.data) : 0; return { header: () => <VetHeader title={meta.title} subtitle={meta.subtitle} />, tabBarStyle: styles.tab, tabBarActiveTintColor: colors.tabActive, tabBarInactiveTintColor: colors.tabInactive, tabBarLabelStyle: styles.label, tabBarIcon: ({ focused }) => <TabBadgeIcon name={meta.icon} focused={focused} badge={badge} /> }; }}><Tab.Screen name="PetSitterDashboard" component={PetSitterDashboardScreen} options={{ tabBarLabel: t('petSitter.tabs.dashboard') }} /><Tab.Screen name="PetSitterChats" component={PetSitterMessagesScreen} options={{ tabBarLabel: t('petSitter.tabs.chats') }} /><Tab.Screen name="PetSitterMore" component={PetSitterMoreScreen} options={{ tabBarLabel: t('petSitter.tabs.more') }} /></Tab.Navigator>;
}
const styles = StyleSheet.create({ tab: { backgroundColor: colors.backgroundCard, borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 8, height: 64 }, label: { fontSize: 12, fontWeight: '600' } });
