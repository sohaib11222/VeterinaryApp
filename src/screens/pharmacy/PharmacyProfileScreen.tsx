import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function PharmacyProfileScreen() {
  const [form, setForm] = useState({
    name: 'PetCare Pharmacy',
    phone: '+1 234 567 890',
    line1: '123 Main St',
    line2: '',
    city: 'City',
    state: 'State',
    country: 'Country',
    zip: '12345',
    isActive: true,
  });

  const update = (key: string) => (value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <ScreenContainer scroll padded>
      <Card>
        <Text style={styles.sectionTitle}>Store Profile</Text>
        <View style={styles.logoRow}>
          <View style={styles.logoPlaceholder} />
          <View><Text style={styles.uploadText}>Upload logo</Text></View>
        </View>
        <Input label="Store Name" value={form.name} onChangeText={update('name')} />
        <Input label="Phone" value={form.phone} onChangeText={update('phone')} keyboardType="phone-pad" />
        <Text style={styles.subsectionTitle}>Address</Text>
        <Input label="Address Line 1" value={form.line1} onChangeText={update('line1')} />
        <Input label="Address Line 2" value={form.line2} onChangeText={update('line2')} />
        <View style={styles.row}>
          <View style={styles.half}><Input label="City" value={form.city} onChangeText={update('city')} /></View>
          <View style={styles.half}><Input label="State" value={form.state} onChangeText={update('state')} /></View>
        </View>
        <View style={styles.row}>
          <View style={styles.half}><Input label="Country" value={form.country} onChangeText={update('country')} /></View>
          <View style={styles.half}><Input label="ZIP" value={form.zip} onChangeText={update('zip')} keyboardType="numeric" /></View>
        </View>
        <Button title="Save Changes" onPress={() => {}} />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  logoPlaceholder: { width: 80, height: 80, borderRadius: 8, backgroundColor: colors.backgroundTertiary },
  uploadText: { ...typography.bodySmall, color: colors.primary, marginLeft: spacing.sm },
  subsectionTitle: { ...typography.body, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
});
