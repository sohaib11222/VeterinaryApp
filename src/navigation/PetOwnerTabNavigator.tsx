import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';
import { PetOwnerTabParamList } from './types';
import { VetHeaderSearchProvider } from '../contexts/VetHeaderSearchContext';
import { VetHeader } from '../components/common/VetHeader';
import { PetOwnerHomeScreen } from '../screens/petowner/PetOwnerHomeScreen';
import { PetOwnerAppointmentsScreen } from '../screens/petowner/PetOwnerAppointmentsScreen';
import { PetOwnerPharmacyStack } from './PetOwnerPharmacyStack';
import { PetOwnerMessagesScreen } from '../screens/petowner/PetOwnerMessagesScreen';
import { PetOwnerMoreScreen } from '../screens/petowner/PetOwnerMoreScreen';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const Tab = createBottomTabNavigator<PetOwnerTabParamList>();

const TAB_HEADERS: Record<string, { title: string; subtitle?: string }> = {
  PetOwnerHome: { title: 'Pet Dashboard', subtitle: "Your pets' health at a glance" },
  PetOwnerAppointments: { title: 'Pet Appointments', subtitle: 'Schedule & manage' },
  PetOwnerPharmacy: { title: 'Pharmacy & Shop', subtitle: 'Pet supplies' },
  PetOwnerMessages: { title: 'Messages', subtitle: 'Chat with veterinarians' },
  PetOwnerMore: { title: 'More', subtitle: 'Settings & more' },
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    PetOwnerHome: '🏠',
    PetOwnerAppointments: '📅',
    PetOwnerPharmacy: '🛒',
    PetOwnerMessages: '💬',
    PetOwnerMore: '⋯',
  };
  return <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icons[name] || '•'}</Text>;
}

function PetOwnerTabHeader({ route }: { route: { name: string } }) {
  const h = TAB_HEADERS[route.name] || { title: route.name, subtitle: '' };
  return <VetHeader title={h.title} subtitle={h.subtitle} />;
}

export function PetOwnerTabNavigator() {
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
          tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        };
      }}
    >
      <Tab.Screen name="PetOwnerHome" component={PetOwnerHomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="PetOwnerAppointments" component={PetOwnerAppointmentsScreen} options={{ tabBarLabel: 'Appointments' }} />
      <Tab.Screen name="PetOwnerPharmacy" component={PetOwnerPharmacyStack} options={{ tabBarLabel: 'Pharmacy' }} />
      <Tab.Screen name="PetOwnerMessages" component={PetOwnerMessagesScreen} options={{ tabBarLabel: 'Messages' }} />
      <Tab.Screen name="PetOwnerMore" component={PetOwnerMoreScreen} options={{ tabBarLabel: 'More' }} />
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
  tabIcon: { fontSize: 20, opacity: 0.7 },
  tabIconActive: { opacity: 1 },
});
