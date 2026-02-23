import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const MOCK_POSTS = [
  { id: '1', title: '5 Tips for Pet Dental Care', excerpt: 'Keeping your pet\'s teeth healthy...', date: 'Feb 10, 2024' },
  { id: '2', title: 'Vaccination Schedule for Dogs', excerpt: 'A complete guide to vaccination timing...', date: 'Feb 5, 2024' },
];

export function VetBlogListScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScreenContainer padded>
      <Button title="Create new post" onPress={() => navigation.navigate('VetBlogCreate')} style={styles.createBtn} />
      <FlatList
        data={MOCK_POSTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('VetBlogDetail', { id: item.id })} activeOpacity={0.8}>
            <Card>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.excerpt} numberOfLines={2}>{item.excerpt}</Text>
              <Text style={styles.date}>{item.date}</Text>
            </Card>
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  createBtn: { marginBottom: spacing.md },
  list: { paddingBottom: spacing.xxl },
  title: { ...typography.h3 },
  excerpt: { ...typography.bodySmall, marginTop: 4, color: colors.textSecondary },
  date: { ...typography.caption, marginTop: 4 },
});
