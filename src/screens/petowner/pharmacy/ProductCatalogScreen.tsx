import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
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

type Route = RouteProp<PetOwnerPharmacyStackParamList, 'ProductCatalog'>;
type Nav = NativeStackNavigationProp<PetOwnerPharmacyStackParamList>;

export function ProductCatalogScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { width } = useWindowDimensions();
  const { pharmacyId, sellerId } = route.params ?? {};
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart } = useCart();

  const { data: productsRes, isLoading } = useProducts({
    search: searchTerm.trim() || undefined,
    sellerId,
    page: 1,
    limit: 50,
  });

  const payload = productsRes?.data ?? (productsRes as { data?: { products?: unknown[] } } | undefined);
  const products = Array.isArray(payload?.products) ? payload.products : [];

  const cardWidth = (width - spacing.md * 2 - spacing.sm) / 2;

  return (
    <ScreenContainer padded>
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={styles.searchInputInner}
        />
      </View>

      <Text style={styles.resultCount}>
        Showing {products.length} products{pharmacyId || sellerId ? ' from this pharmacy' : ''}
      </Text>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.lg }} />
      ) : products.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>No products found. Try adjusting your search or category.</Text>
        </View>
      ) : (
        <View style={styles.productsGrid}>
          {products.map((p: Record<string, unknown>) => {
            const id = String(p._id ?? p.id ?? '');
            const name = (p.name as string) ?? 'Product';
            const price = Number(p.discountPrice ?? p.price ?? 0);
            const originalPrice = typeof p.price === 'number' ? p.price : undefined;
            const images = p.images as string[] | undefined;
            const imageUri = getImageUrl(Array.isArray(images) && images[0] ? images[0] : undefined);
            return (
              <TouchableOpacity
                key={id}
                style={[styles.productCard, { width: cardWidth }]}
                onPress={() => navigation.navigate('ProductDetails', { productId: id })}
                activeOpacity={0.8}
              >
                <View style={styles.productImageContainer}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.productImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.productImage} />
                  )}
                </View>
                <View style={styles.productContent}>
                  <Text style={styles.productName} numberOfLines={2}>{name}</Text>
                  <View style={styles.productPriceRow}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.productPrice}>€{price.toFixed(2)}</Text>
                      {originalPrice != null && originalPrice > price && (
                        <Text style={styles.originalPrice}>€{originalPrice.toFixed(2)}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.cartBtn}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        addToCart(p, 1);
                      }}
                    >
                      <Text style={styles.cartBtnIcon}>🛒</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      <View style={styles.bottomSpacer} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    minHeight: 48,
  },
  searchIcon: { marginRight: spacing.sm, fontSize: 18 },
  searchInputInner: { flex: 1, marginBottom: 0 },
  resultCount: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.sm },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  productCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  productImageContainer: { position: 'relative', width: '100%', height: 150 },
  productImage: { width: '100%', height: '100%', backgroundColor: colors.backgroundTertiary },
  favoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: { fontSize: 16, color: colors.textSecondary },
  productContent: { padding: spacing.sm },
  productName: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8, minHeight: 36 },
  productPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  productPrice: { fontSize: 16, fontWeight: '700', color: colors.primary },
  originalPrice: { fontSize: 12, color: colors.textSecondary, textDecorationLine: 'line-through' },
  cartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtnIcon: { fontSize: 18 },
  bottomSpacer: { height: spacing.xl },
});