import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import type { PetOwnerStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { usePaymentTransaction } from '../../queries/petOwnerQueries';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTranslation } from 'react-i18next';

type Route = RouteProp<PetOwnerStackParamList, 'PetOwnerInvoiceView'>;

function formatDate(dateString: string | undefined, naLabel: string): string {
  if (!dateString) return naLabel;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return naLabel;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(amount: number | undefined | null, naLabel: string, currency = 'EUR'): string {
  if (amount === null || amount === undefined) return naLabel;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'EUR' }).format(amount);
}

export function PetOwnerInvoiceViewScreen() {
  const route = useRoute<Route>();
  const transactionId = route.params?.transactionId;
  const { t } = useTranslation();
  const naLabel = t('common.na');

  const { data, isLoading } = usePaymentTransaction(transactionId);

  const txn = useMemo(() => {
    const payload = (data as { data?: unknown })?.data ?? data;
    return (payload as Record<string, unknown>) ?? null;
  }, [data]);

  const appointment = txn?.relatedAppointmentId as Record<string, unknown> | undefined;
  const veterinarian = appointment?.veterinarianId as { name?: string; email?: string; profileImage?: string } | undefined;
  const petOwner = appointment?.petOwnerId as { name?: string; email?: string; profileImage?: string } | undefined;
  const pet = appointment?.petId as { name?: string; photo?: string } | undefined;

  if (!transactionId) {
    return (
      <ScreenContainer padded>
        <Card><Text style={styles.error}>{t('petOwnerInvoiceView.notFound')}</Text></Card>
      </ScreenContainer>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer padded>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!txn) {
    return (
      <ScreenContainer padded>
        <Card><Text style={styles.error}>{t('petOwnerInvoiceView.notFound')}</Text></Card>
      </ScreenContainer>
    );
  }

  const orderLabel = (appointment?.appointmentNumber as string) || (txn._id as string) || naLabel;
  const description = ((appointment?.reason as string) || t('petOwnerInvoices.defaults.appointment')) + (pet?.name ? ` (${pet.name})` : '');

  return (
    <ScreenContainer scroll padded>
      <Card>
        <View style={styles.header}>
          <Text style={styles.title}>{t('petOwnerInvoiceView.title')}</Text>
          <Text style={styles.meta}><Text style={styles.metaLabel}>{t('petOwnerInvoiceView.meta.order')}</Text> {orderLabel}</Text>
          <Text style={styles.meta}><Text style={styles.metaLabel}>{t('petOwnerInvoiceView.meta.issued')}</Text> {formatDate(txn.createdAt as string, naLabel)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('petOwnerInvoiceView.sections.from')}</Text>
          <Text style={styles.body}>{veterinarian?.name ?? naLabel}</Text>
          {veterinarian?.email ? <Text style={styles.bodySmall}>{veterinarian.email}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('petOwnerInvoiceView.sections.to')}</Text>
          <Text style={styles.body}>{petOwner?.name ?? naLabel}</Text>
          {petOwner?.email ? <Text style={styles.bodySmall}>{petOwner.email}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('petOwnerInvoiceView.sections.paymentMethod')}</Text>
          <Text style={styles.body}>{String(txn.provider ?? naLabel)}</Text>
          <Text style={styles.bodySmall}>{String(txn.status ?? '')}</Text>
        </View>

        <View style={styles.tableWrap}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableHead]}>{t('petOwnerInvoiceView.table.description')}</Text>
            <Text style={[styles.tableCell, styles.tableHead, styles.textCenter]}>{t('petOwnerInvoiceView.table.quantity')}</Text>
            <Text style={[styles.tableCell, styles.tableHead, styles.textCenter]}>{t('petOwnerInvoiceView.table.vat')}</Text>
            <Text style={[styles.tableCell, styles.tableHead, styles.textEnd]}>{t('petOwnerInvoiceView.table.total')}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>{description}</Text>
            <Text style={[styles.tableCell, styles.textCenter]}>1</Text>
            <Text style={[styles.tableCell, styles.textCenter]}>0</Text>
            <Text style={[styles.tableCell, styles.textEnd]}>{formatCurrency(txn.amount as number, naLabel, txn.currency as string)}</Text>
          </View>
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('petOwnerInvoiceView.totals.subtotal')}</Text>
            <Text style={styles.totalValue}>{formatCurrency(txn.amount as number, naLabel, txn.currency as string)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('petOwnerInvoiceView.totals.discount')}</Text>
            <Text style={styles.totalValue}>{naLabel}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('petOwnerInvoiceView.totals.totalAmount')}</Text>
            <Text style={[styles.totalValue, styles.totalAmount]}>{formatCurrency(txn.amount as number, naLabel, txn.currency as string)}</Text>
          </View>
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.lg },
  title: { ...typography.h3, marginBottom: spacing.sm },
  meta: { ...typography.bodySmall, color: colors.textSecondary },
  metaLabel: { fontWeight: '600', color: colors.text },
  section: { marginBottom: spacing.md },
  sectionTitle: { ...typography.label, marginBottom: 4, fontWeight: '600' },
  body: { ...typography.body },
  bodySmall: { ...typography.caption, color: colors.textSecondary },
  tableWrap: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginTop: spacing.md },
  tableRow: { flexDirection: 'row', paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  tableCell: { flex: 1, ...typography.bodySmall },
  tableHead: { fontWeight: '600' },
  textCenter: { textAlign: 'center' },
  textEnd: { textAlign: 'right' },
  totals: { marginTop: spacing.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { ...typography.body },
  totalValue: { ...typography.body },
  totalAmount: { ...typography.h3, color: colors.primary },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { ...typography.body, color: colors.error },
});
