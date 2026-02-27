import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTranslation } from 'react-i18next';

export function PharmacyMoreScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const isParapharmacy = user?.role === 'PARAPHARMACY';
  const { t } = useTranslation();

  const menuItems = [
    { label: t('menu.profile'), icon: '👤', screen: 'PharmacyProfile' as const },
    { label: t('menu.subscription'), icon: '📋', screen: 'PharmacySubscription' as const },
    { label: t('menu.payouts'), icon: '💰', screen: 'PharmacyPayouts' as const },
    { label: t('menu.notifications'), icon: '🔔', screen: 'PharmacyNotifications' as const },
    { label: t('menu.language'), icon: '🌐', screen: 'Language' as const },
    { label: t('menu.changePassword'), icon: '🔒', screen: 'PharmacyChangePassword' as const },
  ];

  return (
    <ScreenContainer scroll padded>
      <Card style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'P'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'Pharmacy'}</Text>
        <Text style={styles.userRole}>{isParapharmacy ? t('more.pharmacy.parapharmacy') : t('more.pharmacy.pharmacy')}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </Card>
      <Card>
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={item.screen}
            style={[styles.menuRow, i < menuItems.length - 1 && styles.menuRowBorder]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </Card>
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>{t('common.logout')}</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  profileCard: { alignItems: 'center', marginBottom: spacing.md },
  avatarWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryLight + '40', alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...typography.h1, color: colors.primary, fontSize: 28 },
  userName: { ...typography.h3, marginTop: spacing.sm },
  userRole: { ...typography.bodySmall, color: colors.primary, fontWeight: '600', marginTop: 2 },
  userEmail: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  menuIcon: { fontSize: 22, marginRight: spacing.md, width: 28, textAlign: 'center' },
  menuLabel: { ...typography.body, flex: 1 },
  chevron: { ...typography.h3, color: colors.textLight },
  logoutBtn: { marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.errorLight, borderRadius: 12, alignItems: 'center' },
  logoutText: { ...typography.body, color: colors.error, fontWeight: '600' },
});
