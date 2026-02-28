import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useCreateProduct } from '../../mutations/productMutations';
import { uploadProductImages } from '../../services/upload';
import { copyToCacheUri, deleteCacheFiles, getExtensionFromMime } from '../../utils/fileUpload';
import { getErrorMessage } from '../../utils/errorUtils';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTranslation } from 'react-i18next';

const CATEGORIES: { value: string; labelKey: string }[] = [
  { value: 'Food & Treats', labelKey: 'pharmacyProducts.categories.foodTreats' },
  { value: 'Medications', labelKey: 'pharmacyProducts.categories.medications' },
  { value: 'Grooming', labelKey: 'pharmacyProducts.categories.grooming' },
  { value: 'Toys', labelKey: 'pharmacyProducts.categories.toys' },
  { value: 'Supplements', labelKey: 'pharmacyProducts.categories.supplements' },
  { value: 'Accessories', labelKey: 'pharmacyProducts.categories.accessories' },
  { value: 'Other', labelKey: 'pharmacyProducts.categories.other' },
];

export function PharmacyAddProductScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const createMutation = useCreateProduct();
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

  const update = (key: string) => (value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const pickAndUploadImages = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });
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

  const onSubmit = async () => {
    const name = String(form.name ?? '').trim();
    const priceNum = Number(form.price);
    if (!name) {
      Toast.show({ type: 'error', text1: t('pharmacyAddProduct.validation.nameRequiredTitle'), text2: t('pharmacyAddProduct.validation.nameRequiredBody') });
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      Toast.show({ type: 'error', text1: t('pharmacyAddProduct.validation.invalidPriceTitle'), text2: t('pharmacyAddProduct.validation.invalidPriceBody') });
      return;
    }
    const discountNum = form.discountPrice ? Number(form.discountPrice) : null;
    if (discountNum != null && (!Number.isFinite(discountNum) || discountNum >= priceNum)) {
      Toast.show({ type: 'error', text1: t('pharmacyAddProduct.validation.invalidDiscountTitle'), text2: t('pharmacyAddProduct.validation.invalidDiscountBody') });
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
      images: form.images.length ? form.images : undefined,
    };
    try {
      await createMutation.mutateAsync(payload);
      Toast.show({ type: 'success', text1: t('pharmacyAddProduct.toasts.productCreated') });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: t('common.failed'), text2: getErrorMessage(err, t('pharmacyAddProduct.errors.couldNotCreateProduct')) });
    }
  };

  return (
    <ScreenContainer scroll padded>
      <Card>
        <Text style={styles.sectionTitle}>{t('pharmacyAddProduct.title')}</Text>
        <Input label={t('pharmacyAddProduct.fields.name.label')} placeholder={t('pharmacyAddProduct.fields.name.placeholder')} value={form.name} onChangeText={update('name')} />
        <Input label={t('pharmacyAddProduct.fields.description.label')} placeholder={t('pharmacyAddProduct.fields.description.placeholder')} value={form.description} onChangeText={update('description')} />
        <Input label={t('pharmacyAddProduct.fields.sku.label')} placeholder={t('pharmacyAddProduct.fields.sku.placeholder')} value={form.sku} onChangeText={update('sku')} />
        <Text style={styles.fieldLabel}>{t('pharmacyAddProduct.fields.category.label')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.value} style={[styles.categoryChip, form.category === cat.value && styles.categoryChipActive]} onPress={() => update('category')(cat.value)}>
              <Text style={[styles.categoryChipText, form.category === cat.value && styles.categoryChipTextActive]}>{t(cat.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.row}>
          <View style={styles.half}><Input label={t('pharmacyAddProduct.fields.price.label')} placeholder={t('pharmacyAddProduct.fields.price.placeholder')} value={form.price} onChangeText={update('price')} keyboardType="decimal-pad" /></View>
          <View style={styles.half}><Input label={t('pharmacyAddProduct.fields.discountPrice.label')} placeholder={t('pharmacyAddProduct.fields.discountPrice.placeholder')} value={form.discountPrice} onChangeText={update('discountPrice')} keyboardType="decimal-pad" /></View>
        </View>
        <Input label={t('pharmacyAddProduct.fields.stock.label')} placeholder={t('pharmacyAddProduct.fields.stock.placeholder')} value={form.stock} onChangeText={update('stock')} keyboardType="numeric" />
        <Input label={t('pharmacyAddProduct.fields.tags.label')} placeholder={t('pharmacyAddProduct.fields.tags.placeholder')} value={form.tags} onChangeText={update('tags')} />
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
          <View style={[styles.checkbox, form.requiresPrescription && styles.checkboxChecked]}>{form.requiresPrescription && <Text style={styles.checkmark}>✓</Text>}</View>
          <Text style={styles.checkLabel}>{t('pharmacyAddProduct.fields.requiresPrescription')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.checkRow} onPress={() => update('isActive')(!form.isActive)}>
          <View style={[styles.checkbox, form.isActive && styles.checkboxChecked]}>{form.isActive && <Text style={styles.checkmark}>✓</Text>}</View>
          <Text style={styles.checkLabel}>{t('pharmacyAddProduct.fields.isActive')}</Text>
        </TouchableOpacity>
        <Button title={t('pharmacyAddProduct.actions.addProduct')} onPress={onSubmit} loading={createMutation.isPending} style={styles.submitBtn} />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  fieldLabel: { ...typography.label, marginBottom: spacing.xs, marginTop: spacing.sm },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
  categoryChip: { paddingHorizontal: spacing.sm, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.backgroundTertiary, borderWidth: 1, borderColor: colors.border },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryChipText: { fontSize: 13, color: colors.text },
  categoryChipTextActive: { color: colors.textInverse, fontWeight: '600' },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: colors.border, borderRadius: 4, marginRight: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkmark: { color: colors.textInverse, fontSize: 12, fontWeight: '700' },
  checkLabel: { ...typography.body },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.sm },
  imageWrap: { width: 64, height: 64, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  thumbImg: { width: 64, height: 64 },
  removeImgText: { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 10, width: 20, height: 20, textAlign: 'center', lineHeight: 18, fontSize: 12 },
  addImgBtn: { width: 64, height: 64, borderRadius: 8, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addImgBtnText: { ...typography.bodySmall, color: colors.textSecondary },
  submitBtn: { marginTop: spacing.lg },
});
