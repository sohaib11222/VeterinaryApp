import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { PharmacyProductsStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Route = RouteProp<PharmacyProductsStackParamList, 'PharmacyProductDetails'>;

const MOCK_PRODUCT = {
  id: '1',
  name: 'Premium Dog Food 5kg',
  description: 'High-quality nutrition for adult dogs. Complete and balanced diet.',
  price: 32.99,
  discountPrice: 24.99,
  sku: 'SKU-001',
  stock: 50,
  category: 'Food & Treats',
  isActive: true,
  createdAt: '1 Feb 2024',
};

export function PharmacyProductDetailsScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<any>();
  const productId = route.params?.productId;
  const product = MOCK_PRODUCT;

  const discountPercent =
    product.discountPrice != null && product.price > 0
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : 0;

  const handleDelete = () => {
    Alert.alert('Delete product', `Remove "${product.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScreenContainer scroll padded>
      <View style={styles.imageContainer}>
        <View style={styles.productImage} />
        {discountPercent > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}% off</Text>
          </View>
        )}
      </View>

      <View style={styles.header}>
        <Text style={styles.productName}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>€{Number(product.discountPrice ?? product.price).toFixed(2)}</Text>
          {product.discountPrice != null && product.discountPrice < product.price && (
            <Text style={styles.originalPrice}>€{Number(product.price).toFixed(2)}</Text>
          )}
        </View>
        <View style={[styles.activeBadge, !product.isActive && styles.activeBadgeInactive]}>
          <Text style={styles.activeBadgeText}>{product.isActive ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>SKU</Text>
          <Text style={styles.detailValue}>{product.sku}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Category</Text>
          <Text style={styles.detailValue}>{product.category}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Stock</Text>
          <Text style={styles.detailValue}>{product.stock} units</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Added</Text>
          <Text style={styles.detailValue}>{product.createdAt}</Text>
        </View>
      </Card>

      {product.description ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>
        </Card>
      ) : null}

      <View style={styles.actions}>
        <Button
          title="Edit product"
          variant="outline"
          onPress={() => navigation.navigate('PharmacyEditProduct', { productId: product.id })}
          style={styles.actionBtn}
        />
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete product</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  imageContainer: { position: 'relative', marginBottom: spacing.md },
  productImage: {
    width: '100%',
    height: 220,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 12,
  },
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