import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PendingStackParamList } from '../../navigation/PendingNavigator';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { sendPhoneOtpApi, verifyPhoneOtpApi } from '../../mutations/authMutations';
import { getErrorMessage } from '../../utils/errorUtils';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Nav = NativeStackNavigationProp<PendingStackParamList, 'PharmacyPhoneVerification'>;

export function PharmacyPhoneVerificationScreen() {
  const navigation = useNavigation<Nav>();
  const { user, updateUser } = useAuth();
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const phoneTrimmed = useMemo(() => String(phone ?? '').trim(), [phone]);

  const handleResend = async () => {
    setSending(true);
    try {
      await sendPhoneOtpApi(phoneTrimmed ? { phone: phoneTrimmed } : {});
      Toast.show({ type: 'success', text1: 'Code sent', text2: 'Verification code sent to your phone.' });
    } catch (err: unknown) {
      Toast.show({ type: 'error', text1: 'Failed', text2: getErrorMessage(err, 'Failed to send verification code.') });
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      Toast.show({ type: 'error', text1: 'Code required', text2: 'Please enter the verification code.' });
      return;
    }
    setVerifying(true);
    try {
      const data = await verifyPhoneOtpApi({ code: code.trim(), phone: phoneTrimmed || undefined });
      const verifiedUser = data?.user;
      if (verifiedUser && typeof verifiedUser === 'object') {
        updateUser({
          phone: (verifiedUser as { phone?: string }).phone ?? (phoneTrimmed || user?.phone),
          isPhoneVerified: true,
        });
      } else {
        updateUser({ isPhoneVerified: true, phone: phoneTrimmed || user?.phone });
      }
      Toast.show({ type: 'success', text1: 'Verified', text2: 'Phone verified successfully.' });
      navigation.replace('PetStoreVerificationUpload');
    } catch (err: unknown) {
      Toast.show({ type: 'error', text1: 'Verification failed', text2: getErrorMessage(err, 'Invalid verification code.') });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <ScreenContainer scroll padded style={styles.bg}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={60}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.logoIcon}>🐾</Text>
            <Text style={styles.title}>Verify Phone Number</Text>
            <Text style={styles.subtitle}>Enter the code we sent to your phone to continue.</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Phone (E.164)"
              value={phone}
              onChangeText={setPhone}
              placeholder="+1234567890"
              keyboardType="phone-pad"
              autoCapitalize="none"
              editable={!verifying}
            />
            <Text style={styles.hint}>Example: +393331234567</Text>

            <Input
              label="Verification Code"
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
              placeholder="Enter code"
              keyboardType="number-pad"
              maxLength={10}
              editable={!verifying}
            />

            <Button
              title={verifying ? 'Verifying...' : 'Verify & Continue'}
              onPress={handleVerify}
              disabled={verifying}
              loading={verifying}
              style={styles.verifyBtn}
            />

            <TouchableOpacity onPress={handleResend} disabled={sending} style={styles.resendWrap}>
              {sending ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={styles.resendText}>Resend code</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: colors.background },
  keyboard: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl * 2 },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logoIcon: { fontSize: 48, marginBottom: spacing.md },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  form: { marginTop: spacing.md },
  hint: { ...typography.caption, color: colors.textSecondary, marginTop: -spacing.sm, marginBottom: spacing.md },
  verifyBtn: { marginTop: spacing.lg },
  resendWrap: { alignItems: 'center', marginTop: spacing.lg },
  resendText: { ...typography.body, color: colors.primary },
});
