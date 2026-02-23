import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { PharmacyProductsStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Route = RouteProp<PharmacyProductsStackParamList, 'PharmacyEditProduct'>;

const CATEGORIES = ['Food & Treats', 'Medications', 'Grooming', 'Toys', 'Supplements', 'Accessories', 'Other'];

export function PharmacyEditProductScreen() {
  const route = useRoute<Route>();
  const [form, setForm] = useState({
    name: 'Premium Dog Food 5kg',
    description: 'High-quality nutrition for adult dogs.',
    sku: 'SKU-001',
    price: '24.99',
    discountPrice: '',
    stock: '50',
    category: 'Food & Treats',
    tags: 'dog, food, premium',
    requiresPrescription: false,
    isActive: true,
  });

  const update = (key: string) => (value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <ScreenContainer scroll padded>
      <Card>
        <Text style={styles.sectionTitle}>Edit product</Text>

        <Input label="Product name" value={form.name} onChangeText={update('name') as (t: string) => void} />
        <Input label="Description" value={form.description} onChangeText={update('description') as (t: string) => void} />
        <Input label="SKU" value={form.sku} onChangeText={update('sku') as (t: string) => void} />

        <Text style={styles.fieldLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, form.category === cat && styles.categoryChipActive]}
              onPress={() => update('category')(cat)}
            >
              <Text style={[styles.categoryChipText, form.category === cat && styles.categoryChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.row}>
          <View style={styles.half}>
            <Input label="Price (€)" value={form.price} onChangeText={update('price') as (t: string) => void} keyboardType="decimal-pad" />
          </View>
          <View style={styles.half}>
            <Input label="Discount price (€)" value={form.discountPrice} onChangeText={update('discountPrice') as (t: string) => void} placeholder="Optional" keyboardType="decimal-pad" />
          </View>
        </View>
        <Input label="Stock" value={form.stock} onChangeText={update('stock') as (t: string) => void} keyboardType="numeric" />
        <Input label="Tags (comma-separated)" value={form.tags} onChangeText={update('tags') as (t: string) => void} />

        <TouchableOpacity style={styles.checkRow} onPress={() => update('requiresPrescription')(!form.requiresPrescription)}>
          <View style={[styles.checkbox, form.requiresPrescription && styles.checkboxChecked]}>
            {form.requiresPrescription && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkLabel}>Requires prescription</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.checkRow} onPress={() => update('isActive')(!form.isActive)}>
          <View style={[styles.checkbox, form.isActive && styles.checkboxChecked]}>
            {form.isActive && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkLabel}>Active (visible in catalog)</Text>
        </TouchableOpacity>

        <Button title="Save changes" onPress={() => {}} style={styles.submitBtn} />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
});