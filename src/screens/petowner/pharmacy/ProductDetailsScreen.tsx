import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppImage } from '../../../components/common/AppImage';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
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
import { useProductPrescriptionEligibility } from '../../../queries/productPrescriptionRequestQueries';
import { useSubmitProductPrescriptionRequest } from '../../../mutations/productPrescriptionRequestMutations';
import { useCart, CartVariantOption } from '../../../contexts/CartContext';
import { useAuth } from '../../../contexts/AuthContext';
import { uploadProductPrescription } from '../../../services/upload';
import { getImageUrl } from '../../../config/api';
import { useTranslation } from 'react-i18next';

type Route = RouteProp<PetOwnerPharmacyStackParamList, 'ProductDetails'>;
type Nav = NativeStackNavigationProp<PetOwnerPharmacyStackParamList>;
type ProductVariant = CartVariantOption & {
  isDefault?: boolean; isActive?: boolean; barcode?: string | null; strengthValue?: number | null;
  strengthUnit?: string | null; dosageForm?: string | null; packageType?: string | null;
  unitsPerPack?: number | null; unitLabel?: string | null; packageDescription?: string | null;
};

function variantKey(variant: ProductVariant | null | undefined, fallback = 'default') {
  return String(variant?._id ?? variant?.id ?? fallback);
}

function variantLabel(variant: ProductVariant | null | undefined, fallback: string) {
  if (!variant) return fallback;
  if (variant.name) return variant.name;
  return [
    variant.strengthValue ? `${variant.strengthValue} ${variant.strengthUnit ?? ''}`.trim() : '',
    variant.dosageForm,
    variant.unitsPerPack ? `${variant.unitsPerPack} ${variant.unitLabel ?? 'units'}` : '',
  ].filter(Boolean).join(' · ') || fallback;
}

function DetailRow({ label, value }: { label: string; value: string | number | string[] | null | undefined }) {
  const display = Array.isArray(value) ? value.filter(Boolean).join(', ') : value;
  if (!display) return null;
  return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{String(display)}</Text></View>;
}

export function ProductDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const productId = route.params?.productId;
  const { t } = useTranslation();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [isUploadingPrescription, setIsUploadingPrescription] = useState(false);
  const fileInputBusy = useRef(false);
  const { data: productRes, isLoading, isError } = useProduct(productId ?? null);
  const product = (productRes?.data ?? (productRes as { data?: Record<string, unknown> } | undefined)?.data) as Record<string, unknown> | undefined;
  const petStoreId = product?.petStoreId;
  const petStoreIdStr = petStoreId && typeof petStoreId === 'object' && '_id' in petStoreId ? String((petStoreId as { _id: string })._id) : typeof petStoreId === 'string' ? petStoreId : undefined;
  const { data: storeRes } = usePetStore(petStoreIdStr ?? undefined);
  const store = (storeRes?.data ?? (storeRes as { data?: Record<string, unknown> } | undefined)?.data) as Record<string, unknown> | undefined;
  const soldByName = (store?.name as string) ?? t('petOwnerProductDetails.defaults.pharmacy');
  const { addToCart } = useCart();

  const variants = useMemo<ProductVariant[]>(() => {
    const structured = Array.isArray(product?.variants) ? product.variants as ProductVariant[] : [];
    if (structured.length) return structured;
    if (!product) return [];
    return [{ id: 'default', name: t('petOwnerProductDetails.defaults.standardPack'), price: Number(product.price ?? 0), discountPrice: typeof product.discountPrice === 'number' ? product.discountPrice : null, stock: typeof product.stock === 'number' ? product.stock : 0, sku: product.sku as string | undefined, isDefault: true, isActive: product.isActive !== false }];
  }, [product, t]);
  const activeVariants = useMemo(() => {
    const active = variants.filter((variant) => variant.isActive !== false);
    return active.length ? active : variants;
  }, [variants]);

  useEffect(() => {
    const initial = variants.find((variant) => variant.isDefault && variant.isActive !== false) ?? activeVariants[0] ?? variants[0];
    setSelectedVariantId(variantKey(initial));
    setQuantity(1);
  }, [variants, activeVariants]);

  const selectedVariant = variants.find((variant) => variantKey(variant) === selectedVariantId) ?? activeVariants[0] ?? variants[0];
  const selectedStock = Number(selectedVariant?.stock ?? product?.stock ?? 0);
  const selectedPrice = Number(typeof selectedVariant?.discountPrice === 'number' && selectedVariant.discountPrice > 0 ? selectedVariant.discountPrice : selectedVariant?.price ?? product?.price ?? 0);
  const originalPrice = typeof selectedVariant?.discountPrice === 'number' && selectedVariant.discountPrice > 0 ? Number(selectedVariant.price ?? product?.price ?? 0) : null;
  const discountPercent = originalPrice && originalPrice > selectedPrice ? Math.round(((originalPrice - selectedPrice) / originalPrice) * 100) : 0;
  const isInStock = selectedVariant?.isActive !== false && selectedStock > 0;
  const isMedicine = product?.productType === 'PHARMACY_MEDICINE' || (!product?.productType && String(product?.sellerType ?? '').toUpperCase() !== 'PARAPHARMACY');
  const requiresPrescription = Boolean(product?.requiresPrescription);
  const isPetOwner = user?.role === 'PET_OWNER';
  const structuredVariants = Array.isArray(product?.variants) && product.variants.length > 0;
  const selectedPrescriptionVariantId = structuredVariants ? String(selectedVariant?._id ?? selectedVariant?.id ?? '') || null : null;
  const eligibilityQuery = useProductPrescriptionEligibility(productId, selectedPrescriptionVariantId, { enabled: requiresPrescription && isPetOwner });
  const submitPrescription = useSubmitProductPrescriptionRequest();
  const eligibilityPayload = (eligibilityQuery.data as { data?: unknown } | undefined)?.data ?? eligibilityQuery.data;
  const eligibility = eligibilityPayload as { canPurchase?: boolean; status?: string; request?: { reviewNotes?: string | null } } | undefined;
  const prescriptionStatus = eligibility?.status ?? (requiresPrescription ? 'NOT_SUBMITTED' : null);
  const canPurchase = !requiresPrescription || (isPetOwner && eligibility?.canPurchase === true);
  const name = (product?.name as string) ?? t('petOwnerProductDetails.defaults.product');
  const description = (product?.description as string) ?? '';
  const category = (product?.category as string) ?? t('common.na');
  const images = product?.images as string[] | undefined;
  const imageUri = getImageUrl(Array.isArray(images) && images[0] ? images[0] : undefined);
  const medicine = (product?.medicineDetails as Record<string, unknown> | undefined) ?? {};
  const parapharmacy = (product?.parapharmacyDetails as Record<string, unknown> | undefined) ?? {};
  const selectedPack = [selectedVariant?.packageType, selectedVariant?.unitsPerPack ? `${selectedVariant.unitsPerPack} ${selectedVariant.unitLabel ?? t('petOwnerProductDetails.labels.units')}` : '', selectedVariant?.packageDescription].filter(Boolean).join(' · ');

  useEffect(() => { if (selectedStock > 0 && quantity > selectedStock) setQuantity(selectedStock); }, [quantity, selectedStock]);
  const selectVariant = (variant: ProductVariant) => { const next = variantKey(variant); if (next !== selectedVariantId) { setSelectedVariantId(next); setQuantity(1); } };
  const changeQuantity = (delta: number) => { const next = quantity + delta; if (next >= 1 && next <= selectedStock) setQuantity(next); };
  const addSelectedToCart = (buyNow = false) => {
    if (!product || !isInStock || !canPurchase) return;
    addToCart(product, quantity, { variant: structuredVariants ? selectedVariant : null });
    if (buyNow) navigation.navigate('Checkout');
    else Toast.show({ type: 'success', text1: t('petOwnerProductDetails.toasts.addedToCart') });
  };
  const handlePrescriptionUpload = async () => {
    if (fileInputBusy.current || !product || !isPetOwner) return;
    try {
      fileInputBusy.current = true;
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      if (file.size && file.size > 15 * 1024 * 1024) { Toast.show({ type: 'error', text1: t('petOwnerProductDetails.errors.prescriptionTooLarge') }); return; }
      setIsUploadingPrescription(true);
      const upload = await uploadProductPrescription({ uri: file.uri, name: file.name ?? `prescription-${Date.now()}`, type: file.mimeType ?? 'application/octet-stream' });
      const uploadPayload = upload as { data?: { url?: string }; url?: string };
      const prescriptionUrl = uploadPayload.data?.url ?? uploadPayload.url;
      if (!prescriptionUrl) throw new Error(t('petOwnerProductDetails.errors.uploadFailed'));
      await submitPrescription.mutateAsync({ productId: String(product._id ?? product.id), variantId: selectedPrescriptionVariantId, prescriptionUrl, originalName: file.name ?? 'prescription', mimeType: file.mimeType ?? null });
      Toast.show({ type: 'success', text1: t('petOwnerProductDetails.toasts.prescriptionSubmitted') });
    } catch (err: unknown) {
      Toast.show({ type: 'error', text1: (err as { message?: string })?.message ?? t('petOwnerProductDetails.errors.prescriptionSubmitFailed') });
    } finally { setIsUploadingPrescription(false); fileInputBusy.current = false; }
  };

  if (!productId || isLoading) return <ScreenContainer padded><ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.xxl }} /></ScreenContainer>;
  if (isError || !product) return <ScreenContainer padded><Text style={styles.errorText}>{t('petOwnerProductDetails.errors.notFound')}</Text></ScreenContainer>;

  return <ScreenContainer scroll padded>
    {imageUri ? <AppImage source={{ uri: imageUri }} style={styles.productImage} resizeMode="cover" /> : <View style={styles.productImage}><Ionicons name="cube-outline" size={42} color={colors.textLight} /></View>}
    <View style={styles.productHeader}><View style={styles.titleRow}><Text style={styles.productName}>{name}</Text>{requiresPrescription ? <View style={styles.prescriptionBadge}><Ionicons name="document-text-outline" size={13} color="#805B00" /><Text style={styles.prescriptionBadgeText}>{t('petOwnerProductDetails.prescription.required')}</Text></View> : null}</View><Text style={styles.soldBy}>{t('petOwnerProductDetails.soldBy', { soldByName })}</Text><Text style={styles.productKind}>{isMedicine ? t('petOwnerProductDetails.labels.medicine') : t('petOwnerProductDetails.labels.parapharmacyProduct')}</Text></View>
    <Card style={styles.purchaseCard}>
      {variants.length > 1 ? <><Text style={styles.sectionEyebrow}>{t('petOwnerProductDetails.labels.chooseVariant')}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.variantChips}>{variants.map((variant, index) => { const selected = variantKey(variant) === variantKey(selectedVariant); return <TouchableOpacity key={variantKey(variant, String(index))} style={[styles.variantChip, selected && styles.variantChipSelected, variant.isActive === false && styles.variantChipDisabled]} onPress={() => selectVariant(variant)} disabled={variant.isActive === false}><Text numberOfLines={1} style={[styles.variantChipText, selected && styles.variantChipTextSelected]}>{variantLabel(variant, `${t('petOwnerProductDetails.labels.variant')} ${index + 1}`)}</Text></TouchableOpacity>; })}</ScrollView></> : null}
      <View style={styles.priceRow}><View><View style={styles.priceLine}><Text style={styles.price}>€{selectedPrice.toFixed(2)}</Text>{originalPrice ? <Text style={styles.originalPrice}>€{originalPrice.toFixed(2)}</Text> : null}{discountPercent > 0 ? <View style={styles.discountBadge}><Text style={styles.discountText}>{t('petOwnerProductDetails.discountOff', { percent: discountPercent })}</Text></View> : null}</View><View style={styles.stockBadge}><Ionicons name={isInStock ? 'checkmark-circle-outline' : 'close-circle-outline'} size={14} color={isInStock ? colors.primaryDark : colors.error} /><Text style={[styles.stockText, !isInStock && styles.stockTextInactive]}>{isInStock ? t('petOwnerProductDetails.stock.inStockWithCount', { count: selectedStock }) : t('petOwnerProductDetails.stock.outOfStock')}</Text></View></View></View>
      {requiresPrescription ? <View style={styles.prescriptionPanel}><View style={styles.prescriptionIcon}><Ionicons name="document-text-outline" size={20} color={colors.primary} /></View><View style={styles.prescriptionCopy}><Text style={styles.prescriptionTitle}>{t('petOwnerProductDetails.prescription.title')}</Text><Text style={styles.prescriptionText}>{eligibilityQuery.isLoading ? t('petOwnerProductDetails.prescription.checking') : prescriptionStatus === 'APPROVED' ? t('petOwnerProductDetails.prescription.approved') : prescriptionStatus === 'PENDING' ? t('petOwnerProductDetails.prescription.pending') : prescriptionStatus === 'REJECTED' ? (eligibility?.request?.reviewNotes || t('petOwnerProductDetails.prescription.rejected')) : t('petOwnerProductDetails.prescription.help')}</Text></View></View> : null}
      {requiresPrescription && isPetOwner && prescriptionStatus !== 'APPROVED' && prescriptionStatus !== 'PENDING' ? <Button title={isUploadingPrescription || submitPrescription.isPending ? t('petOwnerProductDetails.actions.uploadingPrescription') : t('petOwnerProductDetails.actions.uploadPrescription')} variant="outline" icon={<Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />} onPress={handlePrescriptionUpload} disabled={isUploadingPrescription || submitPrescription.isPending} style={styles.uploadButton} /> : null}
      <View style={styles.quantityRow}><Text style={styles.quantityLabel}>{t('petOwnerProductDetails.labels.quantity')}</Text><View style={styles.stepper}><TouchableOpacity style={[styles.stepperButton, quantity <= 1 && styles.stepperDisabled]} onPress={() => changeQuantity(-1)} disabled={quantity <= 1}><Ionicons name="remove" size={18} color={colors.primaryDark} /></TouchableOpacity><Text style={styles.stepperValue}>{quantity}</Text><TouchableOpacity style={[styles.stepperButton, (!isInStock || quantity >= selectedStock) && styles.stepperDisabled]} onPress={() => changeQuantity(1)} disabled={!isInStock || quantity >= selectedStock}><Ionicons name="add" size={18} color={colors.primaryDark} /></TouchableOpacity></View></View>
      <Button title={t('petOwnerProductDetails.actions.addToCart')} icon={<Ionicons name="cart-outline" size={19} color={colors.textInverse} />} onPress={() => addSelectedToCart(false)} disabled={!isInStock || !canPurchase} style={styles.addToCartButton} /><Button title={t('petOwnerProductDetails.actions.buyNow')} variant="outline" icon={<Ionicons name="bag-handle-outline" size={19} color={colors.primary} />} onPress={() => addSelectedToCart(true)} disabled={!isInStock || !canPurchase} />
    </Card>
    <Card style={styles.sectionCard}><Text style={styles.sectionTitle}>{t('petOwnerProductDetails.sections.selectedVariant')}</Text><DetailRow label={t('petOwnerProductDetails.labels.variant')} value={variantLabel(selectedVariant, t('petOwnerProductDetails.defaults.standardPack'))} /><DetailRow label={t('petOwnerProductDetails.labels.strength')} value={selectedVariant?.strengthValue ? `${selectedVariant.strengthValue} ${selectedVariant.strengthUnit ?? ''}`.trim() : null} /><DetailRow label={isMedicine ? t('petOwnerProductDetails.labels.dosageForm') : t('petOwnerProductDetails.labels.productFormat')} value={selectedVariant?.dosageForm} /><DetailRow label={t('petOwnerProductDetails.labels.package')} value={selectedPack} /><DetailRow label={t('petOwnerProductDetails.specs.sku')} value={selectedVariant?.sku ?? product.sku as string} /></Card>
    {variants.length > 1 ? <Card style={styles.sectionCard}><Text style={styles.sectionTitle}>{t('petOwnerProductDetails.sections.availableVariants')}</Text>{variants.map((variant, index) => { const selected = variantKey(variant) === variantKey(selectedVariant); const price = typeof variant.discountPrice === 'number' && variant.discountPrice > 0 ? variant.discountPrice : variant.price ?? 0; return <TouchableOpacity key={variantKey(variant, String(index))} onPress={() => selectVariant(variant)} disabled={variant.isActive === false} style={[styles.variantListItem, selected && styles.variantListItemSelected, variant.isActive === false && styles.variantListItemDisabled]}><View style={styles.variantListTop}><View style={styles.variantListNameWrap}><Text style={styles.variantListName}>{variantLabel(variant, `${t('petOwnerProductDetails.labels.variant')} ${index + 1}`)}</Text><Text style={styles.variantListMeta}>{[variant.strengthValue ? `${variant.strengthValue} ${variant.strengthUnit ?? ''}`.trim() : '', variant.dosageForm, variant.unitsPerPack ? `${variant.unitsPerPack} ${variant.unitLabel ?? t('petOwnerProductDetails.labels.units')}` : ''].filter(Boolean).join(' · ') || t('common.na')}</Text></View><View style={styles.variantListPrice}><Text style={styles.variantPrice}>€{Number(price).toFixed(2)}</Text><Text style={styles.variantAvailability}>{variant.isActive === false ? t('petOwnerProductDetails.stock.unavailable') : Number(variant.stock ?? 0) > 0 ? t('petOwnerProductDetails.stock.inStockWithCount', { count: Number(variant.stock ?? 0) }) : t('petOwnerProductDetails.stock.outOfStock')}</Text></View></View><View style={styles.variantSelect}><Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={19} color={selected ? colors.primary : colors.textLight} /></View></TouchableOpacity>; })}</Card> : null}
    <Card style={styles.sectionCard}><Text style={styles.sectionTitle}>{isMedicine ? t('petOwnerProductDetails.sections.medicineInformation') : t('petOwnerProductDetails.sections.parapharmacyInformation')}</Text>{isMedicine ? <><DetailRow label={t('petOwnerProductDetails.labels.activeIngredients')} value={medicine.activeIngredients as string} /><DetailRow label={t('petOwnerProductDetails.labels.administrationRoute')} value={medicine.administrationRoute as string} /><DetailRow label={t('petOwnerProductDetails.labels.targetSpecies')} value={(medicine.targetSpecies as string[] | undefined) ?? product.petType as string[]} /><DetailRow label={t('petOwnerProductDetails.labels.indications')} value={medicine.indications as string} /><DetailRow label={t('petOwnerProductDetails.labels.dosageInstructions')} value={medicine.dosageInstructions as string} /><DetailRow label={t('petOwnerProductDetails.labels.warnings')} value={medicine.warnings as string} /><DetailRow label={t('petOwnerProductDetails.labels.storage')} value={medicine.storageInstructions as string} /><DetailRow label={t('petOwnerProductDetails.labels.manufacturer')} value={(medicine.manufacturer as string) ?? product.manufacturer as string} /></> : <><DetailRow label={t('petOwnerProductDetails.labels.productClass')} value={parapharmacy.productClass as string} /><DetailRow label={t('petOwnerProductDetails.labels.lifeStage')} value={parapharmacy.lifeStage as string} /><DetailRow label={t('petOwnerProductDetails.labels.targetSpecies')} value={(parapharmacy.targetSpecies as string[] | undefined) ?? product.petType as string[]} /><DetailRow label={t('petOwnerProductDetails.labels.ingredients')} value={parapharmacy.ingredients as string} /><DetailRow label={t('petOwnerProductDetails.labels.allergens')} value={parapharmacy.allergens as string} /><DetailRow label={t('petOwnerProductDetails.labels.usageInstructions')} value={parapharmacy.usageInstructions as string} /><DetailRow label={t('petOwnerProductDetails.labels.warnings')} value={parapharmacy.warnings as string} /><DetailRow label={t('petOwnerProductDetails.labels.storage')} value={parapharmacy.storageInstructions as string} /></>}</Card>
    <Card style={styles.sectionCard}><Text style={styles.sectionTitle}>{t('petOwnerProductDetails.labels.description')}</Text><Text style={styles.description}>{description || t('petOwnerProductDetails.defaults.noDescription')}</Text><DetailRow label={t('petOwnerProductDetails.labels.category')} value={category} /></Card>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  productImage: { width: '100%', height: 280, borderRadius: 20, backgroundColor: colors.backgroundTertiary, marginBottom: spacing.md, alignItems: 'center', justifyContent: 'center' }, productHeader: { marginBottom: spacing.md }, titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm }, productName: { ...typography.h2, flex: 1, color: colors.primaryDark }, soldBy: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 5 }, productKind: { ...typography.caption, color: colors.primary, fontWeight: '800', marginTop: 7, textTransform: 'uppercase', letterSpacing: 0.4 },
  prescriptionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.warningLight, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9 }, prescriptionBadgeText: { ...typography.caption, color: '#805B00', fontWeight: '800' }, purchaseCard: { borderWidth: 1, borderColor: colors.primaryLight + '30', marginBottom: spacing.md }, sectionEyebrow: { ...typography.caption, color: colors.textSecondary, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.45, marginBottom: spacing.xs }, variantChips: { gap: 8, paddingRight: spacing.sm, marginBottom: spacing.md }, variantChip: { maxWidth: 188, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.background }, variantChipSelected: { backgroundColor: colors.primaryLight + '1A', borderColor: colors.primary }, variantChipDisabled: { opacity: 0.52 }, variantChipText: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '700' }, variantChipTextSelected: { color: colors.primaryDark },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }, priceLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }, price: { ...typography.h1, fontSize: 31, color: colors.primaryDark }, originalPrice: { ...typography.body, color: colors.textLight, textDecorationLine: 'line-through' }, discountBadge: { backgroundColor: colors.successLight, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }, discountText: { ...typography.caption, color: colors.primaryDark, fontWeight: '800' }, stockBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 7 }, stockText: { ...typography.caption, color: colors.primaryDark, fontWeight: '700' }, stockTextInactive: { color: colors.error },
  prescriptionPanel: { flexDirection: 'row', padding: spacing.sm, backgroundColor: colors.infoLight, borderRadius: 14, marginBottom: spacing.sm }, prescriptionIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.primaryLight + '20', marginRight: spacing.sm }, prescriptionCopy: { flex: 1 }, prescriptionTitle: { ...typography.label, color: colors.primaryDark }, prescriptionText: { ...typography.caption, color: colors.textSecondary, marginTop: 3, lineHeight: 17 }, uploadButton: { minHeight: 45, paddingVertical: 10, marginBottom: spacing.md },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: spacing.md, marginBottom: spacing.md }, quantityLabel: { ...typography.label, color: colors.text }, stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundSecondary, borderRadius: 12, overflow: 'hidden' }, stepperButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, stepperDisabled: { opacity: 0.38 }, stepperValue: { minWidth: 34, textAlign: 'center', ...typography.label, color: colors.primaryDark }, addToCartButton: { marginBottom: spacing.sm },
  sectionCard: { marginBottom: spacing.md, borderWidth: 1, borderColor: colors.borderLight }, sectionTitle: { ...typography.h3, color: colors.primaryDark, marginBottom: spacing.sm }, detailRow: { paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.borderLight }, detailLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 3 }, detailValue: { ...typography.bodySmall, color: colors.text, lineHeight: 19 }, description: { ...typography.body, color: colors.textSecondary, lineHeight: 21, marginBottom: spacing.sm },
  variantListItem: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, padding: spacing.sm, borderRadius: 13, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.background }, variantListItemSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight + '14' }, variantListItemDisabled: { opacity: 0.5 }, variantListTop: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }, variantListNameWrap: { flex: 1, minWidth: 0 }, variantListName: { ...typography.label, color: colors.text }, variantListMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 3 }, variantListPrice: { alignItems: 'flex-end' }, variantPrice: { ...typography.label, color: colors.primaryDark }, variantAvailability: { ...typography.caption, color: colors.textSecondary, marginTop: 3, maxWidth: 102, textAlign: 'right' }, variantSelect: { marginLeft: spacing.sm }, errorText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginVertical: spacing.lg },
});
