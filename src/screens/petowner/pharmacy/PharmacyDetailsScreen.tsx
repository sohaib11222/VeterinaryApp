import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Linking } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { PetOwnerPharmacyStackParamList } from '../../../navigation/types';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { usePetStore } from '../../../queries/petStoreQueries';
import { useProducts } from '../../../queries/productQueries';
import { getImageUrl } from '../../../config/api';

type Route = RouteProp<PetOwnerPharmacyStackParamList, 'PharmacyDetails'>;
type Nav = NativeStackNavigationProp<PetOwnerPharmacyStackParamList>;
type TabId = 'overview' | 'locations' | 'products';

function formatAddress(addr: { line1?: string; line2?: string; city?: string; state?: string; zip?: string; country?: string } | null | undefined): string {
  if (!addr || typeof addr !== 'object') return '';
  const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.zip, addr.country].filter(Boolean);
  return parts.join(', ');
}

export function PharmacyDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { pharmacyId } = route.params;
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const { data: storeRes, isLoading: storeLoading } = usePetStore(pharmacyId);
  const store = (storeRes?.data ?? (storeRes as { data?: Record<string, unknown> } | undefined)?.data) as Record<string, unknown> | undefined;
  const ownerId = store?.ownerId;
  const sellerId = ownerId && typeof ownerId === 'object' && ownerId !== null && '_id' in ownerId
    ? (ownerId as { _id: string })._id
    : (typeof ownerId === 'string' ? ownerId : undefined);

  const { data: productsRes, isLoading: productsLoading } = useProducts({
    sellerId: sellerId ?? undefined,
    limit: 6,
  });
  const productsPayload = productsRes?.data ?? (productsRes as { data?: { products?: unknown[] } } | undefined);
  const products = Array.isArray(productsPayload?.products) ? productsPayload.products : [];

  const storeName = (store?.name as string) ?? 'Pharmacy';
  const storeKind = (store?.kind as string) ?? 'Pharmacy';
  const storePhone = (store?.phone as string) ?? '';
  const storeAddress = formatAddress(store?.address as Parameters<typeof formatAddress>[0]);
  const logoUri = getImageUrl((store?.logo as string) ?? undefined);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'locations', label: 'Locations' },
    { id: 'products', label: 'Products' },
  ];

  const handleCall = () => {
    if (storePhone) Linking.openURL(`tel:${storePhone}`);
  };

  if (storeLoading || !store) {
    return (
      <ScreenContainer padded>
        {storeLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.xxl }} />
        ) : (
          <Text style={styles.errorText}>Pharmacy not found.</Text>
        )}
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll padded>
      <Card style={styles.topCard}>
        <View style={styles.storeRow}>
          <View style={styles.storeLeft}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.logo} resizeMode="cover" />
            ) : (
              <View style={styles.logo} />
            )}
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{storeName}</Text>
              <Text style={styles.storeDetail}>🏪 {storeKind}</Text>
              {storePhone ? <Text style={styles.storeDetail}>📞 {storePhone}</Text> : null}
              {storeAddress ? <Text style={styles.storeDetail} numberOfLines={2}>📍 {storeAddress}</Text> : null}
            </View>
          </View>
          <View style={styles.actions}>
            <Button
              title="Browse Products"
              onPress={() => navigation.navigate('ProductCatalog', { sellerId, pharmacyId })}
            />
            {storePhone ? (
              <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
                <Text style={styles.callBtnText}>Call Now</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Card>

      <Card style={styles.tabsCard}>
        <View style={styles.tabRow}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <Text style={styles.widgetTitle}>About Pharmacy</Text>
            <Text style={styles.aboutText}>
              {storeName} provides quality pet healthcare products and services.
              {storeAddress ? ` Located at ${storeAddress}.` : ''}
            </Text>
          </View>
        )}

        {activeTab === 'locations' && (
          <View style={styles.tabContent}>
            <Text style={styles.widgetTitle}>Location Details</Text>
            <Text style={styles.aboutText}>{storeAddress || 'No address provided.'}</Text>
          </View>
        )}

        {activeTab === 'products' && (
          <View style={styles.tabContent}>
            {productsLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
            ) : (
              <>
                <View style={styles.productsGrid}>
                  {products.map((p: Record<string, unknown>) => {
                    const id = String(p._id ?? p.id ?? '');
                    const name = (p.name as string) ?? 'Product';
                    const price = Number(p.discountPrice ?? p.price ?? 0);
                    const images = p.images as string[] | undefined;
                    const imgUri = getImageUrl(Array.isArray(images) && images[0] ? images[0] : undefined);
                    return (
                      <TouchableOpacity
                        key={id}
                        style={styles.productItem}
                        onPress={() => navigation.navigate('ProductDetails', { productId: id })}
                      >
                        {imgUri ? (
                          <Image source={{ uri: imgUri }} style={styles.productThumb} resizeMode="cover" />
                        ) : (
                          <View style={styles.productThumb} />
                        )}
                        <Text style={styles.productName} numberOfLines={2}>{name}</Text>
                        <Text style={styles.productPrice}>€{price.toFixed(2)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity
                  style={styles.viewAllBtn}
                  onPress={() => navigation.navigate('ProductCatalog', { sellerId, pharmacyId })}
                >
                  <Text style={styles.viewAllBtnText}>View All Products</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topCard: { marginBottom: spacing.md },
  storeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  storeLeft: { flexDirection: 'row', flex: 1, minWidth: 200 },
  logo: { width: 100, height: 70, backgroundColor: colors.backgroundTertiary, borderRadius: 8 },
  storeInfo: { flex: 1, marginLeft: spacing.sm },
  storeName: { ...typography.h3, marginBottom: 4 },
  storeDetail: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  actions: { gap: 8 },
  callBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.primary, borderRadius: 8 },
  callBtnText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  tabsCard: { paddingTop: 0 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary, marginBottom: -1 },
  tabText: { ...typography.body, color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: '600' },
  tabContent: { paddingTop: spacing.sm },
  widgetTitle: { ...typography.h3, marginBottom: spacing.sm },
  aboutText: { ...typography.body, color: colors.textSecondary },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  productItem: { width: '31%', marginBottom: spacing.sm },
  productThumb: { height: 64, backgroundColor: colors.backgroundTertiary, borderRadius: 8, marginBottom: 4 },
  productName: { ...typography.body, fontSize: 13 },
  productPrice: { ...typography.bodySmall, color: colors.primary, marginTop: 2 },
  viewAllBtn: { marginTop: spacing.md, paddingVertical: spacing.sm },
  viewAllBtnText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  errorText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginVertical: spacing.lg },
});
