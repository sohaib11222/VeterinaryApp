import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VetHeader } from '../components/common/VetHeader';
import { PetOwnerPharmacyStackParamList } from './types';
import { PharmacyHomeScreen } from '../screens/petowner/pharmacy/PharmacyHomeScreen';
import { PharmacySearchScreen } from '../screens/petowner/pharmacy/PharmacySearchScreen';
import { PharmacyDetailsScreen } from '../screens/petowner/pharmacy/PharmacyDetailsScreen';
import { ProductCatalogScreen } from '../screens/petowner/pharmacy/ProductCatalogScreen';
import { ProductDetailsScreen } from '../screens/petowner/pharmacy/ProductDetailsScreen';
import { PharmacyCartScreen } from '../screens/petowner/pharmacy/PharmacyCartScreen';
import { PharmacyCheckoutScreen } from '../screens/petowner/pharmacy/PharmacyCheckoutScreen';
import { PharmacyPaymentSuccessScreen } from '../screens/petowner/pharmacy/PharmacyPaymentSuccessScreen';
import { useCart } from '../contexts/CartContext';
import { colors } from '../theme/colors';
import { useTranslation } from 'react-i18next';

const Stack = createNativeStackNavigator<PetOwnerPharmacyStackParamList>();

const SCREENS_WITH_CART_ICON = ['PharmacySearch', 'PharmacyDetails', 'ProductCatalog', 'ProductDetails'];

function PharmacyStackHeader({
  navigation,
  route,
}: {
  navigation: any;
  route: { name: string; params?: any };
}) {
  const { t } = useTranslation();
  const title = t(`petOwnerPharmacyStack.${route.name}.title`, { defaultValue: route.name });
  const subtitle = t(`petOwnerPharmacyStack.${route.name}.subtitle`, { defaultValue: '' });
  const showBack = route.name !== 'PharmacyHome';
  const { getCartItemCount } = useCart();
  const cartCount = getCartItemCount();
  const showCartIcon = SCREENS_WITH_CART_ICON.includes(route.name);

  const rightAction = showCartIcon ? (
    <TouchableOpacity style={headerStyles.cartBtn} onPress={() => navigation.navigate('Cart')}>
      <Text style={headerStyles.cartIcon}>🛒</Text>
      {cartCount > 0 && (
        <View style={headerStyles.cartBadge}>
          <Text style={headerStyles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  ) : undefined;

  return (
    <VetHeader
      title={title}
      subtitle={subtitle}
      onBack={showBack ? () => navigation.goBack() : undefined}
      rightAction={rightAction}
    />
  );
}

const headerStyles = StyleSheet.create({
  cartBtn: { position: 'relative', padding: 8 },
  cartIcon: { fontSize: 22 },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { color: colors.textInverse, fontSize: 10, fontWeight: '600' },
});

export function PetOwnerPharmacyStack() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        header: () => <PharmacyStackHeader navigation={navigation} route={route} />,
        animation: 'slide_from_right',
      })}
    >
      <Stack.Screen
        name="PharmacyHome"
        component={PharmacyHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="PharmacySearch" component={PharmacySearchScreen} />
      <Stack.Screen name="PharmacyDetails" component={PharmacyDetailsScreen} />
      <Stack.Screen name="ProductCatalog" component={ProductCatalogScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="Cart" component={PharmacyCartScreen} />
      <Stack.Screen name="Checkout" component={PharmacyCheckoutScreen} />
      <Stack.Screen name="PaymentSuccess" component={PharmacyPaymentSuccessScreen} />
    </Stack.Navigator>
  );
}
