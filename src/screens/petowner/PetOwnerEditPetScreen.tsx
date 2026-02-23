import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { PetOwnerStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const PET_SPECIES = ['DOG', 'CAT', 'BIRD', 'RABBIT', 'REPTILE', 'FISH', 'HAMSTER', 'GUINEA_PIG', 'FERRET', 'HORSE', 'OTHER'];
const PET_GENDER = ['MALE', 'FEMALE', 'NEUTERED', 'SPAYED', 'UNKNOWN'];

const MOCK_PET = { id: '1', name: 'Max', species: 'DOG', breed: 'Golden Retriever', gender: 'MALE', ageMonths: 36, weightKg: 28, microchipNumber: '' };

type Route = RouteProp<PetOwnerStackParamList, 'PetOwnerEditPet'>;

export function PetOwnerEditPetScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<any>();
  const petId = route.params?.petId;
  const [name, setName] = useState(MOCK_PET.name);
  const [species, setSpecies] = useState(MOCK_PET.species);
  const [breed, setBreed] = useState(MOCK_PET.breed);
  const [gender, setGender] = useState(MOCK_PET.gender);
  const [ageMonths, setAgeMonths] = useState(String(MOCK_PET.ageMonths));
  const [weightKg, setWeightKg] = useState(String(MOCK_PET.weightKg));
  const [microchipNumber, setMicrochipNumber] = useState(MOCK_PET.microchipNumber);

  const onSave = () => {
    if (!name.trim()) return;
    navigation.goBack();
  };

  const onDelete = () => {
    Alert.alert('Delete pet', 'Are you sure you want to delete this pet?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScreenContainer scroll padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Edit Pet</Text>
          <Input label="Name *" placeholder="Enter pet name" value={name} onChangeText={setName} />
          <Text style={styles.fieldLabel}>Species *</Text>
          <View style={styles.chipRow}>
            {PET_SPECIES.map((s) => (
              <TouchableOpacity key={s} style={[styles.chip, species === s && styles.chipActive]} onPress={() => setSpecies(s)}>
                <Text style={[styles.chipText, species === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input label="Breed" placeholder="Enter breed" value={breed} onChangeText={setBreed} />
          <Text style={styles.fieldLabel}>Gender</Text>
          <View style={styles.chipRow}>
            {PET_GENDER.map((g) => (
              <TouchableOpacity key={g} style={[styles.chip, gender === g && styles.chipActive]} onPress={() => setGender(g)}>
                <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input label="Age (months)" placeholder="e.g. 24" value={ageMonths} onChangeText={setAgeMonths} keyboardType="numeric" />
          <Input label="Weight (kg)" placeholder="Optional" value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" />
          <Input label="Microchip number" placeholder="Optional" value={microchipNumber} onChangeText={setMicrochipNumber} />
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoText}>📷 Change photo</Text>
          </View>
          <Button title="Save Changes" onPress={onSave} style={styles.saveBtn} />
          <Button title="Delete Pet" variant="outline" onPress={onDelete} style={styles.deleteBtn} textStyle={styles.deleteBtnText} />
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  fieldLabel: { ...typography.label, marginBottom: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 20, backgroundColor: colors.backgroundTertiary },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse },
  photoPlaceholder: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 12, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md },
  photoText: { ...typography.bodySmall, color: colors.textSecondary },
  saveBtn: { marginTop: spacing.xs },
  deleteBtn: { marginTop: spacing.sm, borderColor: colors.error },
  deleteBtnText: { color: colors.error },
});
