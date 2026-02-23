import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { PetOwnerStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useAppointment } from '../../queries/appointmentQueries';
import { usePrescriptionByAppointment } from '../../queries/prescriptionQueries';

type Route = RouteProp<PetOwnerStackParamList, 'PetOwnerPrescription'>;

export function PetOwnerPrescriptionScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const appointmentId = route.params?.appointmentId ?? null;

  const { data: appointmentRes, isLoading: appointmentLoading } = useAppointment(appointmentId);
  const appointment = useMemo(
    () => (appointmentRes as { data?: unknown })?.data ?? appointmentRes,
    [appointmentRes]
  ) as Record<string, unknown> | null;

  const status = String((appointment?.status as string) || '').toUpperCase();
  const { data: rxRes, isLoading: rxLoading } = usePrescriptionByAppointment(appointmentId, {
    enabled: !!appointmentId && status === 'COMPLETED',
  });

  const prescription = useMemo(
    () => (rxRes as { data?: unknown })?.data ?? rxRes,
    [rxRes]
  ) as Record<string, unknown> | null;

  if (!appointmentId) {
    return (
      <ScreenContainer padded>
        <Text style={styles.error}>Appointment ID is required.</Text>
      </ScreenContainer>
    );
  }

  if (appointmentLoading) {
    return (
      <ScreenContainer padded>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!appointment) {
    return (
      <ScreenContainer padded>
        <Text style={styles.error}>Appointment not found.</Text>
      </ScreenContainer>
    );
  }

  if (status !== 'COMPLETED') {
    return (
      <ScreenContainer padded>
        <Text style={styles.warning}>
          Prescription is available only after the appointment is completed.
        </Text>
        <Button title="Back" variant="outline" onPress={() => navigation.goBack()} style={styles.btn} />
      </ScreenContainer>
    );
  }

  const vet = (appointment.veterinarianId as Record<string, unknown>) || {};
  const pet = (appointment.petId as Record<string, unknown>) || {};
  const appointmentNumber =
    (appointment.appointmentNumber as string) || `#${String(appointment._id || '').slice(-6)}`;

  if (rxLoading) {
    return (
      <ScreenContainer padded>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading prescription...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!prescription || !(prescription as { _id?: string })?._id) {
    return (
      <ScreenContainer padded>
        <Card>
          <Text style={styles.title}>Prescription</Text>
          <Text style={styles.meta}>Appointment {appointmentNumber}</Text>
          <Text style={styles.noRx}>No prescription has been issued for this appointment yet.</Text>
          <Button title="Back" variant="outline" onPress={() => navigation.goBack()} style={styles.btn} />
        </Card>
      </ScreenContainer>
    );
  }

  const meds = (prescription.medications as Record<string, unknown>[]) || [];
  const tests = (prescription.tests as string[]) || [];

  return (
    <ScreenContainer scroll padded>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <Text style={styles.title}>Prescription</Text>
          <Text style={styles.meta}>Appointment {appointmentNumber}</Text>
          <Text style={styles.meta}>Veterinarian: {(vet.name as string) || (vet.fullName as string) || '—'}</Text>
          <Text style={styles.meta}>
            Pet: {(pet.name as string) || '—'}
            {(pet.breed as string) ? ` (${pet.breed})` : ''}
          </Text>

          <Text style={styles.sectionLabel}>Diagnosis</Text>
          <Text style={styles.value}>{(prescription.diagnosis as string) || '—'}</Text>

          <Text style={styles.sectionLabel}>Allergies</Text>
          <Text style={styles.value}>{(prescription.allergies as string) || '—'}</Text>

          <Text style={styles.sectionLabel}>Clinical notes</Text>
          <Text style={styles.value}>{(prescription.clinicalNotes as string) || '—'}</Text>

          <Text style={styles.sectionLabel}>Medications</Text>
          {meds.length === 0 ? (
            <Text style={styles.value}>—</Text>
          ) : (
            meds.map((m: Record<string, unknown>, idx: number) => (
              <View key={idx} style={styles.medBlock}>
                <Text style={styles.medName}>{(m.name as string) || '—'}</Text>
                <Text style={styles.medDetail}>
                  {(m.strength as string) && `Strength: ${m.strength}  `}
                  {(m.dosage as string) && `Dosage: ${m.dosage}  `}
                  {(m.frequency as string) && `Frequency: ${m.frequency}  `}
                  {(m.duration as string) && `Duration: ${m.duration}  `}
                  {(m.quantity as string) && `Qty: ${m.quantity}  `}
                  {typeof m.refills === 'number' && `Refills: ${m.refills}`}
                </Text>
                {(m.instructions as string) && (
                  <Text style={styles.medInstructions}>{m.instructions as string}</Text>
                )}
              </View>
            ))
          )}

          <Text style={styles.sectionLabel}>Recommended tests</Text>
          <Text style={styles.value}>
            {tests.length === 0 ? '—' : tests.join(', ')}
          </Text>

          <Text style={styles.sectionLabel}>Follow-up</Text>
          <Text style={styles.value}>{(prescription.followUp as string) || '—'}</Text>

          <Text style={styles.sectionLabel}>Advice</Text>
          <Text style={styles.value}>{(prescription.advice as string) || '—'}</Text>

          <Button title="Back" variant="outline" onPress={() => navigation.goBack()} style={styles.btn} />
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  loading: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  loadingText: { ...typography.bodySmall, color: colors.textSecondary },
  error: { ...typography.body, color: colors.error, marginBottom: spacing.md },
  warning: { ...typography.body, color: colors.warning, marginBottom: spacing.md },
  btn: { marginTop: spacing.lg },
  title: { ...typography.h3, marginBottom: spacing.sm },
  meta: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: 2 },
  noRx: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  sectionLabel: { ...typography.label, marginTop: spacing.md, marginBottom: spacing.xs },
  value: { ...typography.body, marginBottom: spacing.xs },
  medBlock: { marginTop: spacing.sm, padding: spacing.sm, backgroundColor: colors.backgroundTertiary, borderRadius: 12 },
  medName: { ...typography.body, fontWeight: '600' },
  medDetail: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  medInstructions: { ...typography.bodySmall, marginTop: 2, fontStyle: 'italic' },
});
