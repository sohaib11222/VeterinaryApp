import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VetHeader } from '../components/common/VetHeader';
import { PharmacyMoreStackParamList } from './types';
import { PharmacyMoreScreen } from '../screens/pharmacy/PharmacyMoreScreen';
import { PharmacyProfileScreen } from '../screens/pharmacy/PharmacyProfileScreen';
import { PharmacySubscriptionScreen } from '../screens/pharmacy/PharmacySubscriptionScreen';
import { PharmacyPayoutsScreen } from '../screens/pharmacy/PharmacyPayoutsScreen';
import { PharmacyChangePasswordScreen } from '../screens/pharmacy/PharmacyChangePasswordScreen';

const Stack = createNativeStackNavigator<PharmacyMoreStackParamList>();

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  PharmacyMoreScreen: { title: 'More', subtitle: 'Settings & account' },
  PharmacyProfile: { title: 'Profile', subtitle: 'Store profile' },
  PharmacySubscription: { title: 'Subscription', subtitle: 'Your plan' },
  PharmacyPayouts: { title: 'Payouts', subtitle: 'Earnings' },
  PharmacyChangePassword: { title: 'Change Password', subtitle: '' },
};

function Header({ navigation, route }: { navigation: any; route: { name: string } }) {
  const config = TITLES[route.name] || { title: route.name, subtitle: '' };
  const showBack = route.name !== 'PharmacyMoreScreen';
  return (
    <VetHeader
      title={config.title}
      subtitle={config.subtitle}
      onBack={showBack ? () => navigation.goBack() : undefined}
    />
  );
}

export function PharmacyMoreStack() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        header: () => <Header navigation={navigation} route={route} />,
        animation: 'slide_from_right',
      })}
    >
      <Stack.Screen name="PharmacyMoreScreen" component={PharmacyMoreScreen} />
      <Stack.Screen name="PharmacyProfile" component={PharmacyProfileScreen} />
      <Stack.Screen name="PharmacySubscription" component={PharmacySubscriptionScreen} />
      <Stack.Screen name="PharmacyPayouts" component={PharmacyPayoutsScreen} />
      <Stack.Screen name="PharmacyChangePassword" component={PharmacyChangePasswordScreen} />
    </Stack.Navigator>
  );
}
