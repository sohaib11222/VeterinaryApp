import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
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

export function VetAwardsSettingsScreen() {
  const { t } = useTranslation();
  const { data: profileResponse, isLoading: profileLoading } = useVeterinarianProfile();
  const updateProfile = useUpdateVeterinarianProfile();
  const profile = profileResponse?.data;
  const initialAwards = Array.isArray(profile?.awards) ? profile.awards : [];

  const [awards, setAwards] = useState([{ title: '', year: '' }]);

  useEffect(() => {
    if (initialAwards.length > 0) {
      setAwards(
        initialAwards.map((a: { title?: string; year?: string }) => ({
          title: a.title ?? '',
          year: a.year ?? '',
        }))
      );
    }
  }, [JSON.stringify(initialAwards)]);

  const handleChange = (index: number, field: string, value: string) => {
    setAwards((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  };

  const addAward = () => setAwards((prev) => [...prev, { title: '', year: '' }]);
  const removeAward = (index: number) =>
    setAwards((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    const cleaned = awards
      .map((a) => ({
        title: (a.title ?? '').trim(),
        year: (a.year ?? '').trim(),
      }))
      .filter((a) => a.title || a.year);
    try {
      await updateProfile.mutateAsync({ awards: cleaned });
      Alert.alert(t('common.success'), t('vetAwardsSettings.alerts.updated'));
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string }; message?: string }; message?: string })?.response?.data?.message
        ?? (err as { message?: string })?.message
        ?? t('vetAwardsSettings.errors.updateFailed');
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
        <Text style={styles.sectionTitle}>{t('vetAwardsSettings.title')}</Text>
        {awards.map((a, index) => (
          <View key={index} style={styles.block}>
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Input
                  label={t('vetAwardsSettings.fields.awardTitle')}
                  placeholder={t('vetAwardsSettings.placeholders.awardTitleExample', { value: 'Best Vet 2020' })}
                  value={a.title}
                  onChangeText={(v) => handleChange(index, 'title', v)}
                />
              </View>
              <View style={styles.flexSmall}>
                <Input
                  label={t('vetAwardsSettings.fields.year')}
                  placeholder={t('vetAwardsSettings.placeholders.year')}
                  value={a.year}
                  onChangeText={(v) => handleChange(index, 'year', v)}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <TouchableOpacity onPress={() => removeAward(index)}>
              <Text style={styles.removeText}>{t('common.remove')}</Text>
            </TouchableOpacity>
          </View>
        ))}
        <Button title={t('vetAwardsSettings.actions.addAward')} onPress={addAward} />
        <Button title={t('common.saveChanges')} onPress={handleSave} style={{ marginTop: spacing.md }} disabled={updateProfile.isPending} />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  block: { marginBottom: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex1: { flex: 1 },
  flexSmall: { width: 100 },
  removeText: { ...typography.body, color: colors.error },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
