import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTranslation } from 'react-i18next';

export function PetOwnerDocumentsScreen() {
  const { t } = useTranslation();
  const MOCK_DOCS = [
    { id: '1', name: t('petOwnerDocuments.mockDocs.vaccinationCertificateMax'), date: t('petOwnerDocuments.mockDocs.date1') },
    { id: '2', name: t('petOwnerDocuments.mockDocs.invoiceTx1'), date: t('petOwnerDocuments.mockDocs.date1') },
  ];
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
            <Text style={styles.download}>{t('petOwnerDocuments.actions.download')}</Text>
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
