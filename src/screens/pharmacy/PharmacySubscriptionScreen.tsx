import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function PharmacySubscriptionScreen() {
  return (
    <ScreenContainer scroll padded>
      <Card>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>Active</Text></View>
        </View>
        <Text style={styles.desc}>Your subscription is active. You can manage products and receive orders.</Text>
        <Button title="Manage Plan" onPress={() => {}} />
      </Card>
      <Card style={styles.planCard}>
        <Text style={styles.planName}>Professional Plan</Text>
        <Text style={styles.planPrice}>€29/month</Text>
        <Text style={styles.planFeatures}>• Up to 100 products\n• Order management\n• Payouts</Text>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  label: { ...typography.body, marginRight: spacing.sm },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.successLight },
  badgeText: { ...typography.caption, color: colors.success, fontWeight: '600' },
  desc: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  planCard: { marginTop: spacing.md },
  planName: { ...typography.h3 },
  planPrice: { ...typography.h2, color: colors.primary, marginTop: 4 },
  planFeatures: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
});
