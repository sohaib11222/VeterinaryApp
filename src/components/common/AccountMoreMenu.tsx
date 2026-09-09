import React from 'react';
import { AppImage } from './AppImage';
import { View, Text, StyleSheet, TouchableOpacity, Image, type ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type IconName = keyof typeof Ionicons.glyphMap;

export type AccountMoreMenuItem = {
  label: string;
  icon: IconName;
  onPress: () => void;
  description?: string;
  badge?: number;
};

export type AccountMoreMenuSection = {
  title: string;
  items: AccountMoreMenuItem[];
};

interface AccountMoreMenuProps {
  name: string;
  role: string;
  email?: string | null;
  avatar?: ImageSourcePropType | null;
  avatarFallback: string;
  accountLabel: string;
  sections: AccountMoreMenuSection[];
  logoutLabel: string;
  onLogout: () => void;
}

/**
 * Shared account hub used by every role's More tab. Keeping this component
 * role-neutral ensures that profile, menu and destructive actions behave the
 * same way across the mobile application.
 */
export function AccountMoreMenu({
  name,
  role,
  email,
  avatar,
  avatarFallback,
  accountLabel,
  sections,
  logoutLabel,
  onLogout,
}: AccountMoreMenuProps) {
  return (
    <View>
      <View style={styles.profileShell}>
        <View style={styles.profileOrbLarge} />
        <View style={styles.profileOrbSmall} />
        <View style={styles.profileTopRow}>
          <View style={styles.avatar}>
            {avatar ? (
              <AppImage source={avatar} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarLetter}>{avatarFallback.slice(0, 1).toUpperCase()}</Text>
            )}
          </View>
          <View style={styles.accountPill}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.primaryDark} />
            <Text style={styles.accountPillText}>{accountLabel}</Text>
          </View>
        </View>
        <Text style={styles.profileName} numberOfLines={1}>{name}</Text>
        <Text style={styles.profileRole} numberOfLines={1}>{role}</Text>
        {email ? <Text style={styles.profileEmail} numberOfLines={1}>{email}</Text> : null}
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Card style={styles.menuCard}>
            {section.items.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, index !== section.items.length - 1 && styles.menuItemBorder]}
                activeOpacity={0.7}
                onPress={item.onPress}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={styles.iconTile}>
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  {item.description ? <Text style={styles.menuDescription} numberOfLines={1}>{item.description}</Text> : null}
                </View>
                {item.badge && item.badge > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge > 99 ? '99+' : item.badge}</Text>
                  </View>
                ) : null}
                <Ionicons name="chevron-forward" size={19} color={colors.textLight} />
              </TouchableOpacity>
            ))}
          </Card>
        </View>
      ))}

      <TouchableOpacity
        style={styles.logoutButton}
        activeOpacity={0.76}
        onPress={onLogout}
        accessibilityRole="button"
        accessibilityLabel={logoutLabel}
      >
        <View style={styles.logoutIcon}>
          <Ionicons name="log-out-outline" size={19} color={colors.error} />
        </View>
        <Text style={styles.logoutText}>{logoutLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  profileShell: {
    overflow: 'hidden',
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    minHeight: 176,
  },
  profileOrbLarge: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -74,
    top: -92,
    backgroundColor: colors.primaryLight,
    opacity: 0.36,
  },
  profileOrbSmall: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    left: -30,
    bottom: -42,
    backgroundColor: colors.accent,
    opacity: 0.18,
  },
  profileTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.52)',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarLetter: { ...typography.h2, color: colors.textInverse, fontSize: 25 },
  accountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.successLight,
  },
  accountPillText: { ...typography.caption, color: colors.primaryDark, fontWeight: '700' },
  profileName: { ...typography.h2, color: colors.textInverse, marginTop: spacing.md },
  profileRole: { ...typography.label, color: colors.secondaryLight, marginTop: 3 },
  profileEmail: { ...typography.bodySmall, color: 'rgba(255,255,255,0.76)', marginTop: 3 },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.65,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  menuCard: { paddingVertical: 0, marginBottom: 0, overflow: 'hidden' },
  menuItem: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight + '18',
    marginRight: spacing.md,
  },
  menuContent: { flex: 1, minWidth: 0 },
  menuLabel: { ...typography.label, color: colors.text },
  menuDescription: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    backgroundColor: colors.secondaryDark,
    marginRight: spacing.sm,
  },
  badgeText: { ...typography.caption, color: colors.primaryDark, fontWeight: '800', fontSize: 10 },
  logoutButton: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error + '32',
    backgroundColor: colors.errorLight + '75',
    marginBottom: spacing.xxl,
  },
  logoutIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { ...typography.label, color: colors.error },
});
