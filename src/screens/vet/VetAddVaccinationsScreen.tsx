import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { VetStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useAppointment } from '../../queries/appointmentQueries';
import { useVaccines } from '../../queries/medicalQueries';
import { useCompleteAppointment } from '../../mutations/appointmentMutations';
import { getErrorMessage } from '../../utils/errorUtils';

type Route = RouteProp<VetStackParamList, 'VetAddVaccinations'>;

const todayStr = () => new Date().toISOString().slice(0, 10);

interface VaccinationRow {
  vaccineId: string;
  vaccinationDate: string;
  nextDueDate: string;
  batchNumber: string;
  notes: string;
}

export function VetAddVaccinationsScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const appointmentId = route.params?.appointmentId ?? null;
  const weightRecordParam = route.params?.weightRecord;

  const [rows, setRows] = useState<VaccinationRow[]>([
    { vaccineId: '', vaccinationDate: todayStr(), nextDueDate: '', batchNumber: '', notes: '' },
  ]);

  const { data: appointmentResponse, isLoading } = useAppointment(appointmentId);
  const { data: vaccinesResponse } = useVaccines();
  const vaccines = useMemo(() => {
    const d = (vaccinesResponse as { data?: unknown[] })?.data ?? vaccinesResponse;
    return Array.isArray(d) ? d : [];
  }, [vaccinesResponse]);

  const appointment = (appointmentResponse as { data?: unknown })?.data ?? appointmentResponse;
  const pet = (appointment as Record<string, unknown>)?.petId as Record<string, unknown> | undefined;

  const completeAppointment = useCompleteAppointment();

  const updateRow = (index: number, field: keyof VaccinationRow, val: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: val } : r))
    );
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { vaccineId: '', vaccinationDate: todayStr(), nextDueDate: '', batchNumber: '', notes: '' },
    ]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    const filtered = rows
      .filter((r) => String(r.vaccineId || '').trim())
      .map((r) => ({
        vaccineId: r.vaccineId,
        vaccinationDate: r.vaccinationDate || todayStr(),
        nextDueDate: r.nextDueDate || null,
        batchNumber: r.batchNumber || null,
        notes: r.notes || null,
      }));

    if (filtered.length === 0 && !weightRecordParam) {
      Toast.show({ type: 'error', text1: 'Add at least one vaccination or go back to add weight only' });
      return;
    }

    if (!appointmentId) return;

    try {
      await completeAppointment.mutateAsync({
        appointmentId,
        data: {
          ...(filtered.length > 0 ? { vaccinations: filtered } : {}),
          ...(weightRecordParam
            ? {
                weightRecord: {
                  weight: {
                    value: weightRecordParam.value,
                    unit: weightRecordParam.unit || 'kg',
                  },
                  date: weightRecordParam.date || new Date().toISOString(),
                  notes: weightRecordParam.notes ?? null,
                },
              }
            : {}),
        },
      });
      Toast.show({ type: 'success', text1: 'Appointment completed' });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) });
    }
  };

  if (isLoading || !appointmentId) {
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

  return (
    <ScreenContainer scroll padded>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <Text style={styles.title}>Add vaccinations</Text>
          <Text style={styles.subtitle}>
            Pet: {(pet as { name?: string })?.name ?? '—'}
            {(pet as { breed?: string })?.breed ? ` (${(pet as { breed: string }).breed})` : ''}
          </Text>
          {weightRecordParam != null && (
            <View style={styles.weightNote}>
              <Text style={styles.weightNoteText}>
                Weight record will be included: {weightRecordParam.value} {weightRecordParam.unit}
              </Text>
            </View>
          )}

          {rows.map((row, idx) => (
            <View key={idx} style={styles.row}>
              <Text style={styles.rowLabel}>Vaccine *</Text>
              <View style={styles.pickerRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {vaccines.length === 0 ? (
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={row.vaccineId}
                      onChangeText={(t) => updateRow(idx, 'vaccineId', t)}
                      placeholder="Vaccine ID or name"
                      placeholderTextColor={colors.textLight}
                    />
                  ) : (
                    <View style={styles.vaccineChips}>
                      {vaccines.map((v: { _id: string; name?: string }) => (
                        <TouchableOpacity
                          key={v._id}
                          style={[
                            styles.chip,
                            row.vaccineId === v._id && styles.chipActive,
                          ]}
                          onPress={() => updateRow(idx, 'vaccineId', v._id)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              row.vaccineId === v._id && styles.chipTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {v.name || v._id}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </ScrollView>
                <TouchableOpacity
                  onPress={() => removeRow(idx)}
                  style={styles.removeBtn}
                  disabled={rows.length <= 1}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.rowLabel}>Date</Text>
              <TextInput
                style={styles.input}
                value={row.vaccinationDate}
                onChangeText={(t) => updateRow(idx, 'vaccinationDate', t)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textLight}
              />
              <Text style={styles.rowLabel}>Next due (optional)</Text>
              <TextInput
                style={styles.input}
                value={row.nextDueDate}
                onChangeText={(t) => updateRow(idx, 'nextDueDate', t)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textLight}
              />
              <Text style={styles.rowLabel}>Batch / Notes (optional)</Text>
              <TextInput
                style={styles.input}
                value={row.batchNumber}
                onChangeText={(t) => updateRow(idx, 'batchNumber', t)}
                placeholder="Batch number"
                placeholderTextColor={colors.textLight}
              />
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={row.notes}
                onChangeText={(t) => updateRow(idx, 'notes', t)}
                placeholder="Notes"
                placeholderTextColor={colors.textLight}
              />
            </View>
          ))}

          <Button title="+ Add another vaccination" variant="outline" onPress={addRow} style={styles.addBtn} />
          <Button
            title={completeAppointment.isPending ? 'Completing...' : 'Complete appointment'}
            onPress={handleComplete}
            style={styles.primaryBtn}
            disabled={completeAppointment.isPending}
          />
          <Button title="Cancel" variant="outline" onPress={() => navigation.goBack()} style={styles.cancelBtn} />
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  loading: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  loadingText: { ...typography.bodySmall, color: colors.textSecondary },
  error: { ...typography.body, color: colors.error },
  title: { ...typography.h3, marginBottom: spacing.xs },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  weightNote: { marginBottom: spacing.md, padding: spacing.sm, backgroundColor: colors.success + '20', borderRadius: 8 },
  weightNoteText: { ...typography.bodySmall, color: colors.text },
  row: { marginBottom: spacing.lg, paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  rowLabel: { ...typography.label, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.md, ...typography.body, marginBottom: spacing.xs },
  notesInput: { marginBottom: 0 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  vaccineChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, flex: 1 },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 20, backgroundColor: colors.backgroundTertiary },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...typography.label, fontSize: 12 },
  chipTextActive: { color: colors.textInverse },
  removeBtn: { paddingVertical: spacing.sm },
  removeText: { ...typography.label, color: colors.error },
  addBtn: { marginTop: spacing.sm },
  primaryBtn: { marginTop: spacing.lg },
  cancelBtn: { marginTop: spacing.sm },
});
