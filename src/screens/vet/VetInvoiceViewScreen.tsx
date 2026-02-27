import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { VetStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useVetInvoice } from '../../queries/vetQueries';
import { useTranslation } from 'react-i18next';

type Route = RouteProp<VetStackParamList, 'VetInvoiceView'>;

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(timeStr?: string): string {
  if (!timeStr) return '';
  return String(timeStr);
}

export function VetInvoiceViewScreen() {
  const { t } = useTranslation();
  const route = useRoute<Route>();
  const transactionId = route.params?.transactionId;
  const { data: response, isLoading, error } = useVetInvoice(transactionId);

  const invoice = React.useMemo(() => {
    const body = response as { data?: Record<string, unknown> } | undefined;
    return body?.data ?? null;
  }, [response]);

  if (isLoading) {
    return (
      <ScreenContainer padded>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (error || !invoice) {
    return (
      <ScreenContainer padded>
        <Text style={styles.errorText}>
          {(error as { message?: string })?.message ?? t('vetInvoiceView.notFound')}
        </Text>
      </ScreenContainer>
    );
  }

  const apt = invoice.relatedAppointmentId as Record<string, unknown> | undefined;
  const pet = apt?.petId as Record<string, unknown> | undefined;
  const owner = apt?.petOwnerId as Record<string, unknown> | undefined;
  const amount = Number((invoice.amount as number) ?? 0);
  const status = String((invoice.status as string) ?? '').toUpperCase();
  const createdAt = invoice.createdAt as string | undefined;
  const appointmentNumber = (apt?.appointmentNumber as string) ?? transactionId;
  const appointmentDate = apt?.appointmentDate as string | undefined;
  const appointmentTime = apt?.appointmentTime as string | undefined;
  const petName = (pet?.name as string) ?? '—';
  const petSpecies = (pet?.species as string) ?? '';
  const petBreed = (pet?.breed as string) ?? '';
  const ownerName = (owner?.name as string) ?? (owner?.fullName as string) ?? '—';
  const ownerEmail = (owner?.email as string) ?? '';

  return (
    <ScreenContainer scroll padded>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Text style={styles.label}>{t('vetInvoiceView.labels.invoiceTransaction')}</Text>
          <Text style={styles.value}>{appointmentNumber}</Text>

          <Text style={[styles.label, { marginTop: spacing.md }]}>{t('vetInvoiceView.labels.amount')}</Text>
          <Text style={styles.amount}>€{amount.toFixed(2)}</Text>

          <Text style={[styles.label, { marginTop: spacing.md }]}>{t('vetInvoiceView.labels.status')}</Text>
          <View style={[styles.statusBadge, (status === 'PAID' || status === 'COMPLETED') ? styles.statusPaid : styles.statusPending]}>
            <Text style={styles.statusText}>{status || '—'}</Text>
          </View>

          <Text style={[styles.label, { marginTop: spacing.md }]}>{t('vetInvoiceView.labels.date')}</Text>
          <Text style={styles.value}>{formatDate(createdAt)}</Text>

          <Text style={[styles.label, { marginTop: spacing.md }]}>{t('vetInvoiceView.labels.appointment')}</Text>
          <Text style={styles.value}>
            {formatDate(appointmentDate)}
            {appointmentTime ? ` · ${formatTime(appointmentTime)}` : ''}
          </Text>

          <Text style={[styles.label, { marginTop: spacing.md }]}>{t('vetInvoiceView.labels.pet')}</Text>
          <Text style={styles.value}>{petName}{petSpecies || petBreed ? ` · ${[petSpecies, petBreed].filter(Boolean).join(', ')}` : ''}</Text>

          <Text style={[styles.label, { marginTop: spacing.md }]}>{t('vetInvoiceView.labels.owner')}</Text>
          <Text style={styles.value}>{ownerName}</Text>
          {ownerEmail ? <Text style={styles.valueSecondary}>{ownerEmail}</Text> : null}
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  errorText: { ...typography.body, color: colors.error },
  card: { marginBottom: spacing.md },
  label: { ...typography.caption, color: colors.textSecondary },
  value: { ...typography.body, marginTop: 2 },
  valueSecondary: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  amount: { ...typography.h1, color: colors.primary, marginTop: 2 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginTop: 4 },
  statusPaid: { backgroundColor: colors.successLight },
  statusPending: { backgroundColor: colors.warningLight },
  statusText: { ...typography.label, fontWeight: '600' },
});
