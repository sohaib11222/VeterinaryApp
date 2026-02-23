import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const MOCK_PRODUCTS = [
  { id: '1', name: 'Premium Dog Food 5kg', price: 24.99, stock: 50, isActive: true },
  { id: '2', name: 'Flea & Tick Drops', price: 12.5, stock: 0, isActive: false },
  { id: '3', name: 'Dental Chews Pack', price: 8.99, stock: 120, isActive: true },
];

export function PharmacyProductListScreen() {
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  return (
    <ScreenContainer scroll padded>
      <View style={styles.filterRow}>
        <Input placeholder="Search products..." value="" onChangeText={() => {}} />
        <View style={styles.filterTabs}>
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => navigation.navigate('PharmacyAddProduct')}
      >
        <Text style={styles.addBtnText}>+ Add Product</Text>
      </TouchableOpacity>
      {MOCK_PRODUCTS.map((p) => (
        <Card key={p.id} style={styles.productCard}>
          <View style={styles.productRow}>
            <View style={styles.productThumb} />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{p.name}</Text>
              <Text style={styles.productMeta}>€{p.price.toFixed(2)} · Stock: {p.stock}</Text>
              <View style={[styles.badge, !p.isActive && styles.badgeInactive]}>
                <Text style={[styles.badgeText, !p.isActive && styles.badgeTextInactive]}>{p.isActive ? 'Active' : 'Inactive'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('PharmacyProductDetails', { productId: p.id })}>
              <Text style={styles.editLink}>View</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filterRow: { marginBottom: spacing.sm },
  filterTabs: { flexDirection: 'row', gap: 8, marginTop: spacing.sm },
  filterTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.backgroundSecondary },
  filterTabActive: { backgroundColor: colors.primary },
  filterTabText: { ...typography.bodySmall },
  filterTabTextActive: { color: colors.textInverse, fontWeight: '600' },
  addBtn: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 16, backgroundColor: colors.primary, borderRadius: 20, marginBottom: spacing.md },
  addBtnText: { ...typography.body, color: colors.textInverse, fontWeight: '600' },
  productCard: { marginBottom: spacing.sm },
  productRow: { flexDirection: 'row', alignItems: 'center' },
  productThumb: { width: 56, height: 56, backgroundColor: colors.backgroundTertiary, borderRadius: 8 },
  productInfo: { flex: 1, marginLeft: spacing.sm },
  productName: { ...typography.body, fontWeight: '600' },
  productMeta: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  badge: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: colors.successLight },
  badgeInactive: { backgroundColor: colors.errorLight },
  badgeText: { ...typography.caption, fontWeight: '600', color: colors.success },
  badgeTextInactive: { color: colors.error },
  editLink: { ...typography.body, color: colors.primary, fontWeight: '600' },
});
