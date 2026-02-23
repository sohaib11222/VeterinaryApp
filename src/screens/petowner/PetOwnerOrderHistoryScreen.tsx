import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useOrders } from '../../queries/orderQueries';
import { usePayForOrder, useCancelOrder } from '../../mutations/orderMutations';
import { getImageUrl } from '../../config/api';

type StatusType = '' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  DELIVERED: { bg: colors.successLight, text: colors.success },
  SHIPPED: { bg: colors.infoLight, text: colors.info },
  PROCESSING: { bg: colors.warningLight, text: colors.warning },
  CONFIRMED: { bg: colors.primary + '20', text: colors.primary },
  PENDING: { bg: colors.backgroundTertiary, text: colors.textSecondary },
  CANCELLED: { bg: colors.errorLight, text: colors.error },
};

const STATUS_LABELS: Record<string, string> = {
  '': 'All',
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function PetOwnerOrderHistoryScreen() {
  const navigation = useNavigation<any>();
  const [statusFilter, setStatusFilter] = useState<StatusType>('');

  const statusParam = statusFilter ? statusFilter.toUpperCase() : undefined;
  const { data: ordersRes, isLoading } = useOrders(statusParam ? { status: statusParam } : {});
  const { data: allOrdersRes } = useOrders({});
  const payMutation = usePayForOrder();
  const cancelMutation = useCancelOrder();

  const payload = ordersRes?.data ?? (ordersRes as { data?: { orders?: unknown[] } } | undefined);
  const orders = Array.isArray(payload?.orders) ? payload.orders : [];

  const statusCounts = useMemo(() => {
    const all = allOrdersRes?.data ?? (allOrdersRes as { data?: { orders?: unknown[] } } | undefined);
    const allOrders = Array.isArray(all?.orders) ? all.orders : [];
    return {
      '': allOrders.length,
      CONFIRMED: allOrders.filter((o: Record<string, unknown>) => String(o?.status).toUpperCase() === 'CONFIRMED').length,
      PROCESSING: allOrders.filter((o: Record<string, unknown>) => String(o?.status).toUpperCase() === 'PROCESSING').length,
      SHIPPED: allOrders.filter((o: Record<string, unknown>) => String(o?.status).toUpperCase() === 'SHIPPED').length,
      DELIVERED: allOrders.filter((o: Record<string, unknown>) => String(o?.status).toUpperCase() === 'DELIVERED').length,
      CANCELLED: allOrders.filter((o: Record<string, unknown>) => String(o?.status).toUpperCase() === 'CANCELLED').length,
    };
  }, [allOrdersRes]);

  const getStatusStyle = (status: string) =>
    STATUS_STYLES[String(status).toUpperCase()] || STATUS_STYLES.PENDING;

  const handlePay = async (orderId: string) => {
    try {
      await payMutation.mutateAsync({ orderId, data: { paymentMethod: 'STRIPE' } });
      Toast.show({ type: 'success', text1: 'Payment successful' });
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Payment failed';
      Toast.show({ type: 'error', text1: msg });
    }
  };

  const handleCancel = (orderId: string) => {
    Alert.alert('Cancel order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelMutation.mutateAsync(orderId);
            Toast.show({ type: 'success', text1: 'Order cancelled' });
          } catch (err: unknown) {
            const msg = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : 'Cancel failed';
            Toast.show({ type: 'error', text1: msg });
          }
        },
      },
    ]);
  };

  const renderOrderCard = ({ item: order }: { item: Record<string, unknown> }) => {
    const id = String(order._id ?? order.id ?? '');
    const orderNumber = (order.orderNumber as string) ?? id;
    const store = order.petStoreId as { name?: string } | null | undefined;
    const pharmacyName = store?.name ?? 'Pharmacy';
    const status = String(order.status ?? 'PENDING').toUpperCase();
    const paymentStatus = String(order.paymentStatus ?? 'UNPAID').toUpperCase();
    const finalShipping = order.finalShipping;
    const shippingSet = finalShipping !== null && finalShipping !== undefined;
    const total = Number(order.total ?? 0);
    const items = (order.items as Array<{ productId?: { images?: string[] }; quantity?: number }>) ?? [];
    const itemCount = items.reduce((s, i) => s + (i.quantity ?? 0), 0);
    const firstImage = items[0]?.productId?.images?.[0];
    const imageUri = getImageUrl(firstImage ?? undefined);
    const createdAt = formatDate(order.createdAt as string);

    const statusStyle = getStatusStyle(status);
    const canPay = paymentStatus === 'UNPAID' && shippingSet && (status === 'PENDING' || status === 'CONFIRMED');
    const canCancel = paymentStatus !== 'PAID' && (status === 'PENDING' || status === 'CONFIRMED');

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>#{orderNumber}</Text>
            <Text style={styles.pharmacyName}>{pharmacyName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg + 'CC' }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {STATUS_LABELS[status] || status}
            </Text>
          </View>
        </View>
        <View style={styles.orderBody}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={styles.productImage} />
          )}
          <View style={styles.orderDetails}>
            <Text style={styles.itemsCount}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
            <Text style={styles.orderDate}>Ordered on {createdAt}</Text>
            <Text style={styles.paymentStatusText}>Payment: {paymentStatus}</Text>
          </View>
          <Text style={styles.orderTotal}>€{total.toFixed(2)}</Text>
        </View>
        <View style={styles.orderFooter}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('PetOwnerOrderDetails', { orderId: id })}
          >
            <Text style={styles.actionButtonText}>View details</Text>
          </TouchableOpacity>
          {canPay && (
            <TouchableOpacity
              style={[styles.actionButton, styles.payButton]}
              onPress={() => handlePay(id)}
              disabled={payMutation.isPending}
            >
              <Text style={[styles.actionButtonText, styles.payButtonText]}>Pay now</Text>
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancel(id)}
              disabled={cancelMutation.isPending}
            >
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
          )}
          {paymentStatus === 'PAID' && (
            <View style={[styles.actionButton, styles.paidButton]}>
              <Text style={styles.paidButtonText}>✓ Paid</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer padded>
      {/* Status filter – mydoctor-app style */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Status</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterOption,
              statusFilter === '' && styles.filterOptionActive,
            ]}
            onPress={() => setStatusFilter('')}
          >
            <Text
              style={[
                styles.filterOptionText,
                statusFilter === '' && styles.filterOptionTextActive,
              ]}
            >
              All
            </Text>
            {statusCounts[''] > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{statusCounts['']}</Text>
              </View>
            )}
          </TouchableOpacity>
          {(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const).map(
            (status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterOption,
                  statusFilter === status && styles.filterOptionActive,
                ]}
                onPress={() => setStatusFilter(status)}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    statusFilter === status && styles.filterOptionTextActive,
                  ]}
                >
                  {STATUS_LABELS[status]}
                </Text>
                {statusCounts[status] > 0 && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>
                      {statusCounts[status]}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          )}
        </ScrollView>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.xxl }} />
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🧾</Text>
          <Text style={styles.emptyText}>No orders found</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() =>
              navigation.getParent()?.navigate('PetOwnerTabs', {
                screen: 'PetOwnerPharmacy',
              })
            }
          >
            <Text style={styles.shopButtonText}>Start shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String((item as Record<string, unknown>)._id ?? (item as Record<string, unknown>).id ?? '')}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginRight: 12,
  },
  filterScroll: { paddingRight: spacing.md },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 6,
  },
  countBadgeText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '600',
  },
  listContent: { paddingBottom: spacing.xxl },
  orderCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderInfo: { flex: 1 },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  pharmacyName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: colors.backgroundTertiary,
  },
  orderDetails: { flex: 1 },
  itemsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  paymentStatusText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  orderFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primaryLight + '40',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  payButton: { backgroundColor: colors.primary },
  payButtonText: { color: colors.textInverse },
  paidButton: {
    backgroundColor: colors.successLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  cancelButton: { backgroundColor: colors.errorLight },
  cancelButtonText: { color: colors.error },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyIcon: { fontSize: 64, marginBottom: spacing.sm },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  shopButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  shopButtonText: {
    color: colors.textInverse,
    fontWeight: '600',
    fontSize: 16,
  },
});
