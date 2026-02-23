import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { useVetHeaderSearch } from '../../contexts/VetHeaderSearchContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const MENU_SECTIONS: { title: string; items: { label: string; icon: string; screen: string }[] }[] = [
  {
    title: 'My Pets & Health',
    items: [
      { label: 'My Pets', icon: '🐾', screen: 'PetOwnerMyPets' },
      { label: 'Pet Medical Records', icon: '📋', screen: 'PetOwnerMedicalRecords' },
      { label: 'Pet Vitals', icon: '❤️', screen: 'PetOwnerMedicalDetails' },
      { label: 'Weight Records', icon: '⚖️', screen: 'PetOwnerWeightRecords' },
    ],
  },
  {
    title: 'Appointments & Favourites',
    items: [
      { label: 'Favorite Veterinarians', icon: '⭐', screen: 'PetOwnerFavourites' },
      { label: 'Request Reschedule', icon: '📅', screen: 'PetOwnerRequestReschedule' },
      { label: 'Reschedule Requests', icon: '🔄', screen: 'PetOwnerRescheduleRequests' },
    ],
  },
  {
    title: 'Finance & Orders',
    items: [
      { label: 'Wallet', icon: '💳', screen: 'PetOwnerWallet' },
      { label: 'Veterinary Invoices', icon: '📄', screen: 'PetOwnerInvoices' },
      { label: 'Pet Supply Orders', icon: '🛒', screen: 'PetOwnerOrderHistory' },
      { label: 'Pet Documents', icon: '📥', screen: 'PetOwnerDocuments' },
    ],
  },
  {
    title: 'Settings & More',
    items: [
      { label: 'Nearby Clinics', icon: '📍', screen: 'PetOwnerClinicMap' },
      { label: 'Notifications', icon: '🔔', screen: 'PetOwnerNotifications' },
      { label: 'Account Settings', icon: '👤', screen: 'PetOwnerProfileSettings' },
      { label: 'Change Password', icon: '🔒', screen: 'PetOwnerChangePassword' },
    ],
  },
];

export function PetOwnerMoreScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const stackNav = navigation.getParent();
  const headerSearch = useVetHeaderSearch();
  useFocusEffect(React.useCallback(() => {
    headerSearch?.setConfig(null);
    return () => {};
  }, []));

  const onMenuPress = (screen: string) => {
    stackNav?.navigate(screen as never);
  };

  return (
    <ScreenContainer scroll padded>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'P'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'Pet Owner'}</Text>
              <Text style={styles.profileRole}>Pet Owner</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>
        </Card>

        {MENU_SECTIONS.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card>
              {section.items.map((item, ii) => (
                <TouchableOpacity
                  key={ii}
                  style={[styles.menuRow, ii < section.items.length - 1 && styles.menuRowBorder]}
                  activeOpacity={0.7}
                  onPress={() => onMenuPress(item.screen)}
                >
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.xxl },
  profileCard: { marginBottom: spacing.lg },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryLight + '40', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarText: { ...typography.h1, color: colors.primary, fontSize: 24 },
  profileInfo: { flex: 1 },
  profileName: { ...typography.h3 },
  profileRole: { ...typography.bodySmall, color: colors.primary, fontWeight: '600', marginTop: 2 },
  profileEmail: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm, marginLeft: spacing.xs },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  menuIcon: { fontSize: 20, marginRight: spacing.md, width: 28, textAlign: 'center' },
  menuLabel: { ...typography.body, flex: 1 },
  chevron: { ...typography.h3, color: colors.textLight },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, backgroundColor: colors.errorLight, borderRadius: 12, marginTop: spacing.sm },
  logoutIcon: { fontSize: 18, marginRight: spacing.sm },
  logoutText: { ...typography.label, color: colors.error },
  bottomSpacer: { height: spacing.xl },
});
