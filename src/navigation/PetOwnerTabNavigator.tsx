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
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator<PetOwnerTabParamList>();

const TAB_HEADERS: Record<string, { titleKey: string; subtitleKey?: string }> = {
  PetOwnerHome: { titleKey: 'tabs.home', subtitleKey: 'petOwnerTabs.PetOwnerHome.subtitle' },
  PetOwnerAppointments: { titleKey: 'tabs.appointments', subtitleKey: 'petOwnerTabs.PetOwnerAppointments.subtitle' },
  PetOwnerPharmacy: { titleKey: 'tabs.pharmacy', subtitleKey: 'petOwnerTabs.PetOwnerPharmacy.subtitle' },
  PetOwnerMessages: { titleKey: 'tabs.messages', subtitleKey: 'petOwnerTabs.PetOwnerMessages.subtitle' },
  PetOwnerMore: { titleKey: 'tabs.more', subtitleKey: 'petOwnerTabs.PetOwnerMore.subtitle' },
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    PetOwnerHome: '🏠',
    PetOwnerAppointments: '📅',
    PetOwnerPharmacy: '🛒',
    PetOwnerMessages: '💬',
    PetOwnerMore: '⋯',
  };
  return (
    <Text style={[styles.tabIcon, { color: focused ? colors.tabActive : colors.tabInactive }, focused && styles.tabIconActive]}>
      {icons[name] || '•'}
    </Text>
  );
}

function PetOwnerTabHeader({ route }: { route: { name: string } }) {
  const { t } = useTranslation();
  const h = TAB_HEADERS[route.name] || { titleKey: route.name, subtitle: '' };
  return <VetHeader title={t(h.titleKey)} subtitle={h.subtitleKey ? t(h.subtitleKey) : ''} />;
}

export function PetOwnerTabNavigator() {
  const { t } = useTranslation();
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
  tabIcon: { fontSize: 20, opacity: 0.7 },
  tabIconActive: { opacity: 1 },
});
