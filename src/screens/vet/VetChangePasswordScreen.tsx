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

export function VetChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const changePassword = useChangePasswordMutation();

  const handleSubmit = async () => {
    const current = (currentPassword || '').trim();
    const newP = (newPassword || '').trim();
    const confirm = (confirmPassword || '').trim();
    if (!current) {
      Toast.show({ type: 'error', text1: 'Enter your current password' });
      return;
    }
    if (!newP) {
      Toast.show({ type: 'error', text1: 'Enter a new password' });
      return;
    }
    if (newP.length < 6) {
      Toast.show({ type: 'error', text1: 'New password must be at least 6 characters' });
      return;
    }
    if (newP !== confirm) {
      Toast.show({ type: 'error', text1: 'New password and confirm password do not match' });
      return;
    }
    try {
      await changePassword.mutateAsync({ oldPassword: current, newPassword: newP });
      Toast.show({ type: 'success', text1: 'Password updated successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message
          ?? (err as { message?: string })?.message
          ?? 'Failed to update password',
      });
    }
  };

  return (
    <ScreenContainer scroll padded>
      <Card>
        <Text style={styles.sectionTitle}>Change Password</Text>
        <Text style={styles.hint}>Enter your current password and choose a new password.</Text>
        <Input
          label="Current password *"
          placeholder="Enter current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Input
          label="New password *"
          placeholder="Enter new password (min 6 characters)"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Input
          label="Confirm new password *"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Button
          title={changePassword.isPending ? 'Updating...' : 'Save changes'}
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
