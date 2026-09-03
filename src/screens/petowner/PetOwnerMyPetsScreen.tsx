import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { usePets } from '../../queries/petsQueries';
import { useDeletePet } from '../../mutations/petsMutations';
import { getImageUrl } from '../../config/api';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

type PetItem = {
  _id: string;
  name?: string;
  species?: string;
  breed?: string;
  gender?: string;
  age?: number;
  photo?: string;
  microchipNumber?: string;
  isActive?: boolean;
};

export function PetOwnerMyPetsScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: petsResponse, isLoading } = usePets();
  const pets = useMemo(() => {
    const raw = (petsResponse as { data?: unknown } | undefined)?.data;
    return Array.isArray(raw) ? (raw as PetItem[]) : [];
  }, [petsResponse]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return pets;
    return pets.filter((p) => {
      const name = String(p?.name || '').toLowerCase();
      const breed = String(p?.breed || '').toLowerCase();
      const speciesCode = String(p?.species || '');
      const species = t(`petOwnerPets.species.${speciesCode}`, { defaultValue: speciesCode }).toLowerCase();
      const microchip = String(p?.microchipNumber || '').toLowerCase();
      return name.includes(q) || breed.includes(q) || species.includes(q) || microchip.includes(q);
    });
  }, [pets, searchQuery, t]);

  const deletePet = useDeletePet();

  const handleDelete = (pet: PetItem) => {
    Alert.alert(
      t('petOwnerMyPets.deleteConfirm.title'),
      t('petOwnerMyPets.deleteConfirm.message', { name: pet?.name || t('common.pet') }),
      [
        { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePet.mutateAsync(pet._id);
            Alert.alert(t('common.success'), t('petOwnerMyPets.toasts.deleted'));
          } catch (err: unknown) {
            const msg = (err as { message?: string })?.message ?? t('petOwnerMyPets.errors.deleteFailed');
            Alert.alert(t('common.error'), msg);
          }
        },
      },
    ]
    );
  };

  const ageLabel = (months: number | undefined) => {
    if (months == null) return t('common.na');
    if (months >= 12) {
      const years = Math.floor(months / 12);
      return t('petOwnerMyPets.age.years', { count: years });
    }
    return t('petOwnerMyPets.age.months', { count: months });
  };

  const speciesLabel = (code?: string) => {
    if (!code) return t('common.na');
    return t(`petOwnerPets.species.${code}`, { defaultValue: code });
  };

  const genderLabel = (code?: string) => {
    if (!code) return t('common.na');
    return t(`petOwnerPets.gender.${code}`, { defaultValue: code });
  };

  const renderItem = ({ item }: { item: PetItem }) => {
    const img = getImageUrl(item.photo);
    return (
      <Card style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.statusPill}>
            <Ionicons name="heart-outline" size={13} color={colors.primary} />
            <Text style={styles.statusText}>{item.isActive === false ? t('common.na') : t('common.active', { defaultValue: 'Active' })}</Text>
          </View>
          {item.microchipNumber ? <Ionicons name="hardware-chip-outline" size={17} color={colors.textLight} /> : null}
        </View>
        <View style={styles.row}>
          <View style={styles.avatar}>
            {img ? (
              <Image source={{ uri: img }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{(item.name || t('common.pet')).charAt(0)}</Text>
            )}
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.name || t('common.na')}</Text>
            <View style={styles.detailRow}>
              <Ionicons name="paw-outline" size={14} color={colors.primary} />
              <Text style={styles.detail}>{speciesLabel(item.species)}</Text>
              <Text style={styles.detail}> · {genderLabel(item.gender)}</Text>
              <Text style={styles.detail}> · {ageLabel(item.age)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.breed}>{t('petOwnerMyPets.labels.breed')}: {item.breed || t('common.na')}</Text>
              {item.microchipNumber ? <Text style={styles.microchip}>{t('petOwnerMyPets.labels.microchip')}: {item.microchipNumber}</Text> : null}
            </View>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('PetOwnerEditPet', { petId: item._id })} accessibilityRole="button">
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.editBtnText}>{t('common.edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)} disabled={deletePet.isPending} accessibilityRole="button">
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={styles.deleteBtnText}>{t('common.delete')}</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

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
    <ScreenContainer padded>
      <View style={styles.introCard}>
        <View style={styles.introIcon}><Ionicons name="paw" size={22} color={colors.primaryDark} /></View>
        <View style={styles.introCopy}>
          <Text style={styles.introTitle}>{t('menu.myPets')}</Text>
          <Text style={styles.introText}>{t('petOwnerMyPets.empty')}</Text>
        </View>
        <View style={styles.petCount}><Text style={styles.petCountText}>{pets.length}</Text></View>
      </View>
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={19} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('petOwnerMyPets.searchPlaceholder')}
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <Button
        title={t('petOwnerMyPets.actions.addPet')}
        onPress={() => navigation.navigate('PetOwnerAddPet')}
        icon={<Ionicons name="add-circle-outline" size={19} color={colors.textInverse} />}
        style={styles.addBtn}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="paw-outline" size={34} color={colors.textLight} /><Text style={styles.emptyText}>{t('petOwnerMyPets.empty')}</Text></View>}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  introCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successLight, borderRadius: 18, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.primaryLight + '24' },
  introIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.secondaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  introCopy: { flex: 1, minWidth: 0 },
  introTitle: { ...typography.h3, color: colors.primaryDark },
  introText: { ...typography.caption, color: colors.primaryDark, opacity: 0.72, marginTop: 2 },
  petCount: { minWidth: 34, height: 34, borderRadius: 17, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.sm },
  petCountText: { ...typography.label, color: colors.textInverse },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 14, paddingHorizontal: spacing.md, marginBottom: spacing.sm, minHeight: 52, borderWidth: 1, borderColor: colors.border },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, ...typography.body, paddingVertical: spacing.sm },
  addBtn: { marginBottom: spacing.md },
  list: { paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.borderLight },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.successLight },
  statusText: { ...typography.caption, color: colors.primaryDark, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 66, height: 66, borderRadius: 18, backgroundColor: colors.primaryLight + '22', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, overflow: 'hidden' },
  avatarImage: { width: 66, height: 66, borderRadius: 18 },
  avatarText: { ...typography.h2, color: colors.primary },
  info: { flex: 1, minWidth: 0 },
  name: { ...typography.h3 },
  detailRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 3, marginTop: 4 },
  detail: { ...typography.bodySmall, color: colors.textSecondary },
  metaRow: { marginTop: 5 },
  breed: { ...typography.caption, color: colors.textSecondary },
  microchip: { ...typography.caption, color: colors.textLight, marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
  editBtn: { minHeight: 40, flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '18', borderRadius: 12, borderWidth: 1, borderColor: colors.primaryLight + '45' },
  editBtnText: { ...typography.bodySmall, color: colors.primary, fontWeight: '700' },
  deleteBtn: { minHeight: 40, flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.errorLight + '70', borderRadius: 12, borderWidth: 1, borderColor: colors.error + '25' },
  deleteBtnText: { ...typography.bodySmall, color: colors.error, fontWeight: '700' },
  empty: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
