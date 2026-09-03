import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PetOwnerTabParamList } from './types';
import { VetHeaderSearchProvider } from '../contexts/VetHeaderSearchContext';
import { VetHeader } from '../components/common/VetHeader';
import { PetOwnerHomeScreen } from '../screens/petowner/PetOwnerHomeScreen';
import { PetOwnerAppointmentsScreen } from '../screens/petowner/PetOwnerAppointmentsScreen';
import { PetOwnerPharmacyStack } from './PetOwnerPharmacyStack';
import { PetOwnerMessagesScreen } from '../screens/petowner/PetOwnerMessagesScreen';
import { PetOwnerMoreScreen } from '../screens/petowner/PetOwnerMoreScreen';
import { colors } from '../theme/colors';
import { useTranslation } from 'react-i18next';
import { useNotifications, useUnreadNotificationsCount } from '../queries/notificationQueries';
import { useUnreadChatCount } from '../queries/chatQueries';
import { TabBadgeIcon } from '../components/common/TabBadgeIcon';

const Tab = createBottomTabNavigator<PetOwnerTabParamList>();

const TAB_HEADERS: Record<string, { titleKey: string; subtitleKey?: string }> = {
  PetOwnerHome: { titleKey: 'tabs.home', subtitleKey: 'petOwnerTabs.PetOwnerHome.subtitle' },
  PetOwnerAppointments: { titleKey: 'tabs.appointments', subtitleKey: 'petOwnerTabs.PetOwnerAppointments.subtitle' },
  PetOwnerPharmacy: { titleKey: 'tabs.pharmacy', subtitleKey: 'petOwnerTabs.PetOwnerPharmacy.subtitle' },
  PetOwnerMessages: { titleKey: 'tabs.messages', subtitleKey: 'petOwnerTabs.PetOwnerMessages.subtitle' },
  PetOwnerMore: { titleKey: 'tabs.more', subtitleKey: 'petOwnerTabs.PetOwnerMore.subtitle' },
};

function getCount(payload: unknown): number {
  const outer = (payload as { data?: unknown })?.data ?? payload;
  const inner = (outer as { data?: unknown })?.data ?? outer;
  const value = (inner as { unreadCount?: unknown; pagination?: { total?: unknown } })?.unreadCount
    ?? (inner as { pagination?: { total?: unknown } })?.pagination?.total;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function TabIcon({ name, focused, badge }: { name: string; focused: boolean; badge?: number }) {
  const icons: Record<string, string> = {
    PetOwnerHome: 'home-outline',
    PetOwnerAppointments: 'calendar-outline',
    PetOwnerPharmacy: 'bag-handle-outline',
    PetOwnerMessages: 'chatbubbles-outline',
    PetOwnerMore: 'grid-outline',
  };
  return <TabBadgeIcon name={(icons[name] || 'ellipse-outline') as keyof typeof Ionicons.glyphMap} focused={focused} badge={badge} />;
}

function PetOwnerTabHeader({ route }: { route: { name: string } }) {
  const { t } = useTranslation();
  const h = TAB_HEADERS[route.name] || { titleKey: route.name, subtitle: '' };
  return <VetHeader title={t(h.titleKey)} subtitle={h.subtitleKey ? t(h.subtitleKey) : ''} />;
}

export function PetOwnerTabNavigator() {
  const { t } = useTranslation();
  const appointmentNotifications = useNotifications({ type: 'APPOINTMENT', unreadOnly: true, page: 1, limit: 50 }, { refetchInterval: 30_000 });
  const unreadMessages = useUnreadChatCount({ refetchInterval: 30_000 });
  const unreadNotifications = useUnreadNotificationsCount({ refetchInterval: 30_000 });
  const appointmentBadge = getCount(appointmentNotifications.data);
  const messageBadge = getCount(unreadMessages.data);
  const moreBadge = getCount(unreadNotifications.data);
  return (
    <VetHeaderSearchProvider>
    <Tab.Navigator
      screenOptions={({ route }) => {
        const isPharmacy = route.name === 'PetOwnerPharmacy';
        return {
          headerShown: !isPharmacy,
          header: isPharmacy ? undefined : () => <PetOwnerTabHeader route={route} />,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} badge={route.name === 'PetOwnerAppointments' ? appointmentBadge : route.name === 'PetOwnerMessages' ? messageBadge : route.name === 'PetOwnerMore' ? moreBadge : 0} />,
        };
      }}
    >
      <Tab.Screen name="PetOwnerHome" component={PetOwnerHomeScreen} options={{ tabBarLabel: t('tabs.home') }} />
      <Tab.Screen name="PetOwnerAppointments" component={PetOwnerAppointmentsScreen} options={{ tabBarLabel: t('tabs.appointments') }} />
      <Tab.Screen name="PetOwnerPharmacy" component={PetOwnerPharmacyStack} options={{ tabBarLabel: t('tabs.pharmacy') }} />
      <Tab.Screen name="PetOwnerMessages" component={PetOwnerMessagesScreen} options={{ tabBarLabel: t('tabs.messages') }} />
      <Tab.Screen name="PetOwnerMore" component={PetOwnerMoreScreen} options={{ tabBarLabel: t('tabs.more') }} />
    </Tab.Navigator>
    </VetHeaderSearchProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.backgroundCard,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: 8,
    height: 64,
  },
  tabLabel: { fontSize: 12, fontWeight: '600' },
});
