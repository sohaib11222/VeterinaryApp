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
import { typography } from '../../theme/typography';
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
  const polling = { refetchInterval: 20_000, refetchIntervalInBackground: true };
  const recentOrdersQuery = useOrders({ page: 1, limit: 100 }, polling);
  const statusPending = useOrders({ status: 'PENDING', page: 1, limit: 1 }, polling);
  const statusConfirmed = useOrders({ status: 'CONFIRMED', page: 1, limit: 1 }, polling);
  const statusProcessing = useOrders({ status: 'PROCESSING', page: 1, limit: 1 }, polling);
  const statusShipped = useOrders({ status: 'SHIPPED', page: 1, limit: 1 }, polling);
  const statusDelivered = useOrders({ status: 'DELIVERED', page: 1, limit: 1 }, polling);
  const statusCancelled = useOrders({ status: 'CANCELLED', page: 1, limit: 1 }, polling);

  const mySubQuery = useMyPetStoreSubscription({ enabled: !isParapharmacy, refetchInterval: 30_000 });
  const myStoreQuery = useMyPetStore({ refetchInterval: 30_000 });
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
  const workspaceLabel = isParapharmacy ? 'Parapharmacy workspace' : 'Pharmacy workspace';
  const todayLabel = new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short' });

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
    navigation.navigate('PharmacyOrders', { screen: 'PharmacyOrdersList', params: params ?? {} });
  const navProducts = () => navigation.navigate('PharmacyProducts', { screen: 'PharmacyProductList' });
  const navMore = (screen: string) => navigation.navigate('PharmacyMore', { screen });

  const isLoading = recentOrdersQuery.isLoading && orders.length === 0;
  const stats = useMemo(
    () => [
      {
        id: '1',
        title: t('pharmacyDashboard.stats.revenueToday'),
        value: `€${revenueToday.toFixed(2)}`,
        icon: 'cash-outline',
        iconColor: colors.primary,
        progress: Math.min(100, revenueToday > 0 ? Math.round((revenueToday / 500) * 100) : 0),
      },
      {
        id: '2',
        title: t('pharmacyDashboard.stats.totalOrders'),
        value: String(totalOrders),
        icon: 'cube-outline',
        iconColor: colors.success,
        progress: totalOrders > 0 ? 100 : 0,
      },
      {
        id: '3',
        title: t('pharmacyDashboard.stats.pendingOrders'),
        value: String(pendingCount),
        icon: 'time-outline',
        iconColor: colors.warning,
        progress: totalOrders ? Math.min(100, Math.round((pendingCount / totalOrders) * 100)) : 0,
      },
      {
        id: '4',
        title: t('pharmacyDashboard.stats.products'),
        value: String(productsData.total),
        icon: 'bag-handle-outline',
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
        <View style={styles.dashboardHero}>
          <View style={styles.heroOrbLarge} />
          <View style={styles.heroOrbSmall} />
          <View style={styles.heroTopRow}>
            <View style={styles.heroIcon}><Ionicons name={isParapharmacy ? 'leaf-outline' : 'medkit-outline'} size={23} color={colors.primaryDark} /></View>
            <View style={styles.heroPill}><Ionicons name="sparkles-outline" size={13} color={colors.primaryDark} /><Text style={styles.heroPillText}>{workspaceLabel}</Text></View>
          </View>
          <Text style={styles.heroWelcome}>Welcome back,</Text>
          <Text style={styles.heroName} numberOfLines={1}>{storeName}</Text>
          <Text style={styles.heroDate}>{todayLabel} · Your operations are up to date.</Text>
          <View style={styles.heroKpiRow}>
            <View style={styles.heroKpi}><Text style={styles.heroKpiLabel}>Today’s revenue</Text><Text style={styles.heroKpiValue}>€{revenueToday.toFixed(2)}</Text></View>
            <View style={styles.heroKpiDivider} />
            <View style={styles.heroKpi}><Text style={styles.heroKpiLabel}>Orders to review</Text><Text style={styles.heroKpiValue}>{pendingCount}</Text></View>
          </View>
        </View>

        {showProfileBanner && (
          <TouchableOpacity style={styles.profileBanner} onPress={() => navMore('PharmacyProfile')} activeOpacity={0.8}>
            <View style={styles.bannerIconWarning}><Ionicons name="alert-circle-outline" size={19} color={colors.secondaryDark} /></View>
            <Text style={styles.profileBannerText}>{t('pharmacyDashboard.banners.completeProfile')}</Text>
            <Text style={styles.profileBannerChevron}>›</Text>
          </TouchableOpacity>
        )}

        {!isParapharmacy && !mySubQuery.isLoading && !hasActiveSubscription && (
          <View style={styles.subscriptionBanner}>
            <View style={styles.subscriptionBannerRow}>
              <View style={styles.bannerIconWarning}><Ionicons name="ribbon-outline" size={19} color={colors.secondaryDark} /></View>
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
            <View style={styles.quickActionsSection}>
              <View style={styles.sectionHeader}><View><Text style={styles.sectionEyebrow}>WORKSPACE</Text><Text style={styles.sectionTitle}>Quick actions</Text></View><Ionicons name="flash-outline" size={19} color={colors.secondaryDark} /></View>
              <View style={styles.quickActionGrid}>
                <TouchableOpacity style={styles.quickAction} onPress={navProducts} activeOpacity={0.82}><View style={[styles.quickActionIcon, { backgroundColor: colors.primaryLight + '18' }]}><Ionicons name="cube-outline" size={20} color={colors.primary} /></View><Text style={styles.quickActionLabel}>Products</Text><Text style={styles.quickActionHint}>Manage catalog</Text></TouchableOpacity>
                <TouchableOpacity style={styles.quickAction} onPress={() => navOrders({ status: 'PENDING' })} activeOpacity={0.82}><View style={[styles.quickActionIcon, { backgroundColor: colors.warningLight }]}><Ionicons name="time-outline" size={20} color={colors.secondaryDark} /></View><Text style={styles.quickActionLabel}>Pending orders</Text><Text style={styles.quickActionHint}>Review and prepare</Text></TouchableOpacity>
                <TouchableOpacity style={styles.quickAction} onPress={() => navMore('PharmacyPayouts')} activeOpacity={0.82}><View style={[styles.quickActionIcon, { backgroundColor: colors.infoLight }]}><Ionicons name="wallet-outline" size={20} color={colors.info} /></View><Text style={styles.quickActionLabel}>Payouts</Text><Text style={styles.quickActionHint}>Balance and history</Text></TouchableOpacity>
              </View>
            </View>
            <View style={styles.statsSection}>
              <View style={styles.sectionHeader}><View><Text style={styles.sectionEyebrow}>PERFORMANCE</Text><Text style={styles.sectionTitle}>At a glance</Text></View><Text style={styles.sectionCaption}>Live overview</Text></View>
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
                        <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={22} color={item.iconColor} />
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
              <View style={styles.sectionHeader}><View><Text style={styles.sectionEyebrow}>INSIGHTS</Text><Text style={styles.sectionTitle}>Store performance</Text></View><Ionicons name="analytics-outline" size={19} color={colors.primary} /></View>
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
                <View><Text style={styles.sectionEyebrow}>CUSTOMERS</Text><Text style={styles.sectionTitle}>{t('pharmacyDashboard.latestCustomers.title')}</Text></View>
                <TouchableOpacity style={styles.viewAllButton} onPress={() => navOrders()}>
                  <Text style={styles.viewAllText}>{t('pharmacyDashboard.latestCustomers.viewAll')}</Text><Ionicons name="arrow-forward" size={14} color={colors.primary} />
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
  dashboardHero: { overflow: 'hidden', backgroundColor: colors.primaryDark, padding: spacing.lg, paddingTop: spacing.xl, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  heroOrbLarge: { position: 'absolute', width: 220, height: 220, borderRadius: 110, right: -75, top: -105, backgroundColor: colors.primaryLight, opacity: .32 },
  heroOrbSmall: { position: 'absolute', width: 110, height: 110, borderRadius: 55, left: -42, bottom: -58, backgroundColor: colors.secondary, opacity: .18 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successLight },
  heroPill: { flexDirection: 'row', gap: 4, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)' },
  heroPillText: { ...typography.caption, color: colors.textInverse, fontWeight: '700' },
  heroWelcome: { ...typography.bodySmall, color: 'rgba(255,255,255,0.72)', marginTop: spacing.lg },
  heroName: { ...typography.h1, color: colors.textInverse, marginTop: 1 },
  heroDate: { ...typography.caption, color: 'rgba(255,255,255,0.72)', marginTop: 5 },
  heroKpiRow: { flexDirection: 'row', marginTop: spacing.md, padding: spacing.sm, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.10)' },
  heroKpi: { flex: 1 }, heroKpiLabel: { ...typography.caption, color: 'rgba(255,255,255,0.68)' }, heroKpiValue: { ...typography.h3, color: colors.textInverse, marginTop: 2 }, heroKpiDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.20)', marginHorizontal: spacing.sm },
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
  bannerIconWarning: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
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
  subscriptionBannerText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
  subscriptionBtn: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 16, backgroundColor: colors.primary, borderRadius: 20 },
  subscriptionBtnText: { fontSize: 14, fontWeight: '600', color: colors.textInverse },
  loadingContainer: { padding: spacing.xl * 2, alignItems: 'center' },
  loadingText: { marginTop: spacing.sm, fontSize: 14, color: colors.textSecondary },
  quickActionsSection: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  quickActionGrid: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  quickAction: { flex: 1, minHeight: 123, padding: spacing.sm, borderRadius: 16, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.borderLight },
  quickActionIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  quickActionLabel: { ...typography.caption, color: colors.primaryDark, fontWeight: '800' },
  quickActionHint: { ...typography.caption, color: colors.textSecondary, marginTop: 3, lineHeight: 15 },
  statsSection: { padding: spacing.lg, paddingBottom: spacing.md },
  statRow: { gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.primaryDark },
  statFooter: {},
  statLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 6 },
  progressBar: { height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  chartsSection: { paddingHorizontal: spacing.lg, gap: spacing.md },
  chartCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
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
  customersSection: { padding: spacing.lg, paddingTop: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionEyebrow: { ...typography.caption, color: colors.textSecondary, fontWeight: '800', letterSpacing: .6 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.primaryDark, marginTop: 2 },
  sectionCaption: { ...typography.caption, color: colors.textSecondary },
  viewAllButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 5, paddingLeft: spacing.sm },
  viewAllText: { fontSize: 13, color: colors.primary, fontWeight: '800' },
  customersCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
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
