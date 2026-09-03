import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import type { PetOwnerStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { usePaymentTransaction } from '../../queries/petOwnerQueries';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Button } from '../../components/common/Button';
import { API_ROUTES } from '../../api/apiConfig';
import { downloadAndSharePdf } from '../../utils/nativePdf';

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
  const [isDownloading, setIsDownloading] = useState(false);

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
  const status = String(txn.status ?? 'SUCCESS').toUpperCase();
  const amount = formatCurrency(txn.amount as number, naLabel, txn.currency as string);
  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadAndSharePdf(
        API_ROUTES.PET_OWNER.INVOICE_PDF(transactionId!),
        `veterinary-invoice-${String(orderLabel)}.pdf`
      );
    } catch (err: unknown) {
      Toast.show({ type: 'error', text1: (err as { message?: string })?.message ?? t('petOwnerInvoices.errors.downloadFailed') });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <ScreenContainer scroll padded>
      <View style={styles.invoiceHero}>
        <View style={styles.heroTop}>
          <View style={styles.brandBlock}><View style={styles.brandIcon}><Ionicons name="receipt-outline" size={23} color={colors.primaryDark} /></View><View><Text style={styles.brand}>{t('petOwnerInvoiceView.title')}</Text><Text style={styles.heroRef}>#{String(orderLabel)}</Text></View></View>
          <View style={[styles.statusBadge, status === 'SUCCESS' ? styles.statusPaid : styles.statusOther]}><Text style={[styles.statusBadgeText, status === 'SUCCESS' ? styles.statusPaidText : styles.statusOtherText]}>{status}</Text></View>
        </View>
        <Text style={styles.heroAmount}>{amount}</Text>
        <Text style={styles.heroIssued}>{t('petOwnerInvoiceView.meta.issued')} {formatDate(txn.createdAt as string, naLabel)}</Text>
      </View>

      <Button
        title={isDownloading ? t('petOwnerInvoices.actions.preparing') : t('petOwnerInvoices.actions.downloadPdf')}
        variant="outline"
        icon={isDownloading ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="download-outline" size={19} color={colors.primary} />}
        onPress={handleDownload}
        disabled={isDownloading}
        style={styles.downloadButton}
      />

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>{t('petOwnerInvoiceView.sections.from')}</Text>
        <View style={styles.personRow}><View style={styles.personIcon}><Ionicons name="medkit-outline" size={18} color={colors.primary} /></View><View style={styles.personCopy}><Text style={styles.body}>{veterinarian?.name ?? naLabel}</Text>{veterinarian?.email ? <Text style={styles.bodySmall}>{veterinarian.email}</Text> : null}</View></View>

        <View style={styles.cardDivider} />
        <Text style={styles.sectionTitle}>{t('petOwnerInvoiceView.sections.to')}</Text>
        <View style={styles.personRow}><View style={styles.personIcon}><Ionicons name="paw-outline" size={18} color={colors.primary} /></View><View style={styles.personCopy}><Text style={styles.body}>{pet?.name ?? petOwner?.name ?? naLabel}</Text><Text style={styles.bodySmall}>{[(pet as { species?: string } | undefined)?.species, (pet as { breed?: string } | undefined)?.breed].filter(Boolean).join(' · ') || petOwner?.email || naLabel}</Text></View></View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>{t('petOwnerInvoiceView.table.description')}</Text>
        <View style={styles.lineItem}><View style={styles.lineItemIcon}><Ionicons name="calendar-outline" size={18} color={colors.primary} /></View><View style={styles.lineItemCopy}><Text style={styles.lineItemName}>{description}</Text><Text style={styles.bodySmall}>{formatDate(appointment?.appointmentDate as string, naLabel)} {(appointment?.appointmentTime as string) ? `· ${appointment?.appointmentTime}` : ''}</Text></View><Text style={styles.lineTotal}>{amount}</Text></View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>{t('petOwnerInvoiceView.sections.paymentMethod')}</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoCell}><Text style={styles.infoLabel}>{t('petOwnerInvoiceView.meta.order')}</Text><Text style={styles.infoValue}>#{String(orderLabel)}</Text></View>
          <View style={styles.infoCell}><Text style={styles.infoLabel}>{t('petOwnerInvoiceView.sections.paymentMethod')}</Text><Text style={styles.infoValue}>{String(txn.provider ?? 'STRIPE')}</Text></View>
          <View style={styles.infoCell}><Text style={styles.infoLabel}>{t('petOwnerInvoiceView.meta.transactionId')}</Text><Text style={styles.infoValue} numberOfLines={1}>{String(txn._id ?? naLabel)}</Text></View>
          <View style={styles.infoCell}><Text style={styles.infoLabel}>{t('petOwnerInvoiceView.meta.paymentStatus')}</Text><Text style={styles.infoValue}>{status}</Text></View>
        </View>
      </Card>

      <Card style={styles.totalCard}>
        <View style={styles.totalRow}><Text style={styles.totalLabel}>{t('petOwnerInvoiceView.totals.subtotal')}</Text><Text style={styles.totalValue}>{amount}</Text></View>
        <View style={styles.totalRow}><Text style={styles.totalLabel}>{t('petOwnerInvoiceView.totals.discount')}</Text><Text style={styles.totalValue}>{naLabel}</Text></View>
        <View style={styles.totalDivider} />
        <View style={styles.totalRow}><Text style={styles.totalLabelStrong}>{t('petOwnerInvoiceView.totals.totalAmount')}</Text><Text style={styles.totalAmount}>{amount}</Text></View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  invoiceHero: { backgroundColor: colors.primaryDark, borderRadius: 20, padding: spacing.lg, overflow: 'hidden', marginBottom: spacing.md },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  brandBlock: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  brandIcon: { width: 45, height: 45, borderRadius: 14, backgroundColor: colors.secondaryLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  brand: { ...typography.h3, color: colors.textInverse },
  heroRef: { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9 },
  statusPaid: { backgroundColor: colors.successLight },
  statusOther: { backgroundColor: colors.warningLight },
  statusBadgeText: { ...typography.caption, fontWeight: '800' },
  statusPaidText: { color: colors.primaryDark },
  statusOtherText: { color: '#805B00' },
  heroAmount: { ...typography.h1, fontSize: 32, color: colors.textInverse, marginTop: spacing.lg },
  heroIssued: { ...typography.caption, color: 'rgba(255,255,255,0.74)', marginTop: 4 },
  downloadButton: { marginBottom: spacing.md },
  card: { borderWidth: 1, borderColor: colors.borderLight, marginBottom: spacing.md },
  sectionTitle: { ...typography.caption, color: colors.textSecondary, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: spacing.sm },
  personRow: { flexDirection: 'row', alignItems: 'center' },
  personIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '18', marginRight: spacing.sm },
  personCopy: { flex: 1 },
  cardDivider: { height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.md },
  body: { ...typography.body },
  bodySmall: { ...typography.caption, color: colors.textSecondary },
  lineItem: { flexDirection: 'row', alignItems: 'center' },
  lineItemIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '18', marginRight: spacing.sm },
  lineItemCopy: { flex: 1, minWidth: 0 },
  lineItemName: { ...typography.label, color: colors.text },
  lineTotal: { ...typography.label, color: colors.primaryDark, paddingLeft: spacing.sm },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: colors.borderLight, borderRadius: 12, overflow: 'hidden' },
  infoCell: { width: '50%', minHeight: 66, padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  infoLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  infoValue: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
  totalCard: { backgroundColor: colors.primaryLight + '10', borderWidth: 1, borderColor: colors.primaryLight + '24', marginBottom: spacing.xl },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { ...typography.bodySmall, color: colors.textSecondary },
  totalLabelStrong: { ...typography.label, color: colors.primaryDark },
  totalValue: { ...typography.bodySmall, color: colors.text },
  totalDivider: { height: 1, backgroundColor: colors.primaryLight + '35', marginVertical: spacing.sm },
  totalAmount: { ...typography.h3, color: colors.primaryDark },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { ...typography.body, color: colors.error },
});
