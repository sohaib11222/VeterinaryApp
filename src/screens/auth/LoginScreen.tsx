import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { AuthStackScreenProps } from '../../navigation/types';
import { AuthLayout } from '../../components/common/AuthLayout';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { getErrorMessage } from '../../utils/errorUtils';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTranslation } from 'react-i18next';

type Nav = AuthStackScreenProps<'Login'>['navigation'];

export function LoginScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = t('auth.validation.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t('auth.validation.invalidEmail');
    if (!password) next.password = t('auth.validation.passwordRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await login(email, password);
      // RootNavigator switches to the correct approved or pending flow.
    } catch (err: unknown) {
      setErrors({ password: getErrorMessage(err, t('authLogin.errors.loginFailedTryAgain')) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon="heart-pulse"
      title={t('authLogin.title')}
      subtitle={t('authLogin.subtitle')}
      footer={
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>{t('authLogin.footer.newToPetCare')}{' '}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')} hitSlop={8}>
            <Text style={styles.registerLink}>{t('authLogin.footer.createAccount')}</Text>
          </TouchableOpacity>
        </View>
      }
    >
      <View style={styles.formHeading}>
        <Text style={styles.formTitle}>{t('authExperience.login.welcomeBack')}</Text>
        <Text style={styles.formCopy}>{t('authExperience.login.continueCare')}</Text>
      </View>

      <Input
        label={t('authLogin.fields.email.label')}
        placeholder={t('authLogin.fields.email.placeholder')}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
        leftIcon={<Ionicons name="mail-outline" size={20} color={colors.primary} />}
      />
      <Input
        label={t('authLogin.fields.password.label')}
        placeholder={t('authLogin.fields.password.placeholder')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={errors.password}
        leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.primary} />}
      />

      <TouchableOpacity style={styles.forgotWrap} onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8}>
        <Ionicons name="key-outline" size={15} color={colors.primary} />
        <Text style={styles.forgotText}>{t('authLogin.actions.forgotPassword')}</Text>
      </TouchableOpacity>

      <Button
        title={loading ? t('authLogin.actions.loggingIn') : t('authLogin.actions.login')}
        onPress={onSubmit}
        loading={loading}
        style={styles.submitBtn}
        icon={<Ionicons name="log-in-outline" size={20} color={colors.textInverse} />}
      />

      <View style={styles.trustStrip}>
        <MaterialCommunityIcons name="shield-check-outline" size={19} color={colors.primary} />
        <Text style={styles.trustText}>{t('authExperience.login.secureAccess')}</Text>
      </View>

      <View style={styles.features}>
        <Feature icon="shield-checkmark-outline" label={t('authLogin.features.secure')} />
        <Feature icon="heart-outline" label={t('authLogin.features.petCare')} />
        <Feature icon="time-outline" label={t('authLogin.features.alwaysAvailable')} />
      </View>
    </AuthLayout>
  );
}

function Feature({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.feature}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={17} color={colors.primary} />
      </View>
      <Text style={styles.featureLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  formHeading: { marginBottom: spacing.lg },
  formTitle: { ...typography.h3, color: colors.primaryDark, marginBottom: 4 },
  formCopy: { ...typography.bodySmall, color: colors.textSecondary },
  forgotWrap: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -spacing.sm, marginBottom: spacing.lg },
  forgotText: { ...typography.bodySmall, color: colors.primary, fontWeight: '700' },
  submitBtn: { marginBottom: spacing.md },
  trustStrip: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.primaryLight + '14', marginBottom: spacing.lg },
  trustText: { ...typography.caption, color: colors.primaryDark, fontWeight: '600' },
  features: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  feature: { alignItems: 'center', flex: 1, paddingHorizontal: 2 },
  featureIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '16', marginBottom: 5 },
  featureLabel: { ...typography.caption, fontSize: 10, color: colors.textSecondary, textAlign: 'center' },
  registerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  registerText: { ...typography.bodySmall },
  registerLink: { ...typography.bodySmall, color: colors.primary, fontWeight: '800' },
});
