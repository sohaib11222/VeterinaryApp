import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const MOCK_CLINICS = [
  { id: '1', name: 'PetCare Central', address: '123 Main St', distance: '0.5 km' },
  { id: '2', name: 'Animal Health Clinic', address: '456 Oak Ave', distance: '1.2 km' },
];

export function PetOwnerClinicMapScreen() {
  return (
    <ScreenContainer padded>
      <Text style={styles.hint}>Map view – integration with maps API later</Text>
      {MOCK_CLINICS.map((c) => (
        <Card key={c.id}>
          <Text style={styles.name}>{c.name}</Text>
          <Text style={styles.address}>{c.address}</Text>
          <Text style={styles.distance}>{c.distance}</Text>
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hint: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  name: { ...typography.h3 },
  address: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  distance: { ...typography.caption, marginTop: 4 },
});
