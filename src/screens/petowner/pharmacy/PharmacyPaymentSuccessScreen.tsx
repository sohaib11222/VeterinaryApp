import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { typography } from '../../../theme/typography';
import { useTranslation } from 'react-i18next';

export function PharmacyPaymentSuccessScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  return (
    <ScreenContainer padded>
      <View style={styles.center}>
        <Card style={styles.card}>
          <View style={styles.content}>
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>✓</Text>
            </View>
            <Text style={styles.title}>{t('petOwnerPharmacyPaymentSuccess.title')}</Text>
            <Text style={styles.subtitle}>{t('petOwnerPharmacyPaymentSuccess.subtitle')}</Text>
            <Button title={t('petOwnerPharmacyPaymentSuccess.actions.backToShop')} onPress={() => navigation.navigate('PharmacyHome')} style={styles.btn} />
            <Button
              title={t('petOwnerPharmacyPaymentSuccess.actions.viewOrders')}
              onPress={() => {
                const root = (navigation as any).getParent()?.getParent();
                root?.navigate('PetOwnerOrderHistory');
              }}
            />
          </View>
        </Card>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { width: '100%', maxWidth: 400 },
  content: { alignItems: 'center', padding: spacing.xl },
  iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.successLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  icon: { fontSize: 32, color: colors.success, fontWeight: '700' },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  btn: { marginBottom: spacing.sm },
});
