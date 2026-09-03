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
import { Ionicons } from '@expo/vector-icons';

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
    <ScreenContainer padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="paw" size={25} color={colors.primaryDark} /></View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{t('petOwnerAddPet.title')}</Text>
            <Text style={styles.heroHint}>{t('petOwnerAddPet.hint')}</Text>
          </View>
        </View>

        <Card style={styles.card}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionIcon}><Ionicons name="information-circle-outline" size={19} color={colors.primary} /></View>
            <Text style={styles.sectionTitle}>{t('petOwnerAddPet.fields.name.label')}</Text>
          </View>
          <Input
            label={t('petOwnerAddPet.fields.name.label')}
            placeholder={t('petOwnerAddPet.fields.name.placeholder')}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            leftIcon={<Ionicons name="paw-outline" size={20} color={colors.textSecondary} />}
          />
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
          <Input
            label={t('petOwnerAddPet.fields.breed.label')}
            placeholder={t('petOwnerAddPet.fields.breed.placeholder')}
            value={breed}
            onChangeText={setBreed}
            autoCapitalize="words"
            leftIcon={<Ionicons name="pricetag-outline" size={19} color={colors.textSecondary} />}
          />
        </Card>

        <Card style={styles.card}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionIcon}><Ionicons name="pulse-outline" size={19} color={colors.primary} /></View>
            <Text style={styles.sectionTitle}>{t('petOwnerAddPet.fields.gender.label')}</Text>
          </View>
          <Text style={styles.fieldLabel}>{t('petOwnerAddPet.fields.gender.label')}</Text>
          <View style={styles.chipRow}>
            {PET_GENDER.map((g) => (
              <TouchableOpacity key={g} style={[styles.chip, gender === g && styles.chipActive]} onPress={() => setGender(g)}>
                <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{t(`petOwnerPets.gender.${g}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input
            label={t('petOwnerAddPet.fields.ageMonths.label')}
            placeholder={t('petOwnerAddPet.fields.ageMonths.placeholder')}
            value={ageMonths}
            onChangeText={setAgeMonths}
            keyboardType="numeric"
            leftIcon={<Ionicons name="calendar-outline" size={19} color={colors.textSecondary} />}
          />
          <Input
            label={t('petOwnerAddPet.fields.weightKg.label')}
            placeholder={t('petOwnerAddPet.fields.weightKg.placeholder')}
            value={weightKg}
            onChangeText={setWeightKg}
            keyboardType="decimal-pad"
            leftIcon={<Ionicons name="analytics-outline" size={19} color={colors.textSecondary} />}
          />
          <Input
            label={t('petOwnerAddPet.fields.microchipNumber.label')}
            placeholder={t('petOwnerAddPet.fields.microchipNumber.placeholder')}
            value={microchipNumber}
            onChangeText={setMicrochipNumber}
            leftIcon={<Ionicons name="hardware-chip-outline" size={19} color={colors.textSecondary} />}
          />
        </Card>

        <Card style={styles.card}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionIcon}><Ionicons name="image-outline" size={19} color={colors.primary} /></View>
            <Text style={styles.sectionTitle}>{t('petOwnerAddPet.fields.photo.label')}</Text>
          </View>
          <Text style={styles.fieldLabel}>{t('petOwnerAddPet.fields.photo.label')}</Text>
          <TouchableOpacity style={[styles.photoPlaceholder, photo?.uri && styles.photoPlaceholderSelected]} onPress={pickPhoto} activeOpacity={0.78}>
            {photo?.uri ? (
              <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
            ) : (
              <>
                <View style={styles.uploadIcon}><Ionicons name="cloud-upload-outline" size={26} color={colors.primary} /></View>
                <Text style={styles.photoText}>{t('petOwnerAddPet.fields.photo.placeholder')}</Text>
              </>
            )}
          </TouchableOpacity>
        </Card>
        <Button
          title={createPet.isPending ? t('petOwnerAddPet.actions.saving') : t('petOwnerAddPet.actions.savePet')}
          onPress={onSave}
          icon={<Ionicons name="checkmark-circle-outline" size={20} color={colors.textInverse} />}
          style={styles.saveBtn}
          disabled={createPet.isPending}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  hero: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 20, padding: spacing.md, marginBottom: spacing.md, overflow: 'hidden' },
  heroIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.secondaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  heroCopy: { flex: 1 },
  heroTitle: { ...typography.h3, color: colors.textInverse },
  heroHint: { ...typography.bodySmall, color: 'rgba(255,255,255,0.74)', marginTop: 3 },
  card: { marginBottom: spacing.md, borderWidth: 1, borderColor: colors.borderLight },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sectionIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primaryLight + '18', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  sectionTitle: { ...typography.label, color: colors.primaryDark },
  fieldLabel: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  chip: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.textInverse },
  photoPlaceholder: { minHeight: 158, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primaryLight + '80', backgroundColor: colors.primaryLight + '0D', borderRadius: 16, padding: spacing.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 0 },
  photoPlaceholderSelected: { padding: spacing.xs, borderStyle: 'solid' },
  uploadIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  photoText: { ...typography.bodySmall, color: colors.primaryDark, fontWeight: '600', textAlign: 'center' },
  photoPreview: { width: '100%', height: 180, borderRadius: 12, resizeMode: 'cover' },
  saveBtn: { marginTop: spacing.xs, marginBottom: spacing.xl },
});
