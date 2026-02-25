import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VetHeader } from '../components/common/VetHeader';
import { PharmacyProductsStackParamList } from './types';
import { PharmacyProductListScreen } from '../screens/pharmacy/PharmacyProductListScreen';
import { PharmacyAddProductScreen } from '../screens/pharmacy/PharmacyAddProductScreen';
import { PharmacyEditProductScreen } from '../screens/pharmacy/PharmacyEditProductScreen';
import { PharmacyProductDetailsScreen } from '../screens/pharmacy/PharmacyProductDetailsScreen';

const Stack = createNativeStackNavigator<PharmacyProductsStackParamList>();

const TITLES: Record<string, { title: string; subtitle?: string }> = {
  PharmacyProductList: { title: 'Products', subtitle: 'Manage your products' },
  PharmacyAddProduct: { title: 'Add Product', subtitle: 'New product' },
  PharmacyEditProduct: { title: 'Edit Product', subtitle: 'Update product' },
  PharmacyProductDetails: { title: 'Product Details', subtitle: '' },
};

function Header({ navigation, route }: { navigation: any; route: { name: string } }) {
  const config = TITLES[route.name] || { title: route.name, subtitle: '' };
  const showBack = route.name !== 'PharmacyProductList';
  return (
    <VetHeader
      title={config.title}
      subtitle={config.subtitle}
      onBack={showBack ? () => navigation.goBack() : undefined}
    />
  );
}

export function PharmacyProductsStack() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        header: () => <Header navigation={navigation} route={route} />,
        animation: 'slide_from_right',
      })}
    >
      <Stack.Screen name="PharmacyProductList" component={PharmacyProductListScreen} />
      <Stack.Screen name="PharmacyAddProduct" component={PharmacyAddProductScreen} />
      <Stack.Screen name="PharmacyEditProduct" component={PharmacyEditProductScreen} />
      <Stack.Screen name="PharmacyProductDetails" component={PharmacyProductDetailsScreen} />
    </Stack.Navigator>
  );
}
