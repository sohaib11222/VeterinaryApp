import React from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { VetHeader } from '../../../components/common/VetHeader';
import { PetOwnerPharmacyStackParamList } from '../../../navigation/types';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { useProducts } from '../../../queries/productQueries';
import { useCart } from '../../../contexts/CartContext';
import { getImageUrl } from '../../../config/api';
import { useTranslation } from 'react-i18next';

type Nav = NativeStackNavigationProp<PetOwnerPharmacyStackParamList>;

export function PharmacyHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const cardWidth = (width - spacing.md * 2 - spacing.sm) / 2;
  const { data: productsRes, isLoading } = useProducts({ limit: 8 });
  const { getCartItemCount, addToCart } = useCart();

  const payload: any = (productsRes as any)?.data ?? productsRes ?? {};
  const products = Array.isArray(payload?.products) ? payload.products : (Array.isArray(payload?.data?.products) ? payload.data.products : []);
  const cartCount = getCartItemCount();

  return (
    <View style={styles.flex}>
      <VetHeader
        title={t('petOwnerPharmacyHome.header.title')}
        subtitle={t('petOwnerPharmacyHome.header.subtitle')}
        roundedBottom={false}
        rightAction={
          <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.cartIcon}>🛒</Text>
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.bannerSection}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>{t('petOwnerPharmacyHome.banner.title')}</Text>
            <Text style={styles.bannerSubtitle}>{t('petOwnerPharmacyHome.banner.subtitle')}</Text>
            <Text style={styles.bannerDescription}>
              {t('petOwnerPharmacyHome.banner.description')}
            </Text>
            <View style={styles.bannerButtons}>
              <TouchableOpacity
                style={styles.shopNowButton}
                onPress={() => navigation.navigate('ProductCatalog', {})}
              >
                <Text style={styles.shopNowText}>{t('petOwnerPharmacyHome.actions.shopNow')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.searchPharmaciesButton}
                onPress={() => navigation.navigate('PharmacySearch')}
              >
                <Text style={styles.searchIcon}>🔍</Text>
                <Text style={styles.searchPharmaciesText}>{t('petOwnerPharmacyHome.actions.findPharmacies')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('petOwnerPharmacyHome.sections.featuredProducts')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProductCatalog', {})}>
              <Text style={styles.viewAllText}>{t('petOwnerPharmacyHome.actions.viewAll')}</Text>
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.lg }} />
          ) : products.length === 0 ? (
            <Text style={styles.emptyText}>{t('petOwnerPharmacyHome.emptyProducts')}</Text>
          ) : (
            <View style={styles.productsGrid}>
              {products.map((p: Record<string, unknown>) => {
                const id = String(p._id ?? p.id ?? '');
                const name = (p.name as string) ?? t('petOwnerPharmacyHome.defaults.product');
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
                          style={styles.cartButton}
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            addToCart(p, 1);
                          }}
                        >
                          <Text style={styles.cartButtonIcon}>🛒</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.backgroundSecondary },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  cartBtn: { position: 'relative', padding: 8 },
  cartIcon: { fontSize: 22 },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { color: colors.textInverse, fontSize: 10, fontWeight: '600' },
  bannerSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    marginBottom: spacing.lg,
  },
  bannerContent: { alignItems: 'center' },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textInverse,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  bannerSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textInverse,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  bannerDescription: {
    fontSize: 14,
    color: colors.textInverse,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  bannerButtons: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  shopNowButton: {
    backgroundColor: colors.textInverse,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: 25,
  },
  shopNowText: { fontSize: 16, fontWeight: '600', color: colors.primary },
  searchPharmaciesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 6,
  },
  searchIcon: { fontSize: 16 },
  searchPharmaciesText: { fontSize: 16, fontWeight: '600', color: colors.textInverse },
  section: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  viewAllText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  productImageContainer: { position: 'relative', width: '100%', height: 150 },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundTertiary,
  },
  favoriteButton: {
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
  cartButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartButtonIcon: { fontSize: 18 },
  bottomSpacer: { height: spacing.xl },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginVertical: spacing.md },
});
