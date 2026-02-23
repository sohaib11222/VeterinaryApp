import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from './ScreenContainer';
import { Card } from './Card';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export function PlaceholderScreen({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <ScreenContainer padded>
      <Card>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <Text style={styles.hint}>UI matches VeterinaryFrontend. API integration later.</Text>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2 },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  hint: { ...typography.caption, color: colors.textLight, marginTop: spacing.md },
});
