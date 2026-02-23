import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useVetInvoices } from '../../queries/vetQueries';

type TransactionItem = {
  _id: string;
  amount?: number;
  status?: string;
  createdAt?: string;
  relatedAppointmentId?: {
    appointmentNumber?: string;
    petId?: { name?: string };
    petOwnerId?: { name?: string; fullName?: string };
  };
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function normalizeInvoices(response: unknown): TransactionItem[] {
  const data = (response as { data?: { transactions?: TransactionItem[] }; transactions?: TransactionItem[] })
    ?.data ?? (response as { transactions?: TransactionItem[] });
  const list = data?.transactions ?? [];
  return Array.isArray(list) ? list : [];
}

export function VetInvoicesScreen() {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'PAID' | 'PENDING' | 'COMPLETED'>('all');

  const { data: invoicesResponse, isLoading, error } = useVetInvoices({ limit: 100 });
  const invoices = useMemo(() => normalizeInvoices(invoicesResponse ?? {}), [invoicesResponse]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const statusFilter = filterStatus === 'all' ? null : filterStatus;
    return invoices.filter((inv) => {
      const apt = inv.relatedAppointmentId;
      const petName = apt?.petId?.name ?? '';
      const ownerName = apt?.petOwnerId?.fullName ?? apt?.petOwnerId?.name ?? '';
      const matchSearch = !q ||
        String(inv._id).toLowerCase().includes(q) ||
        (apt?.appointmentNumber ?? '').toLowerCase().includes(q) ||
        petName.toLowerCase().includes(q) ||
        ownerName.toLowerCase().includes(q);
      const matchStatus = !statusFilter || (inv.status ?? '').toUpperCase() === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, searchQuery, filterStatus]);

  if (isLoading) {
    return (
      <ScreenContainer padded>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer padded>
        <Text style={styles.errorText}>
          {(error as { message?: string })?.message ?? 'Failed to load invoices'}
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded>
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by invoice #, pet or owner..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <View style={styles.filterRow}>
        {(['all', 'PAID', 'PENDING', 'COMPLETED'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filterStatus === f && styles.filterChipActive]}
            onPress={() => setFilterStatus(f)}
          >
            <Text style={[styles.filterChipText, filterStatus === f && styles.filterChipTextActive]}>
              {f === 'all' ? 'All' : f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item._id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const apt = item.relatedAppointmentId;
          const petName = apt?.petId?.name ?? '—';
          const ownerName = apt?.petOwnerId?.fullName ?? apt?.petOwnerId?.name ?? '—';
          const status = (item.status ?? '').toUpperCase();
          const isPaid = status === 'PAID' || status === 'COMPLETED';
          return (
            <TouchableOpacity
              onPress={() => navigation.navigate('VetInvoiceView', { transactionId: item._id })}
              activeOpacity={0.8}
            >
              <Card style={styles.card}>
                <View style={styles.topRow}>
                  <Text style={styles.invoiceNumber}>{apt?.appointmentNumber ?? item._id}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      isPaid ? styles.statusPaid : styles.statusPending,
                    ]}
                  >
                    <Text style={styles.statusText}>{status || '—'}</Text>
                  </View>
                </View>
                <Text style={styles.desc}>
                  Consultation {petName ? `- ${petName}` : ''}
                </Text>
                <Text style={styles.meta}>
                  Pet: {petName} · Owner: {ownerName}
                </Text>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                <View style={styles.amountRow}>
                  <Text style={styles.amount}>€{Number(item.amount ?? 0).toFixed(2)}</Text>
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.viewBtn}
                      onPress={() => navigation.navigate('VetInvoiceView', { transactionId: item._id })}
                    >
                      <Text style={styles.viewBtnText}>View</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No invoices match</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  errorText: { ...typography.body, color: colors.error },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    minHeight: 44,
  },
  searchIcon: { marginRight: spacing.sm, fontSize: 16 },
  searchInput: { flex: 1, ...typography.body, paddingVertical: spacing.sm },
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 20, backgroundColor: colors.backgroundTertiary },
  filterChipActive: { backgroundColor: colors.primary },
  filterChipText: { ...typography.label, color: colors.textSecondary },
  filterChipTextActive: { color: colors.textInverse },
  list: { paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.sm },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  invoiceNumber: { ...typography.label },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusPaid: { backgroundColor: colors.successLight },
  statusPending: { backgroundColor: colors.warningLight },
  statusText: { ...typography.caption, fontWeight: '600' },
  desc: { ...typography.bodySmall },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  date: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  amount: { ...typography.h3, color: colors.primary },
  actions: { flexDirection: 'row', gap: spacing.sm },
  viewBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.primary, borderRadius: 8 },
  viewBtnText: { ...typography.label, color: colors.textInverse },
  empty: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
});
