import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useCreatePetWithUpload } from '../../mutations/petsMutations';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTranslation } from 'react-i18next';

const PET_SPECIES = ['DOG', 'CAT', 'BIRD', 'RABBIT', 'REPTILE', 'FISH', 'HAMSTER', 'GUINEA_PIG', 'FERRET', 'HORSE', 'OTHER'];
const PET_GENDER = ['MALE', 'FEMALE', 'NEUTERED', 'SPAYED', 'UNKNOWN'];

export function PetOwnerAddPetScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('DOG');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState('UNKNOWN');
  const [ageMonths, setAgeMonths] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [microchipNumber, setMicrochipNumber] = useState('');

  const [photo, setPhoto] = useState<{ uri: string; name?: string; mimeType?: string } | null>(null);

  const createPet = useCreatePetWithUpload();

  const pickPhoto = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
    if (result.canceled) return;
    setPhoto(result.assets[0]);
  };

  const onSave = async () => {
    const nm = name.trim();
    if (!nm) {
      Alert.alert(t('common.validation'), t('petOwnerAddPet.validation.nameRequired'));
      return;
    }

    const age = ageMonths.trim() === '' ? null : Number(ageMonths);
    const weight = weightKg.trim() === '' ? null : Number(weightKg);

    const data: Record<string, unknown> = {
      name: nm,
      species,
      ...(breed.trim() ? { breed: breed.trim() } : {}),
      ...(gender ? { gender } : {}),
      ...(age != null && Number.isFinite(age) ? { age } : {}),
      ...(weight != null && Number.isFinite(weight) ? { weight } : {}),
      ...(microchipNumber.trim() ? { microchipNumber: microchipNumber.trim() } : {}),
    };

    try {
      await createPet.mutateAsync({
        data,
        file: photo
          ? ({
              uri: photo.uri,
              name: photo.name,
              mimeType: photo.mimeType,
            } as any)
          : null,
      });
      Alert.alert(t('common.success'), t('petOwnerAddPet.toasts.created'));
      navigation.goBack();
    } catch (err: unknown) {
      Alert.alert(t('common.error'), (err as { message?: string })?.message ?? t('petOwnerAddPet.errors.createFailed'));
    }
  };

  return (
    <ScreenContainer scroll padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>{t('petOwnerAddPet.title')}</Text>
          <Text style={styles.hint}>{t('petOwnerAddPet.hint')}</Text>
          <Input label={t('petOwnerAddPet.fields.name.label')} placeholder={t('petOwnerAddPet.fields.name.placeholder')} value={name} onChangeText={setName} />
          <Text style={styles.fieldLabel}>{t('petOwnerAddPet.fields.species.label')}</Text>
          <View style={styles.chipRow}>
            {PET_SPECIES.slice(0, 6).map((s) => (
              <TouchableOpacity key={s} style={[styles.chip, species === s && styles.chipActive]} onPress={() => setSpecies(s)}>
                <Text style={[styles.chipText, species === s && styles.chipTextActive]}>{t(`petOwnerPets.species.${s}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.chipRow}>
            {PET_SPECIES.slice(6).map((s) => (
              <TouchableOpacity key={s} style={[styles.chip, species === s && styles.chipActive]} onPress={() => setSpecies(s)}>
                <Text style={[styles.chipText, species === s && styles.chipTextActive]}>{t(`petOwnerPets.species.${s}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input label={t('petOwnerAddPet.fields.breed.label')} placeholder={t('petOwnerAddPet.fields.breed.placeholder')} value={breed} onChangeText={setBreed} />
          <Text style={styles.fieldLabel}>{t('petOwnerAddPet.fields.gender.label')}</Text>
          <View style={styles.chipRow}>
            {PET_GENDER.map((g) => (
              <TouchableOpacity key={g} style={[styles.chip, gender === g && styles.chipActive]} onPress={() => setGender(g)}>
                <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{t(`petOwnerPets.gender.${g}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input label={t('petOwnerAddPet.fields.ageMonths.label')} placeholder={t('petOwnerAddPet.fields.ageMonths.placeholder')} value={ageMonths} onChangeText={setAgeMonths} keyboardType="numeric" />
          <Input label={t('petOwnerAddPet.fields.weightKg.label')} placeholder={t('petOwnerAddPet.fields.weightKg.placeholder')} value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" />
          <Input label={t('petOwnerAddPet.fields.microchipNumber.label')} placeholder={t('petOwnerAddPet.fields.microchipNumber.placeholder')} value={microchipNumber} onChangeText={setMicrochipNumber} />
          <Text style={styles.fieldLabel}>{t('petOwnerAddPet.fields.photo.label')}</Text>
          <TouchableOpacity style={styles.photoPlaceholder} onPress={pickPhoto}>
            {photo?.uri ? (
              <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
            ) : (
              <Text style={styles.photoText}>{t('petOwnerAddPet.fields.photo.placeholder')}</Text>
            )}
          </TouchableOpacity>
          <Button title={createPet.isPending ? t('petOwnerAddPet.actions.saving') : t('petOwnerAddPet.actions.savePet')} onPress={onSave} style={styles.saveBtn} disabled={createPet.isPending} />
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
  photoPreview: { width: 160, height: 160, borderRadius: 12 },
  saveBtn: { marginTop: spacing.xs },
});
