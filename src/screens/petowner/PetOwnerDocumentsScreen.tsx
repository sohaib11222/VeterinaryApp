import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const MOCK_DOCS = [
  { id: '1', name: 'Vaccination certificate - Max', date: 'Feb 10, 2024' },
  { id: '2', name: 'Invoice #tx-1', date: 'Feb 10, 2024' },
];

export function PetOwnerDocumentsScreen() {
  return (
    <ScreenContainer padded>
      <FlatList
        data={MOCK_DOCS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.date}>{item.date}</Text>
            <Text style={styles.download}>Download</Text>
          </Card>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xxl },
  name: { ...typography.body, fontWeight: '600' },
  date: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  download: { ...typography.bodySmall, color: colors.primary, marginTop: 8, fontWeight: '600' },
});
