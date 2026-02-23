import React, { useState } from 'react';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export function PharmacyChangePasswordScreen() {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');

  return (
    <ScreenContainer scroll padded>
      <Card>
        <Input label="Current Password" value={current} onChangeText={setCurrent} secureTextEntry placeholder="••••••••" />
        <Input label="New Password" value={newPass} onChangeText={setNewPass} secureTextEntry placeholder="••••••••" />
        <Input label="Confirm New Password" value={confirm} onChangeText={setConfirm} secureTextEntry placeholder="••••••••" />
        <Button title="Update Password" onPress={() => {}} />
      </Card>
    </ScreenContainer>
  );
}
