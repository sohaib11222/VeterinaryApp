import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VetHeader } from '../components/common/VetHeader';
import { PharmacyOrdersStackParamList } from './types';
import { PharmacyOrdersListScreen } from '../screens/pharmacy/PharmacyOrdersListScreen';
import { PharmacyOrderDetailsScreen } from '../screens/pharmacy/PharmacyOrderDetailsScreen';
import { PharmacyOrderStatusScreen } from '../screens/pharmacy/PharmacyOrderStatusScreen';

const Stack = createNativeStackNavigator<PharmacyOrdersStackParamList>();

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  PharmacyOrdersList: { title: 'Orders', subtitle: 'Manage orders' },
  PharmacyOrderDetails: { title: 'Order Details', subtitle: '' },
  PharmacyOrderStatus: { title: 'Update Status', subtitle: '' },
};

function Header({ navigation, route }: { navigation: any; route: { name: string } }) {
  const config = TITLES[route.name] || { title: route.name, subtitle: '' };
  const showBack = route.name !== 'PharmacyOrdersList';
  return (
    <VetHeader
      title={config.title}
      subtitle={config.subtitle}
      onBack={showBack ? () => navigation.goBack() : undefined}
    />
  );
}

export function PharmacyOrdersStack() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        header: () => <Header navigation={navigation} route={route} />,
        animation: 'slide_from_right',
      })}
    >
      <Stack.Screen name="PharmacyOrdersList" component={PharmacyOrdersListScreen} />
      <Stack.Screen name="PharmacyOrderDetails" component={PharmacyOrderDetailsScreen} />
      <Stack.Screen name="PharmacyOrderStatus" component={PharmacyOrderStatusScreen} />
    </Stack.Navigator>
  );
}
