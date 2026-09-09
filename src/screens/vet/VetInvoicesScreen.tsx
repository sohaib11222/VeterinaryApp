import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useVetInvoices } from '../../queries/vetQueries';
import { API_ROUTES } from '../../api/apiConfig';
import { downloadAndSharePdf } from '../../utils/nativePdf';
import { useTranslation } from 'react-i18next';

type InvoiceStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';
type DateRange = 'ALL' | '30_DAYS' | '90_DAYS' | 'THIS_YEAR';
type TransactionItem = {
  _id: string; amount?: number; currency?: string; status?: string; createdAt?: string; provider?: string;
  relatedAppointmentId?: { appointmentNumber?: string; appointmentDate?: string; appointmentTime?: string; reason?: string; petId?: { name?: string; species?: string }; petOwnerId?: { name?: string; fullName?: string; email?: string } };
};

function unwrapInvoices(response: unknown): { transactions: TransactionItem[]; pagination: { page: number; pages: number; total: number } } {
  const outer = (response as { data?: unknown })?.data ?? response;
  const payload = ((outer as { data?: unknown })?.data ?? outer) as { transactions?: TransactionItem[]; pagination?: { page?: number; pages?: number; total?: number } } | undefined;
  return { transactions: Array.isArray(payload?.transactions) ? payload.transactions : [], pagination: { page: payload?.pagination?.page ?? 1, pages: payload?.pagination?.pages ?? 1, total: payload?.pagination?.total ?? 0 } };
}

function formatCurrency(value?: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: currency || 'EUR' }).format(Number(value ?? 0));
}

function formatDate(value?: string): string {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

export function VetInvoicesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<InvoiceStatus | ''>('');
  const [range, setRange] = useState<DateRange>('ALL');
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const dateParams = useMemo(() => {
    const now = new Date(); const toDate = now.toISOString();
    if (range === '30_DAYS' || range === '90_DAYS') { const from = new Date(now); from.setDate(now.getDate() - (range === '30_DAYS' ? 30 : 90)); return { fromDate: from.toISOString(), toDate }; }
    return range === 'THIS_YEAR' ? { fromDate: new Date(now.getFullYear(), 0, 1).toISOString(), toDate } : {};
  }, [range]);
  const invoiceQuery = useVetInvoices({ page, limit: 12, search: search.trim() || undefined, status: status || undefined, ...dateParams });
  const { transactions, pagination } = useMemo(() => unwrapInvoices(invoiceQuery.data), [invoiceQuery.data]);
  const visibleInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return transactions;
    return transactions.filter((invoice) => {
      const appointment = invoice.relatedAppointmentId; const owner = appointment?.petOwnerId; const pet = appointment?.petId;
      return [invoice._id, appointment?.appointmentNumber, owner?.name, owner?.fullName, pet?.name].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
    });
  }, [transactions, search]);
  const statusColor = (value?: string) => {
    switch (String(value ?? '').toUpperCase()) { case 'SUCCESS': return colors.success; case 'FAILED': return colors.error; case 'REFUNDED': return colors.info; default: return colors.warning; }
  };
  const statusLabel = (value?: string) => t(`vetInvoices.status.${String(value ?? 'PENDING').toUpperCase()}`, { defaultValue: value || t('vetInvoices.status.PENDING') });
  const resetFilters = () => { setSearch(''); setStatus(''); setRange('ALL'); setPage(1); };
  const downloadInvoice = async (invoice: TransactionItem) => {
    try { setDownloadingId(invoice._id); await downloadAndSharePdf(API_ROUTES.VETERINARIANS.INVOICE_PDF(invoice._id), `veterinary-invoice-${String(invoice.relatedAppointmentId?.appointmentNumber ?? invoice._id)}.pdf`); }
    catch (error) { Toast.show({ type: 'error', text1: (error as { message?: string })?.message ?? t('vetInvoices.errors.downloadFailed') }); }
    finally { setDownloadingId(null); }
  };

  return (
    <ScreenContainer padded>
      <View style={styles.hero}><View style={styles.heroIcon}><Ionicons name="receipt-outline" size={23} color={colors.primaryDark} /></View><View style={styles.heroCopy}><Text style={styles.heroTitle}>{t('menu.invoices')}</Text><Text style={styles.heroText}>{t('vetInvoices.subtitle')}</Text></View><View style={styles.heroCount}><Text style={styles.heroCountText}>{pagination.total || visibleInvoices.length}</Text></View></View>
      <View style={styles.searchContainer}><Ionicons name="search-outline" size={19} color={colors.textSecondary} style={styles.searchIcon} /><TextInput style={styles.searchInput} placeholder={t('vetInvoices.searchPlaceholder')} placeholderTextColor={colors.textLight} value={search} onChangeText={(value) => { setSearch(value); setPage(1); }} />{search ? <TouchableOpacity onPress={() => { setSearch(''); setPage(1); }}><Ionicons name="close-circle" size={18} color={colors.textLight} /></TouchableOpacity> : null}</View>
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>{t('vetInvoices.filters.status')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll} accessibilityLabel="Filter invoices by status">
          {(['', 'SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'] as const).map((value) => {
            const selected = value === status;
            return <TouchableOpacity key={value || 'all'} style={[styles.filterButton, selected && styles.filterButtonActive]} onPress={() => { setStatus(value); setPage(1); }} accessibilityRole="button" accessibilityState={{ selected }}>
              <Text style={[styles.filterButtonText, selected && styles.filterButtonTextActive]}>{value ? statusLabel(value) : t('common.all')}</Text>
            </TouchableOpacity>;
          })}
        </ScrollView>
      </View>
      <View style={styles.filterSection}>
        <View style={styles.filterTitleRow}>
          <Text style={styles.filterTitle}>{t('vetInvoices.filters.period')}</Text>
          {(search || status || range !== 'ALL') ? <TouchableOpacity style={styles.resetButton} onPress={resetFilters}><Ionicons name="refresh-outline" size={14} color={colors.primary} /><Text style={styles.resetText}>{t('vetInvoices.filters.reset')}</Text></TouchableOpacity> : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll} accessibilityLabel="Filter invoices by date range">
          {(['ALL', '30_DAYS', '90_DAYS', 'THIS_YEAR'] as const).map((value) => {
            const selected = value === range;
            return <TouchableOpacity key={value} style={[styles.filterButton, selected && styles.filterButtonActive]} onPress={() => { setRange(value); setPage(1); }} accessibilityRole="button" accessibilityState={{ selected }}>
              <Text style={[styles.filterButtonText, selected && styles.filterButtonTextActive]}>{t(`vetInvoices.ranges.${value}`)}</Text>
            </TouchableOpacity>;
          })}
        </ScrollView>
      </View>
      {invoiceQuery.isLoading ? <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View> : visibleInvoices.length === 0 ? <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="receipt-outline" size={34} color={colors.primary} /></View><Text style={styles.emptyText}>{t('vetInvoices.empty')}</Text></View> : <>
        <FlatList data={visibleInvoices} keyExtractor={(item) => item._id} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} renderItem={({ item }) => {
          const appointment = item.relatedAppointmentId; const owner = appointment?.petOwnerId; const pet = appointment?.petId; const color = statusColor(item.status);
          return <View style={styles.invoiceCard}>
            <View style={styles.invoiceHeader}><View style={styles.invoiceHeading}><View style={styles.invoiceIcon}><Ionicons name="document-text-outline" size={17} color={colors.primary} /></View><View><Text style={styles.invoiceRef}>{appointment?.appointmentNumber || `#${item._id.slice(-8).toUpperCase()}`}</Text><Text style={styles.invoiceDate}>{formatDate(item.createdAt)}</Text></View></View><View style={styles.amountColumn}><Text style={styles.amount}>{formatCurrency(item.amount, item.currency)}</Text><View style={[styles.statusBadge, { backgroundColor: color + '20' }]}><Text style={[styles.statusText, { color }]}>{statusLabel(item.status)}</Text></View></View></View>
            <View style={styles.detailGrid}><View style={styles.detailCell}><Ionicons name="paw-outline" size={15} color={colors.primary} /><View style={styles.detailCopy}><Text style={styles.detailLabel}>{t('vetInvoices.labels.pet')}</Text><Text style={styles.detailValue}>{pet?.name || '—'}</Text></View></View><View style={styles.detailCell}><Ionicons name="person-outline" size={15} color={colors.primary} /><View style={styles.detailCopy}><Text style={styles.detailLabel}>{t('vetInvoices.labels.owner')}</Text><Text style={styles.detailValue}>{owner?.fullName || owner?.name || '—'}</Text></View></View></View>
            <View style={styles.invoiceActions}><TouchableOpacity style={styles.viewButton} onPress={() => navigation.navigate('VetInvoiceView', { transactionId: item._id })}><Ionicons name="eye-outline" size={16} color={colors.primary} /><Text style={styles.viewText}>{t('common.view')}</Text></TouchableOpacity><TouchableOpacity style={styles.downloadButton} onPress={() => downloadInvoice(item)} disabled={downloadingId === item._id}>{downloadingId === item._id ? <ActivityIndicator size="small" color={colors.textInverse} /> : <Ionicons name="download-outline" size={16} color={colors.textInverse} />}<Text style={styles.downloadText}>{downloadingId === item._id ? t('vetInvoices.actions.preparing') : t('vetInvoices.actions.downloadPdf')}</Text></TouchableOpacity></View>
          </View>;
        }} />
        {pagination.pages > 1 ? <View style={styles.pagination}><TouchableOpacity onPress={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}><Text style={[styles.pageAction, page <= 1 && styles.disabled]}>{t('vetInvoices.pagination.previous')}</Text></TouchableOpacity><Text style={styles.pageInfo}>{t('vetInvoices.pagination.pageOf', { page, pages: pagination.pages })}</Text><TouchableOpacity onPress={() => setPage((current) => Math.min(pagination.pages, current + 1))} disabled={page >= pagination.pages}><Text style={[styles.pageAction, page >= pagination.pages && styles.disabled]}>{t('vetInvoices.pagination.next')}</Text></TouchableOpacity></View> : null}
      </>}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 18, backgroundColor: colors.successLight, borderWidth: 1, borderColor: colors.primaryLight + '25', marginBottom: spacing.md }, heroIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondaryLight, marginRight: spacing.md }, heroCopy: { flex: 1 }, heroTitle: { ...typography.h3, color: colors.primaryDark }, heroText: { ...typography.caption, color: colors.primaryDark, opacity: 0.72, marginTop: 3 }, heroCount: { minWidth: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryDark }, heroCountText: { ...typography.label, color: colors.textInverse },
  searchContainer: { flexDirection: 'row', alignItems: 'center', minHeight: 50, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, borderRadius: 14, marginBottom: spacing.md }, searchIcon: { marginRight: spacing.sm }, searchInput: { flex: 1, ...typography.bodySmall, color: colors.text, padding: 0 }, filterSection: { paddingBottom: spacing.md }, filterTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, filterTitle: { ...typography.caption, color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.xs }, filterScroll: { gap: 8 }, filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, marginRight: 8 }, filterButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary }, filterButtonText: { fontSize: 14, color: colors.text, fontWeight: '500' }, filterButtonTextActive: { color: colors.textInverse, fontWeight: '600' }, resetButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 3, marginBottom: spacing.xs }, resetText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  center: { paddingVertical: spacing.xxl, alignItems: 'center' }, empty: { paddingTop: spacing.xl, alignItems: 'center' }, emptyIcon: { width: 70, height: 70, borderRadius: 23, backgroundColor: colors.primaryLight + '18', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }, emptyText: { ...typography.bodySmall, color: colors.textSecondary }, list: { paddingBottom: spacing.md },
  invoiceCard: { backgroundColor: colors.background, padding: spacing.md, borderRadius: 16, borderWidth: 1, borderColor: colors.borderLight, marginBottom: spacing.sm }, invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, invoiceHeading: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }, invoiceIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primaryLight + '18', alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm }, invoiceRef: { ...typography.label, color: colors.primaryDark }, invoiceDate: { ...typography.caption, color: colors.textSecondary, marginTop: 2 }, amountColumn: { alignItems: 'flex-end', marginLeft: spacing.sm }, amount: { ...typography.label, color: colors.primaryDark, fontSize: 16 }, statusBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, marginTop: 5 }, statusText: { ...typography.caption, fontWeight: '800' }, detailGrid: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight }, detailCell: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 5 }, detailCopy: { flex: 1 }, detailLabel: { ...typography.caption, color: colors.textSecondary }, detailValue: { ...typography.bodySmall, color: colors.text, fontWeight: '600', marginTop: 1 }, invoiceActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }, viewButton: { flex: 0.8, minHeight: 40, borderRadius: 11, backgroundColor: colors.primaryLight + '15', borderWidth: 1, borderColor: colors.primaryLight + '30', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 }, viewText: { ...typography.caption, color: colors.primary, fontWeight: '800' }, downloadButton: { flex: 1.25, minHeight: 40, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 }, downloadText: { ...typography.caption, color: colors.textInverse, fontWeight: '800' }, pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.md }, pageAction: { ...typography.bodySmall, color: colors.primary, fontWeight: '700' }, pageInfo: { ...typography.caption, color: colors.textSecondary }, disabled: { color: colors.textLight },
});
