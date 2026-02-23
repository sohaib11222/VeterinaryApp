import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';
import { PharmacyTabParamList } from './types';
import { PharmacyDashboardScreen } from '../screens/pharmacy/PharmacyDashboardScreen';
import { PharmacyProductsStack } from './PharmacyProductsStack';
import { PharmacyOrdersStack } from './PharmacyOrdersStack';
import { PharmacyMoreStack } from './PharmacyMoreStack';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const Tab = createBottomTabNavigator<PharmacyTabParamList>();

const TAB_LABELS: Record<string, string> = {
  PharmacyDashboard: 'Dashboard',
  PharmacyProducts: 'Products',
  PharmacyOrders: 'Orders',
  PharmacyMore: 'More',
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    PharmacyDashboard: '📊',
    PharmacyProducts: '📦',
    PharmacyOrders: '📋',
    PharmacyMore: '⋯',
  };
  return <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icons[name] || '•'}</Text>;
}

export function PharmacyTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen
        name="PharmacyDashboard"
        component={PharmacyDashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="PharmacyProducts"
        component={PharmacyProductsStack}
        options={{ tabBarLabel: 'Products' }}
      />
      <Tab.Screen
        name="PharmacyOrders"
        component={PharmacyOrdersStack}
        options={{ tabBarLabel: 'Orders' }}
      />
      <Tab.Screen
        name="PharmacyMore"
        component={PharmacyMoreStack}
        options={{ tabBarLabel: 'More' }}
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
  tabIcon: { fontSize: 20, opacity: 0.7 },
  tabIconActive: { opacity: 1 },
});
