import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { PharmacyProductsStackParamList } from '../../navigation/types';
import { useProduct } from '../../queries/productQueries';
import { useUpdateProduct, useDeleteProduct } from '../../mutations/productMutations';
import { uploadProductImages } from '../../services/upload';
import { copyToCacheUri, deleteCacheFiles, getExtensionFromMime } from '../../utils/fileUpload';
import { getErrorMessage } from '../../utils/errorUtils';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTranslation } from 'react-i18next';

type Route = RouteProp<PharmacyProductsStackParamList, 'PharmacyEditProduct'>;

const CATEGORIES: { value: string; labelKey: string }[] = [
  { value: 'Food & Treats', labelKey: 'pharmacyProducts.categories.foodTreats' },
  { value: 'Medications', labelKey: 'pharmacyProducts.categories.medications' },
  { value: 'Grooming', labelKey: 'pharmacyProducts.categories.grooming' },
  { value: 'Toys', labelKey: 'pharmacyProducts.categories.toys' },
  { value: 'Supplements', labelKey: 'pharmacyProducts.categories.supplements' },
  { value: 'Accessories', labelKey: 'pharmacyProducts.categories.accessories' },
  { value: 'Other', labelKey: 'pharmacyProducts.categories.other' },
];

function extractProduct(payload: unknown): any {
  const outer = (payload as { data?: unknown })?.data ?? payload;
  return (outer as { data?: unknown })?.data ?? outer;
}

export function PharmacyEditProductScreen() {
  const { t } = useTranslation();
  const route = useRoute<Route>();
  const navigation = useNavigation<any>();
  const productId = route.params?.productId ?? '';
  const { data, isLoading, isError } = useProduct(productId);
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();
  const product = extractProduct(data);

  const [form, setForm] = useState({
    name: '',
    description: '',
    sku: '',
    price: '',
    discountPrice: '',
    stock: '',
    category: '',
    tags: '',
    requiresPrescription: false,
    isActive: true,
    images: [] as string[],
  });
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    if (!product) return;
    setForm({
      name: product?.name ?? '',
      description: product?.description ?? '',
      sku: product?.sku ?? '',
      price: product?.price != null ? String(product.price) : '',
      discountPrice: product?.discountPrice != null ? String(product.discountPrice) : '',
      stock: product?.stock != null ? String(product.stock) : '',
      category: product?.category ?? '',
      tags: Array.isArray(product?.tags) ? product.tags.join(', ') : (product?.tags ?? ''),
      requiresPrescription: !!product?.requiresPrescription,
      isActive: product?.isActive !== false,
      images: Array.isArray(product?.images) ? [...product.images] : [],
    });
  }, [product]);

  const update = (key: string) => (value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const pickAndUploadImages = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      const mime = asset.mimeType ?? 'image/jpeg';
      const name = asset.name ?? `image-${Date.now()}.jpg`;
      const ext = getExtensionFromMime(mime);
      const uri = await copyToCacheUri(asset.uri, 0, ext);
      setUploadingImages(true);
      const res = await uploadProductImages([{ uri, name, type: mime }]);
      const urls = res?.data?.urls ?? (res as { urls?: string[] })?.urls ?? [];
      if (urls.length > 0) {
        setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
        Toast.show({ type: 'success', text1: t('pharmacyAddProduct.toasts.imageAdded') });
      }
      await deleteCacheFiles([uri]).catch(() => {});
    } catch (err) {
      Toast.show({ type: 'error', text1: t('pharmacyAddProduct.errors.uploadFailedTitle'), text2: getErrorMessage(err, t('pharmacyAddProduct.errors.couldNotUploadImage')) });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (url: string) => {
    setForm((prev) => ({ ...prev, images: prev.images.filter((x) => x !== url) }));
  };

  const onSave = async () => {
    const name = String(form.name ?? '').trim();
    const priceNum = Number(form.price);
    if (!name) {
      Toast.show({ type: 'error', text1: t('pharmacyEditProduct.validation.nameRequired') });
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      Toast.show({ type: 'error', text1: t('pharmacyEditProduct.validation.invalidPrice') });
      return;
    }
    const discountNum = form.discountPrice ? Number(form.discountPrice) : null;
    if (discountNum != null && (!Number.isFinite(discountNum) || discountNum >= priceNum)) {
      Toast.show({ type: 'error', text1: t('pharmacyEditProduct.validation.invalidDiscount') });
      return;
    }
    const payload = {
      name,
      description: String(form.description ?? '').trim() || undefined,
      sku: String(form.sku ?? '').trim() || undefined,
      price: priceNum,
      discountPrice: discountNum ?? undefined,
      stock: form.stock === '' ? 0 : Number(form.stock) || 0,
      category: String(form.category ?? '').trim() || undefined,
      tags: form.tags ? String(form.tags).split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      requiresPrescription: form.requiresPrescription,
      isActive: form.isActive,
      images: form.images,
    };
    try {
      await updateMutation.mutateAsync({ productId, data: payload });
      Toast.show({ type: 'success', text1: t('pharmacyEditProduct.toasts.productUpdated') });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: t('common.failed'), text2: getErrorMessage(err, t('pharmacyEditProduct.errors.couldNotUpdateProduct')) });
    }
  };

  const onDelete = () => {
    Alert.alert(t('pharmacyEditProduct.deleteModal.title'), t('pharmacyEditProduct.deleteModal.body'), [
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
            Toast.show({ type: 'error', text1: t('common.failed'), text2: getErrorMessage(err, t('pharmacyEditProduct.errors.couldNotDelete')) });
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

  return (
    <ScreenContainer scroll padded>
      <Card>
        <Text style={styles.sectionTitle}>{t('pharmacyEditProduct.title')}</Text>
        <Input label={t('pharmacyAddProduct.fields.name.label')} value={form.name} onChangeText={update('name') as (t: string) => void} />
        <Input label={t('pharmacyAddProduct.fields.description.label')} value={form.description} onChangeText={update('description') as (t: string) => void} />
        <Input label={t('pharmacyAddProduct.fields.sku.label')} value={form.sku} onChangeText={update('sku') as (t: string) => void} />
        <Text style={styles.fieldLabel}>{t('pharmacyAddProduct.fields.category.label')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[styles.categoryChip, form.category === cat.value && styles.categoryChipActive]}
              onPress={() => update('category')(cat.value)}
            >
              <Text style={[styles.categoryChipText, form.category === cat.value && styles.categoryChipTextActive]}>{t(cat.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.row}>
          <View style={styles.half}>
            <Input label={t('pharmacyAddProduct.fields.price.label')} value={form.price} onChangeText={update('price') as (t: string) => void} keyboardType="decimal-pad" />
          </View>
          <View style={styles.half}>
            <Input
              label={t('pharmacyAddProduct.fields.discountPrice.label')}
              value={form.discountPrice}
              onChangeText={update('discountPrice') as (t: string) => void}
              placeholder={t('pharmacyAddProduct.fields.discountPrice.placeholder')}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <Input label={t('pharmacyAddProduct.fields.stock.label')} value={form.stock} onChangeText={update('stock') as (t: string) => void} keyboardType="numeric" />
        <Input label={t('pharmacyAddProduct.fields.tags.label')} value={form.tags} onChangeText={update('tags') as (t: string) => void} />
        <Text style={styles.fieldLabel}>{t('pharmacyAddProduct.fields.images.label')}</Text>
        <View style={styles.imageRow}>
          {form.images.map((url) => (
            <TouchableOpacity key={url} style={styles.imageWrap} onPress={() => removeImage(url)}>
              <Image source={{ uri: url }} style={styles.thumbImg} />
              <Text style={styles.removeImgText}>✕</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addImgBtn} onPress={pickAndUploadImages} disabled={uploadingImages}>
            <Text style={styles.addImgBtnText}>{uploadingImages ? t('common.loading') : t('pharmacyAddProduct.actions.addImage')}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.checkRow} onPress={() => update('requiresPrescription')(!form.requiresPrescription)}>
          <View style={[styles.checkbox, form.requiresPrescription && styles.checkboxChecked]}>
            {form.requiresPrescription && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkLabel}>{t('pharmacyAddProduct.fields.requiresPrescription')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.checkRow} onPress={() => update('isActive')(!form.isActive)}>
          <View style={[styles.checkbox, form.isActive && styles.checkboxChecked]}>
            {form.isActive && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkLabel}>{t('pharmacyAddProduct.fields.isActive')}</Text>
        </TouchableOpacity>
        <Button title={t('common.saveChanges')} onPress={onSave} loading={updateMutation.isPending} style={styles.submitBtn} />
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} disabled={deleteMutation.isPending}>
          <Text style={styles.deleteBtnText}>{t('pharmacyEditProduct.actions.deleteProduct')}</Text>
        </TouchableOpacity>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingRow: { padding: spacing.xl, alignItems: 'center' },
  errorText: { ...typography.body, color: colors.error, marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  fieldLabel: { ...typography.label, marginBottom: spacing.xs, marginTop: spacing.sm },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
  categoryChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryChipText: { fontSize: 13, color: colors.text },
  categoryChipTextActive: { color: colors.textInverse, fontWeight: '600' },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  imageWrap: { width: 72, height: 72, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.backgroundTertiary },
  thumbImg: { width: 72, height: 72 },
  removeImgText: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    color: colors.textInverse,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: '700',
    fontSize: 12,
  },
  addImgBtn: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  addImgBtnText: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '600' },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: colors.textInverse, fontSize: 12, fontWeight: '700' },
  checkLabel: { ...typography.body },
  submitBtn: { marginTop: spacing.lg },
  deleteBtn: { marginTop: spacing.sm, paddingVertical: 12, alignItems: 'center' },
  deleteBtnText: { ...typography.body, color: colors.error, fontWeight: '600' },
});