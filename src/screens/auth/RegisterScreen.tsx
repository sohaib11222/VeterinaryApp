import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { AuthStackScreenProps } from '../../navigation/types';
import { AuthLayout } from '../../components/common/AuthLayout';
import { Input } from '../../components/common/Input';
import { CountryPhoneInput } from '../../components/common/CountryPhoneInput';
import { Button } from '../../components/common/Button';
import { useAuth, type UserRole } from '../../contexts/AuthContext';
import { getErrorMessage, getFieldErrors } from '../../utils/errorUtils';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTranslation } from 'react-i18next';

type Nav = AuthStackScreenProps<'Register'>['navigation'];

const ROLE_OPTIONS: { role: UserRole; labelKey: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { role: 'VETERINARIAN', labelKey: 'authRegister.actions.registerAsVeterinarian', icon: 'stethoscope' },
  { role: 'PET_STORE', labelKey: 'authRegister.actions.registerAsPharmacy', icon: 'medical-bag' },
  { role: 'PARAPHARMACY', labelKey: 'authRegister.actions.registerAsParapharmacy', icon: 'pill' },
];

export function RegisterScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = t('auth.validation.nameRequired');
    else if (name.trim().length < 2) next.name = t('auth.validation.nameMinLength', { count: 2 });
    else if (name.trim().length > 50) next.name = t('auth.validation.nameMaxLength', { count: 50 });
    if (!email.trim()) next.email = t('auth.validation.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t('auth.validation.invalidEmail');
    if (!phone.trim()) next.phone = t('auth.validation.phoneRequired');
    else if (!/^\+\d{7,18}$/.test(phone)) next.phone = 'Enter a valid phone number with a country code.';
    if (!password) next.password = t('auth.validation.passwordRequired');
    else if (password.length < 6) next.password = t('auth.validation.passwordMinLength', { count: 6 });
    if (password !== confirmPassword) next.confirmPassword = t('auth.validation.passwordsMustMatch');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submitWithRole = async (role: UserRole) => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const result = await register({ name, email, phone, password }, role);
      if (result?.requiresEmailVerification) {
        navigation.navigate('VerifyEmail', { email: result.email || email.trim() });
      }
      // Role-specific document and approval screens are selected by RootNavigator.
    } catch (err: unknown) {
      const message = getErrorMessage(err, t('authRegister.errors.registrationFailedTryAgain'));
      const fieldErrs = getFieldErrors(err);
      if (fieldErrs._form) setErrors({ email: fieldErrs._form });
      else if (Object.keys(fieldErrs).length > 0) setErrors({ ...fieldErrs } as Record<string, string>);
      else setErrors({ email: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon="account-plus-outline"
      title={t('authRegister.title')}
      subtitle={t('authRegister.subtitle')}
      footer={
        <View style={styles.loginRow}>
          <Text style={styles.loginText}>{t('authRegister.footer.alreadyHaveAccount')}{' '}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} hitSlop={8}>
            <Text style={styles.loginLink}>{t('authRegister.footer.loginToPetCare')}</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <View style={styles.formHeading}>
        <Text style={styles.formTitle}>{t('authExperience.register.createAccount')}</Text>
        <Text style={styles.formCopy}>{t('authExperience.register.protectedInfo')}</Text>
      </View>

      <Input label={t('authRegister.fields.fullName.label')} placeholder={t('authRegister.fields.fullName.placeholder')} value={name} onChangeText={setName} error={errors.name} autoCapitalize="words" leftIcon={<Ionicons name="person-outline" size={20} color={colors.primary} />} />
      <Input label={t('authRegister.fields.email.label')} placeholder={t('authRegister.fields.email.placeholder')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={errors.email} leftIcon={<Ionicons name="mail-outline" size={20} color={colors.primary} />} />
      <CountryPhoneInput label={t('authRegister.fields.phone.label')} value={phone} onChangeText={setPhone} error={errors.phone} helperText="Select your country so we can verify the correct number." />
      <Input label={t('authRegister.fields.password.label')} placeholder={t('authRegister.fields.password.placeholder')} value={password} onChangeText={setPassword} secureTextEntry error={errors.password} leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.primary} />} />
      <Input label={t('authRegister.fields.confirmPassword.label')} placeholder={t('authRegister.fields.confirmPassword.placeholder')} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry error={errors.confirmPassword} leftIcon={<Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />} />

      <Button title={loading ? t('authRegister.actions.creatingAccount') : t('authRegister.actions.createPetCareAccount')} onPress={() => submitWithRole('PET_OWNER')} loading={loading} style={styles.submitBtn} icon={<Ionicons name="arrow-forward" size={19} color={colors.textInverse} />} />

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t('authRegister.divider.or')}</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.professionalBlock}>
        <Text style={styles.professionalTitle}>{t('authExperience.register.professionals')}</Text>
        <Text style={styles.professionalCopy}>{t('authExperience.register.professionalsDescription')}</Text>
        <Button title="Become a Pet Sitter" onPress={() => navigation.navigate('PetSitterRegister')} variant="outline" style={styles.roleBtn} disabled={loading} icon={<MaterialCommunityIcons name="home-heart" size={20} color={colors.primary} />} />
        {ROLE_OPTIONS.map(({ role, labelKey, icon }) => (
          <Button key={role} title={t(labelKey)} onPress={() => submitWithRole(role)} variant="outline" style={styles.roleBtn} disabled={loading} icon={<MaterialCommunityIcons name={icon} size={20} color={colors.primary} />} />
        ))}
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  formHeading: { marginBottom: spacing.lg },
  formTitle: { ...typography.h3, color: colors.primaryDark, marginBottom: 4 },
  formCopy: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 19 },
  submitBtn: { marginTop: spacing.xs },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.borderLight },
  dividerText: { ...typography.caption, marginHorizontal: spacing.md, color: colors.textLight, fontWeight: '700' },
  professionalBlock: { borderRadius: borderRadius.lg, padding: spacing.md, backgroundColor: colors.primaryLight + '0E', borderWidth: 1, borderColor: colors.primaryLight + '22' },
  professionalTitle: { ...typography.label, color: colors.primaryDark, marginBottom: 3 },
  professionalCopy: { ...typography.caption, color: colors.textSecondary, lineHeight: 17, marginBottom: spacing.md },
  roleBtn: { marginBottom: spacing.sm, backgroundColor: colors.background },
  loginRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  loginText: { ...typography.bodySmall },
  loginLink: { ...typography.bodySmall, color: colors.primary, fontWeight: '800' },
});
