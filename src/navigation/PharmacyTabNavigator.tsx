import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PharmacyTabParamList } from './types';
import { PharmacyDashboardScreen } from '../screens/pharmacy/PharmacyDashboardScreen';
import { PharmacyProductsStack } from './PharmacyProductsStack';
import { PharmacyOrdersStack } from './PharmacyOrdersStack';
import { PharmacyMoreStack } from './PharmacyMoreStack';
import { colors } from '../theme/colors';
import { useTranslation } from 'react-i18next';
import { useNotifications, useUnreadNotificationsCount } from '../queries/notificationQueries';
import { TabBadgeIcon } from '../components/common/TabBadgeIcon';

const Tab = createBottomTabNavigator<PharmacyTabParamList>();

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
    PharmacyDashboard: 'grid-outline',
    PharmacyProducts: 'cube-outline',
    PharmacyOrders: 'receipt-outline',
    PharmacyMore: 'ellipsis-horizontal-circle-outline',
  };
  return <TabBadgeIcon name={(icons[name] || 'ellipse-outline') as keyof typeof Ionicons.glyphMap} focused={focused} badge={badge} />;
}

export function PharmacyTabNavigator() {
  const { t } = useTranslation();
  const orderNotifications = useNotifications({ type: 'ORDER', unreadOnly: true, page: 1, limit: 50 }, { refetchInterval: 10_000 });
  const unreadNotifications = useUnreadNotificationsCount({ refetchInterval: 30_000 });
  const ordersBadge = getCount(orderNotifications.data);
  const moreBadge = getCount(unreadNotifications.data);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} badge={route.name === 'PharmacyOrders' ? ordersBadge : route.name === 'PharmacyMore' ? moreBadge : 0} />,
      })}
    >
      <Tab.Screen
        name="PharmacyDashboard"
        component={PharmacyDashboardScreen}
        options={{ tabBarLabel: t('screens.dashboard') }}
      />
      <Tab.Screen
        name="PharmacyProducts"
        component={PharmacyProductsStack}
        options={{ tabBarLabel: t('screens.products') }}
      />
      <Tab.Screen
        name="PharmacyOrders"
        component={PharmacyOrdersStack}
        options={{ tabBarLabel: t('screens.orders') }}
      />
      <Tab.Screen
        name="PharmacyMore"
        component={PharmacyMoreStack}
        options={{ tabBarLabel: t('tabs.more') }}
      />
    </Tab.Navigator>
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
