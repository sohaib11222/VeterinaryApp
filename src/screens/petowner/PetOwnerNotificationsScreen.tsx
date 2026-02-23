import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const MOCK_NOTIF = [
  { id: '1', title: 'Appointment reminder', body: 'Max has an appointment tomorrow at 09:00 with Dr. Sarah Mitchell.', time: '10 min ago', read: false },
  { id: '2', title: 'Order shipped', body: 'Your pet supply order has been shipped.', time: '1 hour ago', read: true },
];

export function PetOwnerNotificationsScreen() {
  return (
    <ScreenContainer padded>
      <FlatList
        data={MOCK_NOTIF}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={!item.read ? styles.unread : undefined}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </Card>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xxl },
  unread: { backgroundColor: colors.primaryLight + '12' },
  title: { ...typography.label },
  body: { ...typography.bodySmall, marginTop: 4 },
  time: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
});
