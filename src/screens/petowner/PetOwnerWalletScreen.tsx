import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function PetOwnerWalletScreen() {
  return (
    <ScreenContainer padded>
      <Card>
        <Text style={styles.label}>Available balance</Text>
        <Text style={styles.balance}>€120.00</Text>
        <Button title="Top up" variant="outline" onPress={() => {}} style={styles.btn} />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.bodySmall, color: colors.textSecondary },
  balance: { ...typography.h1, color: colors.primary, marginTop: 4 },
  btn: { marginTop: spacing.lg },
});
