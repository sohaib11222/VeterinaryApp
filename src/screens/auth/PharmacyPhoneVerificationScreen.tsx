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
import { useTranslation } from 'react-i18next';

type Nav = NativeStackNavigationProp<PendingStackParamList, 'PharmacyPhoneVerification'>;

export function PharmacyPhoneVerificationScreen() {
  const { t } = useTranslation();
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
      Toast.show({ type: 'success', text1: t('authPhoneVerification.toasts.codeSentTitle'), text2: t('authPhoneVerification.toasts.codeSentBody') });
    } catch (err: unknown) {
      Toast.show({ type: 'error', text1: t('common.failed'), text2: getErrorMessage(err, t('authPhoneVerification.errors.failedToSendCode')) });
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      Toast.show({ type: 'error', text1: t('authPhoneVerification.validation.codeRequiredTitle'), text2: t('authPhoneVerification.validation.codeRequiredBody') });
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
      Toast.show({ type: 'success', text1: t('authPhoneVerification.toasts.verifiedTitle'), text2: t('authPhoneVerification.toasts.verifiedBody') });
      navigation.replace('PetStoreVerificationUpload');
    } catch (err: unknown) {
      Toast.show({ type: 'error', text1: t('authPhoneVerification.errors.verificationFailedTitle'), text2: getErrorMessage(err, t('authPhoneVerification.errors.invalidVerificationCode')) });
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
            <Text style={styles.title}>{t('authPhoneVerification.title')}</Text>
            <Text style={styles.subtitle}>{t('authPhoneVerification.subtitle')}</Text>
          </View>

          <View style={styles.form}>
            <Input
              label={t('authPhoneVerification.fields.phone.label')}
              value={phone}
              onChangeText={setPhone}
              placeholder={t('authPhoneVerification.fields.phone.placeholder')}
              keyboardType="phone-pad"
              autoCapitalize="none"
              editable={!verifying}
            />
            <Text style={styles.hint}>{t('authPhoneVerification.fields.phone.hint')}</Text>

            <Input
              label={t('authPhoneVerification.fields.code.label')}
              value={code}
              onChangeText={(t2) => setCode(t2.replace(/\D/g, ''))}
              placeholder={t('authPhoneVerification.fields.code.placeholder')}
              keyboardType="numeric"
              maxLength={10}
              editable={!verifying}
            />

            <Button
              title={verifying ? t('authPhoneVerification.actions.verifying') : t('authPhoneVerification.actions.verifyContinue')}
              onPress={handleVerify}
              disabled={verifying}
              loading={verifying}
              style={styles.verifyBtn}
            />

            <TouchableOpacity onPress={handleResend} disabled={sending} style={styles.resendWrap}>
              {sending ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={styles.resendText}>{t('authPhoneVerification.actions.resendCode')}</Text>}
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
