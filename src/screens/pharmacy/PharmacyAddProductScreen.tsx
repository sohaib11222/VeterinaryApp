import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const CATEGORIES = ['Food & Treats', 'Medications', 'Grooming', 'Toys', 'Supplements', 'Accessories', 'Other'];

export function PharmacyAddProductScreen() {
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
  });

  const update = (key: string) => (value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <ScreenContainer scroll padded>
      <Card>
        <Text style={styles.sectionTitle}>New product</Text>
        <Input label="Product name" placeholder="Name" value={form.name} onChangeText={update('name')} />
        <Input label="Description" placeholder="Description" value={form.description} onChangeText={update('description')} />
        <Input label="SKU" placeholder="e.g. SKU-001" value={form.sku} onChangeText={update('sku')} />
        <Text style={styles.fieldLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat} style={[styles.categoryChip, form.category === cat && styles.categoryChipActive]} onPress={() => update('category')(cat)}>
              <Text style={[styles.categoryChipText, form.category === cat && styles.categoryChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.row}>
          <View style={styles.half}><Input label="Price (€)" placeholder="0.00" value={form.price} onChangeText={update('price')} keyboardType="decimal-pad" /></View>
          <View style={styles.half}><Input label="Discount price (€)" placeholder="Optional" value={form.discountPrice} onChangeText={update('discountPrice')} keyboardType="decimal-pad" /></View>
        </View>
        <Input label="Stock" placeholder="0" value={form.stock} onChangeText={update('stock')} keyboardType="numeric" />
        <Input label="Tags (comma-separated)" placeholder="e.g. dog, food" value={form.tags} onChangeText={update('tags')} />
        <TouchableOpacity style={styles.checkRow} onPress={() => update('requiresPrescription')(!form.requiresPrescription)}>
          <View style={[styles.checkbox, form.requiresPrescription && styles.checkboxChecked]}>{form.requiresPrescription && <Text style={styles.checkmark}>✓</Text>}</View>
          <Text style={styles.checkLabel}>Requires prescription</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.checkRow} onPress={() => update('isActive')(!form.isActive)}>
          <View style={[styles.checkbox, form.isActive && styles.checkboxChecked]}>{form.isActive && <Text style={styles.checkmark}>✓</Text>}</View>
          <Text style={styles.checkLabel}>Active (visible in catalog)</Text>
        </TouchableOpacity>
        <Button title="Add product" onPress={() => {}} style={styles.submitBtn} />
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
  submitBtn: { marginTop: spacing.lg },
});
