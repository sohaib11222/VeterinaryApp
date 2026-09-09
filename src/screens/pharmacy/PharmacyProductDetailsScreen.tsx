import React from 'react';
import { AppImage } from '../../components/common/AppImage';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRoute, useNavigation, RouteProp } from '@react-navigation/native';
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

function valueOrDash(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  return String(value);
}

function variantLabel(variant: any, index: number): string {
  if (variant?.name) return variant.name;
  return [variant?.strengthValue ? `${variant.strengthValue} ${variant?.strengthUnit ?? ''}`.trim() : '', variant?.dosageForm, variant?.unitsPerPack ? `${variant.unitsPerPack} ${variant?.unitLabel ?? 'units'}` : ''].filter(Boolean).join(' · ') || `Variant ${index + 1}`;
}

export function PharmacyProductDetailsScreen() {
  const { t } = useTranslation();
  const route = useRoute<Route>();
  const navigation = useNavigation<any>();
  const productId = route.params?.productId ?? '';
  const { data, isLoading, isError } = useProduct(productId);
  const deleteMutation = useDeleteProduct();
  const product = extractProduct(data);

  useFocusEffect(
    React.useCallback(() => {
      const tabNavigator = navigation.getParent?.();
      tabNavigator?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => tabNavigator?.setOptions({ tabBarStyle: undefined });
    }, [navigation])
  );

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
  const isMedicine = product?.productType === 'PHARMACY_MEDICINE' || product?.sellerType === 'PET_STORE';
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const medicine = product?.medicineDetails ?? {};
  const parapharmacy = product?.parapharmacyDetails ?? {};

  return (
    <ScreenContainer scroll padded>
      <View style={styles.imageContainer}>
        {imgUrl ? (
          <AppImage source={{ uri: imgUrl }} style={styles.productImage} resizeMode="cover" />
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
          <Text style={styles.detailLabel}>Product type</Text>
          <Text style={styles.detailValue}>{isMedicine ? 'Pharmacy medicine' : 'Parapharmacy product'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Brand / manufacturer</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{valueOrDash(product?.brand || product?.manufacturer)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Target species</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{valueOrDash(product?.petType)}</Text>
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

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Variants & availability</Text>
        {variants.length ? variants.map((variant: any, index: number) => {
          const price = Number(variant?.discountPrice ?? variant?.price ?? 0);
          const regularPrice = variant?.discountPrice != null ? Number(variant?.price ?? 0) : null;
          return <View key={String(variant?._id ?? index)} style={[styles.variantItem, index > 0 && styles.variantDivider]}>
            <View style={styles.variantTopRow}><View style={styles.variantCopy}><Text style={styles.variantName}>{variantLabel(variant, index)}</Text><Text style={styles.variantMeta}>{[variant?.strengthValue ? `${variant.strengthValue} ${variant?.strengthUnit ?? ''}`.trim() : '', variant?.dosageForm, variant?.packageType, variant?.unitsPerPack ? `${variant.unitsPerPack} ${variant?.unitLabel ?? 'units'}` : ''].filter(Boolean).join(' · ') || 'Standard product option'}</Text></View><View style={styles.variantPriceWrap}><Text style={styles.variantPrice}>€{price.toFixed(2)}</Text>{regularPrice != null && regularPrice > price ? <Text style={styles.variantOldPrice}>€{regularPrice.toFixed(2)}</Text> : null}</View></View><View style={styles.variantBottomRow}><Text style={[styles.variantAvailability, Number(variant?.stock ?? 0) <= 0 && styles.variantOutOfStock]}>{Number(variant?.stock ?? 0)} in stock{variant?.isActive === false ? ' · Hidden' : ''}</Text>{variant?.isDefault ? <Text style={styles.defaultBadge}>Default</Text> : null}</View>{variant?.packageDescription ? <Text style={styles.packDescription}>{variant.packageDescription}</Text> : null}</View>;
        }) : <Text style={styles.description}>No variants have been added yet.</Text>}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>{isMedicine ? 'Medicine information' : 'Product information'}</Text>
        {isMedicine ? <>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Active ingredient(s)</Text><Text style={styles.detailValue}>{valueOrDash(medicine.activeIngredients)}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Administration route</Text><Text style={styles.detailValue}>{valueOrDash(medicine.administrationRoute)}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Prescription</Text><Text style={styles.detailValue}>{product?.requiresPrescription ? 'Required' : 'Not required'}</Text></View>
          <View style={styles.detailBlock}><Text style={styles.detailLabel}>Indications</Text><Text style={styles.blockValue}>{valueOrDash(medicine.indications)}</Text></View>
          <View style={styles.detailBlock}><Text style={styles.detailLabel}>Dosage notes</Text><Text style={styles.blockValue}>{valueOrDash(medicine.dosageInstructions)}</Text></View>
          <View style={styles.detailBlock}><Text style={styles.detailLabel}>Warnings & storage</Text><Text style={styles.blockValue}>{[medicine.warnings, medicine.storageInstructions].filter(Boolean).join('\n') || '—'}</Text></View>
        </> : <>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Product class</Text><Text style={styles.detailValue}>{valueOrDash(parapharmacy.productClass)}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Life stage</Text><Text style={styles.detailValue}>{valueOrDash(parapharmacy.lifeStage)}</Text></View>
          <View style={styles.detailBlock}><Text style={styles.detailLabel}>Ingredients & allergens</Text><Text style={styles.blockValue}>{[parapharmacy.ingredients, parapharmacy.allergens].filter(Boolean).join('\n') || '—'}</Text></View>
          <View style={styles.detailBlock}><Text style={styles.detailLabel}>Usage, warnings & storage</Text><Text style={styles.blockValue}>{[parapharmacy.usageInstructions, parapharmacy.warnings, parapharmacy.storageInstructions].filter(Boolean).join('\n') || '—'}</Text></View>
        </>}
      </Card>

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
  variantItem: { paddingVertical: spacing.sm },
  variantDivider: { borderTopWidth: 1, borderTopColor: colors.borderLight },
  variantTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  variantCopy: { flex: 1, minWidth: 0 },
  variantName: { ...typography.label, color: colors.text },
  variantMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 3 },
  variantPriceWrap: { alignItems: 'flex-end' },
  variantPrice: { ...typography.label, color: colors.primaryDark },
  variantOldPrice: { ...typography.caption, color: colors.textLight, textDecorationLine: 'line-through', marginTop: 2 },
  variantBottomRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 },
  variantAvailability: { ...typography.caption, color: colors.success, fontWeight: '700' },
  variantOutOfStock: { color: colors.error },
  defaultBadge: { ...typography.caption, color: colors.primaryDark, backgroundColor: colors.primaryLight + '20', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, fontWeight: '800' },
  packDescription: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  detailBlock: { paddingTop: spacing.sm, marginTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.borderLight },
  blockValue: { ...typography.bodySmall, color: colors.text, marginTop: 4, lineHeight: 20 },
  actions: { marginTop: spacing.md, marginBottom: spacing.xl },
  actionBtn: { marginBottom: spacing.sm },
  deleteBtn: { paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.error, borderRadius: 12 },
  deleteBtnText: { ...typography.body, color: colors.error, fontWeight: '600' },
});
