import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const PET_SPECIES = ['DOG', 'CAT', 'BIRD', 'RABBIT', 'REPTILE', 'FISH', 'HAMSTER', 'GUINEA_PIG', 'FERRET', 'HORSE', 'OTHER'];
const PET_GENDER = ['MALE', 'FEMALE', 'NEUTERED', 'SPAYED', 'UNKNOWN'];

export function PetOwnerAddPetScreen() {
  const navigation = useNavigation<any>();
  const stackNav = navigation.getParent();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('DOG');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState('UNKNOWN');
  const [ageMonths, setAgeMonths] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [microchipNumber, setMicrochipNumber] = useState('');

  const onSave = () => {
    if (!name.trim()) return;
    stackNav?.goBack();
  };

  return (
    <ScreenContainer scroll padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Add Pet</Text>
          <Text style={styles.hint}>All fields as in VeterinaryFrontend. Name and species required.</Text>
          <Input label="Name *" placeholder="Enter pet name" value={name} onChangeText={setName} />
          <Text style={styles.fieldLabel}>Species *</Text>
          <View style={styles.chipRow}>
            {PET_SPECIES.slice(0, 6).map((s) => (
              <TouchableOpacity key={s} style={[styles.chip, species === s && styles.chipActive]} onPress={() => setSpecies(s)}>
                <Text style={[styles.chipText, species === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.chipRow}>
            {PET_SPECIES.slice(6).map((s) => (
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
            <Text style={styles.photoText}>📷 Add photo (optional)</Text>
          </View>
          <Button title="Save Pet" onPress={onSave} style={styles.saveBtn} />
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, marginBottom: 4 },
  hint: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.md },
  fieldLabel: { ...typography.label, marginBottom: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 20, backgroundColor: colors.backgroundTertiary },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse },
  photoPlaceholder: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 12, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md },
  photoText: { ...typography.bodySmall, color: colors.textSecondary },
  saveBtn: { marginTop: spacing.xs },
});
