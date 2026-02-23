import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import type { PetOwnerStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Route = RouteProp<PetOwnerStackParamList, 'PetOwnerMedicalDetails'>;

const MOCK_RECORD = {
  id: '1',
  petName: 'Max',
  date: 'Feb 10, 2024',
  recordType: 'Vaccination',
  title: 'Rabies vaccine',
  description: 'Annual booster. Batch #12345. No adverse reaction.',
  vetName: 'Dr. Sarah Mitchell',
  fileName: 'vaccine-cert.pdf',
};

const MOCK_VITALS = [
  { label: 'Weight', value: '28 kg', icon: '⚖️' },
  { label: 'Temperature', value: '38.2 °C', icon: '🌡️' },
  { label: 'Heart Rate', value: '90 Bpm', icon: '❤️' },
];

export function PetOwnerMedicalDetailsScreen() {
  const route = useRoute<Route>();
  const recordId = route.params?.recordId;
  const record = MOCK_RECORD;

  return (
    <ScreenContainer scroll padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Text style={styles.recordType}>{record.recordType}</Text>
          <Text style={styles.title}>{record.title}</Text>
          {record.description ? <Text style={styles.description}>{record.description}</Text> : null}
        </Card>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.row}><Text style={styles.label}>Pet</Text><Text style={styles.value}>{record.petName}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Date</Text><Text style={styles.value}>{record.date}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Veterinarian</Text><Text style={styles.value}>{record.vetName}</Text></View>
          {record.fileName ? <View style={styles.row}><Text style={styles.label}>Attachment</Text><Text style={styles.fileLink}>{record.fileName}</Text></View> : null}
        </Card>
        <Text style={styles.sectionTitle}>Latest vitals (as in VeterinaryFrontend)</Text>
        <View style={styles.vitalsGrid}>
          {MOCK_VITALS.map((v, i) => (
            <View key={i} style={styles.vitalCard}>
              <Text style={styles.vitalIcon}>{v.icon}</Text>
              <Text style={styles.vitalLabel}>{v.label}</Text>
              <Text style={styles.vitalValue}>{v.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.md },
  recordType: { ...typography.caption, color: colors.primary, textTransform: 'uppercase', marginBottom: 4 },
  title: { ...typography.h3 },
  description: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  sectionTitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm },
  row: { flexDirection: 'row', paddingVertical: spacing.xs },
  label: { ...typography.bodySmall, color: colors.textSecondary, width: 120 },
  value: { ...typography.body, flex: 1 },
  fileLink: { ...typography.bodySmall, color: colors.primary, flex: 1 },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  vitalCard: { width: '31%', backgroundColor: colors.backgroundCard, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.borderLight },
  vitalIcon: { fontSize: 24, marginBottom: 4 },
  vitalLabel: { ...typography.caption, color: colors.textSecondary },
  vitalValue: { ...typography.body, fontWeight: '600', marginTop: 2 },
});
