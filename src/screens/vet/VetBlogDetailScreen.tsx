import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
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

  return (
    <ScreenContainer scroll padded>
      <Card>
        <Text style={styles.title}>5 Tips for Pet Dental Care</Text>
        <Text style={styles.date}>Feb 10, 2024</Text>
        <Text style={styles.body}>
          Keeping your pet's teeth healthy is essential for their overall wellbeing. Here are five simple tips...
        </Text>
        <Button title="Edit" variant="outline" onPress={() => {}} style={styles.btn} />
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
