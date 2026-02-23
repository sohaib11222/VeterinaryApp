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

type ClinicRow = {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
};

const emptyClinic = (): ClinicRow => ({
  name: '',
  address: '',
  city: '',
  state: '',
  country: '',
  phone: '',
});

export function VetClinicsSettingsScreen() {
  const { data: profileResponse, isLoading: profileLoading } = useVeterinarianProfile();
  const updateProfile = useUpdateVeterinarianProfile();
  const profile = profileResponse?.data;
  const initialClinics = Array.isArray(profile?.clinics) ? profile.clinics : [];

  const [clinics, setClinics] = useState<ClinicRow[]>([emptyClinic()]);

  useEffect(() => {
    if (initialClinics.length > 0) {
      setClinics(
        initialClinics.map((c: Record<string, unknown>) => ({
          name: (c.name as string) ?? '',
          address: (c.address as string) ?? '',
          city: (c.city as string) ?? '',
          state: (c.state as string) ?? '',
          country: (c.country as string) ?? '',
          phone: (c.phone as string) ?? '',
        }))
      );
    }
  }, [JSON.stringify(initialClinics)]);

  const handleChange = (index: number, field: keyof ClinicRow, value: string) => {
    setClinics((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const addClinic = () => setClinics((prev) => [...prev, emptyClinic()]);
  const removeClinic = (index: number) =>
    setClinics((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    const cleaned = clinics
      .map((c) => ({
        name: (c.name ?? '').trim(),
        address: (c.address ?? '').trim(),
        city: (c.city ?? '').trim(),
        state: (c.state ?? '').trim(),
        country: (c.country ?? '').trim(),
        phone: (c.phone ?? '').trim(),
      }))
      .filter((c) => c.name || c.address || c.city || c.phone);
    if (cleaned.length === 0) {
      Alert.alert('Validation', 'Add at least one clinic with name or address.');
      return;
    }
    try {
      const existingClinics = initialClinics as Array<Record<string, unknown>>;
      const merged = cleaned.map((c, idx) => {
        const existing = existingClinics[idx];
        return {
          ...c,
          lat: existing?.lat ?? null,
          lng: existing?.lng ?? null,
          images: Array.isArray(existing?.images) ? existing.images : [],
          timings: Array.isArray(existing?.timings) ? existing.timings : [],
        };
      });
      await updateProfile.mutateAsync({ clinics: merged });
      Alert.alert('Success', 'Clinics updated successfully.');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string }; message?: string }; message?: string })?.response?.data?.message ?? (err as { message?: string })?.message ?? 'Failed to update clinics.';
      Alert.alert('Error', message);
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
        <Text style={styles.sectionTitle}>Clinics</Text>
        {clinics.map((c, index) => (
          <View key={index} style={styles.block}>
            <Input
              label="Clinic Name"
              placeholder="Name"
              value={c.name}
              onChangeText={(v) => handleChange(index, 'name', v)}
            />
            <Input
              label="Address"
              placeholder="Full address"
              value={c.address}
              onChangeText={(v) => handleChange(index, 'address', v)}
            />
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Input
                  label="City"
                  placeholder="City"
                  value={c.city}
                  onChangeText={(v) => handleChange(index, 'city', v)}
                />
              </View>
              <View style={styles.flex1}>
                <Input
                  label="State"
                  placeholder="State"
                  value={c.state}
                  onChangeText={(v) => handleChange(index, 'state', v)}
                />
              </View>
              <View style={styles.flex1}>
                <Input
                  label="Country"
                  placeholder="Country"
                  value={c.country}
                  onChangeText={(v) => handleChange(index, 'country', v)}
                />
              </View>
            </View>
            <Input
              label="Phone"
              placeholder="Clinic phone"
              value={c.phone}
              onChangeText={(v) => handleChange(index, 'phone', v)}
              keyboardType="phone-pad"
            />
            <TouchableOpacity onPress={() => removeClinic(index)}>
              <Text style={styles.removeText}>Remove Clinic</Text>
            </TouchableOpacity>
          </View>
        ))}
        <Button title="+ Add Clinic" onPress={addClinic} />
        <Button title="Save Changes" onPress={handleSave} style={{ marginTop: spacing.md }} disabled={updateProfile.isPending} />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  block: { marginBottom: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex1: { flex: 1 },
  removeText: { ...typography.body, color: colors.error },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
