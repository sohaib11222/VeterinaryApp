import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { useMyProducts } from '../../queries/productQueries';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { getImageUrl } from '../../config/api';

function extractProducts(payload: unknown): any[] {
  const outer = (payload as { data?: unknown })?.data ?? payload;
  const d = (outer as { data?: unknown })?.data ?? outer;
  const list = (d as { products?: unknown[] })?.products ?? (d as { items?: unknown[] })?.items;
  return Array.isArray(list) ? list : [];
}

export function PharmacyProductListScreen() {
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [search, setSearch] = useState('');

  const queryParams = useMemo(() => ({
    page: 1,
    limit: 100,
    isActive: filter === 'all' ? undefined : filter === 'active' ? 'true' : 'false',
    search: search.trim() || undefined,
  }), [filter, search]);

  const { data, isLoading, isError } = useMyProducts(queryParams);
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
      <View style={styles.filterRow}>
        <Input placeholder="Search products..." value={search} onChangeText={setSearch} />
        <View style={styles.filterTabs}>
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('PharmacyAddProduct')}>
        <Text style={styles.addBtnText}>+ Add Product</Text>
      </TouchableOpacity>
      {isLoading ? (
        <View style={styles.loadingRow}><ActivityIndicator size="small" color={colors.primary} /></View>
      ) : isError ? (
        <Text style={styles.errorText}>Failed to load products.</Text>
      ) : filtered.length === 0 ? (
        <Text style={styles.emptyText}>No products yet.</Text>
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
                    {img ? <Image source={{ uri: img }} style={styles.thumbImg} resizeMode="cover" /> : null}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>{name}</Text>
                    <Text style={styles.productMeta}>€{Number(price).toFixed(2)} · Stock: {stock}</Text>
                    <View style={[styles.badge, !isActive && styles.badgeInactive]}>
                      <Text style={[styles.badgeText, !isActive && styles.badgeTextInactive]}>{isActive ? 'Active' : 'Inactive'}</Text>
                    </View>
                  </View>
                  <View style={styles.rowActions}>
                    <TouchableOpacity onPress={(e) => { e?.stopPropagation?.(); navigation.navigate('PharmacyProductDetails', { productId: String(id) }); }}>
                      <Text style={styles.viewLink}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={(e) => { e?.stopPropagation?.(); navigation.navigate('PharmacyEditProduct', { productId: String(id) }); }}>
                      <Text style={styles.editLink}>Edit</Text>
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
  filterRow: { marginBottom: spacing.sm },
  filterTabs: { flexDirection: 'row', gap: 8, marginTop: spacing.sm },
  filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.backgroundSecondary },
  filterTabActive: { backgroundColor: colors.primary },
  filterTabText: { ...typography.bodySmall },
  filterTabTextActive: { color: colors.textInverse, fontWeight: '600' },
  addBtn: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 16, backgroundColor: colors.primary, borderRadius: 20, marginBottom: spacing.md },
  addBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '600' },
  loadingRow: { padding: spacing.xl, alignItems: 'center' },
  errorText: { ...typography.body, color: colors.error, padding: spacing.lg },
  emptyText: { ...typography.body, color: colors.textSecondary, padding: spacing.lg },
  productCardWrap: { marginBottom: spacing.sm },
  productCard: {},
  productRow: { flexDirection: 'row', alignItems: 'center' },
  productThumb: { width: 56, height: 56, backgroundColor: colors.backgroundTertiary, borderRadius: 8, overflow: 'hidden' },
  thumbImg: { width: 56, height: 56 },
  productInfo: { flex: 1, marginLeft: spacing.sm },
  productName: { ...typography.body, fontWeight: '600' },
  productMeta: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  badge: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: colors.successLight },
  badgeInactive: { backgroundColor: colors.errorLight },
  badgeText: { ...typography.caption, fontWeight: '600', color: colors.success },
  badgeTextInactive: { color: colors.error },
  rowActions: { flexDirection: 'row', gap: spacing.md },
  viewLink: { ...typography.body, color: colors.primary, fontWeight: '600' },
  editLink: { ...typography.body, color: colors.primary, fontWeight: '600' },
});
