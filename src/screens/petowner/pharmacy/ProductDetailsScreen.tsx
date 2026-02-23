import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { PetOwnerPharmacyStackParamList } from '../../../navigation/types';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { useProduct } from '../../../queries/productQueries';
import { usePetStore } from '../../../queries/petStoreQueries';
import { useCart } from '../../../contexts/CartContext';
import { getImageUrl } from '../../../config/api';

type Route = RouteProp<PetOwnerPharmacyStackParamList, 'ProductDetails'>;
type Nav = NativeStackNavigationProp<PetOwnerPharmacyStackParamList>;

export function ProductDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const productId = route.params?.productId;
  const [quantity, setQuantity] = useState(1);

  const { data: productRes, isLoading, isError } = useProduct(productId ?? null);
  const product = (productRes?.data ?? (productRes as { data?: Record<string, unknown> } | undefined)?.data) as Record<string, unknown> | undefined;
  const petStoreId = product?.petStoreId;
  const petStoreIdStr = petStoreId && typeof petStoreId === 'object' && '_id' in petStoreId
    ? (petStoreId as { _id: string })._id
    : typeof petStoreId === 'string' ? petStoreId : undefined;
  const { data: storeRes } = usePetStore(petStoreIdStr ?? undefined);
  const store = (storeRes?.data ?? (storeRes as { data?: Record<string, unknown> } | undefined)?.data) as Record<string, unknown> | undefined;
  const soldByName = (store?.name as string) ?? 'Pharmacy';

  const { addToCart } = useCart();

  const productPrice = product ? Number(product.discountPrice ?? product.price ?? 0) : 0;
  const originalPrice = product && typeof product.price === 'number' ? product.price : undefined;
  const discountPercent = originalPrice && originalPrice > productPrice
    ? Math.round(((originalPrice - productPrice) / originalPrice) * 100)
    : 0;
  const stock = typeof product?.stock === 'number' ? product.stock : undefined;
  const isInStock = stock === undefined ? true : stock > 0;
  const sku = (product?.sku as string) ?? '—';
  const category = (product?.category as string) ?? '—';
  const description = (product?.description as string) ?? '';
  const name = (product?.name as string) ?? 'Product';
  const images = product?.images as string[] | undefined;
  const imageUri = getImageUrl(Array.isArray(images) && images[0] ? images[0] : undefined);

  const handleQuantityChange = (delta: number) => {
    const next = quantity + delta;
    if (next < 1) return;
    if (stock != null && next > stock) return;
    setQuantity(next);
  };

  const handleAddToCart = () => {
    if (!product || !isInStock) return;
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    if (!product || !isInStock) return;
    addToCart(product, quantity);
    navigation.navigate('Checkout');
  };

  if (!productId || isLoading) {
    return (
      <ScreenContainer padded>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.xxl }} />
      </ScreenContainer>
    );
  }
  if (isError || !product) {
    return (
      <ScreenContainer padded>
        <Text style={styles.errorText}>Product not found.</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={styles.productImage} />
        )}

        <View style={styles.productHeader}>
          <Text style={styles.productName}>{name}</Text>
          <Text style={styles.soldBy}>Sold by {soldByName}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Product details</Text>
          <View style={styles.divider} />
          <Text style={styles.detailLabel}>Description</Text>
          <Text style={styles.detailText}>{description || 'No description.'}</Text>
          <Text style={styles.detailLabel}>Category</Text>
          <Text style={styles.detailText}>{category}</Text>
        </Card>

        <Card style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>€{productPrice.toFixed(2)}</Text>
            {originalPrice != null && originalPrice > productPrice && (
              <>
                <Text style={styles.originalPrice}>€{originalPrice.toFixed(2)}</Text>
                {discountPercent > 0 && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{discountPercent}% off</Text>
                  </View>
                )}
              </>
            )}
          </View>
          <View style={[styles.stockBadge, !isInStock && styles.stockBadgeInactive]}>
            <Text style={styles.stockText}>{isInStock ? (stock != null ? `In stock (${stock})` : 'In stock') : 'Out of stock'}</Text>
          </View>

          <Text style={styles.quantityLabel}>Quantity</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={[styles.stepperBtn, quantity <= 1 && styles.stepperBtnDisabled]}
              onPress={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{quantity}</Text>
            <TouchableOpacity
              style={[styles.stepperBtn, (stock != null && quantity >= stock) && styles.stepperBtnDisabled]}
              onPress={() => handleQuantityChange(1)}
              disabled={stock != null && quantity >= stock}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          <Button title="Add to cart" onPress={handleAddToCart} disabled={!isInStock} style={styles.addToCartBtn} />
          <TouchableOpacity
            style={[styles.buyNowBtn, !isInStock && styles.buyNowBtnDisabled]}
            onPress={handleBuyNow}
            disabled={!isInStock}
          >
            <Text style={styles.buyNowBtnText}>Buy now</Text>
          </TouchableOpacity>

          <View style={styles.specs}>
            <View style={styles.specRow}><Text style={styles.specLabel}>SKU</Text><Text style={styles.specValue}>{sku}</Text></View>
            <View style={styles.specRow}><Text style={styles.specLabel}>Stock</Text><Text style={styles.specValue}>{stock != null ? `${stock} units` : '—'}</Text></View>
            <View style={styles.specRow}><Text style={styles.specLabel}>Category</Text><Text style={styles.specValue}>{category}</Text></View>
          </View>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.xxl },
  productImage: {
    width: '100%',
    height: 280,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  productHeader: { marginBottom: spacing.md },
  productName: { ...typography.h2, marginBottom: 4 },
  soldBy: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm },
  description: { ...typography.body, color: colors.textSecondary },
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  divider: { height: 1, backgroundColor: colors.borderLight, marginBottom: spacing.sm },
  detailLabel: { ...typography.label, marginBottom: 4 },
  detailText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  priceCard: { marginBottom: spacing.md },
  priceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  price: { ...typography.h2, color: colors.primary },
  originalPrice: { ...typography.body, color: colors.textLight, textDecorationLine: 'line-through' },
  discountBadge: { backgroundColor: colors.successLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  discountText: { fontSize: 12, fontWeight: '600', color: colors.success },
  stockBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.primaryLight + '30', marginBottom: spacing.md },
  stockBadgeInactive: { backgroundColor: colors.errorLight },
  stockText: { ...typography.caption, fontWeight: '600' },
  quantityLabel: { ...typography.label, marginBottom: spacing.xs },
  stepper: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  stepperBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  stepperBtnDisabled: { backgroundColor: colors.backgroundTertiary, opacity: 0.7 },
  stepperBtnText: { fontSize: 20, fontWeight: '600', color: colors.textInverse },
  stepperValue: { ...typography.h3, marginHorizontal: spacing.md, minWidth: 36, textAlign: 'center' },
  addToCartBtn: { marginBottom: spacing.sm },
  buyNowBtn: { paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: colors.primary, borderRadius: 12 },
  buyNowBtnDisabled: { borderColor: colors.border, opacity: 0.6 },
  buyNowBtnText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  specs: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  specLabel: { ...typography.bodySmall, color: colors.textSecondary },
  specValue: { ...typography.bodySmall },
  bottomSpacer: { height: spacing.xl },
  errorText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginVertical: spacing.lg },
});
