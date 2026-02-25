import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { PharmacyProductsStackParamList } from '../../navigation/types';
import { useProduct } from '../../queries/productQueries';
import { useDeleteProduct } from '../../mutations/productMutations';
import { getImageUrl } from '../../config/api';
import { getErrorMessage } from '../../utils/errorUtils';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Route = RouteProp<PharmacyProductsStackParamList, 'PharmacyProductDetails'>;

function extractProduct(payload: unknown): any {
  if (payload == null) return null;
  const p = payload as Record<string, unknown>;
  if (p.data != null && typeof p.data === 'object') return p.data;
  if (p._id != null || p.name != null) return p;
  return null;
}

function formatDate(val: string | Date | null | undefined): string {
  if (!val) return '—';
  const d = typeof val === 'string' ? new Date(val) : val;
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function PharmacyProductDetailsScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<any>();
  const productId = route.params?.productId ?? '';
  const { data, isLoading, isError } = useProduct(productId);
  const deleteMutation = useDeleteProduct();
  const product = extractProduct(data);

  const discountPercent =
    product && product.discountPrice != null && Number(product.price) > 0
      ? Math.round(((Number(product.price) - Number(product.discountPrice)) / Number(product.price)) * 100)
      : 0;

  const handleDelete = () => {
    if (!product) return;
    const name = product?.name ?? 'this product';
    Alert.alert('Delete product', `Remove "${name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(productId);
            Toast.show({ type: 'success', text1: 'Product deleted' });
            navigation.goBack();
          } catch (err) {
            Toast.show({ type: 'error', text1: 'Failed', text2: getErrorMessage(err, 'Could not delete') });
          }
        },
      },
    ]);
  };

  if (isLoading && !product) {
    return (
      <ScreenContainer padded>
        <View style={styles.loadingRow}><ActivityIndicator size="small" color={colors.primary} /></View>
      </ScreenContainer>
    );
  }
  if (isError || !product) {
    return (
      <ScreenContainer padded>
        <Text style={styles.errorText}>Product not found.</Text>
        <Button title="Back" onPress={() => navigation.goBack()} />
      </ScreenContainer>
    );
  }

  const imgUrl = Array.isArray(product?.images) && product.images[0] ? getImageUrl(product.images[0]) : null;
  const displayPrice = Number(product?.discountPrice ?? product?.price ?? 0);
  const originalPrice = product?.discountPrice != null && Number(product?.price) > Number(product?.discountPrice) ? Number(product.price) : null;
  const createdAt = product?.createdAt ? formatDate(product.createdAt) : '—';

  return (
    <ScreenContainer scroll padded>
      <View style={styles.imageContainer}>
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={[styles.productImage, styles.productImagePlaceholder]} />
        )}
        {discountPercent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}% off</Text>
          </View>
        )}
      </View>

      <View style={styles.header}>
        <Text style={styles.productName}>{product?.name ?? '—'}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>€{displayPrice.toFixed(2)}</Text>
          {originalPrice != null && (
            <Text style={styles.originalPrice}>€{originalPrice.toFixed(2)}</Text>
          )}
        </View>
        <View style={[styles.activeBadge, product?.isActive === false && styles.activeBadgeInactive]}>
          <Text style={styles.activeBadgeText}>{product?.isActive !== false ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>SKU</Text>
          <Text style={styles.detailValue}>{product?.sku ?? '—'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Category</Text>
          <Text style={styles.detailValue}>{product?.category ?? '—'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Stock</Text>
          <Text style={styles.detailValue}>{product?.stock ?? 0} units</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Added</Text>
          <Text style={styles.detailValue}>{createdAt}</Text>
        </View>
      </Card>

      {product?.description ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>
        </Card>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Edit product"
          variant="outline"
          onPress={() => navigation.navigate('PharmacyEditProduct', { productId })}
          style={styles.actionBtn}
        />
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleteMutation.isPending}>
          <Text style={styles.deleteBtnText}>Delete product</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingRow: { padding: spacing.xl, alignItems: 'center' },
  errorText: { ...typography.body, color: colors.error, marginBottom: spacing.md },
  imageContainer: { position: 'relative', marginBottom: spacing.md },
  productImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },
  productImagePlaceholder: { backgroundColor: colors.backgroundTertiary },
  discountBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: { fontSize: 12, fontWeight: '600', color: colors.textInverse },
  header: { marginBottom: spacing.md },
  productName: { ...typography.h2, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  price: { ...typography.h2, color: colors.primary },
  originalPrice: { ...typography.body, color: colors.textLight, textDecorationLine: 'line-through' },
  activeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.successLight },
  activeBadgeInactive: { backgroundColor: colors.errorLight },
  activeBadgeText: { fontSize: 12, fontWeight: '600', color: colors.text },
  section: { marginBottom: spacing.sm },
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  detailLabel: { ...typography.bodySmall, color: colors.textSecondary },
  detailValue: { ...typography.body, fontWeight: '500' },
  description: { ...typography.body, color: colors.textSecondary },
  actions: { marginTop: spacing.md },
  actionBtn: { marginBottom: spacing.sm },
  deleteBtn: { paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.error, borderRadius: 12 },
  deleteBtnText: { ...typography.body, color: colors.error, fontWeight: '600' },
});