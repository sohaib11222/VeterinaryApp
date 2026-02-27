import React, { useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import { VetStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useAppointment } from '../../queries/appointmentQueries';
import { useLatestWeightRecord } from '../../queries/medicalQueries';
import { useCompleteAppointment } from '../../mutations/appointmentMutations';
import { getErrorMessage } from '../../utils/errorUtils';

type Route = RouteProp<VetStackParamList, 'VetAddWeightRecord'>;

export function VetAddWeightRecordScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const appointmentId = route.params?.appointmentId ?? null;
  const thenVaccinations = route.params?.thenVaccinations === true;

  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [notes, setNotes] = useState('');

  const { data: appointmentResponse, isLoading } = useAppointment(appointmentId);
  const appointment = (appointmentResponse as { data?: unknown })?.data ?? appointmentResponse;
  const petRef = (appointment as Record<string, unknown>)?.petId;
  const pet = petRef as Record<string, unknown> | undefined;
  const petIdStr =
    (petRef as { _id?: string })?._id ?? (typeof petRef === 'string' ? petRef : null);

  const { data: latestWeight } = useLatestWeightRecord(petIdStr ?? null);
  const completeAppointment = useCompleteAppointment();

  const handleCompleteWithWeight = async () => {
    const num = Number(value);
    if (!Number.isFinite(num) || value.trim() === '') {
      Toast.show({ type: 'error', text1: t('vetAddWeightRecord.toasts.validWeightRequired') });
      return;
    }
    if (num <= 0) {
      Toast.show({ type: 'error', text1: t('vetAddWeightRecord.toasts.weightMustBeGreaterThanZero') });
      return;
    }
    if (!appointmentId) return;

    try {
      await completeAppointment.mutateAsync({
        appointmentId,
        data: {
          weightRecord: {
            weight: { value: num, unit },
            date: new Date().toISOString(),
            notes: notes.trim() || null,
          },
        },
      });
      Toast.show({ type: 'success', text1: t('vetAddWeightRecord.toasts.completedWithWeight') });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) });
    }
  };

  const latestWeightVal = (latestWeight as { weight?: { value?: number; unit?: string } })?.weight;

  if (isLoading || !appointmentId) {
    return (
      <ScreenContainer padded>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('vetAddWeightRecord.loading')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!appointment) {
    return (
      <ScreenContainer padded>
        <Text style={styles.error}>{t('vetAddWeightRecord.errors.appointmentNotFound')}</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll padded>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <Text style={styles.title}>{t('vetAddWeightRecord.title')}</Text>
          <Text style={styles.subtitle}>
            {t('common.pet')}: {(pet as { name?: string })?.name ?? t('common.na')}
            {(pet as { breed?: string })?.breed ? ` (${(pet as { breed: string }).breed})` : ''}
          </Text>

          {latestWeightVal != null && (
            <View style={styles.latest}>
              <Text style={styles.latestLabel}>{t('vetAddWeightRecord.lastRecorded')}</Text>
              <Text style={styles.latestValue}>
                {latestWeightVal.value}
                {latestWeightVal.unit || 'kg'}
              </Text>
            </View>
          )}

          <Text style={styles.label}>{t('vetAddWeightRecord.fields.weightValue')}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder={t('vetAddWeightRecord.placeholders.weightExample', { value: '5.2' })}
            placeholderTextColor={colors.textLight}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>{t('vetAddWeightRecord.fields.unit')}</Text>
          <View style={styles.unitRow}>
            <TouchableOpacity
              style={[styles.unitBtn, unit === 'kg' && styles.unitBtnActive]}
              onPress={() => setUnit('kg')}
            >
              <Text style={[styles.unitText, unit === 'kg' && styles.unitTextActive]}>kg</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitBtn, unit === 'lbs' && styles.unitBtnActive]}
              onPress={() => setUnit('lbs')}
            >
              <Text style={[styles.unitText, unit === 'lbs' && styles.unitTextActive]}>lbs</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>{t('vetAddWeightRecord.fields.notesOptional')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('vetAddWeightRecord.placeholders.notes')}
            placeholderTextColor={colors.textLight}
            multiline
            numberOfLines={3}
          />

          {thenVaccinations ? (
            <Button
              title={t('vetAddWeightRecord.actions.nextAddVaccinations')}
              onPress={() => {
                const num = Number(value);
                if (!Number.isFinite(num) || value.trim() === '' || num <= 0) {
                  Toast.show({ type: 'error', text1: t('vetAddWeightRecord.toasts.validWeightRequired') });
                  return;
                }
                const rootNav = navigation.getParent();
                const payload = {
                  appointmentId: appointmentId!,
                  weightRecord: {
                    value: num,
                    unit,
                    date: new Date().toISOString(),
                    notes: notes.trim() || undefined,
                  },
                };
                if (rootNav) {
                  rootNav.navigate('Main', { screen: 'VetAddVaccinations', params: payload });
                } else {
                  navigation.navigate('VetAddVaccinations', payload);
                }
              }}
              style={styles.primaryBtn}
            />
          ) : (
            <Button
              title={completeAppointment.isPending ? t('vetAddWeightRecord.actions.completing') : t('vetAddWeightRecord.actions.completeWithThisWeight')}
              onPress={handleCompleteWithWeight}
              style={styles.primaryBtn}
              disabled={completeAppointment.isPending}
            />
          )}
          <Button
            title={t('common.cancel')}
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.cancelBtn}
          />
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
  latest: { marginBottom: spacing.md, padding: spacing.sm, backgroundColor: colors.backgroundTertiary, borderRadius: 8 },
  latestLabel: { ...typography.caption, color: colors.textSecondary },
  latestValue: { ...typography.body, fontWeight: '600' },
  label: { ...typography.label, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    ...typography.body,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  unitRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  unitBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: 12, backgroundColor: colors.backgroundTertiary },
  unitBtnActive: { backgroundColor: colors.primary },
  unitText: { ...typography.label },
  unitTextActive: { color: colors.textInverse },
  primaryBtn: { marginTop: spacing.lg },
  cancelBtn: { marginTop: spacing.sm },
});
