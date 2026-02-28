import React, { useState } from 'react';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useChangePasswordMutation } from '../../mutations/authMutations';
import { getErrorMessage } from '../../utils/errorUtils';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

export function PharmacyChangePasswordScreen() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const changePassword = useChangePasswordMutation();

  const onSubmit = async () => {
    if (!current.trim()) {
      Toast.show({ type: 'error', text1: t('pharmacyChangePassword.validation.currentPasswordRequired') });
      return;
    }
    if (!newPass.trim() || newPass.length < 6) {
      Toast.show({ type: 'error', text1: t('pharmacyChangePassword.validation.newPasswordMinLength') });
      return;
    }
    if (newPass !== confirm) {
      Toast.show({ type: 'error', text1: t('pharmacyChangePassword.validation.passwordsDoNotMatch') });
      return;
    }
    try {
      await changePassword.mutateAsync({ oldPassword: current, newPassword: newPass });
      Toast.show({ type: 'success', text1: t('pharmacyChangePassword.toasts.passwordUpdated') });
      setCurrent('');
      setNewPass('');
      setConfirm('');
    } catch (err) {
      Toast.show({ type: 'error', text1: t('common.failed'), text2: getErrorMessage(err, t('pharmacyChangePassword.errors.couldNotUpdatePassword')) });
    }
  };

  return (
    <ScreenContainer scroll padded>
      <Card>
        <Input label={t('pharmacyChangePassword.fields.currentPassword')} value={current} onChangeText={setCurrent} secureTextEntry placeholder={t('pharmacyChangePassword.fields.passwordPlaceholder')} />
        <Input label={t('pharmacyChangePassword.fields.newPassword')} value={newPass} onChangeText={setNewPass} secureTextEntry placeholder={t('pharmacyChangePassword.fields.passwordPlaceholder')} />
        <Input label={t('pharmacyChangePassword.fields.confirmNewPassword')} value={confirm} onChangeText={setConfirm} secureTextEntry placeholder={t('pharmacyChangePassword.fields.passwordPlaceholder')} />
        <Button title={t('pharmacyChangePassword.actions.updatePassword')} onPress={onSubmit} loading={changePassword.isPending} />
      </Card>
    </ScreenContainer>
  );
}
