import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { usePetOwnerPayments } from '../../queries/petOwnerQueries';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { API_ROUTES } from '../../api/apiConfig';
import { downloadAndSharePdf } from '../../utils/nativePdf';

type TxStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';
type DateRange = 'ALL' | '30_DAYS' | '90_DAYS' | 'THIS_YEAR';

function getStatusColor(s: TxStatus): string {
  const map: Record<TxStatus, string> = {
    SUCCESS: colors.success,
    PENDING: colors.warning,
    FAILED: colors.error,
    REFUNDED: colors.info,
  };
  return map[s] || colors.textSecondary;
}

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

type TxnItem = {
  _id: string;
  amount?: number;
  currency?: string;
  status?: string;
  createdAt?: string;
  relatedAppointmentId?: {
    appointmentNumber?: string;
    appointmentDate?: string;
    reason?: string;
    veterinarianId?: { name?: string; profileImage?: string };
    petId?: { name?: string; photo?: string };
  };
};

export function PetOwnerInvoicesScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>('ALL');
  const [page, setPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const limit = 10;

  const dateParams = useMemo(() => {
    const now = new Date();
    const toDate = now.toISOString().slice(0, 10);
    if (dateRange === '30_DAYS') {
      const from = new Date(now); from.setDate(now.getDate() - 30);
      return { fromDate: from.toISOString().slice(0, 10), toDate };
    }
    if (dateRange === '90_DAYS') {
      const from = new Date(now); from.setDate(now.getDate() - 90);
      return { fromDate: from.toISOString().slice(0, 10), toDate };
    }
    if (dateRange === 'THIS_YEAR') return { fromDate: `${now.getFullYear()}-01-01`, toDate };
    return {};
  }, [dateRange]);

  const getStatusLabel = (status: TxStatus): string => {
    const map: Record<TxStatus, string> = {
      SUCCESS: t('petOwnerInvoices.status.paid'),
      PENDING: t('petOwnerInvoices.status.pending'),
      FAILED: t('petOwnerInvoices.status.failed'),
      REFUNDED: t('petOwnerInvoices.status.refunded'),
    };
    return map[status] ?? String(status);
  };

  const { data, isLoading } = usePetOwnerPayments({
    status: statusFilter || undefined,
    search: searchQuery.trim() || undefined,
    ...dateParams,
    page,
    limit,
  });

  const payload: any = useMemo(() => {
    const root = (data as { data?: unknown } | undefined)?.data ?? data;
    return (root as Record<string, unknown>) ?? {};
  }, [data]);

  const transactions = useMemo<TxnItem[]>(() => {
    const list = payload?.transactions ?? payload?.data?.transactions ?? [];
    return Array.isArray(list) ? (list as TxnItem[]) : [];
  }, [payload]);

  const pagination = useMemo(() => {
    const p = payload?.pagination ?? payload?.data?.pagination ?? null;
    const safe = (p && typeof p === 'object' ? (p as { page?: number; pages?: number; total?: number }) : null) ?? null;
    return { page: safe?.page ?? 1, pages: safe?.pages ?? 1, total: safe?.total ?? 0 };
  }, [payload]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter((tx: TxnItem) => {
      const apt = tx.relatedAppointmentId;
      const id = (tx._id || '').toLowerCase();
      const aptNum = (apt?.appointmentNumber || '').toLowerCase();
      const vetName = (apt?.veterinarianId?.name || '').toLowerCase();
      const petName = (apt?.petId?.name || '').toLowerCase();
      return id.includes(q) || aptNum.includes(q) || vetName.includes(q) || petName.includes(q);
    });
  }, [transactions, searchQuery]);

  const totalPages = Number(pagination?.pages ?? 1);

  const handleDownload = async (transaction: TxnItem) => {
    const reference = transaction.relatedAppointmentId?.appointmentNumber || transaction._id;
    try {
      setDownloadingId(transaction._id);
      await downloadAndSharePdf(
        API_ROUTES.PET_OWNER.INVOICE_PDF(transaction._id),
        `veterinary-invoice-${String(reference)}.pdf`
      );
    } catch (err: unknown) {
      Toast.show({ type: 'error', text1: (err as { message?: string })?.message ?? t('petOwnerInvoices.errors.downloadFailed') });
    } finally {
      setDownloadingId(null);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setDateRange('ALL');
    setPage(1);
  };

  return (
    <ScreenContainer padded>
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="receipt-outline" size={23} color={colors.primaryDark} /></View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>{t('menu.veterinaryInvoices')}</Text>
          <Text style={styles.heroText}>{t('petOwnerInvoices.subtitle')}</Text>
        </View>
        <View style={styles.heroCount}><Text style={styles.heroCountText}>{pagination.total || filtered.length}</Text></View>
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={19} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('petOwnerInvoices.searchPlaceholder')}
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={(value) => { setSearchQuery(value); setPage(1); }}
        />
      </View>

      <View style={styles.statusFilterContainer}>
        <Text style={styles.filterTitle}>{t('petOwnerInvoices.filters.status')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusFilterScroll}>
          <TouchableOpacity style={[styles.statusFilterButton, !statusFilter && styles.statusFilterButtonActive]} onPress={() => setStatusFilter('')}>
            <Text style={[styles.statusFilterText, !statusFilter && styles.statusFilterTextActive]}>{t('common.all')}</Text>
          </TouchableOpacity>
          {(['SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'] as const).map((status) => (
            <TouchableOpacity key={status} style={[styles.statusFilterButton, statusFilter === status && styles.statusFilterButtonActive]} onPress={() => { setStatusFilter(status); setPage(1); }}>
              <Text style={[styles.statusFilterText, statusFilter === status && styles.statusFilterTextActive]}>{getStatusLabel(status)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.statusFilterContainer}>
        <View style={styles.dateFilterHeader}>
          <Text style={styles.filterTitle}>{t('petOwnerInvoices.filters.period')}</Text>
          {(statusFilter || searchQuery || dateRange !== 'ALL') ? (
            <TouchableOpacity style={styles.resetButton} onPress={resetFilters} accessibilityRole="button">
              <Ionicons name="refresh-outline" size={14} color={colors.primary} />
              <Text style={styles.resetButtonText}>{t('petOwnerInvoices.filters.reset')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusFilterScroll}>
          {(['ALL', '30_DAYS', '90_DAYS', 'THIS_YEAR'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              style={[styles.statusFilterButton, dateRange === range && styles.statusFilterButtonActive]}
              onPress={() => { setDateRange(range); setPage(1); }}
            >
              <Text style={[styles.statusFilterText, dateRange === range && styles.statusFilterTextActive]}>{t(`petOwnerInvoices.ranges.${range}`)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}><Ionicons name="receipt-outline" size={36} color={colors.primary} /></View>
          <Text style={styles.emptyText}>{t('petOwnerInvoices.empty')}</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const apt = item.relatedAppointmentId;
              const vet = apt?.veterinarianId;
              const pet = apt?.petId;
              const status = (item.status || '') as TxStatus;
              const naLabel = t('common.na');
              return (
                <View style={styles.invoiceCard}>
                  <View style={styles.invoiceHeader}>
                    <View style={styles.invoiceHeaderLeft}>
                      <View style={styles.invoiceIdRow}><View style={styles.invoiceIcon}><Ionicons name="document-text-outline" size={17} color={colors.primary} /></View><TouchableOpacity onPress={() => navigation.navigate('PetOwnerInvoiceView', { transactionId: item._id })}><Text style={styles.invoiceId}>#{item._id.slice(-8).toUpperCase()}</Text></TouchableOpacity></View>
                      <Text style={styles.invoiceDescription}>{(apt?.reason || t('petOwnerInvoices.defaults.appointment')) + (pet?.name ? ` (${pet.name})` : '')}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '30' }]}>
                        <Text style={[styles.statusBadgeText, { color: getStatusColor(status) }]}>{getStatusLabel(status) || item.status}</Text>
                      </View>
                    </View>
                    <View style={styles.amountColumn}><Text style={styles.amount}>{formatCurrency(item.amount, naLabel, item.currency)}</Text><Text style={styles.amountCaption}>{t('petOwnerInvoices.labels.total')}</Text></View>
                  </View>
                  <View style={styles.invoiceDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('petOwnerInvoices.labels.date')}</Text>
                      <Text style={styles.detailValue}>{formatDate(item.createdAt, naLabel)}</Text>
                    </View>
                    {apt?.appointmentNumber ? (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>{t('petOwnerInvoices.labels.appointment')}</Text>
                        <Text style={styles.detailValue}>#{apt.appointmentNumber}</Text>
                      </View>
                    ) : null}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('petOwnerInvoices.labels.veterinarian')}</Text>
                      <Text style={styles.detailValue}>{vet?.name || naLabel}</Text>
                    </View>
                  </View>
                  <View style={styles.invoiceActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('PetOwnerInvoiceView', { transactionId: item._id })}>
                      <Ionicons name="eye-outline" size={16} color={colors.primary} />
                      <Text style={styles.actionButtonText}>{t('common.view')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.downloadButton} onPress={() => handleDownload(item)} disabled={downloadingId === item._id}>
                      {downloadingId === item._id ? <ActivityIndicator size="small" color={colors.textInverse} /> : <Ionicons name="download-outline" size={16} color={colors.textInverse} />}
                      <Text style={styles.downloadButtonText}>{downloadingId === item._id ? t('petOwnerInvoices.actions.preparing') : t('petOwnerInvoices.actions.downloadPdf')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity onPress={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                <Text style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}>{t('petOwnerInvoices.pagination.prev')}</Text>
              </TouchableOpacity>
              <Text style={styles.pageInfo}>{t('petOwnerInvoices.pagination.pageOf', { page, totalPages })}</Text>
              <TouchableOpacity onPress={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                <Text style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}>{t('petOwnerInvoices.pagination.next')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successLight, borderRadius: 18, borderWidth: 1, borderColor: colors.primaryLight + '28', padding: spacing.md, marginBottom: spacing.md },
  heroIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondaryLight, marginRight: spacing.md },
  heroCopy: { flex: 1, minWidth: 0 },
  heroTitle: { ...typography.h3, color: colors.primaryDark },
  heroText: { ...typography.caption, color: colors.primaryDark, opacity: 0.72, marginTop: 3 },
  heroCount: { minWidth: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryDark, marginLeft: spacing.sm },
  heroCountText: { ...typography.label, color: colors.textInverse },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, marginBottom: spacing.md, paddingHorizontal: spacing.md, minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, marginLeft: 0, fontSize: 14, color: colors.text, padding: 0 },
  statusFilterContainer: { paddingBottom: spacing.md },
  filterTitle: { ...typography.caption, color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.xs },
  dateFilterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resetButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 3, marginBottom: spacing.xs },
  resetButtonText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  statusFilterScroll: { gap: 8 },
  statusFilterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  statusFilterButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusFilterText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  statusFilterTextActive: { color: colors.textInverse, fontWeight: '600' },
  loading: { paddingVertical: spacing.xxl, alignItems: 'center' },
  listContent: { paddingBottom: spacing.xxl },
  invoiceCard: { backgroundColor: colors.background, marginBottom: spacing.md, padding: spacing.md, borderRadius: 16, borderWidth: 1, borderColor: colors.borderLight },
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  invoiceHeaderLeft: { flex: 1 },
  invoiceIdRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 6 },
  invoiceIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '18' },
  invoiceId: { fontSize: 14, fontWeight: '600', color: colors.primary, marginBottom: 4 },
  invoiceDescription: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 6 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  amountColumn: { alignItems: 'flex-end', paddingLeft: spacing.sm },
  amount: { fontSize: 18, fontWeight: '800', color: colors.primaryDark },
  amountCaption: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  invoiceDetails: { borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 12, marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { fontSize: 14, color: colors.textSecondary },
  detailValue: { fontSize: 14, fontWeight: '500', color: colors.text },
  invoiceActions: { flexDirection: 'row', gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: spacing.sm },
  actionButton: { flex: 1, minHeight: 40, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, gap: 6, borderRadius: 11, backgroundColor: colors.primaryLight + '18', borderWidth: 1, borderColor: colors.primaryLight + '38' },
  actionButtonText: { fontSize: 13, color: colors.primary, fontWeight: '700' },
  downloadButton: { flex: 1.2, minHeight: 40, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10, gap: 6, borderRadius: 11, backgroundColor: colors.primary },
  downloadButtonText: { ...typography.caption, color: colors.textInverse, fontWeight: '800' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '18', marginBottom: spacing.md },
  emptyText: { marginTop: 16, fontSize: 16, color: colors.textSecondary },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.md },
  pageBtn: { ...typography.body, color: colors.primary, fontWeight: '600' },
  pageBtnDisabled: { color: colors.textLight },
  pageInfo: { ...typography.caption, color: colors.textSecondary },
});
