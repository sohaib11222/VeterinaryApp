import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { VetStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Route = RouteProp<VetStackParamList, 'VetStartAppointment'>;

export function VetStartAppointmentScreen() {
  const route = useRoute<Route>();
  const appointmentId = route.params?.appointmentId;

  return (
    <ScreenContainer padded>
      <Card>
        <View style={styles.placeholder}>
          <Text style={styles.icon}>📹</Text>
          <Text style={styles.title}>Video Session</Text>
          <Text style={styles.subtitle}>
            Start consultation for appointment {appointmentId || '—'}. Video call integration (e.g. Stream) will be added during API integration.
          </Text>
          <Button title="End Session (placeholder)" onPress={() => {}} variant="outline" style={styles.btn} />
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', paddingVertical: spacing.xl },
  icon: { fontSize: 48, marginBottom: spacing.md },
  title: { ...typography.h2, marginBottom: spacing.sm },
  subtitle: { ...typography.bodySmall, textAlign: 'center', marginBottom: spacing.lg },
  btn: { minWidth: 160 },
});
