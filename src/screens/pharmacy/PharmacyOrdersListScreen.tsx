import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const STATUS_OPTIONS = ['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
const PAYMENT_OPTIONS = ['', 'PAID', 'PENDING', 'REFUNDED'];

const MOCK_ORDERS = [
  { id: '1', orderNumber: 'ORD-1001', customer: 'John Doe', total: 45.99, shipping: 5, paymentStatus: 'PAID', status: 'DELIVERED', date: '12 Feb 2024' },
  { id: '2', orderNumber: 'ORD-1002', customer: 'Jane Smith', total: 32.5, shipping: null as number | null, paymentStatus: 'PENDING', status: 'PENDING', date: '14 Feb 2024' },
  { id: '3', orderNumber: 'ORD-1003', customer: 'Bob Wilson', total: 28, shipping: 3.5, paymentStatus: 'PAID', status: 'SHIPPED', date: '13 Feb 2024' },
];

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

export function PharmacyOrdersListScreen() {
  const navigation = useNavigation<any>();
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [shippingModal, setShippingModal] = useState<{ orderId: string; orderNumber: string } | null>(null);
  const [shippingFee, setShippingFee] = useState('');

  const filtered = MOCK_ORDERS.filter((o) => {
    const matchStatus = !statusFilter || o.status === statusFilter;
    const matchPayment = !paymentFilter || o.paymentStatus === paymentFilter;
    const matchSearch = !searchQuery.trim() ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchPayment && matchSearch;
  });

  const openShippingModal = (order: typeof MOCK_ORDERS[0]) => {
    setShippingModal({ orderId: order.id, orderNumber: order.orderNumber });
    setShippingFee(order.shipping != null ? String(order.shipping) : '');
  };

  const closeShippingModal = () => {
    setShippingModal(null);
    setShippingFee('');
  };

  const saveShippingFee = () => {
    const n = parseFloat(shippingFee);
    if (Number.isFinite(n) && n >= 0) {
      closeShippingModal();
    }
  };

  return (
    <ScreenContainer padded>
      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by order number or customer..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterBlock}>
        <Text style={styles.filterLabel}>Status</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {STATUS_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s || 'all'}
              style={[styles.chip, (!s || statusFilter === s) && styles.chipActive]}
              onPress={() => setStatusFilter(s)}
            >
              <Text style={[styles.chipText, (!s || statusFilter === s) && styles.chipTextActive]}>{s || 'All'}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={styles.filterBlock}>
        <Text style={styles.filterLabel}>Payment</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {PAYMENT_OPTIONS.map((p) => (
            <TouchableOpacity
              key={p || 'all'}
              style={[styles.chip, (!p || paymentFilter === p) && styles.chipActive]}
              onPress={() => setPaymentFilter(p)}
            >
              <Text style={[styles.chipText, (!p || paymentFilter === p) && styles.chipTextActive]}>{p || 'All'}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filtered.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>No orders found.</Text>
        </Card>
      ) : (
        filtered.map((o) => {
          const shippingDisplay = o.shipping === null || o.shipping === undefined ? 'Waiting' : `€${Number(o.shipping).toFixed(2)}`;
          const isPaid = o.paymentStatus === 'PAID';
          return (
            <Card key={o.id} style={styles.orderCard}>
              <TouchableOpacity onPress={() => navigation.navigate('PharmacyOrderDetails', { orderId: o.id })} activeOpacity={0.9}>
                <View style={styles.orderRow}>
                  <View style={styles.orderMain}>
                    <Text style={styles.orderNo}>{o.orderNumber}</Text>
                    <Text style={styles.orderCustomer}>{o.customer}</Text>
                    <Text style={styles.orderDate}>{o.date}</Text>
                  </View>
                  <Text style={styles.orderTotal}>€{Number(o.total).toFixed(2)}</Text>
                </View>
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Shipping</Text>
                    <Text style={styles.metaValue}>{shippingDisplay}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Payment</Text>
                    <Text style={[styles.metaValue, isPaid ? styles.paid : styles.unpaid]}>{o.paymentStatus}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(o.status) + '25' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(o.status) }]}>{o.status}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('PharmacyOrderDetails', { orderId: o.id })}>
                    <Text style={styles.actionBtnText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnPrimary]}
                    onPress={(e) => { e.stopPropagation(); openShippingModal(o); }}
                    disabled={isPaid}
                  >
                    <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>Set Shipping</Text>
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
              <Text style={styles.modalTitle}>Set Shipping Fee</Text>
              <TouchableOpacity onPress={closeShippingModal} hitSlop={12}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {shippingModal && (
                <Text style={styles.modalOrderNo}>Order {shippingModal.orderNumber}</Text>
              )}
              <Text style={styles.modalLabel}>Shipping fee (€)</Text>
              <TextInput
                style={styles.modalInput}
                value={shippingFee}
                onChangeText={setShippingFee}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="outline" onPress={closeShippingModal} style={styles.modalBtn} />
              <Button title="Save" onPress={saveShippingFee} style={styles.modalBtn} />
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
  orderCard: { marginBottom: spacing.sm },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  orderMain: { flex: 1 },
  orderNo: { ...typography.body, fontWeight: '600' },
  orderCustomer: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  orderDate: { ...typography.caption, color: colors.textLight, marginTop: 2 },
  orderTotal: { ...typography.h3, color: colors.primary },
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