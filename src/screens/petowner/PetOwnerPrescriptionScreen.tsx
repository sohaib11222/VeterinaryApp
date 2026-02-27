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
import { useTranslation } from 'react-i18next';

type Route = RouteProp<PetOwnerStackParamList, 'PetOwnerPrescription'>;

export function PetOwnerPrescriptionScreen() {
  const { t } = useTranslation();
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
        <Text style={styles.error}>{t('petOwnerPrescription.errors.appointmentIdRequired')}</Text>
      </ScreenContainer>
    );
  }

  if (appointmentLoading) {
    return (
      <ScreenContainer padded>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!appointment) {
    return (
      <ScreenContainer padded>
        <Text style={styles.error}>{t('petOwnerPrescription.errors.appointmentNotFound')}</Text>
      </ScreenContainer>
    );
  }

  if (status !== 'COMPLETED') {
    return (
      <ScreenContainer padded>
        <Text style={styles.warning}>
          {t('petOwnerPrescription.onlyAfterCompleted')}
        </Text>
        <Button title={t('common.back')} variant="outline" onPress={() => navigation.goBack()} style={styles.btn} />
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
          <Text style={styles.loadingText}>{t('petOwnerPrescription.loadingPrescription')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!prescription || !(prescription as { _id?: string })?._id) {
    return (
      <ScreenContainer padded>
        <Card>
          <Text style={styles.title}>{t('petOwnerPrescription.title')}</Text>
          <Text style={styles.meta}>{t('petOwnerPrescription.meta.appointment', { appointmentNumber })}</Text>
          <Text style={styles.noRx}>{t('petOwnerPrescription.noPrescriptionYet')}</Text>
          <Button title={t('common.back')} variant="outline" onPress={() => navigation.goBack()} style={styles.btn} />
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
          <Text style={styles.title}>{t('petOwnerPrescription.title')}</Text>
          <Text style={styles.meta}>{t('petOwnerPrescription.meta.appointment', { appointmentNumber })}</Text>
          <Text style={styles.meta}>
            {t('petOwnerPrescription.meta.veterinarian', { name: (vet.name as string) || (vet.fullName as string) || t('common.na') })}
          </Text>
          <Text style={styles.meta}>
            {t('petOwnerPrescription.meta.pet', { name: (pet.name as string) || t('common.na') })}
            {(pet.breed as string) ? ` (${pet.breed})` : ''}
          </Text>

          <Text style={styles.sectionLabel}>{t('petOwnerPrescription.sections.diagnosis')}</Text>
          <Text style={styles.value}>{(prescription.diagnosis as string) || t('common.na')}</Text>

          <Text style={styles.sectionLabel}>{t('petOwnerPrescription.sections.allergies')}</Text>
          <Text style={styles.value}>{(prescription.allergies as string) || t('common.na')}</Text>

          <Text style={styles.sectionLabel}>{t('petOwnerPrescription.sections.clinicalNotes')}</Text>
          <Text style={styles.value}>{(prescription.clinicalNotes as string) || t('common.na')}</Text>

          <Text style={styles.sectionLabel}>{t('petOwnerPrescription.sections.medications')}</Text>
          {meds.length === 0 ? (
            <Text style={styles.value}>{t('common.na')}</Text>
          ) : (
            meds.map((m: Record<string, unknown>, idx: number) => (
              <View key={idx} style={styles.medBlock}>
                <Text style={styles.medName}>{(m.name as string) || t('common.na')}</Text>
                <Text style={styles.medDetail}>
                  {(m.strength as string) ? t('petOwnerPrescription.medFields.strength', { value: m.strength }) + '  ' : ''}
                  {(m.dosage as string) ? t('petOwnerPrescription.medFields.dosage', { value: m.dosage }) + '  ' : ''}
                  {(m.frequency as string) ? t('petOwnerPrescription.medFields.frequency', { value: m.frequency }) + '  ' : ''}
                  {(m.duration as string) ? t('petOwnerPrescription.medFields.duration', { value: m.duration }) + '  ' : ''}
                  {(m.quantity as string) ? t('petOwnerPrescription.medFields.quantity', { value: m.quantity }) + '  ' : ''}
                  {typeof m.refills === 'number' ? t('petOwnerPrescription.medFields.refills', { value: m.refills }) : ''}
                </Text>
                {(m.instructions as string) && (
                  <Text style={styles.medInstructions}>{m.instructions as string}</Text>
                )}
              </View>
            ))
          )}

          <Text style={styles.sectionLabel}>{t('petOwnerPrescription.sections.recommendedTests')}</Text>
          <Text style={styles.value}>
            {tests.length === 0 ? t('common.na') : tests.join(', ')}
          </Text>

          <Text style={styles.sectionLabel}>{t('petOwnerPrescription.sections.followUp')}</Text>
          <Text style={styles.value}>{(prescription.followUp as string) || t('common.na')}</Text>

          <Text style={styles.sectionLabel}>{t('petOwnerPrescription.sections.advice')}</Text>
          <Text style={styles.value}>{(prescription.advice as string) || t('common.na')}</Text>

          <Button title={t('common.back')} variant="outline" onPress={() => navigation.goBack()} style={styles.btn} />
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
