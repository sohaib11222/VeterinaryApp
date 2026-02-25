import React, { useState } from 'react';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useChangePasswordMutation } from '../../mutations/authMutations';
import { getErrorMessage } from '../../utils/errorUtils';
import Toast from 'react-native-toast-message';

export function PharmacyChangePasswordScreen() {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const changePassword = useChangePasswordMutation();

  const onSubmit = async () => {
    if (!current.trim()) {
      Toast.show({ type: 'error', text1: 'Current password required' });
      return;
    }
    if (!newPass.trim() || newPass.length < 6) {
      Toast.show({ type: 'error', text1: 'New password must be at least 6 characters' });
      return;
    }
    if (newPass !== confirm) {
      Toast.show({ type: 'error', text1: 'New password and confirm do not match' });
      return;
    }
    try {
      await changePassword.mutateAsync({ oldPassword: current, newPassword: newPass });
      Toast.show({ type: 'success', text1: 'Password updated' });
      setCurrent('');
      setNewPass('');
      setConfirm('');
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed', text2: getErrorMessage(err, 'Could not update password') });
    }
  };

  return (
    <ScreenContainer scroll padded>
      <Card>
        <Input label="Current Password" value={current} onChangeText={setCurrent} secureTextEntry placeholder="••••••••" />
        <Input label="New Password" value={newPass} onChangeText={setNewPass} secureTextEntry placeholder="••••••••" />
        <Input label="Confirm New Password" value={confirm} onChangeText={setConfirm} secureTextEntry placeholder="••••••••" />
        <Button title="Update Password" onPress={onSubmit} loading={changePassword.isPending} />
      </Card>
    </ScreenContainer>
  );
}
