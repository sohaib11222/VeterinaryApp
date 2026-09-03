import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { PendingStackParamList } from '../../navigation/PendingNavigator';
import { AuthInfoRow, AuthLayout } from '../../components/common/AuthLayout';
import { Input } from '../../components/common/Input';
import { CountryPhoneInput } from '../../components/common/CountryPhoneInput';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { sendPhoneOtpApi, verifyPhoneOtpApi } from '../../mutations/authMutations';
import { getErrorMessage } from '../../utils/errorUtils';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
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
        updateUser({ phone: (verifiedUser as { phone?: string }).phone ?? (phoneTrimmed || user?.phone), isPhoneVerified: true });
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
    <AuthLayout
      icon="cellphone-check"
      title={t('authPhoneVerification.title')}
      subtitle={t('authPhoneVerification.subtitle')}
      progress={{ current: 1, total: 2 }}
    >
      <View style={styles.notice}>
        <Ionicons name="shield-checkmark-outline" size={19} color={colors.primary} />
        <Text style={styles.noticeText}>{t('authExperience.phone.securityNotice')}</Text>
      </View>
      <CountryPhoneInput label={t('authPhoneVerification.fields.phone.label')} value={phone} onChangeText={setPhone} editable={!verifying} helperText={t('authPhoneVerification.fields.phone.hint')} />
      <Input
        label={t('authPhoneVerification.fields.code.label')}
        value={code}
        onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
        placeholder={t('authPhoneVerification.fields.code.placeholder')}
        keyboardType="numeric"
        maxLength={10}
        editable={!verifying}
        helperText={t('authExperience.phone.codeHint')}
        leftIcon={<Ionicons name="keypad-outline" size={20} color={colors.primary} />}
      />
      <Button
        title={verifying ? t('authPhoneVerification.actions.verifying') : t('authPhoneVerification.actions.verifyContinue')}
        onPress={handleVerify}
        disabled={verifying}
        loading={verifying}
        style={styles.verifyBtn}
        icon={<Ionicons name="checkmark-circle-outline" size={20} color={colors.textInverse} />}
      />
      <View style={styles.resendRow}>
        <Text style={styles.resendLabel}>{t('authExperience.phone.noCode')}</Text>
        <TouchableOpacity onPress={handleResend} disabled={sending} hitSlop={8}>
          {sending ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={styles.resendText}>{t('authPhoneVerification.actions.resendCode')}</Text>}
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />
      <AuthInfoRow icon="document-text-outline" title={t('authExperience.phone.nextTitle')} description={t('authExperience.phone.nextDescription')} last />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primaryLight + '14', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.lg },
  noticeText: { ...typography.bodySmall, color: colors.primaryDark, flex: 1, lineHeight: 19 },
  verifyBtn: { marginTop: spacing.sm },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: spacing.lg },
  resendLabel: { ...typography.bodySmall, color: colors.textSecondary },
  resendText: { ...typography.bodySmall, color: colors.primary, fontWeight: '800' },
  divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.lg },
});
