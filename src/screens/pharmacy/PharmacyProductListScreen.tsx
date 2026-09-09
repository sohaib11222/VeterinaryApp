import React, { useMemo, useState } from 'react';
import { AppImage } from '../../components/common/AppImage';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { useMyProducts } from '../../queries/productQueries';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { getImageUrl } from '../../config/api';
import { useTranslation } from 'react-i18next';

function extractProducts(payload: unknown): any[] {
  const outer = (payload as { data?: unknown })?.data ?? payload;
  const d = (outer as { data?: unknown })?.data ?? outer;
  const list = (d as { products?: unknown[] })?.products ?? (d as { items?: unknown[] })?.items;
  return Array.isArray(list) ? list : [];
}

export function PharmacyProductListScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [search, setSearch] = useState('');

  const filterLabels: Record<'all' | 'active' | 'inactive', string> = useMemo(
    () => ({
      all: t('common.all'),
      active: t('pharmacyProductList.tabs.active'),
      inactive: t('pharmacyProductList.tabs.inactive'),
    }),
    [t]
  );

  const queryParams = useMemo(() => ({
    page: 1,
    limit: 100,
    isActive: filter === 'all' ? undefined : filter === 'active' ? 'true' : 'false',
    search: search.trim() || undefined,
  }), [filter, search]);

  const { data, isLoading, isError, refetch, isFetching } = useMyProducts(queryParams, { refetchInterval: 20_000, refetchIntervalInBackground: true });
  const products = useMemo(() => extractProducts(data), [data]);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.trim().toLowerCase();
    return products.filter((p: any) =>
      String(p?.name ?? '').toLowerCase().includes(q) ||
      String(p?.category ?? '').toLowerCase().includes(q)
    );
  }, [products, search]);

  return (
    <ScreenContainer scroll padded>
      <View style={styles.overviewRow}>
        <View><Text style={styles.overviewTitle}>Your catalogue</Text><Text style={styles.overviewText}>{filtered.length} product{filtered.length === 1 ? '' : 's'} shown</Text></View>
        <TouchableOpacity style={styles.refreshButton} onPress={() => refetch()} disabled={isFetching}><Ionicons name="refresh-outline" size={19} color={colors.primaryDark} /></TouchableOpacity>
      </View>
      <View style={styles.filterRow}>
        <Input placeholder={t('pharmacyProductList.searchPlaceholder')} value={search} onChangeText={setSearch} />
        <View style={styles.filterTabs}>
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>{filterLabels[f]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('PharmacyAddProduct')}>
        <Ionicons name="add-circle-outline" size={19} color={colors.textInverse} />
        <Text style={styles.addBtnText}>{t('pharmacyProductList.actions.addProduct')}</Text>
      </TouchableOpacity>
      {isLoading ? (
        <View style={styles.loadingRow}><ActivityIndicator size="small" color={colors.primary} /></View>
      ) : isError ? (
        <Text style={styles.errorText}>{t('pharmacyProductList.errors.loadFailed')}</Text>
      ) : filtered.length === 0 ? (
          <View style={styles.emptyState}><View style={styles.emptyIcon}><Ionicons name="cube-outline" size={30} color={colors.primary} /></View><Text style={styles.emptyText}>{t('pharmacyProductList.empty.noProducts')}</Text><TouchableOpacity style={styles.emptyAction} onPress={() => navigation.navigate('PharmacyAddProduct')}><Text style={styles.emptyActionText}>Create your first product</Text></TouchableOpacity></View>
      ) : (
        filtered.map((p: any) => {
          const id = p?._id ?? p?.id;
          const name = p?.name ?? '—';
          const price = p?.price ?? 0;
          const stock = p?.stock ?? 0;
          const isActive = p?.isActive !== false;
          const img = Array.isArray(p?.images) && p.images[0] ? getImageUrl(p.images[0]) : null;
          return (
            <TouchableOpacity
              key={id}
              style={styles.productCardWrap}
              onPress={() => navigation.navigate('PharmacyProductDetails', { productId: String(id) })}
              activeOpacity={0.8}
            >
              <Card style={styles.productCard}>
                <View style={styles.productRow}>
                  <View style={styles.productThumb}>
                    {img ? <AppImage source={{ uri: img }} style={styles.thumbImg} resizeMode="cover" /> : null}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>{name}</Text>
                    {p?.requiresPrescription ? <View style={styles.prescriptionLabel}><Ionicons name="document-text-outline" size={12} color="#805B00" /><Text style={styles.prescriptionText}>Prescription</Text></View> : null}
                    <Text style={styles.productMeta}>
                      {t('pharmacyProductList.labels.priceAndStock', { price: Number(price).toFixed(2), stock })}
                    </Text>
                    <View style={[styles.badge, !isActive && styles.badgeInactive]}>
                      <Text style={[styles.badgeText, !isActive && styles.badgeTextInactive]}>
                        {isActive ? t('pharmacyProductList.status.active') : t('pharmacyProductList.status.inactive')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.rowActions}>
                    <TouchableOpacity style={styles.iconAction} onPress={(e) => { e?.stopPropagation?.(); navigation.navigate('PharmacyProductDetails', { productId: String(id) }); }}>
                      <Ionicons name="eye-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconAction} onPress={(e) => { e?.stopPropagation?.(); navigation.navigate('PharmacyEditProduct', { productId: String(id) }); }}>
                      <Ionicons name="create-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  overviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  overviewTitle: { ...typography.h2, color: colors.primaryDark },
  overviewText: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  refreshButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.primaryLight + '18' },
  filterRow: { marginBottom: spacing.sm },
  filterTabs: { flexDirection: 'row', gap: 8, marginTop: spacing.sm },
  filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.backgroundSecondary },
  filterTabActive: { backgroundColor: colors.primary },
  filterTabText: { ...typography.bodySmall },
  filterTabTextActive: { color: colors.textInverse, fontWeight: '600' },
  addBtn: { alignSelf: 'stretch', flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', paddingVertical: 13, paddingHorizontal: 16, backgroundColor: colors.primary, borderRadius: 14, marginBottom: spacing.md },
  addBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '600' },
  loadingRow: { padding: spacing.xl, alignItems: 'center' },
  errorText: { ...typography.body, color: colors.error, padding: spacing.lg },
  emptyState: { alignItems: 'center', padding: spacing.xl },
  emptyIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '1C', marginBottom: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  emptyAction: { marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.primaryLight + '1B' },
  emptyActionText: { ...typography.bodySmall, color: colors.primaryDark, fontWeight: '800' },
  productCardWrap: { marginBottom: spacing.sm },
  productCard: {},
  productRow: { flexDirection: 'row', alignItems: 'center' },
  productThumb: { width: 56, height: 56, backgroundColor: colors.backgroundTertiary, borderRadius: 8, overflow: 'hidden' },
  thumbImg: { width: 56, height: 56 },
  productInfo: { flex: 1, marginLeft: spacing.sm },
  productName: { ...typography.body, fontWeight: '600' },
  prescriptionLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7, backgroundColor: colors.warningLight, marginTop: 4 },
  prescriptionText: { ...typography.caption, color: '#805B00', fontWeight: '800' },
  productMeta: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  badge: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: colors.successLight },
  badgeInactive: { backgroundColor: colors.errorLight },
  badgeText: { ...typography.caption, fontWeight: '600', color: colors.success },
  badgeTextInactive: { color: colors.error },
  rowActions: { flexDirection: 'row', gap: spacing.xs },
  iconAction: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: colors.primaryLight + '16' },
});
