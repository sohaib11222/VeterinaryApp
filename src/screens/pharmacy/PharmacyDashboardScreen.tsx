import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useOrders } from '../../queries/orderQueries';
import { useMyPetStoreSubscription, useMyPetStore } from '../../queries/petStoreQueries';
import { useMyProducts } from '../../queries/productQueries';
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

function extractOrders(payload: unknown): unknown[] {
  const outer = (payload as { data?: unknown })?.data ?? payload;
  const d = (outer as { data?: unknown })?.data ?? outer;
  const list = (d as { orders?: unknown[] })?.orders ?? (d as { items?: unknown[] })?.items;
  return Array.isArray(list) ? list : [];
}

function extractTotal(payload: unknown): number {
  const outer = (payload as { data?: unknown })?.data ?? payload;
  const d = (outer as { data?: unknown })?.data ?? outer;
  const p = (d as { pagination?: { total?: number } })?.pagination;
  return p?.total ?? (d as { total?: number })?.total ?? (d as { count?: number })?.count ?? 0;
}

export function PharmacyDashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const isParapharmacy = user?.role === 'PARAPHARMACY';

  const [refreshing, setRefreshing] = useState(false);
  const recentOrdersQuery = useOrders({ page: 1, limit: 100 });
  const statusPending = useOrders({ status: 'PENDING', page: 1, limit: 1 });
  const statusConfirmed = useOrders({ status: 'CONFIRMED', page: 1, limit: 1 });
  const statusProcessing = useOrders({ status: 'PROCESSING', page: 1, limit: 1 });
  const statusShipped = useOrders({ status: 'SHIPPED', page: 1, limit: 1 });
  const statusDelivered = useOrders({ status: 'DELIVERED', page: 1, limit: 1 });
  const statusCancelled = useOrders({ status: 'CANCELLED', page: 1, limit: 1 });

  const mySubQuery = useMyPetStoreSubscription({ enabled: !isParapharmacy });
  const myStoreQuery = useMyPetStore();
  const productsQuery = useMyProducts({ page: 1, limit: 1 });

  const orders = useMemo(() => extractOrders(recentOrdersQuery.data), [recentOrdersQuery.data]);
  const totalOrders = useMemo(() => extractTotal(recentOrdersQuery.data), [recentOrdersQuery.data]);
  const pendingCount = useMemo(() => extractTotal(statusPending.data), [statusPending.data]);
  const todayKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }, []);
  const revenueToday = useMemo(() => {
    return (orders as any[])
      .filter((o) => {
        const created = o?.createdAt ? new Date(o.createdAt) : null;
        if (!created) return false;
        const key = `${created.getFullYear()}-${created.getMonth()}-${created.getDate()}`;
        return key === todayKey && String(o?.paymentStatus ?? '').toUpperCase() === 'PAID';
      })
      .reduce((sum, o) => sum + (Number(o?.total) ?? 0), 0);
  }, [orders, todayKey]);
  const unpaidCount = useMemo(
    () => (orders as { paymentStatus?: string }[]).filter((o) => String(o?.paymentStatus ?? '').toUpperCase() !== 'PAID').length,
    [orders]
  );

  const mySub = useMemo(() => {
    const payload = mySubQuery.data as { data?: { hasActiveSubscription?: boolean }; hasActiveSubscription?: boolean } | undefined;
    const inner = payload?.data ?? payload;
    return inner;
  }, [mySubQuery.data]);
  const hasActiveSubscription = isParapharmacy ? true : !!mySub?.hasActiveSubscription;

  const petStore = useMemo(() => {
    const p = myStoreQuery.data as { data?: unknown } | undefined;
    const inner = (p?.data ?? p) as any;
    return inner;
  }, [myStoreQuery.data]);
  const isProfileComplete = useMemo(() => {
    if (!petStore) return false;
    const addr = petStore?.address ?? {};
    return !!(petStore?.name && (petStore?.phone || addr?.line1) && addr?.city);
  }, [petStore]);
  const showProfileBanner = !!petStore && !isProfileComplete;

  const storeName = user?.name ?? (isParapharmacy ? 'Parapharmacy' : 'Pharmacy');

  const revenueLast7Days = useMemo(() => {
    const dayBuckets: { key: string; label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayBuckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
        label: d.toLocaleDateString('en-GB', { weekday: 'short' }),
        total: 0,
      });
    }
    const idxByKey = new Map(dayBuckets.map((b, idx) => [b.key, idx]));
    (orders as any[]).forEach((o) => {
      if (String(o?.paymentStatus ?? '').toUpperCase() !== 'PAID') return;
      const created = o?.createdAt ? new Date(o.createdAt) : null;
      if (!created) return;
      const key = `${created.getFullYear()}-${created.getMonth()}-${created.getDate()}`;
      const idx = idxByKey.get(key);
      if (idx !== undefined) dayBuckets[idx].total += Number(o?.total) ?? 0;
    });
    return dayBuckets;
  }, [orders]);

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    (orders as any[]).forEach((o) => {
      const s = String(o?.status ?? 'UNKNOWN').toUpperCase();
      counts[s] = (counts[s] ?? 0) + 1;
    });
    return STATUS_PIPELINE.map((s) => ({ ...s, count: counts[s.key] ?? 0 })).filter((s) => s.count > 0);
  }, [orders]);

  const latestCustomers = useMemo(() => {
    const seen = new Set<string>();
    const list = (orders as any[])
      .slice()
      .sort((a, b) => new Date(b?.createdAt ?? 0).getTime() - new Date(a?.createdAt ?? 0).getTime());
    const formatDate = (d: string | Date | null | undefined) => {
      if (!d) return '—';
      const date = typeof d === 'string' ? new Date(d) : d;
      return isNaN(date.getTime()) ? String(d) : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    return list
      .filter((o) => {
        const id = o?.petOwnerId?._id ?? o?.petOwnerId?.id ?? o?.petOwner?._id ?? o?.petOwner?.id;
        if (!id || seen.has(String(id))) return false;
        seen.add(String(id));
        return true;
      })
      .slice(0, 5)
      .map((o) => {
        const c = o?.petOwnerId ?? o?.petOwner ?? {};
        return {
          id: o?._id ?? o?.id,
          name: c?.name ?? '—',
          email: c?.email ?? '—',
          dateAdded: formatDate(o?.createdAt),
        };
      });
  }, [orders]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        recentOrdersQuery.refetch(),
        mySubQuery.refetch(),
        myStoreQuery.refetch(),
        productsQuery.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const productsData = useMemo(() => {
    const d = productsQuery.data as { data?: { products?: unknown[]; pagination?: { total?: number }; total?: number } } | undefined;
    const inner = d?.data ?? d;
    const list = (inner as { products?: unknown[] })?.products;
    const total = (inner as { pagination?: { total?: number } })?.pagination?.total ?? (inner as { total?: number })?.total;
    return { list: Array.isArray(list) ? list : [], total: typeof total === 'number' ? total : 0 };
  }, [productsQuery.data]);

  const navOrders = (params?: { status?: string }) =>
    (navigation.getParent() as any)?.navigate('PharmacyOrders', { screen: 'PharmacyOrdersList', params: params ?? {} });
  const navProducts = () => (navigation.getParent() as any)?.navigate('PharmacyProducts', { screen: 'PharmacyProductList' });
  const navMore = (screen: string) => (navigation.getParent() as any)?.navigate('PharmacyMore', { screen });

  const isLoading = recentOrdersQuery.isLoading && orders.length === 0;
  const stats = useMemo(
    () => [
      {
        id: '1',
        title: 'Revenue today',
        value: `€${revenueToday.toFixed(2)}`,
        icon: '💰',
        iconColor: colors.primary,
        progress: Math.min(100, revenueToday > 0 ? Math.round((revenueToday / 500) * 100) : 0),
      },
      {
        id: '2',
        title: 'Total orders',
        value: String(totalOrders),
        icon: '📦',
        iconColor: colors.success,
        progress: totalOrders > 0 ? 100 : 0,
      },
      {
        id: '3',
        title: 'Pending orders',
        value: String(pendingCount),
        icon: '⏳',
        iconColor: colors.warning,
        progress: totalOrders ? Math.min(100, Math.round((pendingCount / totalOrders) * 100)) : 0,
      },
      {
        id: '4',
        title: 'Products',
        value: String(productsData.total),
        icon: '🛍',
        iconColor: colors.info,
        progress: productsData.total > 0 ? 100 : 0,
      },
    ],
    [revenueToday, totalOrders, pendingCount, productsData.total]
  );

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeTitle}>Welcome, {storeName}</Text>
          <Text style={styles.breadcrumb}>Pharmacy Dashboard</Text>
        </View>

        {showProfileBanner && (
          <TouchableOpacity style={styles.profileBanner} onPress={() => navMore('PharmacyProfile')} activeOpacity={0.8}>
            <Text style={styles.profileBannerIcon}>⚠</Text>
            <Text style={styles.profileBannerText}>Complete your store profile</Text>
            <Text style={styles.profileBannerChevron}>›</Text>
          </TouchableOpacity>
        )}

        {!isParapharmacy && !mySubQuery.isLoading && !hasActiveSubscription && (
          <View style={styles.subscriptionBanner}>
            <View style={styles.subscriptionBannerRow}>
              <Text style={styles.subscriptionBannerIcon}>💳</Text>
              <Text style={styles.subscriptionBannerText}>Subscription required to manage products.</Text>
            </View>
            <TouchableOpacity style={styles.subscriptionBtn} onPress={() => navMore('PharmacySubscription')}>
              <Text style={styles.subscriptionBtnText}>View plans</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isParapharmacy && mySubQuery.isLoading && (
          <View style={styles.pendingBanner}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.pendingBannerText}>Loading subscription…</Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading dashboard…</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsSection}>
              <FlatList
                data={stats}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={styles.statRow}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.statCard}
                    onPress={() => (item.id === '4' ? navProducts() : navOrders(item.id === '3' ? { status: 'PENDING' } : undefined))}
                    activeOpacity={0.8}
                  >
                    <View style={styles.statHeader}>
                      <View style={[styles.statIconWrap, { backgroundColor: item.iconColor + '22' }]}>
                        <Text style={styles.statIcon}>{item.icon}</Text>
                      </View>
                      <Text style={styles.statValue}>{item.value}</Text>
                    </View>
                    <View style={styles.statFooter}>
                      <Text style={styles.statLabel}>{item.title}</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${item.progress}%`, backgroundColor: item.iconColor }]} />
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>

            <View style={styles.chartsSection}>
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Revenue (last 7 days)</Text>
                {revenueLast7Days.some((d) => d.total > 0) ? (
                  <View style={styles.chartBody}>
                    {revenueLast7Days.map((d) => (
                      <View key={d.key} style={styles.revenueRow}>
                        <Text style={styles.revenueLabel}>{d.label}</Text>
                        <Text style={styles.revenueValue}>€{d.total.toFixed(2)}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.chartPlaceholder}>
                    <Text style={styles.chartPlaceholderIcon}>📊</Text>
                    <Text style={styles.chartPlaceholderText}>No paid orders in the last 7 days</Text>
                  </View>
                )}
              </View>
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Orders by status</Text>
                {statusBreakdown.length > 0 ? (
                  <View style={styles.chartBody}>
                    {statusBreakdown.map((s) => (
                      <View key={s.key} style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                        <Text style={styles.legendLabel}>{s.label}</Text>
                        <Text style={styles.legendValue}>{s.count}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.chartPlaceholder}>
                    <Text style={styles.chartPlaceholderIcon}>📦</Text>
                    <Text style={styles.chartPlaceholderText}>No orders yet</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.customersSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Latest customers</Text>
                <TouchableOpacity onPress={() => navOrders()}>
                  <Text style={styles.viewAllText}>View all</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.customersCard}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderCell}>Name</Text>
                  <Text style={styles.tableHeaderCell}>Email</Text>
                  <Text style={styles.tableHeaderCell}>Date</Text>
                </View>
                {latestCustomers.length === 0 ? (
                  <Text style={styles.emptyTableText}>No orders yet.</Text>
                ) : (
                  latestCustomers.map((c) => (
                    <View key={c.id} style={styles.customerRow}>
                      <Text style={styles.customerName} numberOfLines={1}>{c.name}</Text>
                      <Text style={styles.customerDetail} numberOfLines={1}>{c.email}</Text>
                      <Text style={styles.customerDate}>{c.dateAdded}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>

            <View style={styles.quickActionsSection}>
              <Text style={styles.sectionTitle}>Quick actions</Text>
              <View style={styles.quickActionsRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navOrders()}>
                  <Text style={styles.actionBtnText}>Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={navProducts}>
                  <Text style={styles.actionBtnTextSecondary}>Products</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.quickActionsRow}>
                <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]} onPress={() => navMore('PharmacyPayouts')}>
                  <Text style={styles.actionBtnTextOutline}>Payouts</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]} onPress={() => navMore('PharmacyProfile')}>
                  <Text style={styles.actionBtnTextOutline}>Profile</Text>
                </TouchableOpacity>
              </View>
              {unpaidCount > 0 && (
                <View style={styles.alertBox}>
                  <Text style={styles.alertTitle}>Attention needed</Text>
                  <Text style={styles.alertText}>Unpaid orders in recent list: {unpaidCount}</Text>
                </View>
              )}
            </View>
            <View style={styles.bottomSpacer} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.backgroundSecondary },
  scroll: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0) + spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  welcomeTitle: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
  breadcrumb: { fontSize: 14, color: colors.textSecondary },
  profileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    padding: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: 8,
    gap: 8,
  },
  profileBannerIcon: { fontSize: 18 },
  profileBannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
  profileBannerChevron: { fontSize: 18, color: colors.textLight },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    padding: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: 8,
    gap: 8,
  },
  pendingBannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
  subscriptionBanner: {
    backgroundColor: colors.warningLight,
    padding: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: 8,
    gap: 10,
  },
  subscriptionBannerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subscriptionBannerIcon: { fontSize: 18 },
  subscriptionBannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
  subscriptionBtn: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: colors.primary, borderRadius: 20 },
  subscriptionBtnText: { fontSize: 14, fontWeight: '600', color: colors.textInverse },
  loadingContainer: { padding: spacing.xl * 2, alignItems: 'center' },
  loadingText: { marginTop: spacing.sm, fontSize: 14, color: colors.textSecondary },
  statsSection: { padding: spacing.lg },
  statRow: { gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statIcon: { fontSize: 22 },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  statFooter: {},
  statLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
  progressBar: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  chartsSection: { paddingHorizontal: spacing.lg, gap: spacing.md },
  chartCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  chartBody: { backgroundColor: colors.backgroundSecondary, borderRadius: 8, padding: spacing.sm },
  revenueRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  revenueLabel: { fontSize: 13, color: colors.textSecondary },
  revenueValue: { fontSize: 13, fontWeight: '600', color: colors.text },
  legendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendLabel: { flex: 1, fontSize: 13, color: colors.text },
  legendValue: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  chartPlaceholder: { paddingVertical: spacing.xl, alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: 8 },
  chartPlaceholderIcon: { fontSize: 32, marginBottom: 4 },
  chartPlaceholderText: { fontSize: 13, color: colors.textLight },
  customersSection: { padding: spacing.lg, paddingTop: 0 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  viewAllText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  customersCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableHeader: { flexDirection: 'row', paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.sm },
  tableHeaderCell: { flex: 1, fontSize: 11, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' },
  customerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  customerName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  customerDetail: { flex: 1, fontSize: 12, color: colors.textSecondary },
  customerDate: { fontSize: 12, color: colors.textSecondary },
  emptyTableText: { paddingVertical: spacing.lg, textAlign: 'center', fontSize: 14, color: colors.textSecondary },
  quickActionsSection: { padding: spacing.lg },
  quickActionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center' },
  actionBtnText: { fontSize: 15, fontWeight: '600', color: colors.textInverse },
  actionBtnSecondary: { backgroundColor: colors.backgroundTertiary },
  actionBtnTextSecondary: { fontSize: 15, fontWeight: '600', color: colors.text },
  actionBtnOutline: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.primary, alignItems: 'center' },
  actionBtnTextOutline: { fontSize: 15, fontWeight: '600', color: colors.primary },
  alertBox: { marginTop: spacing.md, padding: spacing.sm, backgroundColor: colors.infoLight, borderRadius: 8 },
  alertTitle: { ...typography.body, fontWeight: '600', marginBottom: 2 },
  alertText: { ...typography.caption, color: colors.textSecondary },
  bottomSpacer: { height: spacing.xl * 2 },
});
