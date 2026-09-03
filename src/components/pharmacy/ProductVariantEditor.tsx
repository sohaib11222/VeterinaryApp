import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../common/Input';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export type ProductVariantDraft = {
  _id?: string;
  name: string;
  sku: string;
  barcode: string;
  strengthValue: string;
  strengthUnit: string;
  dosageForm: string;
  packageType: string;
  unitsPerPack: string;
  unitLabel: string;
  packageDescription: string;
  price: string;
  discountPrice: string;
  stock: string;
  isDefault: boolean;
  isActive: boolean;
};

export function createProductVariant(isMedicine: boolean, isDefault = false): ProductVariantDraft {
  return {
    name: '',
    sku: '',
    barcode: '',
    strengthValue: '',
    strengthUnit: isMedicine ? 'mg' : '',
    dosageForm: '',
    packageType: '',
    unitsPerPack: '',
    unitLabel: isMedicine ? 'tablets' : '',
    packageDescription: '',
    price: '',
    discountPrice: '',
    stock: '',
    isDefault,
    isActive: true,
  };
}

const MEDICINE_FORMS = ['Tablet', 'Capsule', 'Chewable', 'Oral liquid', 'Topical', 'Spot-on', 'Injection', 'Spray', 'Ointment', 'Drops', 'Other'];
const PACKAGE_TYPES = ['Box', 'Bottle', 'Blister pack', 'Tube', 'Sachet', 'Jar', 'Ampoule', 'Other'];
const STRENGTH_UNITS = ['mg', 'g', 'mcg', 'mg/ml', '%', 'IU', 'ml'];

type Props = {
  isMedicine: boolean;
  variants: ProductVariantDraft[];
  onChange: (variants: ProductVariantDraft[]) => void;
};

function ChipSelector({ label, options, value, onSelect }: { label: string; options: string[]; value: string; onSelect: (value: string) => void }) {
  return (
    <View style={styles.selectorWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {options.map((option) => (
          <TouchableOpacity key={option} style={[styles.chip, value === option && styles.chipActive]} onPress={() => onSelect(option)}>
            <Text style={[styles.chipText, value === option && styles.chipTextActive]}>{option}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

/**
 * One reusable editor gives Pharmacy and Parapharmacy products a single,
 * consistent source of truth for stock, packaging and per-variant prices.
 */
export function ProductVariantEditor({ isMedicine, variants, onChange }: Props) {
  const updateVariant = (index: number, patch: Partial<ProductVariantDraft>) => {
    onChange(variants.map((variant, itemIndex) => itemIndex === index ? { ...variant, ...patch } : variant));
  };

  const setDefault = (index: number) => {
    onChange(variants.map((variant, itemIndex) => ({ ...variant, isDefault: itemIndex === index })));
  };

  const remove = (index: number) => {
    if (variants.length <= 1) return;
    const next = variants.filter((_, itemIndex) => itemIndex !== index);
    if (!next.some((variant) => variant.isDefault)) next[0].isDefault = true;
    onChange(next);
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionCopy}>
          <Text style={styles.sectionTitle}>Variants, packaging & pricing</Text>
          <Text style={styles.sectionSubtitle}>Each option can have its own pack, price and available stock.</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => onChange([...variants, createProductVariant(isMedicine, false)])}>
          <Ionicons name="add" size={17} color={colors.textInverse} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {variants.map((variant, index) => (
        <View key={variant._id ?? `draft-${index}`} style={styles.variantCard}>
          <View style={styles.variantHeader}>
            <View>
              <Text style={styles.variantTitle}>Variant {index + 1}</Text>
              <Text style={styles.variantSubtitle}>{variant.isDefault ? 'Default purchase option' : 'Additional purchase option'}</Text>
            </View>
            <View style={styles.variantActions}>
              <TouchableOpacity style={[styles.smallAction, variant.isDefault && styles.smallActionSelected]} onPress={() => setDefault(index)}>
                <Text style={[styles.smallActionText, variant.isDefault && styles.smallActionTextSelected]}>Default</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconAction, !variant.isActive && styles.iconActionMuted]} onPress={() => updateVariant(index, { isActive: !variant.isActive })}>
                <Ionicons name={variant.isActive ? 'eye-outline' : 'eye-off-outline'} size={17} color={colors.primaryDark} />
              </TouchableOpacity>
              {variants.length > 1 ? <TouchableOpacity style={styles.iconAction} onPress={() => remove(index)}><Ionicons name="trash-outline" size={17} color={colors.error} /></TouchableOpacity> : null}
            </View>
          </View>

          <Input label="Variant label" value={variant.name} onChangeText={(value) => updateVariant(index, { name: value })} placeholder={isMedicine ? 'e.g. 500 mg tablets' : 'e.g. 250 ml bottle'} />
          <View style={styles.row}>
            <View style={styles.half}><Input label="Variant SKU" value={variant.sku} onChangeText={(value) => updateVariant(index, { sku: value })} placeholder="Optional" /></View>
            <View style={styles.half}><Input label="Barcode / GTIN" value={variant.barcode} onChangeText={(value) => updateVariant(index, { barcode: value })} placeholder="Optional" keyboardType="numeric" /></View>
          </View>

          {isMedicine ? <>
            <View style={styles.row}>
              <View style={styles.half}><Input label="Strength" value={variant.strengthValue} onChangeText={(value) => updateVariant(index, { strengthValue: value })} placeholder="500" keyboardType="decimal-pad" /></View>
              <View style={styles.half}><ChipSelector label="Unit" options={STRENGTH_UNITS} value={variant.strengthUnit} onSelect={(value) => updateVariant(index, { strengthUnit: value })} /></View>
            </View>
            <ChipSelector label="Dosage form" options={MEDICINE_FORMS} value={variant.dosageForm} onSelect={(value) => updateVariant(index, { dosageForm: value })} />
          </> : <Input label="Product format" value={variant.dosageForm} onChangeText={(value) => updateVariant(index, { dosageForm: value })} placeholder="e.g. liquid, wipes, chew" />}

          <ChipSelector label="Pack type" options={PACKAGE_TYPES} value={variant.packageType} onSelect={(value) => updateVariant(index, { packageType: value })} />
          <View style={styles.row}>
            <View style={styles.half}><Input label="Units per pack" value={variant.unitsPerPack} onChangeText={(value) => updateVariant(index, { unitsPerPack: value })} placeholder="30" keyboardType="numeric" /></View>
            <View style={styles.half}><Input label="Unit label" value={variant.unitLabel} onChangeText={(value) => updateVariant(index, { unitLabel: value })} placeholder={isMedicine ? 'tablets' : 'ml / pieces'} /></View>
          </View>
          <Input label="Pack description" value={variant.packageDescription} onChangeText={(value) => updateVariant(index, { packageDescription: value })} placeholder="e.g. Box of 3 blisters" />
          <View style={styles.row}>
            <View style={styles.half}><Input label="Regular price (€)" value={variant.price} onChangeText={(value) => updateVariant(index, { price: value })} placeholder="0.00" keyboardType="decimal-pad" /></View>
            <View style={styles.half}><Input label="Sale price (€)" value={variant.discountPrice} onChangeText={(value) => updateVariant(index, { discountPrice: value })} placeholder="Optional" keyboardType="decimal-pad" /></View>
          </View>
          <Input label="Available stock" value={variant.stock} onChangeText={(value) => updateVariant(index, { stock: value })} placeholder="0" keyboardType="numeric" />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.sm },
  sectionCopy: { flex: 1 },
  sectionTitle: { ...typography.h3 },
  sectionSubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 3 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 10, backgroundColor: colors.primary, paddingHorizontal: 11, paddingVertical: 8 },
  addButtonText: { ...typography.caption, color: colors.textInverse, fontWeight: '800' },
  variantCard: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundSecondary, borderRadius: 16, padding: spacing.sm, marginTop: spacing.sm },
  variantHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.sm, gap: spacing.sm },
  variantTitle: { ...typography.label, color: colors.primaryDark },
  variantSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  variantActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  smallAction: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 5, backgroundColor: colors.background },
  smallActionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight + '1C' },
  smallActionText: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
  smallActionTextSelected: { color: colors.primaryDark },
  iconAction: { width: 31, height: 31, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  iconActionMuted: { opacity: 0.5 },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1, minWidth: 0 },
  selectorWrap: { marginBottom: spacing.sm },
  fieldLabel: { ...typography.label, marginBottom: spacing.xs },
  chipRow: { gap: 7, paddingRight: spacing.md },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, backgroundColor: colors.background, paddingVertical: 7, paddingHorizontal: 10 },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight + '1B' },
  chipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' },
  chipTextActive: { color: colors.primaryDark },
});
