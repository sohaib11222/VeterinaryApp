import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { PharmacyOrdersStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTranslation } from 'react-i18next';

type Route = RouteProp<PharmacyOrdersStackParamList, 'PharmacyOrderStatus'>;

export function PharmacyOrderStatusScreen() {
  const { t } = useTranslation();
  const route = useRoute<Route>();
  const orderId = route.params?.orderId;

  return (
    <ScreenContainer padded>
      <Card>
        <Text style={styles.title}>{t('pharmacyOrderStatus.title')}</Text>
        <Text style={styles.orderId}>{t('pharmacyOrderStatus.orderId', { orderId })}</Text>
        <View style={styles.buttons}>
          {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
            <Button key={s} title={t(`pharmacyOrders.statusLabels.${s}`, { defaultValue: s })} onPress={() => {}} style={styles.statusBtn} />
          ))}
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h3, marginBottom: spacing.sm },
  orderId: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  buttons: { gap: 8 },
  statusBtn: { marginBottom: 8 },
});
