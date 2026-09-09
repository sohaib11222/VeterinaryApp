import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../contexts/AuthContext';
import {
  changePasswordWithCodeApi,
  requestChangePasswordCodeApi,
  verifyChangePasswordCodeApi,
} from '../../mutations/authMutations';
import { ScreenContainer } from '../common/ScreenContainer';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type PasswordStage = 'idle' | 'sending' | 'enter-code' | 'verifying' | 'new-password' | 'saving' | 'send-failed' | 'complete';

function errorMessage(error: unknown, fallback: string) {
  const value = error as { response?: { data?: { message?: string } }; message?: string };
  return value?.response?.data?.message || value?.message || fallback;
}

/** The protected email-code password change journey shared by every account role. */
export function EmailVerifiedChangePasswordScreen({ accountLabel = 'account' }: { accountLabel?: string }) {
  const { user } = useAuth();
  const [stage, setStage] = useState<PasswordStage>('idle');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const email = String(user?.email ?? '').trim();

  const requestCode = useCallback(async (isResend = false) => {
    setStage('sending');
    try {
      // The backend gets the authenticated user from the token, deliberately
      // ensuring this always goes to the account's registered email address.
      await requestChangePasswordCodeApi();
      setCode('');
      setStage('enter-code');
      Toast.show({
        type: 'success',
        text1: isResend ? 'A new verification code was sent' : 'Verification code sent',
        text2: email ? `Check ${email}` : 'Check your registered email address',
      });
    } catch (error) {
      setStage('send-failed');
      Toast.show({ type: 'error', text1: 'Unable to send verification code', text2: errorMessage(error, 'Please try again.') });
    }
  }, [email]);

  const verifyCode = async () => {
    if (!/^\d{6}$/.test(code)) {
      Toast.show({ type: 'error', text1: 'Enter the 6-digit verification code' });
      return;
    }
    setStage('verifying');
    try {
      await verifyChangePasswordCodeApi(code);
      setStage('new-password');
      Toast.show({ type: 'success', text1: 'Email verified', text2: 'You can now choose a new password.' });
    } catch (error) {
      setStage('complete');
      Toast.show({ type: 'error', text1: 'Verification failed', text2: errorMessage(error, 'The code is invalid or expired.') });
    }
  };

  const savePassword = async () => {
    if (newPassword.length < 8) {
      Toast.show({ type: 'error', text1: 'Password must be at least 8 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Passwords do not match' });
      return;
    }
    setStage('saving');
    try {
      await changePasswordWithCodeApi(code, newPassword);
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setStage('enter-code');
      Toast.show({ type: 'success', text1: 'Password updated successfully' });
    } catch (error) {
      setStage('new-password');
      Toast.show({ type: 'error', text1: 'Unable to update password', text2: errorMessage(error, 'Please request a new code and try again.') });
    }
  };

  const canEnterCode = stage === 'enter-code' || stage === 'verifying';
  const canSetPassword = stage === 'new-password' || stage === 'saving';
  const canResend = canEnterCode || canSetPassword;

  return (
    <ScreenContainer scroll padded>
      <Card>
        <Text style={styles.title}>Change Password</Text>
        <Text style={styles.subtitle}>For your security, we verify this change through the registered email for your {accountLabel} account.</Text>

        <View style={styles.emailCard}>
          <Text style={styles.emailLabel}>REGISTERED EMAIL</Text>
          <Text style={styles.emailValue} numberOfLines={1}>{email || 'Your registered email address'}</Text>
          <Button
            title={stage === 'sending' ? 'Sending code…' : canResend ? 'Resend code' : 'Send verification code'}
            variant="outline"
            onPress={() => requestCode(canResend)}
            loading={stage === 'sending'}
            disabled={stage === 'sending' || stage === 'verifying' || stage === 'saving'}
            style={styles.resendButton}
          />
        </View>

        {stage === 'send-failed' ? (
          <View style={styles.retryWrap}>
            <Text style={styles.retryText}>We could not send the code. Confirm your connection and try again.</Text>
            <Button title="Try again" onPress={() => requestCode()} />
          </View>
        ) : null}

        {stage === 'idle' ? (
          <View style={styles.readyWrap}>
            <Text style={styles.readyText}>Press “Send verification code” to begin. No code is sent until you choose to start this password change.</Text>
          </View>
        ) : null}

        {stage === 'complete' ? (
          <View style={styles.completeWrap}>
            <Text style={styles.completeText}>Your password has been changed. You can request another verification code whenever you need to update it again.</Text>
          </View>
        ) : null}

        {canEnterCode ? (
          <View>
            <Input
              label="Email verification code"
              placeholder="Enter the 6-digit code"
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              helperText="The code expires after 10 minutes."
            />
            <Button title={stage === 'verifying' ? 'Verifying…' : 'Verify code'} onPress={verifyCode} loading={stage === 'verifying'} />
          </View>
        ) : null}

        {canSetPassword ? (
          <View>
            <View style={styles.verifiedRow}><Text style={styles.verifiedText}>Email verification complete</Text></View>
            <Input label="New password" placeholder="At least 8 characters" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
            <Input label="Confirm new password" placeholder="Re-enter your new password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            <Button title={stage === 'saving' ? 'Saving…' : 'Save new password'} onPress={savePassword} loading={stage === 'saving'} />
          </View>
        ) : null}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h3, color: colors.primaryDark },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20, marginTop: 4, marginBottom: spacing.lg },
  emailCard: { backgroundColor: colors.backgroundSecondary, borderRadius: 14, borderWidth: 1, borderColor: colors.borderLight, padding: spacing.md, marginBottom: spacing.lg },
  emailLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '800', letterSpacing: 0.6 },
  emailValue: { ...typography.body, color: colors.text, fontWeight: '700', marginTop: 4 },
  resendButton: { alignSelf: 'flex-start', minHeight: 40, paddingVertical: 8, marginTop: spacing.sm },
  retryWrap: { marginBottom: spacing.md },
  retryText: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.sm },
  completeWrap: { backgroundColor: colors.successLight, borderRadius: 14, padding: spacing.md },
  completeText: { ...typography.bodySmall, color: colors.primaryDark, lineHeight: 20 },
  readyWrap: { backgroundColor: colors.primaryLight + '14', borderRadius: 14, padding: spacing.md, marginBottom: spacing.md },
  readyText: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20 },
  verifiedRow: { alignSelf: 'flex-start', backgroundColor: colors.successLight, borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 6, marginBottom: spacing.md },
  verifiedText: { ...typography.caption, color: colors.primaryDark, fontWeight: '800' },
});
