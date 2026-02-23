import React, { useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useChangePasswordMutation } from '../../mutations/authMutations';

export function PetOwnerChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const changePassword = useChangePasswordMutation();

  const handleSubmit = async () => {
    if (!currentPassword.trim()) {
      Alert.alert('Validation', 'Current password is required');
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert('Validation', 'New password is required');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation', 'New password and confirm password do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Validation', 'New password must be at least 6 characters');
      return;
    }
    try {
      await changePassword.mutateAsync({
        oldPassword: currentPassword,
        newPassword,
      });
      Alert.alert('Success', 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Failed to change password';
      Alert.alert('Error', msg);
    }
  };

  return (
    <ScreenContainer scroll padded>
      <Card>
        <Input
          label="Current password *"
          placeholder="Enter current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />
        <Input
          label="New password *"
          placeholder="Enter new password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <Input
          label="Confirm new password *"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <Button
          title="Update password"
          onPress={handleSubmit}
          disabled={changePassword.isPending}
        />
      </Card>
    </ScreenContainer>
  );
}
