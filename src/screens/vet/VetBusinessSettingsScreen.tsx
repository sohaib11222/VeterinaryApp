import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useVeterinarianProfile } from '../../queries/veterinarianQueries';
import { useUpdateVeterinarianProfile } from '../../mutations/veterinarianMutations';
import { useTranslation } from 'react-i18next';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function VetBusinessSettingsScreen() {
  const { t } = useTranslation();
  const { data: profileResponse, isLoading: profileLoading } = useVeterinarianProfile();
  const updateProfile = useUpdateVeterinarianProfile();
  const profile = profileResponse?.data;
  const initialClinics = Array.isArray(profile?.clinics) ? profile.clinics : [];

  const dayLabels: Record<string, string> = {
    Monday: t('days.monday'),
    Tuesday: t('days.tuesday'),
    Wednesday: t('days.wednesday'),
    Thursday: t('days.thursday'),
    Friday: t('days.friday'),
    Saturday: t('days.saturday'),
    Sunday: t('days.sunday'),
  };

  const [hours, setHours] = useState<Record<string, { startTime: string; endTime: string }>>(
    DAYS.reduce((acc, d) => ({ ...acc, [d]: { startTime: '', endTime: '' } }), {})
  );

  useEffect(() => {
    if (initialClinics.length > 0) {
      const first = initialClinics[0] as { timings?: Array<{ dayOfWeek?: string; startTime?: string; endTime?: string }> };
      const timings = Array.isArray(first?.timings) ? first.timings : [];
      const next: Record<string, { startTime: string; endTime: string }> = {};
      timings.forEach((t) => {
        if (t.dayOfWeek) {
          next[t.dayOfWeek] = {
            startTime: t.startTime ?? '',
            endTime: t.endTime ?? '',
          };
        }
      });
      setHours((prev) => ({ ...prev, ...next }));
    }
  }, [JSON.stringify(initialClinics)]);

  const update = (day: string, field: 'startTime' | 'endTime', value: string) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...(prev[day] || { startTime: '', endTime: '' }), [field]: value },
    }));
  };

  const handleSave = async () => {
    const timings = Object.keys(hours)
      .filter((day) => hours[day].startTime && hours[day].endTime)
      .map((day) => ({
        dayOfWeek: day,
        startTime: hours[day].startTime,
        endTime: hours[day].endTime,
      }));

    let clinics = initialClinics.length > 0 ? [...initialClinics] : [{ name: 'Main Clinic', timings: [] }];
    clinics = clinics.map((clinic, idx) => {
      const c = clinic as Record<string, unknown>;
      return idx === 0 ? { ...c, timings } : c;
    });

    try {
      await updateProfile.mutateAsync({ clinics });
      Alert.alert(t('common.success'), t('vetBusinessSettings.alerts.updated'));
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string }; message?: string }; message?: string })?.response?.data?.message
        ?? (err as { message?: string })?.message
        ?? t('vetBusinessSettings.errors.updateFailed');
      Alert.alert(t('common.error'), message);
    }
  };

  if (profileLoading) {
    return (
      <ScreenContainer padded>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll padded>
      <Card>
        <Text style={styles.sectionTitle}>{t('vetBusinessSettings.title')}</Text>
        <Text style={styles.hint}>{t('vetBusinessSettings.subtitle')}</Text>
        {DAYS.map((day) => (
          <View key={day} style={styles.dayRow}>
            <Text style={styles.dayLabel}>{dayLabels[day] ?? day}</Text>
            <View style={styles.timeRow}>
              <Input
                placeholder={t('vetBusinessSettings.placeholders.startTime')}
                value={hours[day]?.startTime || ''}
                onChangeText={(v) => update(day, 'startTime', v)}
              />
              <Text style={styles.dash}>–</Text>
              <Input
                placeholder={t('vetBusinessSettings.placeholders.endTime')}
                value={hours[day]?.endTime || ''}
                onChangeText={(v) => update(day, 'endTime', v)}
              />
            </View>
          </View>
        ))}
        <Button title={t('common.saveChanges')} onPress={handleSave} style={{ marginTop: spacing.md }} disabled={updateProfile.isPending} />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  hint: { ...typography.caption, color: colors.textLight, marginBottom: spacing.md },
  dayRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  dayLabel: { ...typography.body, width: 100 },
  timeRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dash: { ...typography.body, color: colors.textLight },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
