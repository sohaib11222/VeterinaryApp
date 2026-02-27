import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import type { PetOwnerStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { usePet } from '../../queries/petsQueries';
import { useDeletePet, useUpdatePetWithUpload } from '../../mutations/petsMutations';
import { getImageUrl } from '../../config/api';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTranslation } from 'react-i18next';

const PET_SPECIES = ['DOG', 'CAT', 'BIRD', 'RABBIT', 'REPTILE', 'FISH', 'HAMSTER', 'GUINEA_PIG', 'FERRET', 'HORSE', 'OTHER'];
const PET_GENDER = ['MALE', 'FEMALE', 'NEUTERED', 'SPAYED', 'UNKNOWN'];

type Route = RouteProp<PetOwnerStackParamList, 'PetOwnerEditPet'>;

export function PetOwnerEditPetScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<any>();
  const petId = route.params?.petId;
  const { t } = useTranslation();

  const { data: petResponse, isLoading } = usePet(petId);
  const pet = useMemo(() => {
    const raw = (petResponse as { data?: unknown } | undefined)?.data;
    return raw && typeof raw === 'object' ? (raw as any) : null;
  }, [petResponse]);

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('DOG');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState('UNKNOWN');
  const [ageMonths, setAgeMonths] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [microchipNumber, setMicrochipNumber] = useState('');
  const [photo, setPhoto] = useState<{ uri: string; name?: string; mimeType?: string } | null>(null);

  const updatePet = useUpdatePetWithUpload();
  const deletePet = useDeletePet();

  useEffect(() => {
    if (!pet) return;
    setName(String(pet?.name ?? ''));
    setSpecies(String(pet?.species ?? 'DOG'));
    setBreed(String(pet?.breed ?? ''));
    setGender(String(pet?.gender ?? 'UNKNOWN'));
    setAgeMonths(pet?.age == null ? '' : String(pet.age));
    const w = (pet?.weight && typeof pet.weight === 'object') ? (pet.weight as { value?: unknown }).value : pet?.weight;
    setWeightKg(w == null ? '' : String(w));
    setMicrochipNumber(String(pet?.microchipNumber ?? ''));
  }, [pet]);

  const pickPhoto = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true });
    if (result.canceled) return;
    setPhoto(result.assets[0]);
  };

  const onSave = async () => {
    const nm = name.trim();
    if (!petId) return;
    if (!nm) {
      Alert.alert(t('common.validation'), t('petOwnerEditPet.validation.nameRequired'));
      return;
    }

    const age = ageMonths.trim() === '' ? null : Number(ageMonths);
    const weight = weightKg.trim() === '' ? null : Number(weightKg);

    const data: Record<string, unknown> = {
      name: nm,
      species,
      ...(breed.trim() ? { breed: breed.trim() } : { breed: null }),
      ...(gender ? { gender } : {}),
      ...(age != null && Number.isFinite(age) ? { age } : { age: null }),
      ...(weight != null && Number.isFinite(weight) ? { weight } : {}),
      ...(microchipNumber.trim() ? { microchipNumber: microchipNumber.trim() } : {}),
    };

    try {
      await updatePet.mutateAsync({
        petId,
        data,
        file: photo
          ? ({ uri: photo.uri, name: photo.name, mimeType: photo.mimeType } as any)
          : null,
      });
      Alert.alert(t('common.success'), t('petOwnerEditPet.toasts.updated'));
      navigation.goBack();
    } catch (err: unknown) {
      Alert.alert(t('common.error'), (err as { message?: string })?.message ?? t('petOwnerEditPet.errors.updateFailed'));
    }
  };

  const onDelete = () => {
    if (!petId) return;
    Alert.alert(t('petOwnerEditPet.deleteConfirm.title'), t('petOwnerEditPet.deleteConfirm.message'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePet.mutateAsync(petId);
            Alert.alert(t('common.success'), t('petOwnerEditPet.toasts.deleted'));
            navigation.goBack();
          } catch (err: unknown) {
            Alert.alert(t('common.error'), (err as { message?: string })?.message ?? t('petOwnerEditPet.errors.deleteFailed'));
          }
        },
      },
    ]);
  };

  if (isLoading && !pet) {
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>{t('petOwnerEditPet.title')}</Text>
          <Input label={t('petOwnerAddPet.fields.name.label')} placeholder={t('petOwnerAddPet.fields.name.placeholder')} value={name} onChangeText={setName} />
          <Text style={styles.fieldLabel}>{t('petOwnerAddPet.fields.species.label')}</Text>
          <View style={styles.chipRow}>
            {PET_SPECIES.map((s) => (
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
            ) : pet?.photo ? (
              <Image source={{ uri: getImageUrl(String(pet.photo)) ?? String(pet.photo) }} style={styles.photoPreview} />
            ) : (
              <Text style={styles.photoText}>{t('petOwnerEditPet.photo.changePhoto')}</Text>
            )}
          </TouchableOpacity>
          <Button title={updatePet.isPending ? t('petOwnerEditPet.actions.saving') : t('common.saveChanges')} onPress={onSave} style={styles.saveBtn} disabled={updatePet.isPending} />
          <Button title={t('petOwnerEditPet.actions.deletePet')} variant="outline" onPress={onDelete} style={styles.deleteBtn} textStyle={styles.deleteBtnText} disabled={deletePet.isPending} />
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
  photoPreview: { width: 160, height: 160, borderRadius: 12 },
  saveBtn: { marginTop: spacing.xs },
  deleteBtn: { marginTop: spacing.sm, borderColor: colors.error },
  deleteBtnText: { color: colors.error },
  loading: { paddingVertical: spacing.xxl, alignItems: 'center' },
});
