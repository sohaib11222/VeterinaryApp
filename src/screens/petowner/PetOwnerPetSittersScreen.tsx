import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { AppImage } from '../../components/common/AppImage';
import { Card } from '../../components/common/Card';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ResponsiveFilterChips } from '../../components/common/ResponsiveFilterChips';
import { getImageUrl } from '../../config/api';
import { usePetSitters } from '../../queries/petSitterQueries';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const PET_TYPES = ['', 'DOG', 'CAT', 'BIRD', 'RABBIT', 'SMALL_PETS', 'REPTILE', 'FISH', 'OTHER'];
const readable = (value: string, fallback: string) => value ? value.toLowerCase().split('_').map((word) => `${word[0]}${word.slice(1)}`).join(' ') : fallback;
const unwrap = (response: any) => response?.data?.petSitters ?? response?.petSitters ?? response?.data?.data?.petSitters ?? [];

export function PetOwnerPetSittersScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [petType, setPetType] = useState('');
  const query = usePetSitters({ search: search.trim() || undefined, petType: petType || undefined });
  const sitters = useMemo(() => Array.isArray(unwrap(query.data)) ? unwrap(query.data) : [], [query.data]);

  return <ScreenContainer padded scroll={false}>
    <View style={styles.hero}><View style={styles.heroIcon}><Ionicons name="heart-outline" size={23} color={colors.primaryDark} /></View><View style={styles.heroCopy}><Text style={styles.heroTitle}>{t('petSitter.directory.title')}</Text><Text style={styles.heroSubtitle}>{t('petSitter.directory.subtitle')}</Text></View></View>
    <View style={styles.search}><Ionicons name="search-outline" size={19} color={colors.textSecondary} /><TextInput style={styles.searchInput} value={search} onChangeText={setSearch} placeholder={t('petSitter.directory.search')} placeholderTextColor={colors.textLight} /></View>
    <ResponsiveFilterChips width={112} height={40} bottomSpacing={spacing.xs} value={petType} onChange={setPetType} accessibilityLabel={t('petSitter.directory.title')} options={PET_TYPES.map((item) => ({ value: item, label: readable(item, t('petSitter.directory.allPets')) }))} />
    {query.isLoading ? <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View> : <FlatList
      data={sitters}
      keyExtractor={(item: any) => String(item.id ?? item._id)}
      contentContainerStyle={styles.list}
      refreshing={query.isFetching}
      onRefresh={() => query.refetch()}
      ListEmptyComponent={<View style={styles.empty}><Ionicons name="paw-outline" size={34} color={colors.primary} /><Text style={styles.emptyTitle}>{t('petSitter.directory.noSitters')}</Text><Text style={styles.emptyCopy}>{t('petSitter.directory.noSittersText')}</Text></View>}
      renderItem={({ item }: { item: any }) => {
        const profile = item.profile ?? item.petSitterProfile ?? {};
        const name = item.name ?? item.fullName ?? t('petSitter.more.role');
        const id = String(item.id ?? item._id ?? '');
        const city = [item.address?.city, item.address?.state ?? item.address?.country].filter(Boolean).join(', ') || t('petSitter.directory.location');
        const types = Array.isArray(profile.petTypes) ? profile.petTypes.slice(0, 3).map((item: string) => readable(item, t('petSitter.directory.allPets'))).join(' · ') : t('petSitter.directory.petCare');
        return <TouchableOpacity onPress={() => navigation.navigate('PetOwnerPetSitterProfile', { petSitterId: id })} activeOpacity={0.8}><Card style={styles.card}><View style={styles.cardRow}><View style={styles.avatar}>{item.profileImage ? <AppImage source={{ uri: getImageUrl(item.profileImage) ?? item.profileImage }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{name.charAt(0)}</Text>}</View><View style={styles.info}><Text style={styles.name}>{name}</Text><Text style={styles.location} numberOfLines={1}><Ionicons name="location-outline" size={13} color={colors.textSecondary} /> {city}</Text><Text style={styles.detail}>{t('petSitter.directory.experience', { count: Number(profile.experienceYears ?? 0) })} · {types}</Text></View><Ionicons name="chevron-forward" size={20} color={colors.textLight} /></View></Card></TouchableOpacity>;
      }}
    />}
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: spacing.md, backgroundColor: colors.primaryDark, marginBottom: spacing.md }, heroIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successLight, marginRight: spacing.sm }, heroCopy: { flex: 1 }, heroTitle: { ...typography.h3, color: colors.textInverse }, heroSubtitle: { ...typography.caption, color: 'rgba(255,255,255,.78)', marginTop: 3 }, search: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.md }, searchInput: { flex: 1, ...typography.body, paddingVertical: 0 }, filters: { gap: spacing.xs, paddingVertical: spacing.sm }, filter: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: colors.backgroundTertiary, borderWidth: 1, borderColor: colors.border }, filterActive: { backgroundColor: colors.primary, borderColor: colors.primary }, filterText: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' }, filterTextActive: { color: colors.textInverse }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, list: { paddingBottom: spacing.xxl }, card: { marginBottom: spacing.sm }, cardRow: { flexDirection: 'row', alignItems: 'center' }, avatar: { width: 54, height: 54, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: colors.primaryLight + '33', marginRight: spacing.sm }, avatarImage: { width: '100%', height: '100%' }, avatarText: { ...typography.h3, color: colors.primary }, info: { flex: 1, minWidth: 0 }, name: { ...typography.label, color: colors.primaryDark }, location: { ...typography.caption, color: colors.textSecondary, marginTop: 3 }, detail: { ...typography.caption, color: colors.primary, fontWeight: '700', marginTop: 4 }, empty: { alignItems: 'center', padding: spacing.xl, marginTop: spacing.lg }, emptyTitle: { ...typography.h3, marginTop: spacing.sm }, emptyCopy: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 19 },
});
