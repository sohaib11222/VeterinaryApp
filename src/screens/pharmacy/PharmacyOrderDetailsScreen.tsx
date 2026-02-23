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
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { PharmacyOrdersStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Route = RouteProp<PharmacyOrdersStackParamList, 'PharmacyOrderDetails'>;

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

const MOCK_ORDER = {
  id: '1',
  orderNumber: 'ORD-1002',
  createdAt: '14 Feb 2024, 10:30',
  status: 'PENDING',
  paymentStatus: 'PENDING',
  subtotal: 30,
  initialShipping: 0,
  shipping: 2.5,
  shippingUpdatedAt: null as string | null,
  total: 32.5,
  customer: { name: 'Jane Smith', email: 'jane@example.com', phone: '+39 333 1234567' },
  shippingAddress: {
    line1: 'Via Roma 123',
    line2: 'Apt 2',
    city: 'Milan',
    state: 'MI',
    zip: '20100',
    country: 'Italy',
  },
  items: [
    { id: '1', name: 'Dog Food 5kg', quantity: 1, price: 24.99, total: 24.99 },
    { id: '2', name: 'Flea Drops', quantity: 1, price: 7.51, total: 7.51 },
  ],
};

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

export function PharmacyOrderDetailsScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<any>();
  const orderId = route.params?.orderId;
  const [status, setStatus] = useState(MOCK_ORDER.status);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingFee, setShippingFee] = useState(String(MOCK_ORDER.shipping));

  const order = MOCK_ORDER;
  const isPaid = order.paymentStatus === 'PAID';
  const shippingSet = order.shipping != null && order.shipping !== undefined;
  const total = order.subtotal + (order.shipping || 0);

  const canChangeStatusTo = (s: string) => {
    if (isPaid) return true;
    return s === 'CANCELLED' || s === order.status;
  };

  return (
    <ScreenContainer scroll padded>
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.label}>Order number</Text>
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
            <Text style={styles.orderDate}>Order date: {order.createdAt}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '25' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
          </View>
        </View>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Payment</Text>
          <View style={[styles.paymentBadge, order.paymentStatus === 'PAID' ? styles.paymentPaid : styles.paymentPending]}>
            <Text style={[styles.paymentBadgeText, order.paymentStatus === 'PAID' ? styles.paymentPaidText : styles.paymentPendingText]}>{order.paymentStatus}</Text>
          </View>
        </View>
      </View>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Customer information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>👤</Text>
          <Text style={styles.infoText}>{order.customer.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>✉</Text>
          <Text style={styles.infoText}>{order.customer.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📞</Text>
          <Text style={styles.infoText}>{order.customer.phone}</Text>
        </View>
      </Card>

      {order.shippingAddress && (order.shippingAddress.line1 || order.shippingAddress.city) && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping address</Text>
          <Text style={styles.addressLine}>{order.shippingAddress.line1}</Text>
          {order.shippingAddress.line2 ? <Text style={styles.addressLine}>{order.shippingAddress.line2}</Text> : null}
          <Text style={styles.addressLine}>
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
          </Text>
          <Text style={styles.addressLine}>{order.shippingAddress.country}</Text>
        </Card>
      )}

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Order items ({order.items.length})</Text>
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>Quantity: {item.quantity}</Text>
              <Text style={styles.itemMeta}>€{Number(item.price).toFixed(2)} each</Text>
            </View>
            <Text style={styles.itemTotal}>€{Number(item.total).toFixed(2)}</Text>
          </View>
        ))}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Order summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>€{Number(order.subtotal).toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Shipping</Text>
            {order.shippingUpdatedAt && (
              <Text style={styles.shippingNote}>Updated on {order.shippingUpdatedAt}</Text>
            )}
            {order.initialShipping != null && order.initialShipping !== order.shipping && (
              <Text style={styles.shippingNote}>Updated from €{Number(order.initialShipping).toFixed(2)}</Text>
            )}
          </View>
          <Text style={styles.summaryValue}>€{Number(order.shipping || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotalLabel}>Total</Text>
          <Text style={styles.summaryTotalValue}>€{Number(total).toFixed(2)}</Text>
        </View>
      </Card>

      <Card style={styles.section}>
        <View style={styles.actionsBlock}>
          {!isPaid && (
            <Button
              title={shippingSet ? 'Update shipping fee' : 'Set shipping fee'}
              variant="outline"
              onPress={() => {
                setShippingFee(String(order.shipping || 0));
                setShowShippingModal(true);
              }}
              style={styles.actionButton}
            />
          )}
          <View style={styles.statusBlock}>
            <Text style={styles.statusLabel}>Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChips}>
              {STATUS_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusChip, status === s && styles.statusChipActive, !canChangeStatusTo(s) && styles.statusChipDisabled]}
                  onPress={() => canChangeStatusTo(s) && setStatus(s)}
                  disabled={!canChangeStatusTo(s)}
                >
                  <Text style={[styles.statusChipText, status === s && styles.statusChipTextActive]}>{s}</Text>
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
              <Text style={styles.modalTitle}>{shippingSet ? 'Update shipping fee' : 'Set shipping fee'}</Text>
              <TouchableOpacity onPress={() => setShowShippingModal(false)} hitSlop={12}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalOrderNo}>Order #{order.orderNumber}</Text>
              <Text style={styles.modalLabel}>Current shipping</Text>
              <Text style={styles.modalCurrentShipping}>€{Number(order.shipping || 0).toFixed(2)}</Text>
              <Text style={[styles.modalLabel, { marginTop: spacing.sm }]}>New shipping fee (€)</Text>
              <TextInput
                style={styles.modalInput}
                value={shippingFee}
                onChangeText={setShippingFee}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
              {shippingFee && !isNaN(parseFloat(shippingFee)) && (
                <Text style={styles.modalNewTotal}>
                  New total: €{(order.subtotal + parseFloat(shippingFee)).toFixed(2)}
                </Text>
              )}
            </View>
            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="outline" onPress={() => setShowShippingModal(false)} style={styles.modalBtn} />
              <Button
                title="Save"
                onPress={() => {
                  setShowShippingModal(false);
                }}
                style={styles.modalBtn}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  paymentPaidText: { fontSize: 12, fontWeight: '600', color: colors.success },
  paymentPendingText: { fontSize: 12, fontWeight: '600', color: colors.warning },
  section: { marginBottom: spacing.sm },
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoIcon: { marginRight: 8, fontSize: 16 },
  infoText: { ...typography.body },
  addressLine: { ...typography.body, marginBottom: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  itemImage: { width: 80, height: 80, borderRadius: 8, marginRight: spacing.sm, backgroundColor: colors.backgroundTertiary },
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