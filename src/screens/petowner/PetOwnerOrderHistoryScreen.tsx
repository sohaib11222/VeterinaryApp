import React, { useMemo, useState } from 'react';
import { AppImage } from '../../components/common/AppImage';
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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useOrders } from '../../queries/orderQueries';
import { usePayForOrder, useCancelOrder } from '../../mutations/orderMutations';
import { getImageUrl } from '../../config/api';
import { useTranslation } from 'react-i18next';

type StatusType = '' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  DELIVERED: { bg: colors.successLight, text: colors.success },
  SHIPPED: { bg: colors.infoLight, text: colors.info },
  PROCESSING: { bg: colors.warningLight, text: colors.warning },
  CONFIRMED: { bg: colors.primary + '20', text: colors.primary },
  PENDING: { bg: colors.backgroundTertiary, text: colors.textSecondary },
  CANCELLED: { bg: colors.errorLight, text: colors.error },
};

function formatDate(dateString: string | undefined, naLabel: string): string {
  if (!dateString) return naLabel;
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function PetOwnerOrderHistoryScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<StatusType>('');
  const [searchQuery, setSearchQuery] = useState('');

  const statusParam = statusFilter ? statusFilter.toUpperCase() : undefined;
  const { data: ordersRes, isLoading } = useOrders(statusParam ? { status: statusParam } : {});
  const { data: allOrdersRes } = useOrders({});
  const payMutation = usePayForOrder();
  const cancelMutation = useCancelOrder();

  const payload: any = ordersRes?.data ?? (ordersRes as any)?.data ?? ordersRes ?? {};
  const orders = Array.isArray(payload?.orders) ? payload.orders : [];
  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter((order: Record<string, unknown>) => {
      const store = order.petStoreId as { name?: string } | undefined;
      const itemNames = (order.items as Array<{ productId?: { name?: string } }> | undefined) ?? [];
      return [order.orderNumber, order._id, store?.name, ...itemNames.map((item) => item.productId?.name)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [orders, searchQuery]);

  const statusCounts = useMemo(() => {
    const all: any = allOrdersRes?.data ?? (allOrdersRes as any)?.data ?? allOrdersRes ?? {};
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

  const getStatusLabel = (status: string) => {
    const s = String(status || '').toUpperCase();
    const map: Record<string, string> = {
      '': t('common.all'),
      PENDING: t('petOwnerOrders.status.pending'),
      CONFIRMED: t('petOwnerOrders.status.confirmed'),
      PROCESSING: t('petOwnerOrders.status.processing'),
      SHIPPED: t('petOwnerOrders.status.shipped'),
      DELIVERED: t('petOwnerOrders.status.delivered'),
      CANCELLED: t('petOwnerOrders.status.cancelled'),
    };
    return map[s] ?? s;
  };

  const handlePay = async (orderId: string) => {
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

  const handleCancel = (orderId: string) => {
    Alert.alert(t('petOwnerOrders.cancelConfirm.title'), t('petOwnerOrders.cancelConfirm.message'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('petOwnerOrders.cancelConfirm.confirm'),
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelMutation.mutateAsync(orderId);
            Toast.show({ type: 'success', text1: t('petOwnerOrders.toasts.orderCancelled') });
          } catch (err: unknown) {
            const msg = err && typeof err === 'object' && 'message' in err
              ? String((err as { message: unknown }).message)
              : t('petOwnerOrders.errors.cancelFailed');
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
    const pharmacyName = store?.name ?? t('petOwnerOrders.defaults.pharmacy');
    const status = String(order.status ?? 'PENDING').toUpperCase();
    const paymentStatus = String(order.paymentStatus ?? 'UNPAID').toUpperCase();
    const finalShipping = order.finalShipping;
    const shippingSet = finalShipping !== null && finalShipping !== undefined;
    const total = Number(order.total ?? 0);
    const items = (order.items as Array<{ productId?: { images?: string[] }; quantity?: number }>) ?? [];
    const itemCount = items.reduce((s, i) => s + (i.quantity ?? 0), 0);
    const firstImage = items[0]?.productId?.images?.[0];
    const imageUri = getImageUrl(firstImage ?? undefined);
    const createdAt = formatDate(order.createdAt as string, t('common.na'));
    const expectedDeliveryDate = order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate as string, t('common.na')) : null;

    const statusStyle = getStatusStyle(status);
    const canPay = paymentStatus === 'UNPAID' && shippingSet && (status === 'PENDING' || status === 'CONFIRMED');
    const canCancel = paymentStatus !== 'PAID' && (status === 'PENDING' || status === 'CONFIRMED');

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <View style={styles.orderNumberRow}><Ionicons name="receipt-outline" size={16} color={colors.primary} /><Text style={styles.orderNumber}>#{orderNumber}</Text></View>
            <Text style={styles.pharmacyName}>{pharmacyName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg + 'CC' }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {getStatusLabel(status)}
            </Text>
          </View>
        </View>
        <View style={styles.orderBody}>
          {imageUri ? (
            <AppImage source={{ uri: imageUri }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={[styles.productImage, styles.productImageFallback]}><Ionicons name="cube-outline" size={24} color={colors.textLight} /></View>
          )}
          <View style={styles.orderDetails}>
            <Text style={styles.itemsCount}>
              {t('petOwnerOrders.itemsCount', { count: itemCount })}
            </Text>
            <Text style={styles.orderDate}>{t('petOwnerOrders.labels.orderedOn', { date: createdAt })}</Text>
            <View style={styles.paymentRow}><Ionicons name={paymentStatus === 'PAID' ? 'checkmark-circle-outline' : 'card-outline'} size={13} color={paymentStatus === 'PAID' ? colors.success : colors.textSecondary} /><Text style={styles.paymentStatusText}>{t('petOwnerOrders.labels.payment', { status: paymentStatus })}</Text></View>
            {expectedDeliveryDate ? <View style={styles.deliveryDateRow}><Ionicons name="car-outline" size={13} color={colors.primary} /><Text style={styles.deliveryDateText}>Expected delivery: {expectedDeliveryDate}</Text></View> : null}
          </View>
          <Text style={styles.orderTotal}>€{total.toFixed(2)}</Text>
        </View>
        <View style={styles.orderFooter}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('PetOwnerOrderDetails', { orderId: id })}
          >
            <Ionicons name="eye-outline" size={16} color={colors.primary} /><Text style={styles.actionButtonText}>{t('petOwnerOrders.actions.viewDetails')}</Text>
          </TouchableOpacity>
          {canPay && (
            <TouchableOpacity
              style={[styles.actionButton, styles.payButton]}
              onPress={() => handlePay(id)}
              disabled={payMutation.isPending}
            >
              <Ionicons name="card-outline" size={16} color={colors.textInverse} /><Text style={[styles.actionButtonText, styles.payButtonText]}>{t('petOwnerOrders.actions.payNow')}</Text>
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancel(id)}
              disabled={cancelMutation.isPending}
            >
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>{t('petOwnerOrders.actions.cancel')}</Text>
            </TouchableOpacity>
          )}
          {paymentStatus === 'PAID' && (
            <View style={[styles.actionButton, styles.paidButton]}>
              <Text style={styles.paidButtonText}>{t('petOwnerOrders.labels.paid')}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer padded>
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="bag-check-outline" size={24} color={colors.primaryDark} /></View>
        <View style={styles.heroCopy}><Text style={styles.heroTitle}>{t('petOwnerOrders.title')}</Text><Text style={styles.heroText}>{t('petOwnerOrders.subtitle')}</Text></View>
      </View>
      <View style={styles.searchBar}><Ionicons name="search-outline" size={19} color={colors.textSecondary} /><TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder={t('petOwnerOrders.searchPlaceholder')} placeholderTextColor={colors.textLight} style={styles.searchInput} /></View>
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>{t('petOwnerOrders.labels.status')}</Text>
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
              {t('common.all')}
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
                  {getStatusLabel(status)}
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
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🧾</Text>
          <Text style={styles.emptyText}>{t('petOwnerOrders.empty')}</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() =>
              navigation.getParent()?.navigate('PetOwnerTabs', {
                screen: 'PetOwnerPharmacy',
              })
            }
          >
            <Text style={styles.shopButtonText}>{t('petOwnerOrders.actions.startShopping')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
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
  hero: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successLight, borderRadius: 18, padding: spacing.md, marginBottom: spacing.md },
  heroIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.secondaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  heroCopy: { flex: 1 }, heroTitle: { ...typography.h3, color: colors.primaryDark }, heroText: { ...typography.caption, color: colors.textSecondary, marginTop: 3 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, minHeight: 50, paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm },
  searchInput: { flex: 1, ...typography.bodySmall, color: colors.text, paddingVertical: 0 },
  filterContainer: {
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
    borderRadius: 16,
    padding: spacing.md,
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
  orderNumberRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
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
  productImageFallback: { alignItems: 'center', justifyContent: 'center' },
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
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  paymentStatusText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  deliveryDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  deliveryDateText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
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
    backgroundColor: colors.primaryLight + '28',
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
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
