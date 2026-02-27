import React, { useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useChangePasswordMutation } from '../../mutations/authMutations';
import { useTranslation } from 'react-i18next';

export function PetOwnerChangePasswordScreen() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const changePassword = useChangePasswordMutation();

  const handleSubmit = async () => {
    if (!currentPassword.trim()) {
      Alert.alert(t('common.validation'), t('petOwnerChangePassword.validation.currentPasswordRequired'));
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert(t('common.validation'), t('petOwnerChangePassword.validation.newPasswordRequired'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.validation'), t('petOwnerChangePassword.validation.passwordsDoNotMatch'));
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t('common.validation'), t('petOwnerChangePassword.validation.minLength', { min: 6 }));
      return;
    }
    try {
      await changePassword.mutateAsync({
        oldPassword: currentPassword,
        newPassword,
      });
      Alert.alert(t('common.success'), t('petOwnerChangePassword.toasts.changed'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? t('petOwnerChangePassword.errors.changeFailed');
      Alert.alert(t('common.error'), msg);
    }
  };

  return (
    <ScreenContainer scroll padded>
      <Card>
        <Input
          label={t('petOwnerChangePassword.fields.currentPassword.label')}
          placeholder={t('petOwnerChangePassword.fields.currentPassword.placeholder')}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
        <Input
          label={t('petOwnerChangePassword.fields.newPassword.label')}
          placeholder={t('petOwnerChangePassword.fields.newPassword.placeholder')}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <Input
          label={t('petOwnerChangePassword.fields.confirmPassword.label')}
          placeholder={t('petOwnerChangePassword.fields.confirmPassword.placeholder')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <Button
          title={t('petOwnerChangePassword.actions.update')}
          onPress={handleSubmit}
          disabled={changePassword.isPending}
        />
      </Card>
    </ScreenContainer>
  );
}
