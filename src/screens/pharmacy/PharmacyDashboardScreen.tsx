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
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useOrders } from '../../queries/orderQueries';
import { useMyPetStoreSubscription, useMyPetStore } from '../../queries/petStoreQueries';
import { useMyProducts } from '../../queries/productQueries';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/appI18n';
import { Ionicons } from '@expo/vector-icons';
import Svg, { G, Path, Rect, Text as SvgText } from 'react-native-svg';

const STATUS_PIPELINE = [
  { key: 'PENDING', color: colors.warning },
  { key: 'CONFIRMED', color: colors.info },
  { key: 'PROCESSING', color: colors.primary },
  { key: 'SHIPPED', color: colors.secondaryDark },
  { key: 'DELIVERED', color: colors.success },
  { key: 'CANCELLED', color: colors.error },
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
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const isParapharmacy = user?.role === 'PARAPHARMACY';
  const locale = i18n.language?.startsWith('it') ? 'it-IT' : 'en-GB';

  const [refreshing, setRefreshing] = useState(false);
  const [chartsWidth, setChartsWidth] = useState<number>(
    Math.min(Dimensions.get('window').width - 64, 420)
  );
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

  const storeName = user?.name ?? (isParapharmacy ? t('more.pharmacy.parapharmacy') : t('more.pharmacy.pharmacy'));

  const revenueLast7Days = useMemo(() => {
    const dayBuckets: { key: string; label: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayBuckets.push({
        key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
        label: d.toLocaleDateString(locale, { weekday: 'short' }),
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
  }, [orders, locale]);

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    (orders as any[]).forEach((o) => {
      const s = String(o?.status ?? 'UNKNOWN').toUpperCase();
      counts[s] = (counts[s] ?? 0) + 1;
    });
    const items = STATUS_PIPELINE
      .map((s) => ({
        ...s,
        label: t(`pharmacyOrders.statusLabels.${s.key}`, { defaultValue: s.key }),
        count: counts[s.key] ?? 0,
      }))
      .filter((s) => s.count > 0);
    const total = items.reduce((sum, it) => sum + it.count, 0);
    return { items, total };
  }, [orders, t]);

  const renderRevenueChart = () => {
    const width = Math.max(240, chartsWidth);
    const height = 170;
    const paddingX = 12;
    const paddingTop = 10;
    const paddingBottom = 28;
    const chartHeight = height - paddingTop - paddingBottom;
    const values = revenueLast7Days.map((d) => d.total);
    const maxValue = Math.max(...values, 1);
    const barCount = revenueLast7Days.length;
    const barSpace = (width - paddingX * 2) / barCount;
    const barWidth = Math.max(10, Math.min(26, barSpace * 0.55));

    return (
      <Svg width={width} height={height}>
        {revenueLast7Days.map((d, idx) => {
          const barH = (d.total / maxValue) * chartHeight;
          const x = paddingX + idx * barSpace + (barSpace - barWidth) / 2;
          const y = paddingTop + (chartHeight - barH);
          return (
            <G key={d.key}>
              <Rect x={x} y={y} width={barWidth} height={barH} rx={6} fill={colors.primary} opacity={0.9} />
              <SvgText
                x={paddingX + idx * barSpace + barSpace / 2}
                y={height - 10}
                fontSize={11}
                fill={colors.textSecondary}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    );
  };

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const a = ((angle - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(a),
      y: cy + r * Math.sin(a),
    };
  };

  const describeArc = (
    cx: number,
    cy: number,
    rOuter: number,
    rInner: number,
    startAngle: number,
    endAngle: number
  ) => {
    const startOuter = polarToCartesian(cx, cy, rOuter, endAngle);
    const endOuter = polarToCartesian(cx, cy, rOuter, startAngle);
    const startInner = polarToCartesian(cx, cy, rInner, startAngle);
    const endInner = polarToCartesian(cx, cy, rInner, endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
      `L ${startInner.x} ${startInner.y}`,
      `A ${rInner} ${rInner} 0 ${largeArcFlag} 1 ${endInner.x} ${endInner.y}`,
      'Z',
    ].join(' ');
  };

  const renderStatusChart = () => {
    const size = 170;
    const cx = size / 2;
    const cy = size / 2;
    const rOuter = 72;
    const rInner = 46;
    const total = Math.max(statusBreakdown.total, 1);

    let startAngle = 0;

    return (
      <Svg width={size} height={size}>
        {statusBreakdown.items.map((it) => {
          const sweep = (it.count / total) * 360;
          const endAngle = startAngle + sweep;
          const path = describeArc(cx, cy, rOuter, rInner, startAngle, endAngle);
          const el = <Path key={it.key} d={path} fill={it.color} opacity={0.9} />;
          startAngle = endAngle;
          return el;
        })}
        <SvgText x={cx} y={cy - 2} fontSize={18} fill={colors.text} fontWeight="700" textAnchor="middle">
          {statusBreakdown.total}
        </SvgText>
        <SvgText x={cx} y={cy + 18} fontSize={11} fill={colors.textSecondary} textAnchor="middle">
          {t('pharmacyDashboard.charts.totalOrders')}
        </SvgText>
      </Svg>
    );
  };

  const latestCustomers = useMemo(() => {
    const seen = new Set<string>();
    const list = (orders as any[])
      .slice()
      .sort((a, b) => new Date(b?.createdAt ?? 0).getTime() - new Date(a?.createdAt ?? 0).getTime());
    const formatDate = (d: string | Date | null | undefined) => {
      if (!d) return t('common.na');
      const date = typeof d === 'string' ? new Date(d) : d;
      return isNaN(date.getTime()) ? String(d) : date.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
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
          name: c?.name ?? t('common.na'),
          email: c?.email ?? t('common.na'),
          dateAdded: formatDate(o?.createdAt),
        };
      });
  }, [orders, locale, t]);

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
        title: t('pharmacyDashboard.stats.revenueToday'),
        value: `€${revenueToday.toFixed(2)}`,
        icon: '💰',
        iconColor: colors.primary,
        progress: Math.min(100, revenueToday > 0 ? Math.round((revenueToday / 500) * 100) : 0),
      },
      {
        id: '2',
        title: t('pharmacyDashboard.stats.totalOrders'),
        value: String(totalOrders),
        icon: '📦',
        iconColor: colors.success,
        progress: totalOrders > 0 ? 100 : 0,
      },
      {
        id: '3',
        title: t('pharmacyDashboard.stats.pendingOrders'),
        value: String(pendingCount),
        icon: '⏳',
        iconColor: colors.warning,
        progress: totalOrders ? Math.min(100, Math.round((pendingCount / totalOrders) * 100)) : 0,
      },
      {
        id: '4',
        title: t('pharmacyDashboard.stats.products'),
        value: String(productsData.total),
        icon: '🛍',
        iconColor: colors.info,
        progress: productsData.total > 0 ? 100 : 0,
      },
    ],
    [revenueToday, totalOrders, pendingCount, productsData.total, t]
  );

  return (
    <SafeAreaView style={styles.flex}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <View style={styles.header}>
          <Text style={styles.welcomeTitle}>{t('pharmacyDashboard.header.welcome', { storeName })}</Text>
          <Text style={styles.breadcrumb}>{t('pharmacyDashboard.header.title')}</Text>
        </View>

        {showProfileBanner && (
          <TouchableOpacity style={styles.profileBanner} onPress={() => navMore('PharmacyProfile')} activeOpacity={0.8}>
            <Text style={styles.profileBannerIcon}>⚠</Text>
            <Text style={styles.profileBannerText}>{t('pharmacyDashboard.banners.completeProfile')}</Text>
            <Text style={styles.profileBannerChevron}>›</Text>
          </TouchableOpacity>
        )}

        {!isParapharmacy && !mySubQuery.isLoading && !hasActiveSubscription && (
          <View style={styles.subscriptionBanner}>
            <View style={styles.subscriptionBannerRow}>
              <Text style={styles.subscriptionBannerIcon}>💳</Text>
              <Text style={styles.subscriptionBannerText}>{t('pharmacyDashboard.banners.subscriptionRequired')}</Text>
            </View>
            <TouchableOpacity style={styles.subscriptionBtn} onPress={() => navMore('PharmacySubscription')}>
              <Text style={styles.subscriptionBtnText}>{t('pharmacyDashboard.actions.viewPlans')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isParapharmacy && mySubQuery.isLoading && (
          <View style={styles.pendingBanner}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.pendingBannerText}>{t('pharmacyDashboard.loading.subscription')}</Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('pharmacyDashboard.loading.dashboard')}</Text>
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

            <View
              style={styles.chartsSection}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w && Number.isFinite(w)) {
                  setChartsWidth(Math.min(w - 32, 520));
                }
              }}
            >
              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>{t('pharmacyDashboard.charts.revenueLast7Days')}</Text>
                </View>
                {revenueLast7Days.some((d) => d.total > 0) ? (
                  <View style={styles.chartBodySvg}>
                    {renderRevenueChart()}
                    <Text style={styles.chartHintText}>{t('pharmacyDashboard.charts.last7Days')}</Text>
                  </View>
                ) : (
                  <View style={styles.chartPlaceholder}>
                    <Ionicons name="bar-chart" size={48} color={colors.textLight} />
                    <Text style={styles.chartPlaceholderText}>{t('pharmacyDashboard.charts.noPaidOrdersLast7Days')}</Text>
                  </View>
                )}
              </View>

              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Text style={styles.chartTitle}>{t('pharmacyDashboard.charts.ordersByStatus')}</Text>
                </View>
                {statusBreakdown.total > 0 ? (
                  <View style={styles.statusChartBody}>
                    {renderStatusChart()}
                    <View style={styles.statusLegend}>
                      {statusBreakdown.items.slice(0, 6).map((s) => (
                        <View key={s.key} style={styles.legendRow}>
                          <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                          <Text style={styles.legendLabel} numberOfLines={1}>
                            {s.label}
                          </Text>
                          <Text style={styles.legendValue}>{s.count}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.chartPlaceholder}>
                    <Ionicons name="trending-up" size={48} color={colors.textLight} />
                    <Text style={styles.chartPlaceholderText}>{t('pharmacyDashboard.charts.noOrdersYet')}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.customersSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('pharmacyDashboard.latestCustomers.title')}</Text>
                <TouchableOpacity onPress={() => navOrders()}>
                  <Text style={styles.viewAllText}>{t('pharmacyDashboard.latestCustomers.viewAll')}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.customersCard}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderCell}>{t('pharmacyDashboard.latestCustomers.table.name')}</Text>
                  <Text style={styles.tableHeaderCell}>{t('pharmacyDashboard.latestCustomers.table.email')}</Text>
                  <Text style={styles.tableHeaderCell}>{t('pharmacyDashboard.latestCustomers.table.date')}</Text>
                </View>
                {latestCustomers.length === 0 ? (
                  <Text style={styles.emptyTableText}>{t('pharmacyDashboard.latestCustomers.empty')}</Text>
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

            <View style={styles.bottomSpacer} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chartTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  chartBodySvg: { backgroundColor: colors.backgroundSecondary, borderRadius: 8, padding: spacing.sm, alignItems: 'center' },
  chartHintText: { marginTop: spacing.xs, fontSize: 12, color: colors.textSecondary },
  statusChartBody: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.backgroundSecondary, borderRadius: 8, padding: spacing.sm },
  statusLegend: { flex: 1, paddingLeft: spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendLabel: { flex: 1, fontSize: 13, color: colors.text },
  legendValue: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  chartPlaceholder: { paddingVertical: spacing.xl, alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: 8 },
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
  bottomSpacer: { height: spacing.xl * 2 },
});
