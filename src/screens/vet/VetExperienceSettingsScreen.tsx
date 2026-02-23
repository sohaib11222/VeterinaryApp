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

export function VetExperienceSettingsScreen() {
  const { data: profileResponse, isLoading: profileLoading } = useVeterinarianProfile();
  const updateProfile = useUpdateVeterinarianProfile();
  const profile = profileResponse?.data;
  const initialExperiences = Array.isArray(profile?.experience) ? profile.experience : [];

  const [experiences, setExperiences] = useState([
    { hospital: '', fromYear: '', toYear: '', designation: '' },
  ]);

  useEffect(() => {
    if (initialExperiences.length > 0) {
      setExperiences(
        initialExperiences.map((e: { hospital?: string; fromYear?: string; toYear?: string; designation?: string }) => ({
          hospital: e.hospital ?? '',
          fromYear: e.fromYear ?? '',
          toYear: e.toYear ?? '',
          designation: e.designation ?? '',
        }))
      );
    }
  }, [JSON.stringify(initialExperiences)]);

  const handleChange = (index: number, field: string, value: string) => {
    setExperiences((prev) =>
      prev.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp))
    );
  };

  const addExperience = () =>
    setExperiences((prev) => [...prev, { hospital: '', fromYear: '', toYear: '', designation: '' }]);
  const removeExperience = (index: number) =>
    setExperiences((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    const cleaned = experiences
      .map((e) => ({
        hospital: (e.hospital ?? '').trim(),
        fromYear: (e.fromYear ?? '').trim(),
        toYear: (e.toYear ?? '').trim(),
        designation: (e.designation ?? '').trim(),
      }))
      .filter((e) => e.hospital || e.designation || e.fromYear || e.toYear);
    try {
      await updateProfile.mutateAsync({ experience: cleaned });
      Alert.alert('Success', 'Experience updated successfully.');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string }; message?: string }; message?: string })?.response?.data?.message ?? (err as { message?: string })?.message ?? 'Failed to update experience.';
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
        <Text style={styles.sectionTitle}>Experience</Text>
        {experiences.map((exp, index) => (
          <View key={index} style={styles.block}>
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Input
                  label="Hospital / Clinic"
                  placeholder="Name"
                  value={exp.hospital}
                  onChangeText={(v) => handleChange(index, 'hospital', v)}
                />
              </View>
              <View style={styles.flex1}>
                <Input
                  label="Designation"
                  placeholder="e.g. Senior Vet"
                  value={exp.designation}
                  onChangeText={(v) => handleChange(index, 'designation', v)}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Input
                  label="From Year"
                  placeholder="YYYY"
                  value={exp.fromYear}
                  onChangeText={(v) => handleChange(index, 'fromYear', v)}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.flex1}>
                <Input
                  label="To Year"
                  placeholder="YYYY"
                  value={exp.toYear}
                  onChangeText={(v) => handleChange(index, 'toYear', v)}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <TouchableOpacity onPress={() => removeExperience(index)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
        <Button title="+ Add Experience" onPress={addExperience} />
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
