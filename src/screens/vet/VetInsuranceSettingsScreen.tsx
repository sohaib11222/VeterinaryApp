import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useVeterinarianProfile } from '../../queries/veterinarianQueries';
import { useUpdateVeterinarianProfile } from '../../mutations/veterinarianMutations';
import { useInsuranceCompanies } from '../../queries/insuranceQueries';

type InsuranceItem = { _id: string; name?: string };

function getInsuranceId(item: InsuranceItem | string): string {
  return typeof item === 'string' ? item : (item?._id ?? '');
}

export function VetInsuranceSettingsScreen() {
  const { data: profileResponse, isLoading: profileLoading } = useVeterinarianProfile();
  const { data: insuranceResponse, isLoading: insuranceLoading } = useInsuranceCompanies();
  const updateProfile = useUpdateVeterinarianProfile();

  const profile = profileResponse?.data;
  const profileInsurance = (profile?.insuranceCompanies as (InsuranceItem | string)[] | undefined) ?? [];
  const initialIds = profileInsurance.map(getInsuranceId).filter(Boolean);

  const list = (insuranceResponse?.data ?? insuranceResponse) as InsuranceItem[] | undefined;
  const insuranceList = Array.isArray(list) ? list : [];

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialIds));

  useEffect(() => {
    if (initialIds.length > 0) {
      setSelectedIds(new Set(initialIds));
    }
  }, [JSON.stringify(initialIds)]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    const ids = Array.from(selectedIds).filter(Boolean);
    try {
      await updateProfile.mutateAsync({ insuranceCompanies: ids });
      Alert.alert('Success', 'Insurance companies updated successfully.');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string }; message?: string }; message?: string })?.response?.data?.message ?? (err as { message?: string })?.message ?? 'Failed to update insurance.';
      Alert.alert('Error', message);
    }
  };

  const isLoading = profileLoading || insuranceLoading;
  if (isLoading) {
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
        <Text style={styles.sectionTitle}>Insurances</Text>
        <Text style={styles.hint}>Select the insurance companies you accept</Text>
        {insuranceList.length === 0 ? (
          <Text style={styles.muted}>No insurance companies available.</Text>
        ) : (
          insuranceList.map((ins) => {
            const id = ins._id;
            const isSelected = selectedIds.has(id);
            return (
              <TouchableOpacity
                key={id}
                style={[styles.row, isSelected && styles.rowSelected]}
                onPress={() => toggle(id)}
                activeOpacity={0.7}
              >
                <Text style={styles.checkbox}>{isSelected ? '✓' : '○'}</Text>
                <Text style={styles.label}>{ins.name ?? id}</Text>
              </TouchableOpacity>
            );
          })
        )}
        <Button title="Save Changes" onPress={handleSave} style={{ marginTop: spacing.md }} disabled={updateProfile.isPending} />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  hint: { ...typography.caption, color: colors.textLight, marginBottom: spacing.md },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, marginBottom: spacing.xs, borderRadius: 8 },
  rowSelected: { backgroundColor: colors.backgroundSecondary },
  checkbox: { marginRight: spacing.sm, fontSize: 18 },
  label: { ...typography.body, flex: 1 },
  muted: { ...typography.caption, color: colors.textLight },
});
