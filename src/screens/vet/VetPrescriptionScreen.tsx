import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { VetStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useAppointment } from '../../queries/appointmentQueries';
import { usePrescriptionByAppointment, downloadPrescriptionPdf } from '../../queries/prescriptionQueries';
import { useUpsertPrescriptionForAppointment } from '../../mutations/prescriptionMutations';
import type { MedicationItem } from '../../mutations/prescriptionMutations';
import { getErrorMessage } from '../../utils/errorUtils';

type Route = RouteProp<VetStackParamList, 'VetPrescription'>;

const emptyMedication = (): MedicationItem => ({
  name: '',
  strength: '',
  form: '',
  route: '',
  dosage: '',
  frequency: '',
  duration: '',
  quantity: '',
  refills: 0,
  instructions: '',
  substitutionAllowed: true,
  isPrn: false,
});

export function VetPrescriptionScreen() {
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

  const [form, setForm] = useState({
    diagnosis: '',
    clinicalNotes: '',
    allergies: '',
    advice: '',
    followUp: '',
    testsText: '',
    medications: [emptyMedication()],
    status: 'ISSUED',
  });

  useEffect(() => {
    if (!prescription || !(prescription as { _id?: string })?._id) return;
    const p = prescription as Record<string, unknown>;
    setForm({
      diagnosis: (p.diagnosis as string) || '',
      clinicalNotes: (p.clinicalNotes as string) || '',
      allergies: (p.allergies as string) || '',
      advice: (p.advice as string) || '',
      followUp: (p.followUp as string) || '',
      testsText: Array.isArray(p.tests) ? (p.tests as string[]).join('\n') : '',
      medications:
        Array.isArray(p.medications) && (p.medications as Record<string, unknown>[]).length > 0
          ? (p.medications as Record<string, unknown>[]).map((m) => ({
              name: (m.name as string) || '',
              strength: (m.strength as string) || '',
              form: (m.form as string) || '',
              route: (m.route as string) || '',
              dosage: (m.dosage as string) || '',
              frequency: (m.frequency as string) || '',
              duration: (m.duration as string) || '',
              quantity: (m.quantity as string) || '',
              refills: typeof m.refills === 'number' ? m.refills : 0,
              instructions: (m.instructions as string) || '',
              substitutionAllowed: m.substitutionAllowed !== false,
              isPrn: m.isPrn === true,
            }))
          : [emptyMedication()],
      status: (p.status as string) || 'ISSUED',
    });
  }, [(prescription as { _id?: string })?._id]);

  const upsertRx = useUpsertPrescriptionForAppointment();

  const updateMedication = (index: number, key: keyof MedicationItem, value: string | number | boolean) => {
    setForm((prev) => {
      const meds = [...(prev.medications || [])];
      meds[index] = { ...meds[index], [key]: value };
      return { ...prev, medications: meds };
    });
  };

  const addMedication = () =>
    setForm((prev) => ({ ...prev, medications: [...(prev.medications || []), emptyMedication()] }));

  const removeMedication = (index: number) => {
    setForm((prev) => {
      const meds = [...(prev.medications || [])];
      meds.splice(index, 1);
      return { ...prev, medications: meds.length > 0 ? meds : [emptyMedication()] };
    });
  };

  const handleSave = async () => {
    if (!appointmentId) {
      Toast.show({ type: 'error', text1: 'Appointment ID is required' });
      return;
    }
    const tests = form.testsText
      ? form.testsText
          .split('\n')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    const medications = (form.medications || [])
      .map((m) => ({
        name: (m.name || '').trim(),
        strength: (m.strength || '').trim() || null,
        form: (m.form || '').trim() || null,
        route: (m.route || '').trim() || null,
        dosage: (m.dosage || '').trim() || null,
        frequency: (m.frequency || '').trim() || null,
        duration: (m.duration || '').trim() || null,
        quantity: (m.quantity || '').trim() || null,
        refills: Number.isFinite(Number(m.refills)) ? Number(m.refills) : 0,
        instructions: (m.instructions || '').trim() || null,
        substitutionAllowed: m.substitutionAllowed !== false,
        isPrn: m.isPrn === true,
      }))
      .filter((m) => m.name);

    try {
      await upsertRx.mutateAsync({
        appointmentId,
        data: {
          diagnosis: form.diagnosis || null,
          clinicalNotes: form.clinicalNotes || null,
          allergies: form.allergies || null,
          advice: form.advice || null,
          followUp: form.followUp || null,
          tests,
          medications,
          status: form.status,
        },
      });
      Toast.show({ type: 'success', text1: 'Prescription saved' });
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) });
    }
  };

  const handleDownload = async () => {
    const id = (prescription as { _id?: string })?._id;
    if (!id) {
      Toast.show({ type: 'error', text1: 'Save prescription first to download PDF' });
      return;
    }
    try {
      const blob = await downloadPrescriptionPdf(id);
      Toast.show({ type: 'info', text1: 'PDF download not supported in-app yet. Use web for PDF.' });
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) });
    }
  };

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
          <Text style={styles.loadingText}>Loading appointment...</Text>
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
          Prescription can only be created after the appointment is completed.
        </Text>
        <Button title="Back" variant="outline" onPress={() => navigation.goBack()} style={styles.btn} />
      </ScreenContainer>
    );
  }

  const vet = (appointment.veterinarianId as Record<string, unknown>) || {};
  const owner = (appointment.petOwnerId as Record<string, unknown>) || {};
  const pet = (appointment.petId as Record<string, unknown>) || {};
  const appointmentNumber =
    (appointment.appointmentNumber as string) || `#${String(appointment._id || '').slice(-6)}`;

  return (
    <ScreenContainer scroll padded>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <Text style={styles.title}>Prescription</Text>
          <Text style={styles.meta}>Appointment {appointmentNumber}</Text>
          <Text style={styles.meta}>Veterinarian: {(vet.name as string) || (vet.fullName as string) || '—'}</Text>
          <Text style={styles.meta}>Pet owner: {(owner.name as string) || (owner.fullName as string) || '—'}</Text>
          <Text style={styles.meta}>
            Pet: {(pet.name as string) || '—'}
            {(pet.breed as string) ? ` (${pet.breed})` : ''}
          </Text>

          <View style={styles.actions}>
            <Button
              title="Download PDF"
              variant="outline"
              onPress={handleDownload}
              style={styles.actionBtn}
              disabled={!(prescription as { _id?: string })?._id}
            />
            <Button
              title={upsertRx.isPending ? 'Saving...' : 'Save prescription'}
              onPress={handleSave}
              style={styles.actionBtn}
              disabled={upsertRx.isPending}
            />
          </View>

          {rxLoading && (
            <View style={styles.loading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}

          <Text style={styles.sectionLabel}>Diagnosis</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.diagnosis}
            onChangeText={(t) => setForm((p) => ({ ...p, diagnosis: t }))}
            placeholder="Diagnosis"
            placeholderTextColor={colors.textLight}
            multiline
          />
          <Text style={styles.sectionLabel}>Allergies</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.allergies}
            onChangeText={(t) => setForm((p) => ({ ...p, allergies: t }))}
            placeholder="Allergies"
            placeholderTextColor={colors.textLight}
            multiline
          />
          <Text style={styles.sectionLabel}>Clinical notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.clinicalNotes}
            onChangeText={(t) => setForm((p) => ({ ...p, clinicalNotes: t }))}
            placeholder="Clinical notes"
            placeholderTextColor={colors.textLight}
            multiline
          />

          <View style={styles.medHeader}>
            <Text style={styles.sectionLabel}>Medications</Text>
            <TouchableOpacity onPress={addMedication}>
              <Text style={styles.addMedText}>+ Add medication</Text>
            </TouchableOpacity>
          </View>
          {(form.medications || []).map((m, idx) => (
            <View key={idx} style={styles.medRow}>
              <TextInput
                style={styles.input}
                value={m.name}
                onChangeText={(t) => updateMedication(idx, 'name', t)}
                placeholder="Name *"
                placeholderTextColor={colors.textLight}
              />
              <TextInput
                style={styles.input}
                value={m.strength}
                onChangeText={(t) => updateMedication(idx, 'strength', t)}
                placeholder="Strength"
                placeholderTextColor={colors.textLight}
              />
              <TextInput
                style={styles.input}
                value={m.dosage}
                onChangeText={(t) => updateMedication(idx, 'dosage', t)}
                placeholder="Dosage"
                placeholderTextColor={colors.textLight}
              />
              <TextInput
                style={styles.input}
                value={m.frequency}
                onChangeText={(t) => updateMedication(idx, 'frequency', t)}
                placeholder="Frequency"
                placeholderTextColor={colors.textLight}
              />
              <TextInput
                style={styles.input}
                value={m.duration}
                onChangeText={(t) => updateMedication(idx, 'duration', t)}
                placeholder="Duration"
                placeholderTextColor={colors.textLight}
              />
              <TextInput
                style={styles.input}
                value={m.quantity}
                onChangeText={(t) => updateMedication(idx, 'quantity', t)}
                placeholder="Qty"
                placeholderTextColor={colors.textLight}
              />
              <TextInput
                style={styles.input}
                value={String(m.refills)}
                onChangeText={(t) => updateMedication(idx, 'refills', Number(t) || 0)}
                placeholder="Refills"
                placeholderTextColor={colors.textLight}
                keyboardType="number-pad"
              />
              <TextInput
                style={[styles.input, styles.instructions]}
                value={m.instructions}
                onChangeText={(t) => updateMedication(idx, 'instructions', t)}
                placeholder="Instructions"
                placeholderTextColor={colors.textLight}
              />
              <TouchableOpacity onPress={() => removeMedication(idx)} style={styles.removeMed}>
                <Text style={styles.removeMedText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}

          <Text style={styles.sectionLabel}>Recommended tests (one per line)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.testsText}
            onChangeText={(t) => setForm((p) => ({ ...p, testsText: t }))}
            placeholder="One per line"
            placeholderTextColor={colors.textLight}
            multiline
          />
          <Text style={styles.sectionLabel}>Follow-up</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.followUp}
            onChangeText={(t) => setForm((p) => ({ ...p, followUp: t }))}
            placeholder="Follow-up"
            placeholderTextColor={colors.textLight}
            multiline
          />
          <Text style={styles.sectionLabel}>Advice</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.advice}
            onChangeText={(t) => setForm((p) => ({ ...p, advice: t }))}
            placeholder="Advice"
            placeholderTextColor={colors.textLight}
            multiline
          />
          <Text style={styles.sectionLabel}>Status</Text>
          <View style={styles.statusRow}>
            <TouchableOpacity
              style={[styles.statusChip, form.status === 'ISSUED' && styles.statusChipActive]}
              onPress={() => setForm((p) => ({ ...p, status: 'ISSUED' }))}
            >
              <Text style={[styles.statusChipText, form.status === 'ISSUED' && styles.statusChipTextActive]}>
                ISSUED
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusChip, form.status === 'DRAFT' && styles.statusChipActive]}
              onPress={() => setForm((p) => ({ ...p, status: 'DRAFT' }))}
            >
              <Text style={[styles.statusChipText, form.status === 'DRAFT' && styles.statusChipTextActive]}>
                DRAFT
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  loading: { paddingVertical: spacing.md, alignItems: 'center' },
  loadingText: { ...typography.bodySmall, color: colors.textSecondary },
  error: { ...typography.body, color: colors.error, marginBottom: spacing.md },
  warning: { ...typography.body, color: colors.warning, marginBottom: spacing.md },
  btn: { marginTop: spacing.sm },
  title: { ...typography.h3, marginBottom: spacing.sm },
  meta: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.md },
  actionBtn: { flex: 1 },
  sectionLabel: { ...typography.label, marginTop: spacing.md, marginBottom: spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.md, ...typography.body, marginBottom: spacing.xs },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  medHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  addMedText: { ...typography.label, color: colors.primary },
  medRow: { marginTop: spacing.sm, padding: spacing.sm, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 12 },
  instructions: { marginBottom: spacing.xs },
  removeMed: { alignSelf: 'flex-start', marginTop: spacing.xs },
  removeMedText: { ...typography.label, color: colors.error },
  statusRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  statusChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 12, backgroundColor: colors.backgroundTertiary },
  statusChipActive: { backgroundColor: colors.primary },
  statusChipText: { ...typography.label },
  statusChipTextActive: { color: colors.textInverse },
});
