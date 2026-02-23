import React from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function VetBlogCreateScreen() {
  return (
    <ScreenContainer scroll padded>
      <Card>
        <Text style={styles.label}>Title</Text>
        <TextInput style={styles.input} placeholder="Post title" placeholderTextColor={colors.textLight} />
        <Text style={[styles.label, { marginTop: spacing.md }]}>Content</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Write your post..." placeholderTextColor={colors.textLight} multiline numberOfLines={8} />
        <Button title="Publish" onPress={() => {}} style={styles.btn} />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.label },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: spacing.md, marginTop: spacing.xs, ...typography.body },
  textArea: { minHeight: 160, textAlignVertical: 'top' },
  btn: { marginTop: spacing.lg },
});
