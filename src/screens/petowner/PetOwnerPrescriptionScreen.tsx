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
import { Ionicons } from '@expo/vector-icons';

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
        <View style={styles.stateCard}><Ionicons name="alert-circle-outline" size={32} color={colors.error} /><Text style={styles.error}>{t('petOwnerPrescription.errors.appointmentIdRequired')}</Text></View>
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
        <View style={styles.stateCard}><Ionicons name="alert-circle-outline" size={32} color={colors.error} /><Text style={styles.error}>{t('petOwnerPrescription.errors.appointmentNotFound')}</Text></View>
      </ScreenContainer>
    );
  }

  if (status !== 'COMPLETED') {
    return (
      <ScreenContainer padded>
        <View style={styles.stateCard}>
          <Ionicons name="time-outline" size={32} color={colors.secondaryDark} />
          <Text style={styles.warning}>
          {t('petOwnerPrescription.onlyAfterCompleted')}
          </Text>
          <Button title={t('common.back')} variant="outline" onPress={() => navigation.goBack()} style={styles.btn} />
        </View>
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
        <Card style={styles.card}>
          <View style={styles.titleRow}><View style={styles.titleIcon}><Ionicons name="medical-outline" size={21} color={colors.primary} /></View><Text style={styles.title}>{t('petOwnerPrescription.title')}</Text></View>
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
    <ScreenContainer padded>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.prescriptionHero}>
          <View style={styles.heroIcon}><Ionicons name="medical" size={25} color={colors.primaryDark} /></View>
          <View style={styles.heroCopy}><Text style={styles.heroTitle}>{t('petOwnerPrescription.title')}</Text><Text style={styles.heroRef}>{t('petOwnerPrescription.meta.appointment', { appointmentNumber })}</Text></View>
        </View>
        <Card style={styles.card}>
          <View style={styles.patientMetaRow}><Ionicons name="person-outline" size={16} color={colors.primary} /><Text style={styles.meta}>
            {t('petOwnerPrescription.meta.veterinarian', { name: (vet.name as string) || (vet.fullName as string) || t('common.na') })}
          </Text></View>
          <View style={styles.patientMetaRow}><Ionicons name="paw-outline" size={16} color={colors.primary} /><Text style={styles.meta}>
            {t('petOwnerPrescription.meta.pet', { name: (pet.name as string) || t('common.na') })}
            {(pet.breed as string) ? ` (${pet.breed})` : ''}
          </Text></View>

          <View style={styles.sectionBlock}><Text style={styles.sectionLabel}>{t('petOwnerPrescription.sections.diagnosis')}</Text><Text style={styles.value}>{(prescription.diagnosis as string) || t('common.na')}</Text></View>

          <View style={styles.sectionBlock}><Text style={styles.sectionLabel}>{t('petOwnerPrescription.sections.allergies')}</Text><Text style={styles.value}>{(prescription.allergies as string) || t('common.na')}</Text></View>

          <View style={styles.sectionBlock}><Text style={styles.sectionLabel}>{t('petOwnerPrescription.sections.clinicalNotes')}</Text><Text style={styles.value}>{(prescription.clinicalNotes as string) || t('common.na')}</Text></View>

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

          <View style={styles.sectionBlock}><Text style={styles.sectionLabel}>{t('petOwnerPrescription.sections.recommendedTests')}</Text><Text style={styles.value}>
            {tests.length === 0 ? t('common.na') : tests.join(', ')}
          </Text></View>

          <View style={styles.sectionBlock}><Text style={styles.sectionLabel}>{t('petOwnerPrescription.sections.followUp')}</Text><Text style={styles.value}>{(prescription.followUp as string) || t('common.na')}</Text></View>

          <View style={styles.sectionBlock}><Text style={styles.sectionLabel}>{t('petOwnerPrescription.sections.advice')}</Text><Text style={styles.value}>{(prescription.advice as string) || t('common.na')}</Text></View>

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
  stateCard: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
  error: { ...typography.body, color: colors.error, textAlign: 'center' },
  warning: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  btn: { marginTop: spacing.lg },
  card: { borderWidth: 1, borderColor: colors.borderLight },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  titleIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primaryLight + '18', alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h3, color: colors.primaryDark },
  prescriptionHero: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successLight, borderRadius: 18, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.primaryLight + '28' },
  heroIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.secondaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  heroCopy: { flex: 1 },
  heroTitle: { ...typography.h3, color: colors.primaryDark },
  heroRef: { ...typography.caption, color: colors.primaryDark, opacity: 0.72, marginTop: 3 },
  patientMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  meta: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
  noRx: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  sectionBlock: { marginTop: spacing.md, padding: spacing.md, borderRadius: 14, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight },
  sectionLabel: { ...typography.label, color: colors.primaryDark, marginTop: spacing.md, marginBottom: spacing.xs },
  value: { ...typography.bodySmall, color: colors.text, lineHeight: 21 },
  medBlock: { marginTop: spacing.sm, padding: spacing.md, backgroundColor: colors.primaryLight + '10', borderWidth: 1, borderColor: colors.primaryLight + '22', borderRadius: 14 },
  medName: { ...typography.body, fontWeight: '600' },
  medDetail: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  medInstructions: { ...typography.bodySmall, marginTop: 2, fontStyle: 'italic' },
});
