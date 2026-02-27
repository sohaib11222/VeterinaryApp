import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useChangePasswordMutation } from '../../mutations/authMutations';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

export function VetChangePasswordScreen() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const changePassword = useChangePasswordMutation();

  const handleSubmit = async () => {
    const current = (currentPassword || '').trim();
    const newP = (newPassword || '').trim();
    const confirm = (confirmPassword || '').trim();
    if (!current) {
      Toast.show({ type: 'error', text1: t('vetChangePassword.errors.currentRequired') });
      return;
    }
    if (!newP) {
      Toast.show({ type: 'error', text1: t('vetChangePassword.errors.newRequired') });
      return;
    }
    if (newP.length < 6) {
      Toast.show({ type: 'error', text1: t('vetChangePassword.errors.minLength', { count: 6 }) });
      return;
    }
    if (newP !== confirm) {
      Toast.show({ type: 'error', text1: t('vetChangePassword.errors.mismatch') });
      return;
    }
    try {
      await changePassword.mutateAsync({ oldPassword: current, newPassword: newP });
      Toast.show({ type: 'success', text1: t('vetChangePassword.toasts.updated') });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
          ?? (err as { message?: string })?.message
          ?? t('vetChangePassword.errors.updateFailedGeneric'),
      });
    }
  };

  return (
    <ScreenContainer scroll padded>
      <Card>
        <Text style={styles.sectionTitle}>{t('vetChangePassword.title')}</Text>
        <Text style={styles.hint}>{t('vetChangePassword.subtitle')}</Text>
        <Input
          label={t('vetChangePassword.fields.currentPassword')}
          placeholder={t('vetChangePassword.placeholders.currentPassword')}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Input
          label={t('vetChangePassword.fields.newPassword')}
          placeholder={t('vetChangePassword.placeholders.newPassword', { count: 6 })}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Input
          label={t('vetChangePassword.fields.confirmNewPassword')}
          placeholder={t('vetChangePassword.placeholders.confirmNewPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Button
          title={changePassword.isPending ? t('vetChangePassword.actions.updating') : t('common.saveChanges')}
          onPress={handleSubmit}
          disabled={changePassword.isPending}
        />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...typography.h3, marginBottom: 4 },
  hint: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
});
