import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { VetStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useVetInvoice } from '../../queries/vetQueries';
import { API_ROUTES } from '../../api/apiConfig';
import { downloadAndSharePdf } from '../../utils/nativePdf';
import { useTranslation } from 'react-i18next';

type Route = RouteProp<VetStackParamList, 'VetInvoiceView'>;
function formatDate(value?: string) { const date = value ? new Date(value) : null; return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }
function formatCurrency(value?: number, currency = 'EUR') { return new Intl.NumberFormat('en-IE', { style: 'currency', currency: currency || 'EUR' }).format(Number(value ?? 0)); }

export function VetInvoiceViewScreen() {
  const { t } = useTranslation();
  const route = useRoute<Route>();
  const transactionId = route.params?.transactionId;
  const invoiceQuery = useVetInvoice(transactionId);
  const [downloading, setDownloading] = useState(false);
  const invoice = useMemo(() => {
    const outer = (invoiceQuery.data as { data?: unknown } | undefined)?.data ?? invoiceQuery.data;
    return ((outer as { data?: Record<string, unknown> } | undefined)?.data ?? outer) as Record<string, any> | null;
  }, [invoiceQuery.data]);
  const download = async () => {
    if (!transactionId) return;
    try { setDownloading(true); await downloadAndSharePdf(API_ROUTES.VETERINARIANS.INVOICE_PDF(transactionId), `veterinary-invoice-${String(invoice?.relatedAppointmentId?.appointmentNumber ?? transactionId)}.pdf`); }
    catch (error) { Toast.show({ type: 'error', text1: (error as { message?: string })?.message ?? t('vetInvoices.errors.downloadFailed') }); }
    finally { setDownloading(false); }
  };
  if (invoiceQuery.isLoading) return <ScreenContainer padded><View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View></ScreenContainer>;
  if (invoiceQuery.error || !invoice) return <ScreenContainer padded><View style={styles.errorWrap}><Ionicons name="alert-circle-outline" size={28} color={colors.error} /><Text style={styles.errorText}>{(invoiceQuery.error as { message?: string })?.message ?? t('vetInvoiceView.notFound')}</Text></View></ScreenContainer>;

  const appointment = (invoice.relatedAppointmentId ?? {}) as Record<string, any>;
  const pet = (appointment.petId ?? {}) as Record<string, any>;
  const owner = (appointment.petOwnerId ?? invoice.userId ?? {}) as Record<string, any>;
  const status = String(invoice.status ?? 'PENDING').toUpperCase();
  const statusColor = status === 'SUCCESS' ? colors.success : status === 'FAILED' ? colors.error : status === 'REFUNDED' ? colors.info : colors.warning;
  const reference = appointment.appointmentNumber || `#${String(invoice._id ?? transactionId).slice(-8).toUpperCase()}`;
  const rows = [
    [t('vetInvoiceView.labels.issued'), formatDate(invoice.createdAt), 'calendar-outline'],
    [t('vetInvoiceView.labels.paymentMethod'), String(invoice.provider ?? 'STRIPE'), 'card-outline'],
    [t('vetInvoiceView.labels.transactionId'), String(invoice._id ?? transactionId), 'finger-print-outline'],
  ];
  return <ScreenContainer scroll padded><ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
    <View style={styles.invoiceHero}><View style={styles.brandRow}><View style={styles.brandIcon}><Ionicons name="paw" size={18} color={colors.primaryDark} /></View><Text style={styles.brandText}>MyPetPlus</Text></View><Text style={styles.heroEyebrow}>{t('vetInvoiceView.labels.invoice')}</Text><Text style={styles.heroTitle}>{reference}</Text><View style={styles.heroBottom}><View style={[styles.statusBadge, { backgroundColor: colors.background }]}><View style={[styles.statusDot, { backgroundColor: statusColor }]} /><Text style={[styles.statusText, { color: statusColor }]}>{t(`vetInvoices.status.${status}`, { defaultValue: status })}</Text></View><Text style={styles.heroAmount}>{formatCurrency(invoice.amount, invoice.currency)}</Text></View></View>
    <View style={styles.sectionTitleRow}><Ionicons name="people-outline" size={17} color={colors.primary} /><Text style={styles.sectionTitle}>{t('vetInvoiceView.labels.parties')}</Text></View>
    <Card style={styles.partiesCard}><View style={styles.party}><View style={styles.partyIcon}><Ionicons name="person-outline" size={18} color={colors.primary} /></View><View style={styles.partyCopy}><Text style={styles.partyLabel}>{t('vetInvoiceView.labels.owner')}</Text><Text style={styles.partyName}>{owner.fullName || owner.name || owner.email || '—'}</Text>{owner.email ? <Text style={styles.partyMeta}>{owner.email}</Text> : null}</View></View><View style={styles.divider} /><View style={styles.party}><View style={styles.partyIcon}><Ionicons name="paw-outline" size={18} color={colors.primary} /></View><View style={styles.partyCopy}><Text style={styles.partyLabel}>{t('vetInvoiceView.labels.pet')}</Text><Text style={styles.partyName}>{pet.name || '—'}</Text><Text style={styles.partyMeta}>{[pet.species, pet.breed].filter(Boolean).join(' · ') || '—'}</Text></View></View></Card>
    <View style={styles.sectionTitleRow}><Ionicons name="calendar-outline" size={17} color={colors.primary} /><Text style={styles.sectionTitle}>{t('vetInvoiceView.labels.appointment')}</Text></View>
    <Card style={styles.appointmentCard}><Text style={styles.appointmentReason}>{appointment.reason || t('vetInvoices.labels.consultation')}</Text><Text style={styles.appointmentDate}>{formatDate(appointment.appointmentDate)}{appointment.appointmentTime ? ` · ${appointment.appointmentTime}` : ''}</Text><View style={styles.totalRow}><Text style={styles.totalLabel}>{t('vetInvoiceView.labels.consultationTotal')}</Text><Text style={styles.totalValue}>{formatCurrency(invoice.amount, invoice.currency)}</Text></View></Card>
    <View style={styles.sectionTitleRow}><Ionicons name="information-circle-outline" size={17} color={colors.primary} /><Text style={styles.sectionTitle}>{t('vetInvoiceView.labels.paymentInformation')}</Text></View>
    <Card style={styles.infoCard}>{rows.map(([label, value, icon], index) => <View key={String(label)} style={[styles.infoRow, index < rows.length - 1 && styles.infoBorder]}><View style={styles.infoLabelWrap}><Ionicons name={icon as any} size={16} color={colors.textSecondary} /><Text style={styles.infoLabel}>{label}</Text></View><Text style={styles.infoValue} numberOfLines={1}>{value}</Text></View>)}</Card>
    <TouchableOpacity style={styles.downloadButton} onPress={download} disabled={downloading}>{downloading ? <ActivityIndicator size="small" color={colors.textInverse} /> : <Ionicons name="download-outline" size={19} color={colors.textInverse} />}<Text style={styles.downloadText}>{downloading ? t('vetInvoices.actions.preparing') : t('vetInvoices.actions.downloadPdf')}</Text></TouchableOpacity>
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm }, errorText: { ...typography.bodySmall, color: colors.error, textAlign: 'center' },
  invoiceHero: { backgroundColor: colors.primaryDark, borderRadius: 20, padding: spacing.lg, marginBottom: spacing.lg }, brandRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, brandIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.secondaryLight, alignItems: 'center', justifyContent: 'center' }, brandText: { ...typography.label, color: colors.textInverse }, heroEyebrow: { ...typography.caption, color: colors.textInverse, opacity: 0.7, marginTop: spacing.lg, textTransform: 'uppercase', letterSpacing: 1 }, heroTitle: { ...typography.h2, color: colors.textInverse, marginTop: 4 }, heroBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: spacing.lg }, statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9 }, statusDot: { width: 7, height: 7, borderRadius: 4 }, statusText: { ...typography.caption, fontWeight: '800' }, heroAmount: { ...typography.h2, color: colors.textInverse },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm }, sectionTitle: { ...typography.label, color: colors.primaryDark }, partiesCard: { borderWidth: 1, borderColor: colors.borderLight }, party: { flexDirection: 'row', alignItems: 'center' }, partyIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primaryLight + '17', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm }, partyCopy: { flex: 1 }, partyLabel: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase' }, partyName: { ...typography.label, marginTop: 1 }, partyMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 1 }, divider: { height: 1, backgroundColor: colors.borderLight, marginVertical: spacing.md },
  appointmentCard: { borderWidth: 1, borderColor: colors.borderLight }, appointmentReason: { ...typography.body, fontWeight: '700' }, appointmentDate: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 }, totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight }, totalLabel: { ...typography.label }, totalValue: { ...typography.h3, color: colors.primaryDark },
  infoCard: { borderWidth: 1, borderColor: colors.borderLight }, infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs }, infoBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight, paddingBottom: spacing.sm, marginBottom: spacing.sm }, infoLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }, infoLabel: { ...typography.bodySmall, color: colors.textSecondary }, infoValue: { ...typography.caption, color: colors.text, fontWeight: '700', maxWidth: '54%', textAlign: 'right' }, downloadButton: { minHeight: 50, backgroundColor: colors.primary, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.sm }, downloadText: { ...typography.label, color: colors.textInverse },
});
