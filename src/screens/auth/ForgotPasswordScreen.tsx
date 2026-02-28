import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { AuthStackScreenProps } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { forgotPasswordApi } from '../../mutations/authMutations';
import { getErrorMessage } from '../../utils/errorUtils';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
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
      <ScreenContainer padded style={styles.bg}>
        <View style={styles.centered}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>✉️</Text>
          </View>
          <Text style={styles.title}>{t('authForgotPassword.sent.title')}</Text>
          <Text style={styles.subtitle}>{t('authForgotPassword.sent.subtitle', { email })}</Text>
          <Button
            title={t('authForgotPassword.actions.backToLogin')}
            onPress={() => navigation.navigate('Login')}
            style={styles.backBtn}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll padded style={styles.bg}>
      <View style={styles.header}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoIcon}>🐾</Text>
        </View>
        <Text style={styles.title}>{t('authForgotPassword.title')}</Text>
        <Text style={styles.subtitle}>{t('authForgotPassword.subtitle')}</Text>
      </View>

      <View style={styles.form}>
        <Input
          label={t('authForgotPassword.fields.email.label')}
          placeholder={t('authForgotPassword.fields.email.placeholder')}
          value={email}
          onChangeText={(val) => {
            setEmail(val);
            if (error) setError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          error={error}
        />
        <Button
          title={loading ? t('authForgotPassword.actions.sending') : t('authForgotPassword.actions.submit')}
          onPress={onSubmit}
          loading={loading}
          style={styles.submitBtn}
        />
        <Button
          title={t('common.back')}
          onPress={() => navigation.navigate('Login')}
          variant="outline"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  bg: { backgroundColor: colors.backgroundSecondary },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoIcon: { fontSize: 32 },
  title: {
    ...typography.h2,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  form: {
    backgroundColor: colors.background,
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtn: { marginBottom: spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  iconWrap: { marginBottom: spacing.lg },
  icon: { fontSize: 48 },
  backBtn: { marginTop: spacing.lg },
});
