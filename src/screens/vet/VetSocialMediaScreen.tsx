import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function VetSocialMediaScreen() {
  const { t } = useTranslation();
  return (
    <ScreenContainer scroll padded>
      <Card>
        <Text style={styles.sectionTitle}>{t('vetSocialMedia.title')}</Text>
        <Input label={t('vetSocialMedia.fields.facebook')} placeholder={t('vetSocialMedia.placeholders.url')} value="" onChangeText={() => {}} />
        <Input label={t('vetSocialMedia.fields.instagram')} placeholder={t('vetSocialMedia.placeholders.url')} value="" onChangeText={() => {}} />
        <Input label={t('vetSocialMedia.fields.twitter')} placeholder={t('vetSocialMedia.placeholders.url')} value="" onChangeText={() => {}} />
        <Input label={t('vetSocialMedia.fields.linkedin')} placeholder={t('vetSocialMedia.placeholders.url')} value="" onChangeText={() => {}} />
        <Button title={t('common.save')} onPress={() => {}} />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
});
