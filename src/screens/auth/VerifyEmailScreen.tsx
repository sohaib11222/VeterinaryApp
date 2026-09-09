import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { AuthStackScreenProps, AuthStackParamList } from '../../navigation/types';
import { AuthInfoRow, AuthLayout } from '../../components/common/AuthLayout';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { resendEmailVerificationApi } from '../../mutations/authMutations';
import { getErrorMessage } from '../../utils/errorUtils';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Nav = AuthStackScreenProps<'VerifyEmail'>['navigation'];
type Route = RouteProp<AuthStackParamList, 'VerifyEmail'>;

export function VerifyEmailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { verifyEmail } = useAuth();
  const email = route.params.email.trim().toLowerCase();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit verification code sent to your email.');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      await verifyEmail(email, code.trim());
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'The verification code is invalid or has expired.'));
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendEmailVerificationApi(email);
      Toast.show({ type: 'success', text1: 'New Code Sent', text2: `A new verification code was sent to ${email}.` });
    } catch (err: unknown) {
      Toast.show({ type: 'error', text1: 'Could Not Resend Code', text2: getErrorMessage(err, 'Please try again in a moment.') });
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout icon="email-check-outline" title="Verify your email" subtitle={`We sent a 6-digit code to ${email}.`} compact>
      <View style={styles.notice}>
        <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
        <Text style={styles.noticeText}>Confirming your email activates your account and sends your MyPetPlus welcome email.</Text>
      </View>
      <Input
        label="Verification code"
        placeholder="000000"
        value={code}
        onChangeText={(value) => { setCode(value.replace(/\D/g, '').slice(0, 6)); if (error) setError(''); }}
        keyboardType="number-pad"
        maxLength={6}
        error={error}
        leftIcon={<Ionicons name="keypad-outline" size={20} color={colors.primary} />}
      />
      <Button title={verifying ? 'Verifying…' : 'Verify and continue'} onPress={handleVerify} loading={verifying} disabled={verifying} style={styles.primaryAction} icon={<Ionicons name="checkmark-circle-outline" size={20} color={colors.textInverse} />} />
      <View style={styles.resendRow}>
        <Text style={styles.resendLabel}>Didn’t receive a code?</Text>
        <TouchableOpacity onPress={handleResend} disabled={resending} hitSlop={8}>
          {resending ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={styles.resendText}>Resend code</Text>}
        </TouchableOpacity>
      </View>
      <AuthInfoRow icon="time-outline" tone="neutral" title="Code validity" description="Each code expires after 10 minutes and can be used once." last />
      <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()} hitSlop={8}>
        <Ionicons name="arrow-back" size={16} color={colors.primary} />
        <Text style={styles.backLinkText}>Use a different email</Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.primaryLight + '16', marginBottom: spacing.lg },
  noticeText: { ...typography.bodySmall, color: colors.primaryDark, flex: 1, lineHeight: 19 },
  primaryAction: { marginTop: spacing.sm },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5, marginVertical: spacing.lg },
  resendLabel: { ...typography.bodySmall, color: colors.textSecondary },
  resendText: { ...typography.bodySmall, color: colors.primary, fontWeight: '800' },
  backLink: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 5, marginTop: spacing.lg },
  backLinkText: { ...typography.bodySmall, color: colors.primary, fontWeight: '700' },
});
