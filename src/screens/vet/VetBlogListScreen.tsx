import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function VetBlogListScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const posts = [
    {
      id: '1',
      title: t('vetBlog.mockPosts.post1.title'),
      excerpt: t('vetBlog.mockPosts.post1.excerpt'),
      dateISO: '2024-02-10',
    },
    {
      id: '2',
      title: t('vetBlog.mockPosts.post2.title'),
      excerpt: t('vetBlog.mockPosts.post2.excerpt'),
      dateISO: '2024-02-05',
    },
  ];

  return (
    <ScreenContainer padded>
      <Button title={t('vetBlog.actions.createNewPost')} onPress={() => navigation.navigate('VetBlogCreate')} style={styles.createBtn} />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('VetBlogDetail', { id: item.id })} activeOpacity={0.8}>
            <Card>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.excerpt} numberOfLines={2}>{item.excerpt}</Text>
              <Text style={styles.date}>{new Date(item.dateISO).toLocaleDateString()}</Text>
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
