import React, { useState } from 'react';
import { AppImage } from '../../components/common/AppImage';
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
import { useAuth } from '../../contexts/AuthContext';
import { ProductVariantEditor, createProductVariant, type ProductVariantDraft } from '../../components/pharmacy/ProductVariantEditor';

const CATEGORIES: { value: string; labelKey: string }[] = [
  { value: 'Food & Treats', labelKey: 'pharmacyProducts.categories.foodTreats' },
  { value: 'Medications', labelKey: 'pharmacyProducts.categories.medications' },
  { value: 'Grooming', labelKey: 'pharmacyProducts.categories.grooming' },
  { value: 'Toys', labelKey: 'pharmacyProducts.categories.toys' },
  { value: 'Supplements', labelKey: 'pharmacyProducts.categories.supplements' },
  { value: 'Accessories', labelKey: 'pharmacyProducts.categories.accessories' },
  { value: 'Other', labelKey: 'pharmacyProducts.categories.other' },
];

const SPECIES = ['DOG', 'CAT', 'RABBIT', 'BIRD', 'HORSE', 'OTHER'];
const PARAPHARMACY_CLASSES = ['Supplement', 'Complementary feed', 'Hygiene', 'Dental care', 'Skin & coat', 'Ear & eye care', 'Grooming', 'Accessories', 'Other'];

function numberOrUndefined(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function PharmacyAddProductScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const createMutation = useCreateProduct();
  const isMedicine = user?.role === 'PET_STORE';
  const [form, setForm] = useState({
    name: '',
    description: '',
    sku: '',
    brand: '',
    manufacturer: '',
    barcode: '',
    category: '',
    subCategory: '',
    petType: [] as string[],
    tags: '',
    requiresPrescription: false,
    isActive: true,
    images: [] as string[],
    medicineDetails: {
      activeIngredients: '', administrationRoute: '', indications: '', dosageInstructions: '', warnings: '', storageInstructions: '', authorizationHolder: '', aicNumber: '', leafletUrl: '',
    },
    parapharmacyDetails: {
      productClass: 'Supplement', ingredients: '', allergens: '', lifeStage: 'All life stages', usageInstructions: '', warnings: '', storageInstructions: '',
    },
  });
  const [variants, setVariants] = useState<ProductVariantDraft[]>([createProductVariant(isMedicine, true)]);
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

  const updateMedicine = (key: string) => (value: string) => setForm((prev) => ({ ...prev, medicineDetails: { ...prev.medicineDetails, [key]: value } }));
  const updateParapharmacy = (key: string) => (value: string) => setForm((prev) => ({ ...prev, parapharmacyDetails: { ...prev.parapharmacyDetails, [key]: value } }));
  const toggleSpecies = (species: string) => setForm((prev) => ({ ...prev, petType: prev.petType.includes(species) ? prev.petType.filter((item) => item !== species) : [...prev.petType, species] }));

  const onSubmit = async () => {
    const name = String(form.name ?? '').trim();
    if (!name) {
      Toast.show({ type: 'error', text1: t('pharmacyAddProduct.validation.nameRequiredTitle'), text2: t('pharmacyAddProduct.validation.nameRequiredBody') });
      return;
    }
    if (isMedicine && !form.medicineDetails.activeIngredients.trim()) {
      Toast.show({ type: 'error', text1: 'Active ingredient is required', text2: 'Add the medicine active ingredient before saving.' });
      return;
    }
    const normalizedVariants = variants.map((variant, index) => ({
      ...variant,
      name: variant.name.trim() || `${name} · Option ${index + 1}`,
      price: numberOrUndefined(variant.price),
      discountPrice: numberOrUndefined(variant.discountPrice),
      stock: numberOrUndefined(variant.stock),
      strengthValue: numberOrUndefined(variant.strengthValue),
      unitsPerPack: numberOrUndefined(variant.unitsPerPack),
    }));
    const invalidVariant = normalizedVariants.find((variant) => typeof variant.price !== 'number' || variant.price < 0 || typeof variant.stock !== 'number' || variant.stock < 0 || (typeof variant.discountPrice === 'number' && variant.discountPrice >= variant.price));
    if (invalidVariant) {
      Toast.show({ type: 'error', text1: 'Check variant price and stock', text2: 'Every variant needs a valid price and stock. Sale price must be lower than regular price.' });
      return;
    }
    const defaultVariant = normalizedVariants.find((variant) => variant.isDefault) ?? normalizedVariants[0];
    const payload = {
      name,
      description: String(form.description ?? '').trim() || undefined,
      sku: String(form.sku ?? '').trim() || undefined,
      brand: form.brand.trim() || undefined,
      manufacturer: form.manufacturer.trim() || undefined,
      barcode: form.barcode.trim() || undefined,
      price: Number(defaultVariant.price),
      discountPrice: typeof defaultVariant.discountPrice === 'number' ? defaultVariant.discountPrice : undefined,
      stock: Number(defaultVariant.stock),
      category: String(form.category ?? '').trim() || undefined,
      subCategory: form.subCategory.trim() || undefined,
      petType: form.petType.length ? form.petType : undefined,
      tags: form.tags ? String(form.tags).split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      requiresPrescription: isMedicine ? form.requiresPrescription : false,
      isActive: form.isActive,
      images: form.images.length ? form.images : undefined,
      medicineDetails: isMedicine ? { ...form.medicineDetails, targetSpecies: form.petType } : undefined,
      parapharmacyDetails: !isMedicine ? { ...form.parapharmacyDetails, targetSpecies: form.petType } : undefined,
      variants: normalizedVariants,
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
        <View style={styles.row}>
          <View style={styles.half}><Input label="Brand" value={form.brand} onChangeText={update('brand')} placeholder="Optional" /></View>
          <View style={styles.half}><Input label="Manufacturer" value={form.manufacturer} onChangeText={update('manufacturer')} placeholder="Optional" /></View>
        </View>
        <Input label="Product barcode / GTIN" value={form.barcode} onChangeText={update('barcode')} placeholder="Optional" keyboardType="numeric" />
        <Text style={styles.fieldLabel}>{t('pharmacyAddProduct.fields.category.label')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.value} style={[styles.categoryChip, form.category === cat.value && styles.categoryChipActive]} onPress={() => update('category')(cat.value)}>
              <Text style={[styles.categoryChipText, form.category === cat.value && styles.categoryChipTextActive]}>{t(cat.labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Input label="Subcategory" value={form.subCategory} onChangeText={update('subCategory')} placeholder="Optional" />
        <Text style={styles.fieldLabel}>Target species</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {SPECIES.map((species) => <TouchableOpacity key={species} style={[styles.categoryChip, form.petType.includes(species) && styles.categoryChipActive]} onPress={() => toggleSpecies(species)}><Text style={[styles.categoryChipText, form.petType.includes(species) && styles.categoryChipTextActive]}>{species}</Text></TouchableOpacity>)}
        </ScrollView>
        <Input label={t('pharmacyAddProduct.fields.tags.label')} placeholder={t('pharmacyAddProduct.fields.tags.placeholder')} value={form.tags} onChangeText={update('tags')} />

        <View style={styles.detailSection}>
          <Text style={styles.detailTitle}>{isMedicine ? 'Medicine information' : 'Parapharmacy product information'}</Text>
          {isMedicine ? <>
            <Input label="Active ingredient(s) *" value={form.medicineDetails.activeIngredients} onChangeText={updateMedicine('activeIngredients')} placeholder="e.g. Amoxicillin trihydrate" />
            <Input label="Administration route" value={form.medicineDetails.administrationRoute} onChangeText={updateMedicine('administrationRoute')} placeholder="e.g. Oral, topical, otic" />
            <Input label="Indications / intended use" value={form.medicineDetails.indications} onChangeText={updateMedicine('indications')} multiline />
            <Input label="Dosage & administration notes" value={form.medicineDetails.dosageInstructions} onChangeText={updateMedicine('dosageInstructions')} multiline />
            <View style={styles.row}><View style={styles.half}><Input label="AIC / authorization number" value={form.medicineDetails.aicNumber} onChangeText={updateMedicine('aicNumber')} /></View><View style={styles.half}><Input label="Authorization holder" value={form.medicineDetails.authorizationHolder} onChangeText={updateMedicine('authorizationHolder')} /></View></View>
            <Input label="Leaflet URL" value={form.medicineDetails.leafletUrl} onChangeText={updateMedicine('leafletUrl')} placeholder="https://…" keyboardType="url" />
            <Input label="Warnings / contraindications" value={form.medicineDetails.warnings} onChangeText={updateMedicine('warnings')} multiline />
            <Input label="Storage instructions" value={form.medicineDetails.storageInstructions} onChangeText={updateMedicine('storageInstructions')} multiline />
          </> : <>
            <Text style={styles.fieldLabel}>Product class</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>{PARAPHARMACY_CLASSES.map((item) => <TouchableOpacity key={item} style={[styles.categoryChip, form.parapharmacyDetails.productClass === item && styles.categoryChipActive]} onPress={() => updateParapharmacy('productClass')(item)}><Text style={[styles.categoryChipText, form.parapharmacyDetails.productClass === item && styles.categoryChipTextActive]}>{item}</Text></TouchableOpacity>)}</ScrollView>
            <Input label="Ingredients / composition" value={form.parapharmacyDetails.ingredients} onChangeText={updateParapharmacy('ingredients')} multiline />
            <Input label="Allergen information" value={form.parapharmacyDetails.allergens} onChangeText={updateParapharmacy('allergens')} placeholder="e.g. Contains fish" />
            <Input label="Life stage" value={form.parapharmacyDetails.lifeStage} onChangeText={updateParapharmacy('lifeStage')} placeholder="All life stages" />
            <Input label="Usage instructions" value={form.parapharmacyDetails.usageInstructions} onChangeText={updateParapharmacy('usageInstructions')} multiline />
            <Input label="Warnings" value={form.parapharmacyDetails.warnings} onChangeText={updateParapharmacy('warnings')} multiline />
            <Input label="Storage instructions" value={form.parapharmacyDetails.storageInstructions} onChangeText={updateParapharmacy('storageInstructions')} multiline />
          </>}
        </View>

        <ProductVariantEditor isMedicine={isMedicine} variants={variants} onChange={setVariants} />
        <Text style={styles.fieldLabel}>{t('pharmacyAddProduct.fields.images.label')}</Text>
        <View style={styles.imageRow}>
          {form.images.map((url) => (
            <TouchableOpacity key={url} style={styles.imageWrap} onPress={() => removeImage(url)}>
              <AppImage source={{ uri: url }} style={styles.thumbImg} />
              <Text style={styles.removeImgText}>✕</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addImgBtn} onPress={pickAndUploadImages} disabled={uploadingImages}>
            <Text style={styles.addImgBtnText}>{uploadingImages ? t('common.loading') : t('pharmacyAddProduct.actions.addImage')}</Text>
          </TouchableOpacity>
        </View>
        {isMedicine ? <TouchableOpacity style={styles.checkRow} onPress={() => update('requiresPrescription')(!form.requiresPrescription)}>
          <View style={[styles.checkbox, form.requiresPrescription && styles.checkboxChecked]}>{form.requiresPrescription && <Text style={styles.checkmark}>✓</Text>}</View>
          <Text style={styles.checkLabel}>{t('pharmacyAddProduct.fields.requiresPrescription')}</Text>
        </TouchableOpacity> : null}
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
  detailSection: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  detailTitle: { ...typography.h3, marginBottom: spacing.xs },
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
