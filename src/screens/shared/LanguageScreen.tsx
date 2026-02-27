import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { useLanguage } from '../../contexts/LanguageContext';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const LANGUAGES: Array<{ code: 'en' | 'it'; labelKey: string }> = [
  { code: 'en', labelKey: 'languageScreen.english' },
  { code: 'it', labelKey: 'languageScreen.italian' },
];

export function LanguageScreen() {
  const { language, setLanguage } = useLanguage();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return (
    <ScreenContainer padded>
      <Card>
        {LANGUAGES.map((item, idx) => {
          const selected = item.code === language;
          return (
            <TouchableOpacity
              key={item.code}
              style={[styles.row, idx < LANGUAGES.length - 1 && styles.rowBorder]}
              activeOpacity={0.8}
              onPress={async () => {
                await setLanguage(item.code);
                queryClient.invalidateQueries();
              }}
            >
              <View style={styles.left}>
                <Text style={styles.label}>{t(item.labelKey)}</Text>
                <Text style={styles.code}>{item.code}</Text>
              </View>
              <Text style={[styles.check, selected ? styles.checkOn : styles.checkOff]}>
                {selected ? '✓' : '○'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  left: { flex: 1 },
  label: { ...typography.body, fontWeight: '600' },
  code: { ...typography.caption, marginTop: 2 },
  check: { fontSize: 18, width: 28, textAlign: 'right' },
  checkOn: { color: colors.primary },
  checkOff: { color: colors.textLight },
});
