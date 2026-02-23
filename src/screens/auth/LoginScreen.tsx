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
import { getErrorMessage } from '../../utils/errorUtils';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Nav = AuthStackScreenProps<'Login'>['navigation'];

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Invalid email';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await login(email, password);
      // RootNavigator will switch to Pending or Main based on user.role / user.status
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Login failed. Try again.');
      setErrors({ password: message });
    } finally {
      setLoading(false);
    }
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
            <Text style={styles.title}>PetCare Login</Text>
            <Text style={styles.subtitle}>Access your pet health dashboard</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={errors.password}
            />
            <TouchableOpacity style={styles.forgotWrap} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              title={loading ? 'Logging in...' : 'Login to PetCare'}
              onPress={onSubmit}
              loading={loading}
              style={styles.submitBtn}
            />

            <View style={styles.footer}>
              <View style={styles.features}>
                <View style={styles.feature}>
                  <Text style={styles.featureIcon}>🔒</Text>
                  <Text style={styles.featureLabel}>Secure</Text>
                </View>
                <View style={styles.feature}>
                  <Text style={styles.featureIcon}>❤️</Text>
                  <Text style={styles.featureLabel}>Pet Care</Text>
                </View>
                <View style={styles.feature}>
                  <Text style={styles.featureIcon}>🕐</Text>
                  <Text style={styles.featureLabel}>24/7</Text>
                </View>
              </View>
              <View style={styles.registerRow}>
                <Text style={styles.registerText}>New to PetCare? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.registerLink}>Create Account</Text>
                </TouchableOpacity>
              </View>
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
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryLight + '25',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoIcon: { fontSize: 42 },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
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
  forgotWrap: { alignSelf: 'flex-end', marginTop: -spacing.xs, marginBottom: spacing.md },
  forgotText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  submitBtn: { marginTop: spacing.sm, marginBottom: spacing.md },
  footer: {
    borderTopWidth: 0,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing.xl,
  },
  feature: { alignItems: 'center' },
  featureIcon: { fontSize: 24, marginBottom: spacing.xs },
  featureLabel: { ...typography.caption, color: colors.textSecondary },
  registerRow: { flexDirection: 'row', alignItems: 'center' },
  registerText: { ...typography.bodySmall },
  registerLink: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
});
