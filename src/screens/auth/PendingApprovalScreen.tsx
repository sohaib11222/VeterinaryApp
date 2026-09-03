import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthInfoRow, AuthLayout } from '../../components/common/AuthLayout';
import { useAuth, type User } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { getMeApi } from '../../queries/authQueries';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTranslation } from 'react-i18next';

export function PendingApprovalScreen() {
  const { t } = useTranslation();
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
      // A temporary connection problem should not block the existing pending state.
    } finally {
      setCheckingStatus(false);
    }
  }, [updateUser, user?.id, user?.name, user?.email, user?.role, user?.status]);

  useEffect(() => {
    checkApprovalStatus();
  }, [checkApprovalStatus]);

  const status = (user?.status ?? '').toUpperCase();
  const isRejectedOrBlocked = status === 'REJECTED' || status === 'BLOCKED';
  const title = isRejectedOrBlocked ? t('authPendingApproval.rejected.title') : t('authPendingApproval.pending.title');
  const subtitle = isRejectedOrBlocked ? t('authPendingApproval.rejected.subtitle') : t('authPendingApproval.pending.subtitle');

  if (checkingStatus) {
    return (
      <AuthLayout icon="clock-check-outline" title={t('authPendingApproval.loading.checkingStatus')} subtitle={t('authExperience.pending.checkingDescription')} compact>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('authPendingApproval.loading.checkingStatus')}</Text>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={isRejectedOrBlocked ? 'alert-octagon-outline' : 'clock-check-outline'}
      title={title}
      subtitle={subtitle}
      compact
    >
      {!isRejectedOrBlocked ? (
        <View style={styles.stepsCard}>
          <Text style={styles.stepsHeading}>{t('authExperience.pending.progress')}</Text>
          <AuthInfoRow icon="checkmark-circle-outline" tone="success" title={t('authPendingApproval.steps.documentsSubmitted.title')} description={t('authPendingApproval.steps.documentsSubmitted.desc')} />
          <AuthInfoRow icon="time-outline" tone="warning" title={t('authPendingApproval.steps.reviewInProgress.title')} description={t('authPendingApproval.steps.reviewInProgress.desc')} />
          <AuthInfoRow icon="notifications-outline" title={t('authPendingApproval.steps.notification.title')} description={t('authPendingApproval.steps.notification.desc')} last />
        </View>
      ) : null}

      <View style={[styles.infoBox, isRejectedOrBlocked && styles.infoBoxWarning]}>
        <Ionicons name={isRejectedOrBlocked ? 'information-circle-outline' : 'sparkles-outline'} size={20} color={isRejectedOrBlocked ? colors.error : colors.primary} />
        <View style={styles.infoCopy}>
          <Text style={styles.infoTitle}>{t('authPendingApproval.whatNext.title')}</Text>
          <Text style={styles.infoText}>{isRejectedOrBlocked ? t('authPendingApproval.whatNext.rejected') : t('authPendingApproval.whatNext.pending')}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {!isRejectedOrBlocked ? (
          <Button title={t('authPendingApproval.actions.checkStatusAgain')} onPress={checkApprovalStatus} icon={<Ionicons name="refresh-outline" size={20} color={colors.textInverse} />} />
        ) : null}
        <Button title={t('common.logout')} onPress={logout} variant="outline" icon={<Ionicons name="log-out-outline" size={20} color={colors.primary} />} />
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  loadingCard: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.md },
  loadingText: { ...typography.bodySmall, color: colors.textSecondary },
  stepsCard: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  stepsHeading: { ...typography.label, color: colors.primaryDark, paddingTop: spacing.md, marginBottom: spacing.xs },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.primaryLight + '12', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.lg },
  infoBoxWarning: { backgroundColor: colors.errorLight + '70' },
  infoCopy: { flex: 1, marginLeft: spacing.sm },
  infoTitle: { ...typography.label, color: colors.primaryDark, marginBottom: 3 },
  infoText: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 19 },
  actions: { gap: spacing.sm },
});
