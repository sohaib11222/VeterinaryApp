import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';
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
import { typography } from '../theme/typography';
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator<VetTabParamList>();

const TAB_HEADERS: Record<string, { titleKey: string; subtitle?: string }> = {
  VetDashboard: { titleKey: 'tabs.home', subtitle: 'Pet care at a glance' },
  VetAppointments: { titleKey: 'tabs.appointments', subtitle: 'Schedule & manage' },
  VetMessages: { titleKey: 'tabs.messages', subtitle: 'Chat with pet owners' },
  VetMore: { titleKey: 'tabs.more', subtitle: 'Account & settings' },
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    VetDashboard: '🏠',
    VetAppointments: '📅',
    VetMessages: '💬',
    VetMore: '⋯',
  };
  return (
    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
      {icons[name] || '•'}
    </Text>
  );
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
          tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
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
  tabIcon: {
    fontSize: 20,
    opacity: 0.7,
  },
  tabIconActive: {
    opacity: 1,
  },
});
