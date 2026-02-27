import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { VetStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Route = RouteProp<VetStackParamList, 'VetBlogDetail'>;

export function VetBlogDetailScreen() {
  const route = useRoute<Route>();
  const id = route.params?.id;
  const { t } = useTranslation();

  const postKey = id === '2' ? 'post2' : 'post1';
  const dateISO = id === '2' ? '2024-02-05' : '2024-02-10';

  return (
    <ScreenContainer scroll padded>
      <Card>
        <Text style={styles.title}>{t(`vetBlog.mockPosts.${postKey}.title`)}</Text>
        <Text style={styles.date}>{new Date(dateISO).toLocaleDateString()}</Text>
        <Text style={styles.body}>{t(`vetBlog.mockPosts.${postKey}.body`)}</Text>
        <Button title={t('common.edit')} variant="outline" onPress={() => {}} style={styles.btn} />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2 },
  date: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  body: { ...typography.body, marginTop: spacing.md },
  btn: { marginTop: spacing.lg },
});
