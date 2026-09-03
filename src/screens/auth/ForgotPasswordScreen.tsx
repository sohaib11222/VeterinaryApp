import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { AuthStackScreenProps } from '../../navigation/types';
import { AuthInfoRow, AuthLayout } from '../../components/common/AuthLayout';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { forgotPasswordApi } from '../../mutations/authMutations';
import { getErrorMessage } from '../../utils/errorUtils';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTranslation } from 'react-i18next';

type Nav = AuthStackScreenProps<'ForgotPassword'>['navigation'];

export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!email.trim()) {
      setError(t('auth.validation.emailRequired'));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('auth.validation.invalidEmail'));
      return false;
    }
    setError('');
    return true;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      await forgotPasswordApi(email);
      setSent(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('authForgotPassword.errors.failedToSendResetLinkTryAgain')));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        icon="email-check-outline"
        title={t('authForgotPassword.sent.title')}
        subtitle={t('authForgotPassword.sent.subtitle', { email })}
        compact
      >
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          <Text style={styles.successText}>{t('authExperience.password.resetSent')}</Text>
        </View>
        <AuthInfoRow
          icon="mail-open-outline"
          tone="success"
          title={t('authExperience.password.checkInbox')}
          description={t('authExperience.password.checkInboxDescription')}
          last
        />
        <Button
          title={t('authForgotPassword.actions.backToLogin')}
          onPress={() => navigation.navigate('Login')}
          style={styles.backBtn}
          icon={<Ionicons name="arrow-back" size={19} color={colors.textInverse} />}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon="lock-reset"
      title={t('authForgotPassword.title')}
      subtitle={t('authForgotPassword.subtitle')}
      compact
    >
      <View style={styles.formHeading}>
        <Text style={styles.formTitle}>{t('authExperience.password.recovery')}</Text>
        <Text style={styles.formCopy}>{t('authExperience.password.recoveryDescription')}</Text>
      </View>
      <Input
        label={t('authForgotPassword.fields.email.label')}
        placeholder={t('authForgotPassword.fields.email.placeholder')}
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          if (error) setError('');
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        error={error}
        leftIcon={<Ionicons name="mail-outline" size={20} color={colors.primary} />}
      />
      <Button
        title={loading ? t('authForgotPassword.actions.sending') : t('authForgotPassword.actions.submit')}
        onPress={onSubmit}
        loading={loading}
        style={styles.submitBtn}
        icon={<Ionicons name="send-outline" size={19} color={colors.textInverse} />}
      />
      <Button
        title={t('common.back')}
        onPress={() => navigation.navigate('Login')}
        variant="ghost"
        icon={<Ionicons name="arrow-back" size={18} color={colors.primary} />}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  formHeading: { marginBottom: spacing.lg },
  formTitle: { ...typography.h3, color: colors.primaryDark, marginBottom: 4 },
  formCopy: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 19 },
  submitBtn: { marginTop: spacing.sm, marginBottom: spacing.sm },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.successLight + '80', borderRadius: borderRadius.md, marginBottom: spacing.sm },
  successText: { ...typography.bodySmall, color: colors.success, fontWeight: '700' },
  backBtn: { marginTop: spacing.lg },
});
