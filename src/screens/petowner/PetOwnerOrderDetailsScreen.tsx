import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import type { PetOwnerStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useOrder } from '../../queries/orderQueries';
import { usePayForOrder, useCancelOrder } from '../../mutations/orderMutations';
import { getImageUrl } from '../../config/api';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

type Route = RouteProp<PetOwnerStackParamList, 'PetOwnerOrderDetails'>;

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  DELIVERED: { bg: colors.successLight, text: colors.success },
  SHIPPED: { bg: colors.infoLight, text: colors.info },
  PROCESSING: { bg: colors.warningLight, text: colors.warning },
  PENDING: { bg: colors.backgroundTertiary, text: colors.textSecondary },
  CANCELLED: { bg: colors.errorLight, text: colors.error },
  CONFIRMED: { bg: colors.primary + '20', text: colors.primary },
};

function formatDate(dateString: string | undefined, naLabel: string): string {
  if (!dateString) return naLabel;
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PetOwnerOrderDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const orderId = route.params?.orderId;
  const { t } = useTranslation();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data: orderRes, isLoading, isError } = useOrder(orderId ?? null);
  const payMutation = usePayForOrder();
  const cancelMutation = useCancelOrder();

  const order = (orderRes?.data ?? (orderRes as { data?: Record<string, unknown> } | undefined)?.data) as Record<string, unknown> | undefined;

  if (!orderId || isLoading) {
    return (
      <ScreenContainer padded>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.xxl }} />
      </ScreenContainer>
    );
  }
  if (isError || !order) {
    return (
      <ScreenContainer padded>
        <Text style={styles.errorText}>{t('petOwnerOrders.details.notFound')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>{t('petOwnerOrders.details.backToOrders')}</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  const status = String(order.status ?? 'PENDING').toUpperCase();
  const paymentStatus = String(order.paymentStatus ?? 'UNPAID').toUpperCase();
  const finalShipping = order.finalShipping;
  const shippingSet = finalShipping !== null && finalShipping !== undefined;
  const orderNumber = (order.orderNumber as string) ?? orderId;
  const createdAt = formatDate(order.createdAt as string, t('common.na'));
  const subtotal = Number(order.subtotal ?? 0);
  const shipping = Number(order.shipping ?? order.finalShipping ?? 0);
  const total = Number(order.total ?? 0);
  const items = (order.items as Array<{
    productId?: { name?: string; images?: string[] };
    quantity?: number;
    price?: number;
    total?: number;
  }>) ?? [];
  const shippingAddress = order.shippingAddress as { line1?: string; line2?: string; city?: string; state?: string; zip?: string; country?: string } | undefined;
  const pharmacy = order.petStoreId as { name?: string; phone?: string; email?: string; storeType?: string } | undefined;
  const transaction = order.transactionId as { _id?: string; provider?: string; status?: string } | undefined;

  const canPay = paymentStatus === 'UNPAID' && shippingSet && (status === 'PENDING' || status === 'CONFIRMED');
  const canCancel = paymentStatus !== 'PAID' && (status === 'PENDING' || status === 'CONFIRMED');
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.PENDING;

  const handlePay = async () => {
    try {
      await payMutation.mutateAsync({ orderId, data: { paymentMethod: 'STRIPE' } });
      Toast.show({ type: 'success', text1: t('petOwnerOrders.toasts.paymentSuccessful') });
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : t('petOwnerOrders.errors.paymentFailed');
      Toast.show({ type: 'error', text1: msg });
    }
  };

  const handleCancelConfirm = async () => {
    setShowCancelConfirm(false);
    try {
      await cancelMutation.mutateAsync(orderId);
      Toast.show({ type: 'success', text1: t('petOwnerOrders.toasts.orderCancelled') });
      navigation.goBack();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : t('petOwnerOrders.errors.cancelFailed');
      Toast.show({ type: 'error', text1: msg });
    }
  };

  return (
    <ScreenContainer scroll padded>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>{t('petOwnerOrders.details.title')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>{t('petOwnerOrders.details.backToOrders')}</Text>
        </TouchableOpacity>
      </View>

      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCopy}>
            <View style={styles.orderIcon}><Ionicons name="receipt-outline" size={22} color={colors.primaryDark} /></View>
            <Text style={styles.label}>{t('petOwnerOrders.details.summary.orderNumber')}</Text>
            <Text style={styles.orderNo}>#{orderNumber}</Text>
            <Text style={styles.orderDate}>{t('petOwnerOrders.details.summary.orderDate', { date: createdAt })}</Text>
          </View>
          <View style={styles.summaryRight}>
            <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.badgeText, { color: statusStyle.text }]}>{status}</Text>
            </View>
            <View style={styles.paymentStatusRow}><Ionicons name={paymentStatus === 'PAID' ? 'checkmark-circle-outline' : 'card-outline'} size={13} color={paymentStatus === 'PAID' ? colors.success : colors.textSecondary} /><Text style={styles.paymentStatus}>{t('petOwnerOrders.labels.payment', { status: paymentStatus })}</Text></View>
          </View>
        </View>
      </Card>

      {paymentStatus === 'UNPAID' && !shippingSet && (
        <Card style={[styles.alert, styles.alertInfo]}>
          <Ionicons name="time-outline" size={19} color={colors.info} /><Text style={styles.alertText}>{t('petOwnerOrders.details.alerts.waitingShippingFee')}</Text>
        </Card>
      )}
      {paymentStatus === 'UNPAID' && shippingSet && (
        <Card style={[styles.alert, styles.alertWarning]}>
          <Ionicons name="card-outline" size={19} color={colors.warning} /><Text style={styles.alertText}>{t('petOwnerOrders.details.alerts.shippingFeeSet')}</Text>
        </Card>
      )}
      {paymentStatus === 'PAID' && (
        <Card style={[styles.alert, styles.alertSuccess]}>
          <Ionicons name="checkmark-circle-outline" size={19} color={colors.success} /><Text style={styles.alertText}>{t('petOwnerOrders.details.alerts.paymentCompleted')}</Text>
        </Card>
      )}

      {pharmacy?.name ? <Card style={styles.infoCard}><View style={styles.infoHeading}><View style={styles.infoIcon}><Ionicons name="storefront-outline" size={19} color={colors.primary} /></View><View><Text style={styles.cardTitle}>{t('petOwnerOrders.details.sections.pharmacy')}</Text><Text style={styles.infoSubtext}>{pharmacy.name}</Text></View></View>{pharmacy.phone ? <Text style={styles.infoLine}>{pharmacy.phone}</Text> : null}{pharmacy.email ? <Text style={styles.infoLine}>{pharmacy.email}</Text> : null}</Card> : null}

      <Card style={styles.infoCard}>
        <Text style={styles.cardTitle}>{t('petOwnerOrders.details.sections.items')}</Text>
        {items.map((item, idx) => {
          const product = item.productId as { name?: string; images?: string[]; requiresPrescription?: boolean } | undefined;
          const name = product?.name ?? t('petOwnerOrders.details.defaults.product');
          const qty = item.quantity ?? 0;
          const price = item.price ?? 0;
          const lineTotal = item.total ?? (price * qty);
          const imgUri = getImageUrl(product?.images?.[0]);
          return (
            <View key={idx} style={styles.itemRow}>
              {imgUri ? (
                <Image source={{ uri: imgUri }} style={styles.itemImage} resizeMode="cover" />
              ) : (
                <View style={styles.itemImage} />
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{name}</Text>
                <Text style={styles.itemMeta}>{t('petOwnerOrders.details.item.quantity', { qty })}</Text>
                <Text style={styles.itemMeta}>{t('petOwnerOrders.details.item.eachPrice', { price: Number(price).toFixed(2) })}</Text>
                {(item as { variantName?: string }).variantName ? <Text style={styles.itemVariant}>{(item as { variantName?: string }).variantName}</Text> : null}
                {product?.requiresPrescription ? <View style={styles.itemPrescription}><Ionicons name="document-text-outline" size={12} color="#805B00" /><Text style={styles.itemPrescriptionText}>{t('petOwnerOrders.details.item.prescription')}</Text></View> : null}
              </View>
              <Text style={styles.itemTotal}>€{Number(lineTotal).toFixed(2)}</Text>
            </View>
          );
        })}
      </Card>

      <Card style={styles.infoCard}>
        <View style={styles.infoHeading}><View style={styles.infoIcon}><Ionicons name="card-outline" size={19} color={colors.primary} /></View><View><Text style={styles.cardTitle}>{t('petOwnerOrders.details.sections.payment')}</Text><Text style={styles.infoSubtext}>{t('petOwnerOrders.labels.payment', { status: paymentStatus })}</Text></View></View>
        <View style={styles.paymentGrid}><View><Text style={styles.paymentLabel}>{t('petOwnerOrders.details.payment.method')}</Text><Text style={styles.paymentValue}>{String(order.paymentMethod ?? transaction?.provider ?? 'STRIPE')}</Text></View>{transaction?._id ? <View style={styles.paymentGridRight}><Text style={styles.paymentLabel}>{t('petOwnerOrders.details.payment.transaction')}</Text><Text style={styles.paymentValue} numberOfLines={1}>{transaction._id}</Text></View> : null}</View>
      </Card>

      {shippingAddress && (shippingAddress.line1 || shippingAddress.city) && (
        <Card style={styles.infoCard}>
          <View style={styles.infoHeading}><View style={styles.infoIcon}><Ionicons name="location-outline" size={19} color={colors.primary} /></View><View><Text style={styles.cardTitle}>{t('petOwnerOrders.details.sections.shippingAddress')}</Text><Text style={styles.infoSubtext}>{t('petOwnerOrders.details.shipping.status', { status })}</Text></View></View>
          {shippingAddress.line1 ? <Text style={styles.addressLine}>{shippingAddress.line1}</Text> : null}
          {shippingAddress.line2 ? <Text style={styles.addressLine}>{shippingAddress.line2}</Text> : null}
          <Text style={styles.addressLine}>
            {[shippingAddress.city, shippingAddress.state, shippingAddress.zip].filter(Boolean).join(', ')}
          </Text>
          {shippingAddress.country ? <Text style={styles.addressLine}>{shippingAddress.country}</Text> : null}
        </Card>
      )}

      <Card style={styles.totalCard}>
        <Text style={styles.cardTitle}>{t('petOwnerOrders.details.sections.summary')}</Text>
        <View style={styles.totalRow}>
          <Text>{t('petOwnerOrders.details.totals.subtotal')}</Text>
          <Text>€{subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text>{t('petOwnerOrders.details.totals.shipping')}</Text>
          <Text>€{shipping.toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={[styles.totalRow, styles.totalFinal]}>
          <Text style={styles.totalLabel}>{t('petOwnerOrders.details.totals.total')}</Text>
          <Text style={styles.totalValue}>€{total.toFixed(2)}</Text>
        </View>
      </Card>

      {(canPay || canCancel) && (
        <Card style={styles.actionsCard}>
          <View style={styles.actionsRow}>
            {canPay && (
              <Button
                title={payMutation.isPending ? t('petOwnerOrders.details.actions.processing') : t('petOwnerOrders.details.actions.payAmount', { amount: total.toFixed(2) })}
                onPress={handlePay}
                disabled={payMutation.isPending}
              />
            )}
            {canCancel && (
              <Button title={t('petOwnerOrders.details.actions.cancelOrder')} onPress={() => setShowCancelConfirm(true)} />
            )}
          </View>
        </Card>
      )}

      <Modal visible={showCancelConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('petOwnerOrders.details.cancelModal.title')}</Text>
            <Text style={styles.modalBody}>{t('petOwnerOrders.details.cancelModal.body', { orderNumber })}</Text>
            <Text style={styles.modalHint}>{t('petOwnerOrders.details.cancelModal.hint')}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalSecondaryBtn} onPress={() => setShowCancelConfirm(false)}>
                <Text style={styles.modalSecondaryBtnText}>{t('petOwnerOrders.details.cancelModal.keep')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={handleCancelConfirm}
                disabled={cancelMutation.isPending}
              >
                <Text style={styles.modalCancelBtnText}>
                  {cancelMutation.isPending ? t('petOwnerOrders.details.cancelModal.cancelling') : t('petOwnerOrders.details.cancelModal.confirm')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  pageTitle: { ...typography.h2 },
  backLink: { ...typography.body, color: colors.primary },
  summaryCard: { marginBottom: spacing.md, backgroundColor: colors.primaryDark, borderWidth: 0 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  summaryCopy: { flex: 1 },
  orderIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.secondaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  label: { ...typography.bodySmall, color: 'rgba(255,255,255,0.68)' },
  orderNo: { ...typography.h3, color: colors.textInverse, marginTop: 2 },
  orderDate: { ...typography.bodySmall, color: 'rgba(255,255,255,0.72)', marginTop: 4 },
  summaryRight: { alignItems: 'flex-end' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { ...typography.caption, fontWeight: '600' },
  paymentStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 7 },
  paymentStatus: { ...typography.bodySmall, color: 'rgba(255,255,255,0.78)' },
  alert: { marginBottom: spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  alertInfo: { backgroundColor: colors.infoLight },
  alertWarning: { backgroundColor: colors.warningLight },
  alertSuccess: { backgroundColor: colors.successLight },
  alertText: { ...typography.bodySmall, flex: 1, lineHeight: 20 },
  infoCard: { marginBottom: spacing.md, borderWidth: 1, borderColor: colors.borderLight },
  infoHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  infoIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primaryLight + '18', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  infoSubtext: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  infoLine: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 3 },
  cardTitle: { ...typography.h3, marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  itemImage: { width: 80, height: 80, backgroundColor: colors.backgroundTertiary, borderRadius: 8, marginRight: spacing.sm },
  itemInfo: { flex: 1 },
  itemName: { ...typography.body, fontWeight: '600' },
  itemMeta: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  itemVariant: { ...typography.caption, color: colors.primary, fontWeight: '700', marginTop: 3 },
  itemPrescription: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: colors.warningLight, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7, marginTop: 5 },
  itemPrescriptionText: { ...typography.caption, color: '#805B00', fontWeight: '700' },
  itemTotal: { ...typography.h3 },
  addressLine: { ...typography.body, marginBottom: 2 },
  paymentGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
  paymentGridRight: { alignItems: 'flex-end', maxWidth: '55%' },
  paymentLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 3 }, paymentValue: { ...typography.bodySmall, color: colors.text, fontWeight: '700' },
  totalCard: { marginBottom: spacing.md, backgroundColor: colors.primaryLight + '10', borderWidth: 1, borderColor: colors.primaryLight + '28' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  totalFinal: { marginBottom: 0 },
  totalLabel: { ...typography.body, fontWeight: '700' },
  totalValue: { ...typography.h3, color: colors.primary },
  actionsCard: { marginBottom: spacing.lg },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.background, borderRadius: 12, padding: spacing.lg, width: '100%', maxWidth: 400 },
  modalTitle: { ...typography.h3, marginBottom: spacing.sm },
  modalBody: { ...typography.body, marginBottom: spacing.xs },
  modalHint: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  modalActions: { gap: spacing.sm },
  modalSecondaryBtn: { paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8 },
  modalSecondaryBtnText: { ...typography.body, color: colors.textSecondary },
  modalCancelBtn: { paddingVertical: 12, alignItems: 'center', backgroundColor: colors.error, borderRadius: 8 },
  modalCancelBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '600' },
  errorText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginVertical: spacing.lg },
});
