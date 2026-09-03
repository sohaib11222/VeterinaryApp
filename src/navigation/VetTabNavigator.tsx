import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VetTabParamList } from './types';
import { VetHeaderSearchProvider } from '../contexts/VetHeaderSearchContext';
import { VetHeaderRightActionProvider, useVetHeaderRightAction } from '../contexts/VetHeaderRightActionContext';
import { useAuth } from '../contexts/AuthContext';
import { VetHeader } from '../components/common/VetHeader';
import { VetDashboardScreen } from '../screens/vet/VetDashboardScreen';
import { VetAppointmentsScreen } from '../screens/vet/VetAppointmentsScreen';
import { VetMessagesScreen } from '../screens/vet/VetMessagesScreen';
import { VetMoreScreen } from '../screens/vet/VetMoreScreen';
import { colors } from '../theme/colors';
import { useTranslation } from 'react-i18next';
import { useNotifications, useUnreadNotificationsCount } from '../queries/notificationQueries';
import { useUnreadChatCount } from '../queries/chatQueries';
import { TabBadgeIcon } from '../components/common/TabBadgeIcon';

const Tab = createBottomTabNavigator<VetTabParamList>();

const TAB_HEADERS: Record<string, { titleKey: string; subtitle?: string }> = {
  VetDashboard: { titleKey: 'tabs.home', subtitle: 'Pet care at a glance' },
  VetAppointments: { titleKey: 'tabs.appointments', subtitle: 'Schedule & manage' },
  VetMessages: { titleKey: 'tabs.messages', subtitle: 'Chat with pet owners' },
  VetMore: { titleKey: 'tabs.more', subtitle: 'Account & settings' },
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
    VetDashboard: 'home-outline',
    VetAppointments: 'calendar-outline',
    VetMessages: 'chatbubbles-outline',
    VetMore: 'grid-outline',
  };
  return <TabBadgeIcon name={(icons[name] || 'ellipse-outline') as keyof typeof Ionicons.glyphMap} focused={focused} badge={badge} />;
}

function VetTabHeader({ route }: { route: { name: string } }) {
  const rightActionCtx = useVetHeaderRightAction();
  const { user } = useAuth();
  const { t } = useTranslation();
  const h = TAB_HEADERS[route.name] || { titleKey: route.name, subtitle: '' };
  // More screen: header like mydoctor-app – title "More", subtitle = user name
  const title = route.name === 'VetMore' ? t('tabs.more') : t(h.titleKey);
  const subtitle = route.name === 'VetMore' ? (user?.name ?? h.subtitle) : h.subtitle;
  return (
    <VetHeader
      title={title}
      subtitle={subtitle}
      rightAction={rightActionCtx?.rightAction ?? undefined}
    />
  );
}

export function VetTabNavigator() {
  const { t } = useTranslation();
  const appointmentNotifications = useNotifications({ type: 'APPOINTMENT', unreadOnly: true, page: 1, limit: 50 }, { refetchInterval: 30_000 });
  const unreadMessages = useUnreadChatCount({ refetchInterval: 30_000 });
  const unreadNotifications = useUnreadNotificationsCount({ refetchInterval: 30_000 });
  const appointmentBadge = getCount(appointmentNotifications.data);
  const messageBadge = getCount(unreadMessages.data);
  const moreBadge = getCount(unreadNotifications.data);
  return (
    <VetHeaderSearchProvider>
    <VetHeaderRightActionProvider>
    <Tab.Navigator
      screenOptions={({ route }) => {
        return {
          header: () => <VetTabHeader route={route} />,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} badge={route.name === 'VetAppointments' ? appointmentBadge : route.name === 'VetMessages' ? messageBadge : route.name === 'VetMore' ? moreBadge : 0} />,
        };
      }}
    >
      <Tab.Screen
        name="VetDashboard"
        component={VetDashboardScreen}
        options={{ tabBarLabel: t('tabs.home') }}
      />
      <Tab.Screen
        name="VetAppointments"
        component={VetAppointmentsScreen}
        options={{ tabBarLabel: t('tabs.appointments') }}
      />
      <Tab.Screen
        name="VetMessages"
        component={VetMessagesScreen}
        options={{ tabBarLabel: t('tabs.messages') }}
      />
      <Tab.Screen
        name="VetMore"
        component={VetMoreScreen}
        options={{ tabBarLabel: t('tabs.more') }}
      />
    </Tab.Navigator>
    </VetHeaderRightActionProvider>
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
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
