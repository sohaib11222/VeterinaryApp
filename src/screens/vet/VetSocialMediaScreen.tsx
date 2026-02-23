import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function VetSocialMediaScreen() {
  return (
    <ScreenContainer scroll padded>
      <Card>
        <Text style={styles.sectionTitle}>Social links</Text>
        <Input label="Facebook" placeholder="URL" value="" onChangeText={() => {}} />
        <Input label="Instagram" placeholder="URL" value="" onChangeText={() => {}} />
        <Input label="Twitter" placeholder="URL" value="" onChangeText={() => {}} />
        <Input label="LinkedIn" placeholder="URL" value="" onChangeText={() => {}} />
        <Button title="Save" onPress={() => {}} />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
});
