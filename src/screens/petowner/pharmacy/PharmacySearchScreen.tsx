import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Linking,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { PetOwnerPharmacyStackParamList } from '../../../navigation/types';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { usePetStores } from '../../../queries/petStoreQueries';
import { getImageUrl } from '../../../config/api';

type StoreKind = 'PHARMACY' | 'PARAPHARMACY';
type Nav = NativeStackNavigationProp<PetOwnerPharmacyStackParamList>;

const POPULAR_CITIES = ['City', 'Town', 'Village', 'Downtown', 'Central'];

function formatAddress(addr: { line1?: string; line2?: string; city?: string; state?: string; zip?: string; country?: string } | null | undefined): string {
  if (!addr || typeof addr !== 'object') return '';
  const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.zip, addr.country].filter(Boolean);
  return parts.join(', ');
}

export function PharmacySearchScreen() {
  const navigation = useNavigation<Nav>();
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [selectedKind, setSelectedKind] = useState<StoreKind>('PHARMACY');

  const { data: storesRes, isLoading } = usePetStores({
    kind: selectedKind,
    search: searchTerm.trim() || undefined,
    city: cityFilter.trim() || undefined,
    page: 1,
    limit: 30,
  });

  const payload = storesRes?.data ?? (storesRes as { data?: { petStores?: unknown[] } } | undefined);
  const petStores = Array.isArray(payload?.petStores) ? payload.petStores : [];

  const clearFilters = () => {
    setSearchTerm('');
    setCityFilter('');
    setSelectedKind('PHARMACY');
  };

  const handleCall = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const getSellerId = (store: Record<string, unknown>): string | undefined => {
    const owner = store.ownerId;
    if (owner && typeof owner === 'object' && owner !== null && '_id' in owner) return (owner as { _id: string })._id;
    if (typeof owner === 'string') return owner;
    return undefined;
  };

  const renderPharmacyCard = ({ item: store }: { item: Record<string, unknown> }) => {
    const id = String(store._id ?? store.id ?? '');
    const name = (store.name as string) ?? 'Pharmacy';
    const phone = (store.phone as string) ?? '';
    const addressStr = formatAddress(store.address as Parameters<typeof formatAddress>[0]);
    const logo = getImageUrl((store.logo as string) ?? undefined);
    const sellerId = getSellerId(store);
    return (
      <View style={styles.pharmacyCard}>
        {logo ? (
          <Image source={{ uri: logo }} style={styles.pharmacyImage} resizeMode="cover" />
        ) : (
          <View style={styles.pharmacyImage} />
        )}
        <View style={styles.pharmacyInfo}>
          <TouchableOpacity onPress={() => navigation.navigate('PharmacyDetails', { pharmacyId: id })}>
            <Text style={styles.pharmacyName}>{name}</Text>
          </TouchableOpacity>
          {phone ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📞</Text>
              <Text style={styles.detailText}>{phone}</Text>
            </View>
          ) : null}
          {addressStr ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📍</Text>
              <Text style={styles.detailText} numberOfLines={2}>{addressStr}</Text>
            </View>
          ) : null}
          <View style={styles.pharmacyActions}>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('ProductCatalog', { sellerId: sellerId ?? undefined, pharmacyId: id })}
            >
              <Text style={styles.browseButtonText}>Browse Products</Text>
            </TouchableOpacity>
            {phone ? (
              <TouchableOpacity style={styles.callButton} onPress={() => handleCall(phone)}>
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer padded>
      {/* Kind tabs – mydoctor-app style */}
      <View style={styles.kindTabs}>
        <TouchableOpacity
          style={[styles.kindTab, selectedKind === 'PHARMACY' && styles.kindTabActive]}
          onPress={() => setSelectedKind('PHARMACY')}
        >
          <Text style={[styles.kindTabText, selectedKind === 'PHARMACY' && styles.kindTabTextActive]}>Pharmacies</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.kindTab, selectedKind === 'PARAPHARMACY' && styles.kindTabActive]}
          onPress={() => setSelectedKind('PARAPHARMACY')}
        >
          <Text style={[styles.kindTabText, selectedKind === 'PARAPHARMACY' && styles.kindTabTextActive]}>Parapharmacies</Text>
        </TouchableOpacity>
      </View>

      {/* Search section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={selectedKind === 'PARAPHARMACY' ? 'Search parapharmacies...' : 'Search pharmacies...'}
            placeholderTextColor={colors.textLight}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        <View style={styles.filterInputContainer}>
          <Text style={styles.filterIcon}>📍</Text>
          <TextInput
            style={styles.filterInput}
            placeholder="Enter city or location..."
            placeholderTextColor={colors.textLight}
            value={cityFilter}
            onChangeText={setCityFilter}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.citiesList}>
          {POPULAR_CITIES.map((city) => (
            <TouchableOpacity
              key={city}
              style={[styles.cityChip, cityFilter === city && styles.cityChipActive]}
              onPress={() => setCityFilter(cityFilter === city ? '' : city)}
            >
              <Text style={[styles.cityChipText, cityFilter === city && styles.cityChipTextActive]}>{city}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
          <Text style={styles.clearButtonText}>Clear filters</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.resultsText}>
        Showing {petStores.length} {selectedKind === 'PARAPHARMACY' ? 'parapharmacies' : 'pharmacies'}
      </Text>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.lg }} />
      ) : petStores.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🏪</Text>
          <Text style={styles.emptyText}>No pharmacies found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
        </View>
      ) : (
        <FlatList
          data={petStores}
          renderItem={renderPharmacyCard}
          keyExtractor={(item) => String((item as Record<string, unknown>)._id ?? (item as Record<string, unknown>).id ?? '')}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  kindTabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  kindTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  kindTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  kindTabText: { fontSize: 14, fontWeight: '600', color: colors.text },
  kindTabTextActive: { color: colors.textInverse },
  searchSection: { backgroundColor: colors.background, padding: spacing.md, borderRadius: 12, marginBottom: spacing.md },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
    marginBottom: spacing.sm,
  },
  searchIcon: { fontSize: 18, marginRight: spacing.sm },
  searchInput: { flex: 1, ...typography.body, padding: 0 },
  filterInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    marginBottom: spacing.sm,
  },
  filterIcon: { marginRight: spacing.sm, fontSize: 16 },
  filterInput: { flex: 1, ...typography.body, padding: 0 },
  citiesList: { paddingVertical: spacing.xs },
  cityChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundTertiary,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cityChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  cityChipText: { fontSize: 13, color: colors.text },
  cityChipTextActive: { color: colors.textInverse, fontWeight: '600' },
  clearButton: { alignSelf: 'flex-start', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, marginTop: spacing.xs },
  clearButtonText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  resultsText: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm },
  listContent: { paddingBottom: spacing.xxl },
  pharmacyCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  pharmacyImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: colors.primaryLight + '30',
    marginRight: spacing.md,
  },
  pharmacyInfo: { flex: 1, minWidth: 0 },
  pharmacyName: { ...typography.h3, marginBottom: spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  detailIcon: { marginRight: 6, fontSize: 14 },
  detailText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
  pharmacyActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  browseButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
  browseButtonText: { fontSize: 13, fontWeight: '600', color: colors.textInverse },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
  },
  callButtonText: { fontSize: 13, fontWeight: '600', color: colors.textInverse },
  emptyContainer: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.sm },
  emptyText: { ...typography.body, fontWeight: '600', marginBottom: 4 },
  emptySubtext: { ...typography.bodySmall, color: colors.textSecondary },
});
