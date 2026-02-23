import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { useCart } from '../../../contexts/CartContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useCreateOrder } from '../../../mutations/orderMutations';

export function PharmacyCheckoutScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const createOrderMutation = useCreateOrder();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    shipToDifferentAddress: false,
    shippingLine1: '',
    shippingLine2: '',
    shippingCity: '',
    shippingState: '',
    shippingZip: '',
    shippingCountry: 'Italy',
    orderNotes: '',
    termsAccepted: false,
  });

  useEffect(() => {
    if (user) {
      const parts = (user.name || '').trim().split(/\s+/);
      const firstName = parts[0] ?? '';
      const lastName = parts.slice(1).join(' ') ?? '';
      setFormData((prev) => ({
        ...prev,
        firstName: prev.firstName || firstName,
        lastName: prev.lastName || lastName,
        email: prev.email || (user as { email?: string }).email || '',
        phone: prev.phone || (user as { phone?: string }).phone || '',
      }));
    }
  }, [user]);

  const subtotal = getCartTotal();
  const shipping = 0;
  const total = subtotal;

  const update = (key: string) => (value: string | boolean) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (cartItems.length === 0 && !createOrderMutation.isPending) {
      Toast.show({ type: 'info', text1: 'Cart is empty', text2: 'Add products to checkout.' });
      const parent = navigation.getParent?.();
      const root = parent?.getParent?.();
      if (root?.navigate) {
        root.navigate('PetOwnerOrderHistory');
      } else {
        navigation.navigate('PharmacyHome');
      }
    }
  }, [cartItems.length, createOrderMutation.isPending, navigation]);

  const handlePlaceOrder = async () => {
    if (!user) {
      Toast.show({ type: 'error', text1: 'Please log in to place an order.' });
      return;
    }
    if (!formData.termsAccepted) {
      Toast.show({ type: 'error', text1: 'Please accept the Terms & Conditions.' });
      return;
    }
    const orderItems = cartItems
      .filter((item) => (item.quantity || 0) > 0)
      .map((item) => ({
        productId: String(item._id),
        quantity: item.quantity || 1,
      }));
    if (orderItems.length === 0) {
      Toast.show({ type: 'error', text1: 'Your cart is empty.' });
      return;
    }
    let shippingAddress: { line1: string; line2?: string; city: string; state: string; country: string; zip: string } | undefined;
    if (formData.shipToDifferentAddress) {
      const hasRequired =
        formData.shippingLine1?.trim() &&
        formData.shippingCity?.trim() &&
        formData.shippingState?.trim() &&
        formData.shippingZip?.trim();
      if (!hasRequired) {
        Toast.show({ type: 'error', text1: 'Please fill all required shipping fields.' });
        return;
      }
      shippingAddress = {
        line1: formData.shippingLine1.trim(),
        line2: formData.shippingLine2?.trim() || undefined,
        city: formData.shippingCity.trim(),
        state: formData.shippingState.trim(),
        country: formData.shippingCountry?.trim() || 'Italy',
        zip: formData.shippingZip.trim(),
      };
    }
    try {
      await createOrderMutation.mutateAsync({ items: orderItems, shippingAddress });
      clearCart();
      Toast.show({ type: 'success', text1: 'Order placed', text2: 'You can pay when shipping is set.' });
      const parent = navigation.getParent?.();
      const root = parent?.getParent?.();
      if (root?.navigate) {
        root.navigate('PetOwnerOrderHistory');
      } else {
        navigation.navigate('PharmacyHome');
      }
    } catch (err: unknown) {
      const errObj = err as { message?: string; data?: { message?: string } };
      const message =
        errObj?.data?.message ||
        errObj?.message ||
        (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : null) ||
        'Failed to place order';
      Toast.show({ type: 'error', text1: 'Order failed', text2: String(message) });
    }
  };

  if (cartItems.length === 0 && !createOrderMutation.isPending) {
    return (
      <ScreenContainer padded>
        <Text style={styles.redirectText}>Redirecting...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Billing Details – single column like mydoctor-app */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing details</Text>

          <Text style={styles.subSectionTitle}>Personal information</Text>
          <Input
            label="First name"
            value={formData.firstName}
            onChangeText={update('firstName') as (t: string) => void}
            placeholder="First name"
          />
          <Input
            label="Last name"
            value={formData.lastName}
            onChangeText={update('lastName') as (t: string) => void}
            placeholder="Last name"
          />
          <Input
            label="Email"
            value={formData.email}
            onChangeText={update('email') as (t: string) => void}
            placeholder="Email"
            keyboardType="email-address"
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChangeText={update('phone') as (t: string) => void}
            placeholder="Phone"
            keyboardType="phone-pad"
          />

          <Text style={styles.subSectionTitle}>Shipping details</Text>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() =>
              update('shipToDifferentAddress')(
                !formData.shipToDifferentAddress
              )
            }
          >
            <View
              style={[
                styles.checkbox,
                formData.shipToDifferentAddress && styles.checkboxChecked,
              ]}
            >
              {formData.shipToDifferentAddress && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              Ship to a different address?
            </Text>
          </TouchableOpacity>
          {formData.shipToDifferentAddress && (
            <>
              <Input
                label="Address line 1"
                value={formData.shippingLine1}
                onChangeText={update('shippingLine1') as (t: string) => void}
                placeholder="Street address"
              />
              <Input
                label="Address line 2 (optional)"
                value={formData.shippingLine2}
                onChangeText={update('shippingLine2') as (t: string) => void}
                placeholder="Apartment, suite..."
              />
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label="City"
                    value={formData.shippingCity}
                    onChangeText={update('shippingCity') as (t: string) => void}
                    placeholder="City"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Input
                    label="State"
                    value={formData.shippingState}
                    onChangeText={update('shippingState') as (t: string) => void}
                    placeholder="State"
                  />
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Input
                    label="Country"
                    value={formData.shippingCountry}
                    onChangeText={update('shippingCountry') as (t: string) => void}
                    placeholder="Country"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Input
                    label="ZIP code"
                    value={formData.shippingZip}
                    onChangeText={update('shippingZip') as (t: string) => void}
                    placeholder="ZIP"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </>
          )}
          <View style={styles.textAreaContainer}>
            <Text style={styles.label}>Order notes (optional)</Text>
            <TextInput
              style={styles.textArea}
              value={formData.orderNotes}
              onChangeText={update('orderNotes') as (t: string) => void}
              placeholder="Notes about your order..."
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={4}
            />
          </View>

          <Text style={styles.subSectionTitle}>Payment method</Text>
          <View style={styles.paymentOption}>
            <View style={[styles.radio, styles.radioChecked]}>
              <View style={styles.radioInner} />
            </View>
            <Text style={styles.paymentOptionText}>Card / Stripe</Text>
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => update('termsAccepted')(!formData.termsAccepted)}
          >
            <View
              style={[
                styles.checkbox,
                formData.termsAccepted && styles.checkboxChecked,
              ]}
            >
              {formData.termsAccepted && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              I have read and accept the{' '}
              <Text style={styles.linkText}>Terms & Conditions</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Order summary */}
        <View style={styles.orderSummary}>
          <Text style={styles.orderSummaryTitle}>Your order</Text>
          <View style={styles.orderItemsList}>
            {cartItems.map((item) => {
              const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);
              return (
                <View key={item._id} style={styles.orderItem}>
                  <Text style={styles.orderItemName} numberOfLines={2}>
                    {item.name}{' '}
                    <Text style={styles.orderItemQuantity}>x{item.quantity}</Text>
                  </Text>
                  <Text style={styles.orderItemTotal}>€{lineTotal.toFixed(2)}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.orderTotals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>€{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Shipping</Text>
              <Text style={styles.totalValue}>
                {shipping === 0 ? (
                  <Text style={styles.freeShippingText}>Free</Text>
                ) : (
                  `€${shipping.toFixed(2)}`
                )}
              </Text>
            </View>
            <View style={[styles.totalRow, styles.totalRowMain]}>
              <Text style={styles.totalLabelMain}>Total</Text>
              <Text style={styles.totalValueMain}>€{total.toFixed(2)}</Text>
            </View>
          </View>
          {!user && (
            <Text style={styles.loginHint}>Please log in to place an order.</Text>
          )}
          <Button
            title={createOrderMutation.isPending ? 'Placing order...' : 'Place order'}
            onPress={handlePlaceOrder}
            disabled={!user || !formData.termsAccepted || createOrderMutation.isPending}
            style={styles.submitButton}
          />
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  halfInput: { flex: 1 },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
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
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '500',
  },
  textAreaContainer: { marginTop: spacing.xs },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentOption: { marginBottom: spacing.sm },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  radioChecked: { borderColor: colors.primary },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  paymentOptionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  orderSummary: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderSummaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  orderItemsList: { marginBottom: spacing.lg },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  orderItemName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginRight: 12,
  },
  orderItemQuantity: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  orderItemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  orderTotals: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalRowMain: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: { fontSize: 14, color: colors.text },
  totalValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  totalLabelMain: { fontSize: 18, fontWeight: '600', color: colors.text },
  totalValueMain: { fontSize: 18, fontWeight: '700', color: colors.primary },
  submitButton: { marginTop: spacing.lg },
  freeShippingText: {
    color: colors.success,
    fontWeight: '600',
  },
  bottomSpacer: { height: spacing.xxl },
  redirectText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.lg },
  loginHint: { fontSize: 14, color: colors.warning, marginBottom: spacing.sm, textAlign: 'center' },
});
