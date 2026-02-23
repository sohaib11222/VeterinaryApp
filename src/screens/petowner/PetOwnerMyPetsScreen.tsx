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

const SPECIES_LABELS: Record<string, string> = { DOG: 'Dog', CAT: 'Cat', BIRD: 'Bird', RABBIT: 'Rabbit', OTHER: 'Other' };

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
  const stackNav = navigation.getParent();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: petsResponse, isLoading } = usePets();
  const pets = useMemo(() => {
    const raw = (petsResponse as { data?: PetItem[] })?.data ?? (petsResponse as PetItem[]);
    return Array.isArray(raw) ? raw : [];
  }, [petsResponse]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return pets;
    return pets.filter((p) => {
      const name = String(p?.name || '').toLowerCase();
      const breed = String(p?.breed || '').toLowerCase();
      const species = String(SPECIES_LABELS[p?.species || ''] || p?.species || '').toLowerCase();
      const microchip = String(p?.microchipNumber || '').toLowerCase();
      return name.includes(q) || breed.includes(q) || species.includes(q) || microchip.includes(q);
    });
  }, [pets, searchQuery]);

  const deletePet = useDeletePet();

  const handleDelete = (pet: PetItem) => {
    Alert.alert('Delete pet', `Delete "${pet?.name || 'this pet'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePet.mutateAsync(pet._id);
            Alert.alert('Success', 'Pet deleted');
          } catch (err: unknown) {
            const msg = (err as { message?: string })?.message ?? 'Failed to delete pet';
            Alert.alert('Error', msg);
          }
        },
      },
    ]);
  };

  const ageLabel = (months: number | undefined) => {
    if (months == null) return '—';
    return months >= 12 ? `${Math.floor(months / 12)} years` : `${months} months`;
  };

  const renderItem = ({ item }: { item: PetItem }) => {
    const img = getImageUrl(item.photo);
    return (
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.avatar}>
            {img ? (
              <Image source={{ uri: img }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{(item.name || 'P').charAt(0)}</Text>
            )}
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.name || '—'}</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detail}>{SPECIES_LABELS[item.species || ''] || item.species || '—'}</Text>
              <Text style={styles.detail}> · {item.gender || '—'}</Text>
              <Text style={styles.detail}> · {ageLabel(item.age)}</Text>
            </View>
            <Text style={styles.breed}>Breed: {item.breed || '—'}</Text>
            {item.microchipNumber ? <Text style={styles.microchip}>Microchip: {item.microchipNumber}</Text> : null}
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => stackNav?.navigate('PetOwnerEditPet', { petId: item._id })}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)} disabled={deletePet.isPending}>
            <Text style={styles.deleteBtnText}>Delete</Text>
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
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search pets"
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <Button title="Add Pet" onPress={() => stackNav?.navigate('PetOwnerAddPet')} style={styles.addBtn} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No pets found</Text></View>}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundTertiary, borderRadius: 12, paddingHorizontal: spacing.sm, marginBottom: spacing.sm, minHeight: 44 },
  searchIcon: { marginRight: spacing.sm, fontSize: 16 },
  searchInput: { flex: 1, ...typography.body, paddingVertical: spacing.sm },
  addBtn: { marginBottom: spacing.md },
  list: { paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 56, height: 56, borderRadius: 14, backgroundColor: colors.primaryLight + '40', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, overflow: 'hidden' },
  avatarImage: { width: 56, height: 56, borderRadius: 14 },
  avatarText: { ...typography.h2, color: colors.primary },
  info: { flex: 1, minWidth: 0 },
  name: { ...typography.h3 },
  detailRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
  detail: { ...typography.bodySmall, color: colors.textSecondary },
  breed: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  microchip: { ...typography.caption, color: colors.textLight, marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  editBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: colors.primary, borderRadius: 20 },
  editBtnText: { ...typography.bodySmall, color: colors.textInverse, fontWeight: '600' },
  deleteBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: colors.errorLight, borderRadius: 20 },
  deleteBtnText: { ...typography.bodySmall, color: colors.error, fontWeight: '600' },
  empty: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
