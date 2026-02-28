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
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/appI18n';

type Route = RouteProp<PharmacyProductsStackParamList, 'PharmacyProductDetails'>;

function extractProduct(payload: unknown): any {
  if (payload == null) return null;
  const p = payload as Record<string, unknown>;
  if (p.data != null && typeof p.data === 'object') return p.data;
  if (p._id != null || p.name != null) return p;
  return null;
}

function formatDate(val: string | Date | null | undefined): string {
  if (!val) return i18n.t('common.na');
  const d = typeof val === 'string' ? new Date(val) : val;
  return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function PharmacyProductDetailsScreen() {
  const { t } = useTranslation();
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
    const name = product?.name ?? t('pharmacyProductDetails.defaults.product');
    Alert.alert(t('pharmacyProductDetails.deleteModal.title'), t('pharmacyProductDetails.deleteModal.body', { name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(productId);
            Toast.show({ type: 'success', text1: t('pharmacyProductDetails.toasts.productDeleted') });
            navigation.goBack();
          } catch (err) {
            Toast.show({ type: 'error', text1: t('common.failed'), text2: getErrorMessage(err, t('pharmacyProductDetails.errors.couldNotDelete')) });
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
        <Text style={styles.errorText}>{t('pharmacyProductDetails.errors.notFound')}</Text>
        <Button title={t('common.back')} onPress={() => navigation.goBack()} />
      </ScreenContainer>
    );
  }

  const imgUrl = Array.isArray(product?.images) && product.images[0] ? getImageUrl(product.images[0]) : null;
  const displayPrice = Number(product?.discountPrice ?? product?.price ?? 0);
  const originalPrice = product?.discountPrice != null && Number(product?.price) > Number(product?.discountPrice) ? Number(product.price) : null;
  const createdAt = product?.createdAt ? formatDate(product.createdAt) : t('common.na');

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
            <Text style={styles.discountText}>{t('pharmacyProductDetails.discountOff', { percent: discountPercent })}</Text>
          </View>
        )}
      </View>

      <View style={styles.header}>
        <Text style={styles.productName}>{product?.name ?? t('common.na')}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>€{displayPrice.toFixed(2)}</Text>
          {originalPrice != null && (
            <Text style={styles.originalPrice}>€{originalPrice.toFixed(2)}</Text>
          )}
        </View>
        <View style={[styles.activeBadge, product?.isActive === false && styles.activeBadgeInactive]}>
          <Text style={styles.activeBadgeText}>
            {product?.isActive !== false ? t('pharmacyProductDetails.status.active') : t('pharmacyProductDetails.status.inactive')}
          </Text>
        </View>
      </View>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>{t('pharmacyProductDetails.sections.details')}</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('pharmacyProductDetails.labels.sku')}</Text>
          <Text style={styles.detailValue}>{product?.sku ?? t('common.na')}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('pharmacyProductDetails.labels.category')}</Text>
          <Text style={styles.detailValue}>{product?.category ?? t('common.na')}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('pharmacyProductDetails.labels.stock')}</Text>
          <Text style={styles.detailValue}>{t('pharmacyProductDetails.labels.stockUnits', { count: product?.stock ?? 0 })}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{t('pharmacyProductDetails.labels.added')}</Text>
          <Text style={styles.detailValue}>{createdAt}</Text>
        </View>
      </Card>

      {product?.description ? (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('pharmacyProductDetails.sections.description')}</Text>
          <Text style={styles.description}>{product.description}</Text>
        </Card>
      ) : null}

      <View style={styles.actions}>
        <Button
          title={t('pharmacyProductDetails.actions.editProduct')}
          variant="outline"
          onPress={() => navigation.navigate('PharmacyEditProduct', { productId })}
          style={styles.actionBtn}
        />
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleteMutation.isPending}>
          <Text style={styles.deleteBtnText}>{t('pharmacyProductDetails.actions.deleteProduct')}</Text>
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