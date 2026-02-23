import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth, type User } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { getMeApi } from '../../queries/authQueries';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function PendingApprovalScreen() {
  const { user, logout, updateUser } = useAuth();
  const [checkingStatus, setCheckingStatus] = useState(true);

  const checkApprovalStatus = useCallback(async () => {
    try {
      const me = await getMeApi();
      const normalized = {
        id: me?.id ?? (me as { _id?: string })?._id ?? user?.id ?? '',
        name: me?.name ?? user?.name ?? '',
        email: me?.email ?? user?.email ?? '',
        phone: me?.phone ?? user?.phone,
        role: (me?.role as User['role']) ?? user?.role ?? 'PET_OWNER',
        status: (me?.status as User['status']) ?? user?.status,
      };
      if (normalized.id) updateUser(normalized);
    } catch {
      // ignore
    } finally {
      setCheckingStatus(false);
    }
  }, [updateUser, user?.id, user?.name, user?.email, user?.role, user?.status]);

  useEffect(() => {
    checkApprovalStatus();
  }, [checkApprovalStatus]);

  const handleLogout = async () => {
    await logout();
  };

  const status = (user?.status ?? '').toUpperCase();
  const isRejectedOrBlocked = status === 'REJECTED' || status === 'BLOCKED';
  const title = isRejectedOrBlocked ? 'Account Not Approved' : 'Pending Admin Approval';
  const subtitle = isRejectedOrBlocked
    ? 'Your account was rejected or blocked. Please update your documents or contact support.'
    : 'Your verification documents have been submitted successfully. Our team is reviewing them.';

  if (checkingStatus) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.checkingText}>Checking your status...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{isRejectedOrBlocked ? '⚠️' : '🕐'}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {!isRejectedOrBlocked && (
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardIcon}>✓</Text>
            <View>
              <Text style={styles.cardTitle}>Documents Submitted</Text>
              <Text style={styles.cardDesc}>Your verification documents are under review</Text>
            </View>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardIcon}>🕐</Text>
            <View>
              <Text style={styles.cardTitle}>Review in Progress</Text>
              <Text style={styles.cardDesc}>Our admin team is reviewing your documents</Text>
            </View>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardIcon}>✉️</Text>
            <View>
              <Text style={styles.cardTitle}>Notification</Text>
              <Text style={styles.cardDesc}>You will receive an email once your account is approved</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>What happens next?</Text>
        <Text style={styles.infoText}>
          {isRejectedOrBlocked
            ? 'Contact support to resolve the issue or submit updated documents if you have a way to do so.'
            : "Our admin team typically reviews verification documents within 24-48 hours. Once approved, you'll be able to access your dashboard."}
        </Text>
      </View>

      <View style={styles.actions}>
        {!isRejectedOrBlocked && (
          <Button title="Check Status Again" onPress={checkApprovalStatus} style={styles.btn} />
        )}
        <Button title="Logout" onPress={handleLogout} variant="outline" style={styles.btn} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    backgroundColor: colors.backgroundSecondary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  checkingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  icon: { fontSize: 40 },
  title: {
    ...typography.h2,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  cardIcon: { fontSize: 20, marginRight: spacing.sm },
  cardTitle: { ...typography.body, fontWeight: '600', marginBottom: 2 },
  cardDesc: { ...typography.caption, color: colors.textSecondary },
  infoBox: {
    backgroundColor: colors.primaryLight + '15',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoTitle: { ...typography.body, fontWeight: '600', marginBottom: spacing.xs },
  infoText: { ...typography.bodySmall, color: colors.textSecondary },
  actions: { gap: spacing.sm },
  btn: { marginBottom: spacing.sm },
});
