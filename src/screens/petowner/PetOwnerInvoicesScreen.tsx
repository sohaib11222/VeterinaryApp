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

type TxStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';

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
  const [page, setPage] = useState(1);
  const limit = 10;

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

  return (
    <ScreenContainer padded>
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('petOwnerInvoices.searchPlaceholder')}
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.statusFilterContainer}>
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

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🧾</Text>
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
                      <TouchableOpacity onPress={() => navigation.navigate('PetOwnerInvoiceView', { transactionId: item._id })}>
                        <Text style={styles.invoiceId}>#{item._id.slice(-8).toUpperCase()}</Text>
                      </TouchableOpacity>
                      <Text style={styles.invoiceDescription}>{(apt?.reason || t('petOwnerInvoices.defaults.appointment')) + (pet?.name ? ` (${pet.name})` : '')}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '30' }]}>
                        <Text style={[styles.statusBadgeText, { color: getStatusColor(status) }]}>{getStatusLabel(status) || item.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.amount}>{formatCurrency(item.amount, naLabel, item.currency)}</Text>
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
                      <Text style={styles.actionIcon}>👁</Text>
                      <Text style={styles.actionButtonText}>{t('common.view')}</Text>
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
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, marginBottom: spacing.sm, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  searchIcon: { marginRight: 8, fontSize: 18 },
  searchInput: { flex: 1, marginLeft: 0, fontSize: 14, color: colors.text, padding: 0 },
  statusFilterContainer: { paddingBottom: spacing.sm },
  statusFilterScroll: { gap: 8 },
  statusFilterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, marginRight: 8 },
  statusFilterButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusFilterText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  statusFilterTextActive: { color: colors.textInverse, fontWeight: '600' },
  loading: { paddingVertical: spacing.xxl, alignItems: 'center' },
  listContent: { paddingBottom: spacing.xxl },
  invoiceCard: { backgroundColor: colors.background, marginBottom: spacing.sm, padding: spacing.sm, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  invoiceHeaderLeft: { flex: 1 },
  invoiceId: { fontSize: 14, fontWeight: '600', color: colors.primary, marginBottom: 4 },
  invoiceDescription: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 6 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  amount: { fontSize: 18, fontWeight: '700', color: colors.primary },
  invoiceDetails: { borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 12, marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { fontSize: 14, color: colors.textSecondary },
  detailValue: { fontSize: 14, fontWeight: '500', color: colors.text },
  invoiceActions: { flexDirection: 'row', justifyContent: 'flex-start', borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, gap: 6 },
  actionIcon: { fontSize: 16 },
  actionButtonText: { fontSize: 14, color: colors.primary, fontWeight: '500' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 64, marginBottom: spacing.sm },
  emptyText: { marginTop: 16, fontSize: 16, color: colors.textSecondary },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.md },
  pageBtn: { ...typography.body, color: colors.primary, fontWeight: '600' },
  pageBtnDisabled: { color: colors.textLight },
  pageInfo: { ...typography.caption, color: colors.textSecondary },
});
