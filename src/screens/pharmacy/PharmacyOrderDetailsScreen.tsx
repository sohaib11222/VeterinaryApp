import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { getImageUrl } from '../../config/api';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { PharmacyOrdersStackParamList } from '../../navigation/types';
import { useOrder } from '../../queries/orderQueries';
import { useUpdateOrderStatus, useUpdateShippingFee } from '../../mutations/orderMutations';
import { getErrorMessage } from '../../utils/errorUtils';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/appI18n';

type Route = RouteProp<PharmacyOrdersStackParamList, 'PharmacyOrderDetails'>;

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

/** Backend returns { success, message, data: order }. Api.get returns that body. */
function extractOrder(payload: unknown): any {
  if (payload == null) return null;
  const p = payload as Record<string, unknown>;
  if (p.data != null && typeof p.data === 'object') return p.data;
  if (p._id != null || p.orderNumber != null) return p;
  return null;
}

function getStatusColor(status: string) {
  const map: Record<string, string> = {
    DELIVERED: colors.success,
    SHIPPED: colors.info,
    PROCESSING: colors.primary,
    CONFIRMED: colors.primary,
    PENDING: colors.warning,
    CANCELLED: colors.error,
    REFUNDED: colors.error,
  };
  return map[status] || colors.textSecondary;
}

function formatDate(val: string | Date | null | undefined): string {
  if (!val) return i18n.t('common.na');
  const d = typeof val === 'string' ? new Date(val) : val;
  const locale = i18n.language?.startsWith('it') ? 'it-IT' : 'en-GB';
  return isNaN(d.getTime())
    ? String(val)
    : d.toLocaleString(locale, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function PharmacyOrderDetailsScreen() {
  const { t } = useTranslation();
  const route = useRoute<Route>();
  const navigation = useNavigation<any>();
  const orderId = route.params?.orderId ?? '';
  const { data, isLoading, isError, error } = useOrder(orderId);
  const updateStatus = useUpdateOrderStatus();
  const updateShipping = useUpdateShippingFee();
  const order = extractOrder(data);

  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingFee, setShippingFee] = useState('');

  const paymentStatusCode = String(order?.paymentStatus ?? '').toUpperCase();
  const isPaid = order && paymentStatusCode === 'PAID';
  const shippingSet = order && order.shipping != null && order.shipping !== undefined;
  const subtotal = order?.subtotal ?? order?.initialTotal ?? 0;
  const shipping = order?.shipping ?? 0;
  const total = order?.total ?? order?.finalTotal ?? (subtotal + shipping);
  const currentStatus = order?.status ?? '';

  const statusLabel = (code: string) =>
    code ? t(`pharmacyOrders.statusLabels.${code}`, { defaultValue: code }) : t('common.na');

  const paymentLabel = (code: string) =>
    code ? t(`pharmacyOrders.paymentLabels.${code}`, { defaultValue: code }) : t('common.na');

  const canChangeStatusTo = (s: string) => {
    if (isPaid) return true;
    return s === 'CANCELLED' || s === currentStatus;
  };

  const onStatusChange = async (newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ orderId, data: { status: newStatus } });
      Toast.show({ type: 'success', text1: t('pharmacyOrderDetails.toasts.statusUpdated') });
    } catch (err) {
      Toast.show({ type: 'error', text1: t('common.failed'), text2: getErrorMessage(err, t('pharmacyOrderDetails.errors.couldNotUpdateStatus')) });
    }
  };

  const onSaveShipping = async () => {
    const n = parseFloat(shippingFee);
    if (!Number.isFinite(n) || n < 0) {
      Toast.show({ type: 'error', text1: t('pharmacyOrderDetails.validation.invalidShippingFee') });
      return;
    }
    try {
      await updateShipping.mutateAsync({ orderId, data: { shippingFee: n } });
      Toast.show({ type: 'success', text1: t('pharmacyOrderDetails.toasts.shippingFeeUpdated') });
      setShowShippingModal(false);
    } catch (err) {
      Toast.show({ type: 'error', text1: t('common.failed'), text2: getErrorMessage(err, t('pharmacyOrderDetails.errors.couldNotUpdateShippingFee')) });
    }
  };

  if (isLoading && !order) {
    return (
      <ScreenContainer padded>
        <View style={styles.loadingRow}><ActivityIndicator size="small" color={colors.primary} /></View>
      </ScreenContainer>
    );
  }
  if (isError || !order || (typeof order === 'object' && !order._id && !order.orderNumber)) {
    const errMsg = error?.message;
    return (
      <ScreenContainer padded>
        <Text style={styles.errorText}>{errMsg ?? t('pharmacyOrderDetails.errors.notFound')}</Text>
        <Button title={t('common.back')} onPress={() => navigation.goBack()} />
      </ScreenContainer>
    );
  }

  const customer = order?.petOwnerId ?? order?.petOwner ?? {};
  const customerName = customer?.name ?? t('common.na');
  const customerEmail = customer?.email ?? t('common.na');
  const customerPhone = customer?.phone ?? t('common.na');
  const shippingAddress = order?.shippingAddress ?? {};
  const items = Array.isArray(order?.items) ? order.items : [];
  const orderNumber = order?.orderNumber ?? order?._id ?? orderId;
  const createdAt = formatDate(order?.createdAt);
  const shippingUpdatedAt = order?.shippingUpdatedAt ? formatDate(order.shippingUpdatedAt) : null;
  const initialShipping = order?.initialShipping;

  return (
    <ScreenContainer scroll padded>
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.label}>{t('pharmacyOrderDetails.labels.orderNumber')}</Text>
            <Text style={styles.orderNumber}>#{orderNumber}</Text>
            <Text style={styles.orderDate}>{t('pharmacyOrderDetails.labels.orderDate', { createdAt })}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentStatus) + '25' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(currentStatus) }]}>{statusLabel(currentStatus)}</Text>
          </View>
        </View>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>{t('pharmacyOrderDetails.labels.payment')}</Text>
          <View style={[styles.paymentBadge, isPaid ? styles.paymentPaid : styles.paymentPending]}>
            <Text style={[styles.paymentBadgeText, isPaid ? styles.paymentPaidText : styles.paymentPendingText]}>{paymentLabel(paymentStatusCode || '')}</Text>
          </View>
        </View>
      </View>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>{t('pharmacyOrderDetails.labels.customerInformation')}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>👤</Text>
          <Text style={styles.infoText}>{customerName}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>✉</Text>
          <Text style={styles.infoText}>{customerEmail}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📞</Text>
          <Text style={styles.infoText}>{customerPhone}</Text>
        </View>
      </Card>

      {shippingAddress && (shippingAddress.line1 || shippingAddress.city) && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('pharmacyOrderDetails.labels.shippingAddress')}</Text>
          {shippingAddress.line1 ? <Text style={styles.addressLine}>{shippingAddress.line1}</Text> : null}
          {shippingAddress.line2 ? <Text style={styles.addressLine}>{shippingAddress.line2}</Text> : null}
          <Text style={styles.addressLine}>
            {[shippingAddress.city, shippingAddress.state, shippingAddress.zip].filter(Boolean).join(', ')}
          </Text>

          {shippingAddress.country ? <Text style={styles.addressLine}>{shippingAddress.country}</Text> : null}
        </Card>
      )}

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>{t('pharmacyOrderDetails.labels.orderItems', { count: items.length })}</Text>
        {items.map((item: any, idx: number) => {
          const itemId = item?._id ?? item?.id ?? idx;
          const product = item?.productId;
          const name = product?.name ?? item?.name ?? t('common.na');
          const qty = item?.quantity ?? 0;
          const price = item?.price ?? 0;
          const itemTotal = item?.total ?? item?.subtotal ?? (qty * price);
          const imgUrl = Array.isArray(product?.images) && product.images[0] ? getImageUrl(product.images[0]) : null;
          return (

            <View key={itemId} style={styles.itemRow}>
              <View style={styles.itemImage}>
                {imgUrl ? <Image source={{ uri: imgUrl }} style={styles.itemImageInner} resizeMode="cover" /> : null}
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{name}</Text>
                <Text style={styles.itemMeta}>{t('pharmacyOrderDetails.item.quantity', { count: qty })}</Text>
                <Text style={styles.itemMeta}>{t('pharmacyOrderDetails.item.eachPrice', { price: Number(price).toFixed(2) })}</Text>
              </View>
              <Text style={styles.itemTotal}>€{Number(itemTotal).toFixed(2)}</Text>
            </View>
          );
        })}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>{t('pharmacyOrderDetails.summary.title')}</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('pharmacyOrderDetails.summary.subtotal')}</Text>
          <Text style={styles.summaryValue}>€{Number(subtotal).toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>{t('pharmacyOrderDetails.summary.shipping')}</Text>
            {shippingUpdatedAt && (
              <Text style={styles.shippingNote}>{t('pharmacyOrderDetails.summary.updatedOn', { date: shippingUpdatedAt })}</Text>
            )}
            {initialShipping != null && initialShipping !== shipping && (
              <Text style={styles.shippingNote}>{t('pharmacyOrderDetails.summary.updatedFrom', { amount: Number(initialShipping).toFixed(2) })}</Text>
            )}
          </View>
          <Text style={styles.summaryValue}>€{Number(shipping).toFixed(2)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotalLabel}>{t('pharmacyOrderDetails.summary.total')}</Text>
          <Text style={styles.summaryTotalValue}>€{Number(total).toFixed(2)}</Text>
        </View>
      </Card>

      <Card style={styles.section}>
        <View style={styles.actionsBlock}>
          {!isPaid && (
            <Button
              title={shippingSet ? t('pharmacyOrderDetails.actions.updateShippingFee') : t('pharmacyOrderDetails.actions.setShippingFee')}
              variant="outline"
              onPress={() => {
                setShippingFee(String(order?.shipping ?? 0));
                setShowShippingModal(true);
              }}

              style={styles.actionButton}
            />
          )}
          <View style={styles.statusBlock}>
            <Text style={styles.statusLabel}>{t('pharmacyOrderDetails.labels.status')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChips}>
              {STATUS_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusChip, currentStatus === s && styles.statusChipActive, !canChangeStatusTo(s) && styles.statusChipDisabled]}
                  onPress={() => canChangeStatusTo(s) && onStatusChange(s)}
                  disabled={!canChangeStatusTo(s) || updateStatus.isPending}
                >
                  <Text style={[styles.statusChipText, currentStatus === s && styles.statusChipTextActive]}>{statusLabel(s)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Card>

      <Modal visible={showShippingModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowShippingModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{shippingSet ? t('pharmacyOrderDetails.actions.updateShippingFee') : t('pharmacyOrderDetails.actions.setShippingFee')}</Text>
              <TouchableOpacity onPress={() => setShowShippingModal(false)} hitSlop={12}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalOrderNo}>{t('pharmacyOrderDetails.modal.orderNumber', { orderNumber })}</Text>
              <Text style={styles.modalLabel}>{t('pharmacyOrderDetails.modal.currentShipping')}</Text>
              <Text style={styles.modalCurrentShipping}>€{Number(shipping).toFixed(2)}</Text>
              <Text style={[styles.modalLabel, { marginTop: spacing.sm }]}>{t('pharmacyOrderDetails.modal.newShippingFee')}</Text>
              <TextInput
                style={styles.modalInput}
                value={shippingFee}
                onChangeText={setShippingFee}
                placeholder={t('pharmacyOrderDetails.modal.shippingFeePlaceholder')}
                keyboardType="decimal-pad"
              />
              {shippingFee && !isNaN(parseFloat(shippingFee)) && (
                <Text style={styles.modalNewTotal}>
                  {t('pharmacyOrderDetails.modal.newTotal', { amount: (subtotal + parseFloat(shippingFee)).toFixed(2) })}
                </Text>
              )}
            </View>
            <View style={styles.modalFooter}>
              <Button title={t('common.cancel')} variant="outline" onPress={() => setShowShippingModal(false)} style={styles.modalBtn} />
              <Button title={t('common.save')} onPress={onSaveShipping} loading={updateShipping.isPending} style={styles.modalBtn} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingRow: { padding: spacing.xl, alignItems: 'center' },
  errorText: { ...typography.body, color: colors.error, marginBottom: spacing.md },
  headerCard: {
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  label: { ...typography.bodySmall, color: colors.textSecondary },
  orderNumber: { ...typography.h3, marginTop: 2 },
  orderDate: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  paymentRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  paymentLabel: { ...typography.bodySmall, color: colors.textSecondary, marginRight: 8 },
  paymentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  paymentPaid: { backgroundColor: colors.successLight },
  paymentPending: { backgroundColor: colors.warningLight },
  paymentBadgeText: { fontSize: 12, fontWeight: '600' },
  paymentPaidText: { fontSize: 12, fontWeight: '600', color: colors.success },
  paymentPendingText: { fontSize: 12, fontWeight: '600', color: colors.warning },
  section: { marginBottom: spacing.sm },
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoIcon: { marginRight: 8, fontSize: 16 },
  infoText: { ...typography.body },
  addressLine: { ...typography.body, marginBottom: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  itemImage: { width: 80, height: 80, borderRadius: 8, marginRight: spacing.sm, backgroundColor: colors.backgroundTertiary, overflow: 'hidden' },
  itemImageInner: { width: 80, height: 80 },
  itemInfo: { flex: 1 },
  itemName: { ...typography.body, fontWeight: '600' },
  itemMeta: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  itemTotal: { ...typography.h3 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { ...typography.body, color: colors.textSecondary },
  summaryValue: { ...typography.body, fontWeight: '600' },
  shippingNote: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  summaryDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  summaryTotalLabel: { ...typography.body, fontWeight: '700' },
  summaryTotalValue: { ...typography.h3, color: colors.primary },
  actionsBlock: {},
  actionButton: { marginBottom: spacing.sm },
  statusBlock: {},
  statusLabel: { ...typography.label, marginBottom: 4 },
  statusChips: { flexDirection: 'row', gap: 8, paddingRight: spacing.md },
  statusChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.backgroundTertiary, borderWidth: 1, borderColor: colors.border },
  statusChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusChipDisabled: { opacity: 0.5 },
  statusChipText: { ...typography.bodySmall },
  statusChipTextActive: { color: colors.textInverse, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.background, borderRadius: 16, width: '100%', maxWidth: 360 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  modalTitle: { ...typography.h3 },
  modalClose: { fontSize: 20, color: colors.textSecondary },
  modalBody: { padding: spacing.sm },
  modalOrderNo: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm },
  modalLabel: { ...typography.label, marginBottom: 4 },
  modalCurrentShipping: { ...typography.body, marginBottom: 4 },
  modalInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.sm, ...typography.body, backgroundColor: colors.backgroundSecondary },
  modalNewTotal: { ...typography.body, fontWeight: '600', marginTop: spacing.sm },
  modalFooter: { flexDirection: 'row', gap: spacing.sm, padding: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
  modalBtn: { flex: 1 },
});