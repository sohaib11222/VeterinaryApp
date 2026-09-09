import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { AuthStackScreenProps } from '../../navigation/types';
import { AuthInfoRow, AuthLayout } from '../../components/common/AuthLayout';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { forgotPasswordApi, resetPasswordApi, verifyResetCodeApi } from '../../mutations/authMutations';
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
  const [step, setStep] = useState<'request' | 'verify' | 'reset' | 'complete'>('request');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const requestCode = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      await forgotPasswordApi(email);
      setStep('verify');
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('authForgotPassword.errors.failedToSendResetLinkTryAgain')));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit verification code sent to your email.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyResetCodeApi(email.trim(), code.trim());
      setStep('reset');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'The verification code is invalid or has expired.'));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (newPassword.length < 8) {
      setError('Your new password must have at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPasswordApi(email.trim(), code.trim(), newPassword);
      setStep('complete');
    } catch (err: unknown) {
      setError(getErrorMessage(err, t('authForgotPassword.errors.failedToSendResetLinkTryAgain')));
    } finally {
      setLoading(false);
    }
  };

  if (step === 'complete') {
    return (
      <AuthLayout
        icon="email-check-outline"
        title={t('authForgotPassword.sent.title')}
        subtitle="Your password has been reset. You can now sign in with your new password."
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
      title={step === 'request' ? t('authForgotPassword.title') : step === 'verify' ? 'Verify reset code' : 'Set a new password'}
      subtitle={step === 'request' ? t('authForgotPassword.subtitle') : step === 'verify' ? `Enter the 6-digit code sent to ${email}.` : 'Choose a strong password for your account.'}
      compact
    >
      {step === 'request' ? <>
        <View style={styles.formHeading}>
          <Text style={styles.formTitle}>{t('authExperience.password.recovery')}</Text>
          <Text style={styles.formCopy}>{t('authExperience.password.recoveryDescription')}</Text>
        </View>
        <Input
          label={t('authForgotPassword.fields.email.label')}
          placeholder={t('authForgotPassword.fields.email.placeholder')}
          value={email}
          onChangeText={(value) => { setEmail(value); if (error) setError(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
          error={error}
          leftIcon={<Ionicons name="mail-outline" size={20} color={colors.primary} />}
        />
        <Button title={loading ? t('authForgotPassword.actions.sending') : 'Send verification code'} onPress={requestCode} loading={loading} style={styles.submitBtn} icon={<Ionicons name="send-outline" size={19} color={colors.textInverse} />} />
      </> : step === 'verify' ? <>
        <View style={styles.formHeading}>
          <Text style={styles.formTitle}>Check your inbox</Text>
          <Text style={styles.formCopy}>The code is valid for 10 minutes. Verify it before choosing a new password.</Text>
        </View>
        <Input label="Verification code" placeholder="000000" value={code} onChangeText={(value) => { setCode(value.replace(/\D/g, '').slice(0, 6)); if (error) setError(''); }} keyboardType="number-pad" maxLength={6} error={error} leftIcon={<Ionicons name="keypad-outline" size={20} color={colors.primary} />} />
        <Button title={loading ? 'Verifying…' : 'Verify code'} onPress={verifyCode} loading={loading} style={styles.submitBtn} icon={<Ionicons name="checkmark-circle-outline" size={19} color={colors.textInverse} />} />
        <TouchableOpacity style={styles.resendLink} onPress={requestCode} disabled={loading}><Text style={styles.resendText}>Send a new code</Text></TouchableOpacity>
      </> : <>
        <Input label="New password" placeholder="At least 8 characters" value={newPassword} onChangeText={(value) => { setNewPassword(value); if (error) setError(''); }} secureTextEntry autoCapitalize="none" error={error} leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.primary} />} />
        <Input label="Confirm new password" placeholder="Enter the same password again" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" leftIcon={<Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />} />
        <Button title={loading ? 'Saving…' : 'Reset password'} onPress={resetPassword} loading={loading} style={styles.submitBtn} icon={<Ionicons name="lock-open-outline" size={19} color={colors.textInverse} />} />
      </>}
      <Button
        title={t('common.back')}
        onPress={() => step === 'request' ? navigation.navigate('Login') : setStep(step === 'reset' ? 'verify' : 'request')}
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
  resendLink: { alignSelf: 'center', paddingVertical: spacing.sm },
  resendText: { ...typography.bodySmall, color: colors.primary, fontWeight: '800' },
});
