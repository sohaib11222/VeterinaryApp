import React, { useMemo, useState } from 'react';
import { AppImage } from '../../../components/common/AppImage';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Input } from '../../../components/common/Input';
import { PetOwnerPharmacyStackParamList } from '../../../navigation/types';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { useProducts } from '../../../queries/productQueries';
import { useCart } from '../../../contexts/CartContext';
import { getImageUrl } from '../../../config/api';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

type Route = RouteProp<PetOwnerPharmacyStackParamList, 'ProductCatalog'>;
type Nav = NativeStackNavigationProp<PetOwnerPharmacyStackParamList>;
type SortBy = 'FEATURED' | 'PRICE_ASC' | 'PRICE_DESC' | 'IN_STOCK';

export function ProductCatalogScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { width } = useWindowDimensions();
  const { pharmacyId, sellerId } = route.params ?? {};
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('FEATURED');
  const { addToCart } = useCart();
  const { data: productsRes, isLoading } = useProducts({ search: searchTerm.trim() || undefined, sellerId, page: 1, limit: 50 });
  const payload: any = (productsRes as any)?.data ?? productsRes ?? {};
  const rawProducts = Array.isArray(payload?.products) ? payload.products : (Array.isArray(payload?.data?.products) ? payload.data.products : []);
  const categories = useMemo<string[]>(() => Array.from(new Set<string>(rawProducts.map((product: Record<string, unknown>) => String(product.category ?? '').trim()).filter(Boolean))).sort(), [rawProducts]);
  const products = useMemo(() => {
    const filtered = categoryFilter ? rawProducts.filter((product: Record<string, unknown>) => String(product.category ?? '') === categoryFilter) : rawProducts;
    return [...filtered].sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const priceA = Number(a.discountPrice ?? a.price ?? 0); const priceB = Number(b.discountPrice ?? b.price ?? 0);
      if (sortBy === 'PRICE_ASC') return priceA - priceB;
      if (sortBy === 'PRICE_DESC') return priceB - priceA;
      if (sortBy === 'IN_STOCK') return Number(b.stock ?? 0) - Number(a.stock ?? 0);
      return 0;
    });
  }, [categoryFilter, rawProducts, sortBy]);
  const cardWidth = (width - spacing.md * 2 - spacing.sm) / 2;

  return <ScreenContainer scroll padded contentContainerStyle={styles.catalogContent}>
    <View style={styles.searchWrap}><Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} /><Input placeholder={t('petOwnerPharmacyCatalog.searchPlaceholder')} value={searchTerm} onChangeText={setSearchTerm} style={styles.searchInputInner} /></View>
    {categories.length > 0 ? <><Text style={styles.filterLabel}>{t('petOwnerPharmacyCatalog.labels.categories')}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}><TouchableOpacity style={[styles.filterChip, !categoryFilter && styles.filterChipActive]} onPress={() => setCategoryFilter('')}><Text style={[styles.filterChipText, !categoryFilter && styles.filterChipTextActive]}>{t('common.all')}</Text></TouchableOpacity>{categories.map((category) => <TouchableOpacity key={category} style={[styles.filterChip, categoryFilter === category && styles.filterChipActive]} onPress={() => setCategoryFilter(category)}><Text style={[styles.filterChipText, categoryFilter === category && styles.filterChipTextActive]}>{category}</Text></TouchableOpacity>)}</ScrollView></> : null}
    <View style={styles.sortRow}><Text style={styles.filterLabel}>{t('petOwnerPharmacyCatalog.labels.sortBy')}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortScroll}>{(['FEATURED', 'PRICE_ASC', 'PRICE_DESC', 'IN_STOCK'] as const).map((sort) => <TouchableOpacity key={sort} style={[styles.sortChip, sortBy === sort && styles.sortChipActive]} onPress={() => setSortBy(sort)}><Text style={[styles.sortChipText, sortBy === sort && styles.sortChipTextActive]}>{t(`petOwnerPharmacyCatalog.sort.${sort}`)}</Text></TouchableOpacity>)}</ScrollView></View>
    <Text style={styles.resultCount}>{t('petOwnerPharmacyCatalog.results', { count: products.length, suffix: pharmacyId || sellerId ? t('petOwnerPharmacyCatalog.fromThisPharmacySuffix') : '' })}</Text>
    {isLoading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.lg }} /> : products.length === 0 ? <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="cube-outline" size={31} color={colors.primary} /></View><Text style={styles.emptyText}>{t('petOwnerPharmacyCatalog.empty')}</Text></View> : <View style={styles.productsGrid}>{products.map((p: Record<string, unknown>) => {
      const id = String(p._id ?? p.id ?? ''); const name = (p.name as string) ?? t('petOwnerPharmacyCatalog.defaults.product'); const price = Number(p.discountPrice ?? p.price ?? 0); const originalPrice = typeof p.price === 'number' ? p.price : undefined; const images = p.images as string[] | undefined; const imageUri = getImageUrl(Array.isArray(images) && images[0] ? images[0] : undefined); const stock = Number(p.stock ?? 0); const requiresPrescription = Boolean(p.requiresPrescription);
      return <TouchableOpacity key={id} style={[styles.productCard, { width: cardWidth }]} onPress={() => navigation.navigate('ProductDetails', { productId: id })} activeOpacity={0.8}><View style={styles.productImageContainer}>{imageUri ? <AppImage source={{ uri: imageUri }} style={styles.productImage} resizeMode="cover" /> : <View style={[styles.productImage, styles.productImageFallback]}><Ionicons name="cube-outline" size={28} color={colors.textLight} /></View>}{requiresPrescription ? <View style={styles.prescriptionTag}><Ionicons name="document-text-outline" size={12} color="#805B00" /></View> : null}</View><View style={styles.productContent}><Text style={styles.productName} numberOfLines={2}>{name}</Text><Text style={styles.productAvailability}>{stock > 0 ? t('petOwnerPharmacyCatalog.stock.available', { count: stock }) : t('petOwnerPharmacyCatalog.stock.out')}</Text><View style={styles.productPriceRow}><View style={styles.priceContainer}><Text style={styles.productPrice}>€{price.toFixed(2)}</Text>{originalPrice != null && originalPrice > price ? <Text style={styles.originalPrice}>€{originalPrice.toFixed(2)}</Text> : null}</View><TouchableOpacity style={styles.cartBtn} onPress={(e) => { e?.stopPropagation?.(); if (requiresPrescription) { Toast.show({ type: 'info', text1: 'Prescription required', text2: 'Upload and obtain approval from the product page before adding this medicine.' }); navigation.navigate('ProductDetails', { productId: id }); return; } addToCart(p, 1); }}><Ionicons name="cart-outline" size={18} color={colors.primary} /></TouchableOpacity></View></View></TouchableOpacity>;
    })}</View>}
    <View style={styles.bottomSpacer} />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  catalogContent: { paddingBottom: spacing.xxl },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundTertiary, borderRadius: 14, paddingHorizontal: spacing.sm, marginBottom: spacing.md, minHeight: 50 }, searchIcon: { marginRight: spacing.sm }, searchInputInner: { flex: 1, marginBottom: 0 },
  filterLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: spacing.xs }, filterScroll: { gap: 8, paddingRight: spacing.sm, marginBottom: spacing.md }, filterChip: { backgroundColor: colors.backgroundSecondary, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 }, filterChipActive: { backgroundColor: colors.primary }, filterChipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' }, filterChipTextActive: { color: colors.textInverse },
  sortRow: { marginBottom: spacing.sm }, sortScroll: { gap: 8, paddingRight: spacing.sm }, sortChip: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }, sortChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight + '18' }, sortChipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' }, sortChipTextActive: { color: colors.primaryDark }, resultCount: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl }, emptyIcon: { width: 64, height: 64, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '18', marginBottom: spacing.sm }, emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' }, productsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }, productCard: { backgroundColor: colors.background, borderRadius: 16, marginBottom: spacing.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderLight }, productImageContainer: { position: 'relative', width: '100%', height: 150 }, productImage: { width: '100%', height: '100%', backgroundColor: colors.backgroundTertiary }, productImageFallback: { alignItems: 'center', justifyContent: 'center' }, prescriptionTag: { position: 'absolute', top: 8, left: 8, width: 27, height: 27, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.warningLight }, productContent: { padding: spacing.sm }, productName: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4, minHeight: 36 }, productAvailability: { ...typography.caption, color: colors.textSecondary, marginBottom: 7 }, productPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, priceContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 }, productPrice: { fontSize: 16, fontWeight: '800', color: colors.primaryDark }, originalPrice: { fontSize: 12, color: colors.textSecondary, textDecorationLine: 'line-through' }, cartBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight + '40', alignItems: 'center', justifyContent: 'center' }, bottomSpacer: { height: spacing.xl },
});
