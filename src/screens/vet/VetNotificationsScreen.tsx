import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const MOCK_NOTIFICATIONS = [
  { id: '1', title: 'New appointment request', body: 'John D. requested an appointment for Max on Feb 16.', time: '10 min ago', read: false },
  { id: '2', title: 'Payment received', body: 'You received €50 for consultation.', time: '1 hour ago', read: true },
];

export function VetNotificationsScreen() {
  return (
    <ScreenContainer padded>
      <FlatList
        data={MOCK_NOTIFICATIONS}
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
