import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { VetHeader } from '../../components/common/VetHeader';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const STATUS_PIPELINE = [
  { key: 'PENDING', label: 'Pending', color: colors.warning },
  { key: 'CONFIRMED', label: 'Confirmed', color: colors.info },
  { key: 'PROCESSING', label: 'Processing', color: colors.primary },
  { key: 'SHIPPED', label: 'Shipped', color: colors.secondaryDark },
  { key: 'DELIVERED', label: 'Delivered', color: colors.success },
  { key: 'CANCELLED', label: 'Cancelled', color: colors.error },
];

const MOCK_STATS = {
  revenueToday: 124.49,
  totalOrders: 48,
  pendingOrders: 5,
  totalProducts: 12,
};
const MOCK_RECENT_ORDERS = [
  { id: '1', orderNumber: 'ORD-1001', customer: 'John Doe', total: 45.99, payment: 'PAID', status: 'DELIVERED' },
  { id: '2', orderNumber: 'ORD-1002', customer: 'Jane Smith', total: 32.5, payment: 'UNPAID', status: 'PENDING' },
  { id: '3', orderNumber: 'ORD-1003', customer: 'Bob Wilson', total: 28, payment: 'PAID', status: 'SHIPPED' },
];

export function PharmacyDashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const isParapharmacy = user?.role === 'PARAPHARMACY';
  const title = isParapharmacy ? 'Parapharmacy Dashboard' : 'Pharmacy Dashboard';

  return (
    <View style={styles.flex}>
      <VetHeader title={title} subtitle="Track orders, manage products and payouts" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenContainer padded>
          {/* Subscription card (PET_STORE only) */}
          {!isParapharmacy && (
            <Card style={styles.subCard}>
              <View style={styles.subRow}>
                <View>
                  <Text style={styles.subLabel}>Subscription</Text>
                  <Text style={styles.subText}>Your subscription is active.</Text>
                </View>
                <View style={styles.subBadge}>
                  <Text style={styles.subBadgeText}>Active</Text>
                </View>
                <TouchableOpacity
                  style={styles.manageBtn}
                  onPress={() => (navigation.getParent() as any)?.navigate('PharmacyMore', { screen: 'PharmacySubscription' })}
                >
                  <Text style={styles.manageBtnText}>Manage</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Stats cards – reference mydoctor-app dashboard */}
          <View style={styles.statsGrid}>
            <TouchableOpacity style={styles.statCard} onPress={() => (navigation.getParent() as any)?.navigate('PharmacyOrders', { screen: 'PharmacyOrdersList' })}>
              <View style={[styles.statIconWrap, { backgroundColor: colors.primary + '20' }]}>
                <Text style={styles.statIcon}>💰</Text>
              </View>
              <Text style={styles.statValue}>€{MOCK_STATS.revenueToday.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Revenue today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statCard} onPress={() => (navigation.getParent() as any)?.navigate('PharmacyOrders', { screen: 'PharmacyOrdersList' })}>
              <View style={[styles.statIconWrap, { backgroundColor: colors.success + '20' }]}>
                <Text style={styles.statIcon}>📦</Text>
              </View>
              <Text style={styles.statValue}>{MOCK_STATS.totalOrders}</Text>
              <Text style={styles.statLabel}>Total orders</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statCard} onPress={() => (navigation.getParent() as any)?.navigate('PharmacyOrders', { screen: 'PharmacyOrdersList' })}>
              <View style={[styles.statIconWrap, { backgroundColor: colors.warning + '20' }]}>
                <Text style={styles.statIcon}>⏳</Text>
              </View>
              <Text style={styles.statValue}>{MOCK_STATS.pendingOrders}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statCard} onPress={() => (navigation.getParent() as any)?.navigate('PharmacyProducts', { screen: 'PharmacyProductList' })}>
              <View style={[styles.statIconWrap, { backgroundColor: colors.info + '20' }]}>
                <Text style={styles.statIcon}>🛍</Text>
              </View>
              <Text style={styles.statValue}>{MOCK_STATS.totalProducts}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </TouchableOpacity>
          </View>

          {/* Status pipeline */}
          <View style={styles.statusGrid}>
            {STATUS_PIPELINE.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={styles.statusCard}
                onPress={() => (navigation.getParent() as any)?.navigate('PharmacyOrders', { screen: 'PharmacyOrdersList' })}
              >
                <View style={styles.statusContent}>
                  <Text style={styles.statusLabel}>{s.label}</Text>
                  <Text style={styles.statusCount}>12</Text>
                  <Text style={[styles.statusLink, { color: s.color }]}>View Orders</Text>
                </View>
                <View style={[styles.statusIcon, { backgroundColor: s.color + '20' }]}>
                  <Text style={styles.statusIconText}>📦</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.twoCol}>
            {/* Recent Orders */}
            <Card style={styles.recentCard}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>Recent Orders</Text>
                <TouchableOpacity onPress={() => (navigation.getParent() as any)?.navigate('PharmacyOrders', { screen: 'PharmacyOrdersList' })}>
                  <Text style={styles.viewAll}>View All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.table}>
                <View style={styles.tableRow}>
                  <Text style={styles.th}>Order</Text>
                  <Text style={styles.th}>Customer</Text>
                  <Text style={styles.th}>Total</Text>
                  <Text style={styles.th}>Payment</Text>
                  <Text style={styles.th}>Status</Text>
                </View>
                {MOCK_RECENT_ORDERS.map((o) => (
                  <View key={o.id} style={styles.tableRow}>
                    <Text style={styles.td}>{o.orderNumber}</Text>
                    <Text style={styles.td}>{o.customer}</Text>
                    <Text style={styles.td}>€{o.total.toFixed(2)}</Text>
                    <Text style={styles.td}>{o.payment}</Text>
                    <Text style={styles.td}>{o.status}</Text>
                  </View>
                ))}
              </View>
            </Card>

            {/* Quick Actions */}
            <Card style={styles.actionsCard}>
              <Text style={styles.cardTitle}>Quick Actions</Text>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => (navigation.getParent() as any)?.navigate('PharmacyOrders', { screen: 'PharmacyOrdersList' })}
              >
                <Text style={styles.actionBtnText}>Manage Orders</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSecondary]}
                onPress={() => (navigation.getParent() as any)?.navigate('PharmacyProducts', { screen: 'PharmacyProductList' })}
              >
                <Text style={styles.actionBtnTextSecondary}>Manage Products</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnOutline]}
                onPress={() => (navigation.getParent() as any)?.navigate('PharmacyMore', { screen: 'PharmacyPayouts' })}
              >
                <Text style={styles.actionBtnTextOutline}>Payouts</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnOutline]}
                onPress={() => (navigation.getParent() as any)?.navigate('PharmacyMore', { screen: 'PharmacyProfile' })}
              >
                <Text style={styles.actionBtnTextOutline}>Profile</Text>
              </TouchableOpacity>
              {MOCK_RECENT_ORDERS.some((o) => o.payment === 'UNPAID') && (
              <View style={styles.alertBox}>
                <Text style={styles.alertTitle}>Attention needed</Text>
                <Text style={styles.alertText}>You have orders awaiting shipping fee or payment.</Text>
              </View>
            )}
            </Card>
          </View>
        </ScreenContainer>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flex: 1 },
  subCard: { marginBottom: spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    width: '48%',
    minWidth: 140,
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statIcon: { fontSize: 20 },
  statValue: { ...typography.h3, marginBottom: 2 },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  subRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  subLabel: { ...typography.body, fontWeight: '600' },
  subText: { ...typography.bodySmall, color: colors.textSecondary },
  subBadge: { backgroundColor: colors.success, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  subBadgeText: { ...typography.caption, color: colors.textInverse, fontWeight: '600' },
  manageBtn: { paddingVertical: 6, paddingHorizontal: 14, backgroundColor: colors.primary, borderRadius: 20 },
  manageBtnText: { ...typography.bodySmall, color: colors.textInverse, fontWeight: '600' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  statusCard: { width: '31%', minWidth: 100, backgroundColor: colors.backgroundCard, borderRadius: 12, padding: spacing.sm, borderWidth: 1, borderColor: colors.border },
  statusContent: {},
  statusLabel: { ...typography.caption, color: colors.textSecondary },
  statusCount: { ...typography.h3, marginVertical: 2 },
  statusLink: { ...typography.caption, fontWeight: '600' },
  statusIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  statusIconText: { fontSize: 18 },
  twoCol: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  recentCard: { flex: 1, minWidth: 280 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  cardTitle: { ...typography.h3, marginBottom: 0 },
  viewAll: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  table: {},
  tableRow: { flexDirection: 'row', paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  th: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  td: { ...typography.bodySmall, flex: 1 },
  actionsCard: { width: 280 },
  actionBtn: { paddingVertical: 12, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', marginBottom: 8 },
  actionBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '600' },
  actionBtnSecondary: { backgroundColor: colors.backgroundTertiary },
  actionBtnTextSecondary: { ...typography.body, color: colors.text, fontWeight: '600' },
  actionBtnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
  actionBtnTextOutline: { ...typography.body, color: colors.primary, fontWeight: '600' },
  alertBox: { marginTop: spacing.md, padding: spacing.sm, backgroundColor: colors.infoLight, borderRadius: 8 },
  alertTitle: { ...typography.body, fontWeight: '600', marginBottom: 2 },
  alertText: { ...typography.caption, color: colors.textSecondary },
});
