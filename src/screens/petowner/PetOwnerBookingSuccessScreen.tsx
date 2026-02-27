import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { PetOwnerStackParamList } from '../../navigation/types';
import { useTranslation } from 'react-i18next';

type Route = RouteProp<PetOwnerStackParamList, 'PetOwnerBookingSuccess'>;

export function PetOwnerBookingSuccessScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { t } = useTranslation();
  const appointmentId = route.params?.appointmentId ?? '';

  return (
    <ScreenContainer padded>
      <Card>
        <Text style={styles.icon}>✓</Text>
        <Text style={styles.title}>{t('petOwnerBookingSuccess.title')}</Text>
        <Text style={styles.message}>{t('petOwnerBookingSuccess.message')}</Text>
        {appointmentId ? (
          <Text style={styles.id}>{t('petOwnerBookingSuccess.reference', { id: appointmentId })}</Text>
        ) : null}
        <Button
          title={t('petOwnerBookingSuccess.actions.viewAppointments')}
          onPress={() => navigation.navigate('PetOwnerTabs', { screen: 'PetOwnerAppointments' })}
          style={styles.btn}
        />
        <Button
          title={t('petOwnerBookingSuccess.actions.backToHome')}
          variant="outline"
          onPress={() => navigation.navigate('PetOwnerTabs', { screen: 'PetOwnerHome' })}
          style={styles.btnOutline}
        />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  icon: { fontSize: 48, color: colors.success, textAlign: 'center', marginBottom: spacing.md },
  title: { ...typography.h2, textAlign: 'center', marginBottom: spacing.sm },
  message: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.sm },
  id: { ...typography.caption, color: colors.textLight, textAlign: 'center', marginBottom: spacing.md },
  btn: { marginBottom: spacing.sm },
  btnOutline: {},
});
