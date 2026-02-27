import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Button } from '../../../components/common/Button';
import { PetOwnerPharmacyStackParamList } from '../../../navigation/types';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { useCart } from '../../../contexts/CartContext';
import { getImageUrl } from '../../../config/api';
import { useTranslation } from 'react-i18next';

type Nav = NativeStackNavigationProp<PetOwnerPharmacyStackParamList>;

export function PharmacyCartScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
  } = useCart();

  const subtotal = getCartTotal();
  const shipping = subtotal >= 50 ? 0 : 5;
  const total = subtotal + shipping;

  if (cartItems.length === 0) {
    return (
      <ScreenContainer padded>
        <View style={styles.emptyCart}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>{t('petOwnerPharmacyCart.empty.title')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('petOwnerPharmacyCart.empty.subtitle')}
          </Text>
          <Button
            title={t('petOwnerPharmacyCart.actions.startShopping')}
            onPress={() => navigation.navigate('ProductCatalog', {})}
            style={styles.shopButton}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.cartItemsSection}>
          {cartItems.map((item) => {
            const id = item._id;
            const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);
            const imageUri = getImageUrl(item.image ?? undefined);
            return (
              <View key={id} style={styles.cartItem}>
                <TouchableOpacity onPress={() => navigation.navigate('ProductDetails', { productId: id })}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.itemImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.itemImage} />
                  )}
                </TouchableOpacity>
                <View style={styles.itemDetails}>
                  <TouchableOpacity onPress={() => navigation.navigate('ProductDetails', { productId: id })}>
                    <Text style={styles.itemName}>{item.name}</Text>
                  </TouchableOpacity>
                  {item.sku ? <Text style={styles.itemSku}>{t('petOwnerPharmacyCart.labels.sku', { sku: item.sku })}</Text> : null}
                  <Text style={styles.itemPrice}>€{Number(item.price || 0).toFixed(2)}</Text>
                  <View style={styles.quantitySection}>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(id, Math.max(0, (item.quantity || 0) - 1))}
                      >
                        <Text style={styles.quantityButtonText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.quantityValue}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(id, (item.quantity || 0) + 1)}
                      >
                        <Text style={styles.quantityButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.itemTotal}>€{lineTotal.toFixed(2)}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.removeButton} onPress={() => removeFromCart(id)}>
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View style={styles.checkoutSection}>
          <TouchableOpacity style={styles.clearCartButton} onPress={clearCart}>
            <Text style={styles.clearCartButtonText}>{t('petOwnerPharmacyCart.actions.clearCart')}</Text>
          </TouchableOpacity>
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('petOwnerPharmacyCart.totals.subtotal')}</Text>
              <Text style={styles.totalValue}>€{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('petOwnerPharmacyCart.totals.shipping')}</Text>
              <Text style={styles.totalValue}>
                {shipping === 0 ? (
                  <Text style={styles.freeShippingText}>{t('petOwnerPharmacyCart.totals.free')}</Text>
                ) : (
                  `€${shipping.toFixed(2)}`
                )}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('petOwnerPharmacyCart.totals.total')}</Text>
              <Text style={styles.totalValueMain}>€{total.toFixed(2)}</Text>
            </View>
            <Button
              title={t('petOwnerPharmacyCart.actions.proceedToCheckout')}
              onPress={() => navigation.navigate('Checkout')}
              style={styles.checkoutButton}
            />
          </View>
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cartItemsSection: {
    paddingVertical: spacing.sm,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: spacing.sm,
    backgroundColor: colors.backgroundTertiary,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  itemSku: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
  },
  quantityValue: {
    width: 50,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: 8,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  removeButton: {
    padding: spacing.sm,
    alignSelf: 'flex-start',
  },
  removeButtonText: {
    fontSize: 18,
    color: colors.error,
    fontWeight: '600',
  },
  emptyCart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  shopButton: {
    paddingHorizontal: 32,
  },
  checkoutSection: {
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textInverse,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  clearCartButton: {
    marginTop: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
    alignSelf: 'flex-start',
  },
  clearCartButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
  totalSection: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalValueMain: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  checkoutButton: {
    marginTop: spacing.sm,
  },
  freeShippingText: {
    color: colors.success,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
