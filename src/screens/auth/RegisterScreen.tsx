import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { AuthStackScreenProps } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../contexts/AuthContext';
import { getErrorMessage, getFieldErrors } from '../../utils/errorUtils';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTranslation } from 'react-i18next';

type Nav = AuthStackScreenProps<'Register'>['navigation'];

const ROLE_OPTIONS: { role: UserRole; labelKey: string }[] = [
  { role: 'VETERINARIAN', labelKey: 'authRegister.actions.registerAsVeterinarian' },
  { role: 'PET_STORE', labelKey: 'authRegister.actions.registerAsPharmacy' },
  { role: 'PARAPHARMACY', labelKey: 'authRegister.actions.registerAsParapharmacy' },
];

export function RegisterScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { register, logout } = useAuth();
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
      await register({ name, email, phone, password }, role);
      // Success toast is shown by AuthContext
      if (role === 'PET_OWNER') {
        await logout();
        navigation.replace('Login');
      }
      // For VETERINARIAN / PET_STORE / PARAPHARMACY, RootNavigator shows Pending stack
      // with DoctorVerificationUpload or PetStoreVerificationUpload as initial screen
    } catch (err: unknown) {
      const message = getErrorMessage(err, t('authRegister.errors.registrationFailedTryAgain'));
      const fieldErrs = getFieldErrors(err);
      if (fieldErrs._form) {
        setErrors({ email: fieldErrs._form });
      } else if (Object.keys(fieldErrs).length > 0) {
        setErrors({ ...fieldErrs } as Record<string, string>);
      } else {
        setErrors({ email: message });
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmitPetOwner = async () => {
    await submitWithRole('PET_OWNER');
  };

  return (
    <ScreenContainer scroll padded style={styles.bg}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Text style={styles.logoIcon}>🐾</Text>
            </View>
            <Text style={styles.title}>{t('authRegister.title')}</Text>
            <Text style={styles.subtitle}>{t('authRegister.subtitle')}</Text>
          </View>

          <View style={styles.form}>
            <Input
              label={t('authRegister.fields.fullName.label')}
              placeholder={t('authRegister.fields.fullName.placeholder')}
              value={name}
              onChangeText={setName}
              error={errors.name}
            />
            <Input
              label={t('authRegister.fields.email.label')}
              placeholder={t('authRegister.fields.email.placeholder')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <Input
              label={t('authRegister.fields.phone.label')}
              placeholder={t('authRegister.fields.phone.placeholder')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              error={errors.phone}
            />
            <Input
              label={t('authRegister.fields.password.label')}
              placeholder={t('authRegister.fields.password.placeholder')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
            />
            <Input
              label={t('authRegister.fields.confirmPassword.label')}
              placeholder={t('authRegister.fields.confirmPassword.placeholder')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              error={errors.confirmPassword}
            />

            <Button
              title={loading ? t('authRegister.actions.creatingAccount') : t('authRegister.actions.createPetCareAccount')}
              onPress={onSubmitPetOwner}
              loading={loading}
              style={styles.submitBtn}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('authRegister.divider.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {ROLE_OPTIONS.map(({ role, labelKey }) => (
              <Button
                key={role}
                title={t(labelKey)}
                onPress={() => submitWithRole(role)}
                variant="outline"
                style={styles.altBtn}
                disabled={loading}
              />
            ))}

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>{t('authRegister.footer.alreadyHaveAccount')}{' '}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.registerLink}>{t('authRegister.footer.loginToPetCare')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: colors.backgroundSecondary },
  keyboard: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl, paddingHorizontal: spacing.xs, flexGrow: 1 },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight + '25',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoIcon: { fontSize: 38 },
  title: { ...typography.h1, color: colors.primary, marginBottom: spacing.xs, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.lg },
  form: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: 24,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  submitBtn: { marginTop: spacing.sm, marginBottom: spacing.md },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { ...typography.caption, marginHorizontal: spacing.sm, color: colors.textLight },
  altBtn: { marginBottom: spacing.sm },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl },
  registerText: { ...typography.bodySmall },
  registerLink: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
});
