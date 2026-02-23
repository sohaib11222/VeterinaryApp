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

export function VetEducationSettingsScreen() {
  const { data: profileResponse, isLoading: profileLoading } = useVeterinarianProfile();
  const updateProfile = useUpdateVeterinarianProfile();
  const profile = profileResponse?.data;
  const initialEducation = Array.isArray(profile?.education) ? profile.education : [];

  const [educations, setEducations] = useState([{ degree: '', college: '', year: '' }]);

  useEffect(() => {
    if (initialEducation.length > 0) {
      setEducations(
        initialEducation.map((e: { degree?: string; college?: string; year?: string }) => ({
          degree: e.degree ?? '',
          college: e.college ?? '',
          year: e.year ?? '',
        }))
      );
    }
  }, [JSON.stringify(initialEducation)]);

  const handleChange = (index: number, field: string, value: string) => {
    setEducations((prev) =>
      prev.map((edu, i) => (i === index ? { ...edu, [field]: value } : edu))
    );
  };

  const addEducation = () =>
    setEducations((prev) => [...prev, { degree: '', college: '', year: '' }]);
  const removeEducation = (index: number) =>
    setEducations((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    const cleaned = educations
      .map((e) => ({
        degree: (e.degree ?? '').trim(),
        college: (e.college ?? '').trim(),
        year: (e.year ?? '').trim(),
      }))
      .filter((e) => e.degree || e.college || e.year);
    try {
      await updateProfile.mutateAsync({ education: cleaned });
      Alert.alert('Success', 'Education updated successfully.');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string }; message?: string }; message?: string })?.response?.data?.message ?? (err as { message?: string })?.message ?? 'Failed to update education.';
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
        <Text style={styles.sectionTitle}>Education</Text>
        {educations.map((edu, index) => (
          <View key={index} style={styles.block}>
            <View style={styles.row}>
              <View style={styles.flex1}>
                <Input
                  label="Degree"
                  placeholder="e.g. DVM"
                  value={edu.degree}
                  onChangeText={(v) => handleChange(index, 'degree', v)}
                />
              </View>
              <View style={styles.flex1}>
                <Input
                  label="College / University"
                  placeholder="Name"
                  value={edu.college}
                  onChangeText={(v) => handleChange(index, 'college', v)}
                />
              </View>
              <View style={styles.flexSmall}>
                <Input
                  label="Year"
                  placeholder="YYYY"
                  value={edu.year}
                  onChangeText={(v) => handleChange(index, 'year', v)}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <TouchableOpacity onPress={() => removeEducation(index)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}
        <Button title="+ Add Education" onPress={addEducation} />
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
  flexSmall: { width: 100 },
  removeText: { ...typography.body, color: colors.error },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
