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
import { useSpecializations } from '../../queries/specializationQueries';

type SpecItem = { _id?: string; type?: string; name?: string; slug?: string };
type ServiceRow = { name: string; price: string; description: string };

export function VetSpecialitiesScreen() {
  const { data: profileResponse, isLoading: profileLoading } = useVeterinarianProfile();
  const { data: specsResponse, isLoading: specsLoading } = useSpecializations();
  const updateProfile = useUpdateVeterinarianProfile();

  const profile = profileResponse?.data;
  const profileSpecs = (profile?.specializations as SpecItem[] | string[] | undefined) ?? [];
  const profileServices = (profile?.services as Array<{ name?: string; price?: number | null; description?: string | null }> | undefined) ?? [];

  const rawList = (specsResponse?.data ?? specsResponse) as SpecItem[] | undefined;
  const specializationsList = Array.isArray(rawList) ? rawList : [];

  const [selectedCode, setSelectedCode] = useState('');
  const [services, setServices] = useState<ServiceRow[]>([{ name: '', price: '', description: '' }]);

  useEffect(() => {
    if (profileSpecs.length > 0) {
      const first = profileSpecs[0];
      const code = typeof first === 'string' ? first : (first as SpecItem)?.type ?? '';
      setSelectedCode(code);
    } else {
      setSelectedCode('');
    }
  }, [JSON.stringify(profileSpecs)]);

  useEffect(() => {
    if (profileServices.length > 0) {
      setServices(
        profileServices.map((s) => ({
          name: s.name ?? '',
          price: s.price != null ? String(s.price) : '',
          description: s.description ?? '',
        }))
      );
    } else {
      setServices([{ name: '', price: '', description: '' }]);
    }
  }, [JSON.stringify(profileServices)]);

  const handleServiceChange = (index: number, field: keyof ServiceRow, value: string) => {
    setServices((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const addService = () => setServices((prev) => [...prev, { name: '', price: '', description: '' }]);
  const removeService = (index: number) => setServices((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!selectedCode) {
      Alert.alert('Validation', 'Please select a specialization.');
      return;
    }
    const validServices = services
      .map((s) => ({
        name: (s.name ?? '').trim(),
        price: s.price === '' ? null : Number(s.price),
        description: (s.description ?? '').trim() || null,
      }))
      .filter((s) => s.name);
    if (validServices.length === 0) {
      Alert.alert('Validation', 'Please add at least one service with a name.');
      return;
    }
    try {
      await updateProfile.mutateAsync({
        specializations: [selectedCode],
        services: validServices,
      });
      Alert.alert('Success', 'Specialties & services updated successfully.');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string }; message?: string }; message?: string })?.response?.data?.message ?? (err as { message?: string })?.message ?? 'Failed to update.';
      Alert.alert('Error', message);
    }
  };

  const isLoading = profileLoading || specsLoading;
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
        <Text style={styles.sectionTitle}>Specialties & Services</Text>
        <Text style={styles.label}>Specialization</Text>
        <View style={styles.specRow}>
          {specializationsList.map((spec) => {
            const code = spec.type ?? (spec.name?.toUpperCase().replace(/\s+/g, '_')) ?? (spec.slug?.toUpperCase().replace(/-/g, '_')) ?? '';
            if (!code) return null;
            const isSelected = selectedCode === code;
            return (
              <TouchableOpacity
                key={spec._id ?? code}
                style={[styles.specChip, isSelected && styles.specChipSelected]}
                onPress={() => setSelectedCode(code)}
              >
                <Text style={styles.specChipText}>{spec.name ?? code}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {specializationsList.length === 0 && (
          <Text style={styles.muted}>No specializations available.</Text>
        )}
        <Text style={styles.subsectionTitle}>Services</Text>
        {services.map((s, index) => (
          <View key={index} style={styles.serviceRow}>
            <View style={styles.serviceInputs}>
              <Input
                placeholder="Service name"
                value={s.name}
                onChangeText={(v) => handleServiceChange(index, 'name', v)}
              />
              <Input
                placeholder="Price"
                value={s.price}
                onChangeText={(v) => handleServiceChange(index, 'price', v)}
                keyboardType="numeric"
              />
              <Input
                placeholder="Description"
                value={s.description}
                onChangeText={(v) => handleServiceChange(index, 'description', v)}
              />
            </View>
            <Button title="Remove" onPress={() => removeService(index)} />
          </View>
        ))}
        <Button title="+ Add Service" onPress={addService} />
        <Button title="Save Changes" onPress={handleSave} style={{ marginTop: spacing.md }} disabled={updateProfile.isPending} />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  subsectionTitle: { ...typography.body, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.sm },
  label: { ...typography.label, marginBottom: spacing.xs },
  specRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  specChip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.backgroundSecondary, borderRadius: 8 },
  specChipSelected: { backgroundColor: colors.primary, opacity: 0.9 },
  specChipText: { ...typography.body },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  serviceInputs: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { ...typography.caption, color: colors.textLight },
});
