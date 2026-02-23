import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const MOCK_REQUESTS = [
  { id: '1', petName: 'Max', ownerName: 'John D.', currentDate: 'Feb 15, 09:00', requestedDate: 'Feb 16, 10:00', reason: 'Schedule conflict', status: 'PENDING' },
];

export function VetRescheduleRequestsScreen() {
  return (
    <ScreenContainer padded>
      <FlatList
        data={MOCK_REQUESTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.petName}>{item.petName} – {item.ownerName}</Text>
            <Text style={styles.date}>Current: {item.currentDate}</Text>
            <Text style={styles.date}>Requested: {item.requestedDate}</Text>
            <Text style={styles.reason}>{item.reason}</Text>
            <View style={styles.actions}>
              <Button title="Approve" onPress={() => {}} style={styles.btn} />
              <Button title="Reject" variant="outline" onPress={() => {}} style={styles.btn} />
            </View>
          </Card>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xxl },
  petName: { ...typography.body, fontWeight: '600' },
  date: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  reason: { ...typography.caption, marginTop: 4, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  btn: { flex: 1 },
});
