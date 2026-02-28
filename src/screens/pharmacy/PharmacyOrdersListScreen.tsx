import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { getImageUrl } from '../../config/api';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useOrders } from '../../queries/orderQueries';
import { useUpdateShippingFee } from '../../mutations/orderMutations';
import { getErrorMessage } from '../../utils/errorUtils';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { PharmacyOrdersStackParamList } from '../../navigation/types';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/appI18n';

type Route = RouteProp<PharmacyOrdersStackParamList, 'PharmacyOrdersList'>;

const STATUS_OPTIONS = ['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
const PAYMENT_OPTIONS = ['', 'PAID', 'PENDING', 'REFUNDED'];

function extractOrders(payload: unknown): any[] {
  const outer = (payload as { data?: unknown })?.data ?? payload;
  const d = (outer as { data?: unknown })?.data ?? outer;
  const list = (d as { orders?: unknown[] })?.orders ?? (d as { items?: unknown[] })?.items;
  return Array.isArray(list) ? list : [];
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
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function PharmacyOrdersListScreen() {
  const { t } = useTranslation();
  const route = useRoute<Route>();
  const navigation = useNavigation<any>();
  const initialStatus = (route.params as { status?: string } | undefined)?.status;
  const [statusFilter, setStatusFilter] = useState(initialStatus ?? '');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [shippingModal, setShippingModal] = useState<{ orderId: string; orderNumber: string; currentShipping?: number } | null>(null);
  const [shippingFee, setShippingFee] = useState('');

  const queryParams = useMemo(() => ({
    page: 1,
    limit: 50,
    status: statusFilter || undefined,
    paymentStatus: paymentFilter || undefined,
  }), [statusFilter, paymentFilter]);

  const { data, isLoading, isError } = useOrders(queryParams);
  const updateShipping = useUpdateShippingFee();
  const orders = useMemo(() => extractOrders(data), [data]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((o: any) => {
      const orderNo = o?.orderNumber ?? o?._id ?? '';
      const customer = o?.petOwnerId?.name ?? o?.petOwner?.name ?? '';
      return String(orderNo).toLowerCase().includes(q) || String(customer).toLowerCase().includes(q);
    });
  }, [orders, searchQuery]);

  const openShippingModal = (order: any) => {
    const id = order?._id ?? order?.id;
    const orderNo = order?.orderNumber ?? id;
    setShippingModal({ orderId: String(id), orderNumber: String(orderNo), currentShipping: order?.shipping });
    setShippingFee(order?.shipping != null ? String(order.shipping) : '');
  };

  const closeShippingModal = () => {
    setShippingModal(null);
    setShippingFee('');
  };

  const statusLabel = (code: string) =>
    code
      ? t(`pharmacyOrders.statusLabels.${code}`, { defaultValue: code })
      : t('common.all');

  const paymentLabel = (code: string) =>
    code
      ? t(`pharmacyOrders.paymentLabels.${code}`, { defaultValue: code })
      : t('common.all');

  const saveShippingFee = async () => {
    const n = parseFloat(shippingFee);
    if (!Number.isFinite(n) || n < 0) {
      Toast.show({ type: 'error', text1: t('pharmacyOrdersList.validation.invalidShippingFee') });
      return;
    }
    if (!shippingModal) return;
    try {
      await updateShipping.mutateAsync({ orderId: shippingModal.orderId, data: { shippingFee: n } });
      Toast.show({ type: 'success', text1: t('pharmacyOrdersList.toasts.shippingFeeUpdated') });
      closeShippingModal();
    } catch (err) {
      Toast.show({ type: 'error', text1: t('common.failed'), text2: getErrorMessage(err, t('pharmacyOrdersList.errors.couldNotUpdateShippingFee')) });
    }
  };

  return (
    <ScreenContainer padded>
      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('pharmacyOrdersList.searchPlaceholder')}
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterBlock}>
        <Text style={styles.filterLabel}>{t('pharmacyOrdersList.filters.status')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {STATUS_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s || 'all'}
              style={[styles.chip, (!s || statusFilter === s) && styles.chipActive]}
              onPress={() => setStatusFilter(s)}
            >
              <Text style={[styles.chipText, (!s || statusFilter === s) && styles.chipTextActive]}>{statusLabel(s)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={styles.filterBlock}>
        <Text style={styles.filterLabel}>{t('pharmacyOrdersList.filters.payment')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {PAYMENT_OPTIONS.map((p) => (
            <TouchableOpacity
              key={p || 'all'}
              style={[styles.chip, (!p || paymentFilter === p) && styles.chipActive]}
              onPress={() => setPaymentFilter(p)}
            >
              <Text style={[styles.chipText, (!p || paymentFilter === p) && styles.chipTextActive]}>{paymentLabel(p)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filtered.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>{t('pharmacyOrdersList.empty.noOrders')}</Text>
        </Card>
      ) : (
        filtered.map((o: any) => {
          const id = o?._id ?? o?.id;
          const orderNo = o?.orderNumber ?? id;
          const customer = o?.petOwnerId?.name ?? o?.petOwner?.name ?? t('common.na');
          const total = o?.total ?? o?.finalTotal ?? o?.initialTotal ?? 0;
          const shippingVal = o?.shipping;
          const shippingDisplay =
            shippingVal === null || shippingVal === undefined
              ? t('pharmacyOrdersList.shipping.waiting')
              : t('pharmacyOrdersList.shipping.amount', { amount: Number(shippingVal).toFixed(2) });
          const paymentStatus = o?.paymentStatus ?? t('common.na');
          const status = o?.status ?? t('common.na');
          const isPaid = String(paymentStatus).toUpperCase() === 'PAID';
          const dateStr = formatDate(o?.createdAt);
          const firstItem = Array.isArray(o?.items) && o.items[0] ? o.items[0] : null;
          const productImg = firstItem?.productId?.images?.[0];
          const thumbUri = productImg ? getImageUrl(productImg) : null;

          return (
            <Card key={id} style={styles.orderCard}>
              <TouchableOpacity onPress={() => navigation.navigate('PharmacyOrderDetails', { orderId: String(id) })} activeOpacity={0.9}>
                <View style={styles.orderRow}>
                  {thumbUri ? (
                    <Image source={{ uri: thumbUri }} style={styles.orderThumb} />
                  ) : (
                    <View style={styles.orderThumbPlaceholder} />
                  )}
                  <View style={styles.orderMain}>
                    <Text style={styles.orderNo}>{orderNo}</Text>
                    <Text style={styles.orderCustomer}>{customer}</Text>
                    <Text style={styles.orderDate}>{dateStr}</Text>
                    <Text style={styles.orderTotal}>€{Number(total).toFixed(2)}</Text>
                  </View>
                </View>
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>{t('pharmacyOrdersList.labels.shipping')}</Text>
                    <Text style={styles.metaValue}>{shippingDisplay}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>{t('pharmacyOrdersList.labels.payment')}</Text>
                    <Text style={[styles.metaValue, isPaid ? styles.paid : styles.unpaid]}>{paymentStatus}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>{t('pharmacyOrdersList.labels.status')}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '25' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(status) }]}>{status}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('PharmacyOrderDetails', { orderId: String(id) })}>
                    <Text style={styles.actionBtnText}>{t('common.view')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnPrimary]}
                    onPress={(e) => { e.stopPropagation(); openShippingModal(o); }}
                    disabled={isPaid}
                  >
                    <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>{t('pharmacyOrdersList.actions.setShipping')}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Card>
          );
        })
      )}

      <Modal visible={!!shippingModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={closeShippingModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('pharmacyOrdersList.modal.title')}</Text>
              <TouchableOpacity onPress={closeShippingModal} hitSlop={12}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {shippingModal && (
                <Text style={styles.modalOrderNo}>{t('pharmacyOrdersList.modal.orderNumber', { orderNumber: shippingModal.orderNumber })}</Text>
              )}
              <Text style={styles.modalLabel}>{t('pharmacyOrdersList.modal.shippingFeeLabel')}</Text>
              <TextInput
                style={styles.modalInput}
                value={shippingFee}
                onChangeText={setShippingFee}
                placeholder={t('pharmacyOrdersList.modal.shippingFeePlaceholder')}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.modalFooter}>
              <Button title={t('common.cancel')} variant="outline" onPress={closeShippingModal} style={styles.modalBtn} />
              <Button title={t('common.save')} onPress={saveShippingFee} loading={updateShipping.isPending} style={styles.modalBtn} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
  },
  searchIcon: { marginRight: 8, fontSize: 18 },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, paddingVertical: 10 },
  filterBlock: { marginBottom: spacing.sm },
  filterLabel: { ...typography.label, marginBottom: 4 },
  chipRow: { flexDirection: 'row', gap: 8, paddingRight: spacing.md },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.bodySmall },
  chipTextActive: { color: colors.textInverse, fontWeight: '600' },
  loadingRow: { padding: spacing.xl, alignItems: 'center' },
  orderCard: { marginBottom: spacing.sm },
  orderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  orderThumb: { width: 56, height: 56, borderRadius: 8, marginRight: spacing.sm },
  orderThumbPlaceholder: { width: 56, height: 56, borderRadius: 8, marginRight: spacing.sm, backgroundColor: colors.backgroundTertiary },
  orderMain: { flex: 1 },
  orderNo: { ...typography.body, fontWeight: '600' },
  orderCustomer: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  orderDate: { ...typography.caption, color: colors.textLight, marginTop: 2 },
  orderTotal: { ...typography.h3, color: colors.primary, marginTop: 2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
  metaItem: {},
  metaLabel: { ...typography.caption, color: colors.textSecondary },
  metaValue: { ...typography.bodySmall, fontWeight: '600' },
  paid: { color: colors.success },
  unpaid: { color: colors.warning },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginTop: 2 },
  statusText: { fontSize: 12, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 8, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.backgroundTertiary, borderWidth: 1, borderColor: colors.border },
  actionBtnText: { ...typography.label, color: colors.text },
  actionBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionBtnTextPrimary: { color: colors.textInverse },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.background, borderRadius: 16, width: '100%', maxWidth: 360 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  modalTitle: { ...typography.h3 },
  modalClose: { fontSize: 20, color: colors.textSecondary },
  modalBody: { padding: spacing.sm },
  modalOrderNo: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm },
  modalLabel: { ...typography.label, marginBottom: 4 },
  modalInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.sm, ...typography.body, backgroundColor: colors.backgroundSecondary },
  modalFooter: { flexDirection: 'row', gap: spacing.sm, padding: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
  modalBtn: { flex: 1 },
});