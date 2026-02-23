import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  RefreshControl,
} from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const MOCK_BALANCE = 1250.5;
const MOCK_WITHDRAWALS = [
  { id: '1', date: '2024-02-10', paymentMethod: 'STRIPE', amount: 450, netAmount: 441, withdrawalFeePercent: 2, withdrawalFeeAmount: 9, totalDeducted: 9, status: 'APPROVED' },
  { id: '2', date: '2024-01-31', paymentMethod: 'BANK_TRANSFER', amount: 380, netAmount: 380, withdrawalFeePercent: 0, withdrawalFeeAmount: 0, totalDeducted: 0, status: 'COMPLETED' },
  { id: '3', date: '2024-02-14', paymentMethod: 'STRIPE', amount: 200, netAmount: null as number | null, withdrawalFeePercent: null as number | null, withdrawalFeeAmount: null as number | null, totalDeducted: null as number | null, status: 'PENDING' },
];

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  STRIPE: 'Stripe',
  BANK_TRANSFER: 'Bank Transfer',
  BANK: 'Bank Transfer',
  PAYPAL: 'PayPal',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toUpperCase();
  const isApproved = s === 'APPROVED' || s === 'COMPLETED';
  const isPending = s === 'PENDING';
  const isRejected = s === 'REJECTED';
  const label = isApproved ? 'Approved' : isPending ? 'Pending' : isRejected ? 'Rejected' : status || '—';
  return (
    <View
      style={[
        styles.statusBadge,
        isApproved && styles.statusSuccess,
        isPending && styles.statusWarning,
        isRejected && styles.statusDanger,
      ]}
    >
      <Text style={[styles.statusBadgeText, isPending && styles.statusBadgeTextDark]}>{label}</Text>
    </View>
  );
}

export function PharmacyPayoutsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'BANK_TRANSFER' | 'PAYPAL'>('STRIPE');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [page, setPage] = useState(1);

  const balance = MOCK_BALANCE;
  const requests = MOCK_WITHDRAWALS;
  const pagination = { page: 1, pages: 1, total: requests.length, limit: 10 };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  };

  const openWithdrawModal = () => {
    setAmount('');
    setPaymentMethod('STRIPE');
    setPayoutDetails('');
    setWithdrawModalOpen(true);
  };

  const submitWithdrawal = () => {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    if (n > balance) return;
    if (!payoutDetails.trim()) return;
    setWithdrawModalOpen(false);
    setAmount('');
    setPayoutDetails('');
  };

  const canSubmit =
    amount.trim() &&
    Number(parseFloat(amount)) > 0 &&
    Number(parseFloat(amount)) <= balance &&
    payoutDetails.trim().length > 0;

  return (
    <ScreenContainer scroll padded>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Preferred payout method</Text>
          <Text style={styles.sectionSubtitle}>
            Your earnings will be paid out using the method you provide when requesting a withdrawal.
          </Text>
          <View style={styles.methodRow}>
            <View style={[styles.methodBox, styles.methodBoxActive]}>
              <Text style={styles.methodIcon}>💳</Text>
              <Text style={styles.methodName}>Stripe</Text>
              <Button title="Configure" variant="outline" onPress={openWithdrawModal} style={styles.configureBtn} />
            </View>
          </View>

          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
            </View>
            <Button
              title="Request Withdrawal"
              onPress={openWithdrawModal}
              disabled={balance <= 0}
              style={styles.withdrawBtn}
            />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Withdrawal Requests</Text>
        {requests.length === 0 ? (
          <Card style={styles.card}>
            <Text style={styles.emptyText}>No withdrawal requests found</Text>
          </Card>
        ) : (
          <>
            {requests.map((r) => (
              <Card key={r.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestDate}>{formatDate(r.date)}</Text>
                  <StatusBadge status={r.status} />
                </View>
                <View style={styles.requestDetailRow}>
                  <Text style={styles.requestDetailLabel}>Payment Method</Text>
                  <Text style={styles.requestDetailValue}>{PAYMENT_METHOD_LABELS[r.paymentMethod] || r.paymentMethod}</Text>
                </View>
                <View style={styles.requestDetailRow}>
                  <Text style={styles.requestDetailLabel}>Amount</Text>
                  <Text style={styles.requestDetailAmount}>€{Number(r.amount).toFixed(2)}</Text>
                </View>
                {r.netAmount != null && r.netAmount !== r.amount && (
                  <View style={styles.requestDetailRow}>
                    <Text style={styles.requestDetailLabel}>You receive</Text>
                    <Text style={styles.requestDetailValue}>€{Number(r.netAmount).toFixed(2)}</Text>
                  </View>
                )}
                <View style={styles.requestDetailRow}>
                  <Text style={styles.requestDetailLabel}>Fee</Text>
                  <Text style={styles.requestDetailValue}>
                    {r.withdrawalFeePercent != null
                      ? `${Number(r.withdrawalFeePercent).toFixed(0)}%` +
                        (r.withdrawalFeeAmount != null ? ` (€${Number(r.withdrawalFeeAmount).toFixed(2)})` : '')
                      : 'No fee'}
                  </Text>
                </View>
                {r.totalDeducted != null && r.totalDeducted > 0 && (
                  <View style={styles.requestDetailRow}>
                    <Text style={styles.requestDetailLabel}>Total Deducted</Text>
                    <Text style={styles.requestTotalDeducted}>€{Number(r.totalDeducted).toFixed(2)}</Text>
                  </View>
                )}
              </Card>
            ))}

            {pagination.pages > 1 && (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <Text style={styles.pageBtnText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.pageText}>{page} / {pagination.pages}</Text>
                <TouchableOpacity
                  style={[styles.pageBtn, page >= pagination.pages && styles.pageBtnDisabled]}
                  onPress={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                >
                  <Text style={styles.pageBtnText}>›</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal visible={withdrawModalOpen} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setWithdrawModalOpen(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Withdrawal</Text>
              <TouchableOpacity onPress={() => setWithdrawModalOpen(false)} hitSlop={12}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Available Balance</Text>
                <TextInput
                  style={[styles.formInput, styles.formInputDisabled]}
                  value={formatCurrency(balance)}
                  editable={false}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Amount to Withdraw <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Enter amount"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Payment Method <Text style={styles.required}>*</Text></Text>
                <View style={styles.methodOptions}>
                  {(['STRIPE', 'BANK_TRANSFER', 'PAYPAL'] as const).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.methodOption, paymentMethod === m && styles.methodOptionActive]}
                      onPress={() => setPaymentMethod(m)}
                    >
                      <Text style={[styles.methodOptionText, paymentMethod === m && styles.methodOptionTextActive]}>
                        {PAYMENT_METHOD_LABELS[m]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Payout Details <Text style={styles.required}>*</Text></Text>
                <Text style={styles.formHint}>IBAN / account no / PayPal email / Stripe email</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={payoutDetails}
                  onChangeText={setPayoutDetails}
                  placeholder="Enter IBAN, account number, or email"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <Button title="Cancel" variant="outline" onPress={() => setWithdrawModalOpen(false)} style={styles.modalBtn} />
              <Button title="Submit Request" onPress={submitWithdrawal} disabled={!canSubmit} style={styles.modalBtn} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, marginBottom: 4 },
  sectionSubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  methodRow: { marginBottom: spacing.md },
  methodBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodBoxActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight + '15' },
  methodIcon: { fontSize: 24, marginRight: spacing.sm },
  methodName: { ...typography.body, fontWeight: '600', flex: 1 },
  configureBtn: { minWidth: 100 },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundTertiary,
    padding: spacing.md,
    borderRadius: 12,
  },
  balanceLabel: { ...typography.caption, color: colors.textSecondary },
  balanceAmount: { ...typography.h2, fontWeight: '700' },
  withdrawBtn: { minWidth: 140 },
  requestCard: { marginBottom: spacing.sm },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  requestDate: { ...typography.body, fontWeight: '600' },
  requestDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  requestDetailLabel: { ...typography.bodySmall, color: colors.textSecondary },
  requestDetailValue: { ...typography.bodySmall, fontWeight: '500' },
  requestDetailAmount: { ...typography.body, fontWeight: '600' },
  requestTotalDeducted: { ...typography.bodySmall, color: colors.error, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: spacing.xs },
  statusSuccess: { backgroundColor: colors.successLight },
  statusWarning: { backgroundColor: colors.warningLight },
  statusDanger: { backgroundColor: colors.errorLight },
  statusBadgeText: { fontSize: 12, fontWeight: '600', color: colors.textInverse },
  statusBadgeTextDark: { color: colors.text },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, gap: spacing.sm },
  pageBtn: { padding: spacing.sm },
  pageBtnDisabled: { opacity: 0.5 },
  pageBtnText: { fontSize: 18, color: colors.primary },
  pageText: { ...typography.bodySmall, color: colors.textSecondary },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.lg },
  bottomSpacer: { height: spacing.xl },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.background, borderRadius: 16, width: '100%', maxWidth: 400, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  modalTitle: { ...typography.h3 },
  modalClose: { fontSize: 20, color: colors.textSecondary },
  modalBody: { padding: spacing.md },
  modalFooter: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  formGroup: { marginBottom: spacing.md },
  formLabel: { ...typography.label, marginBottom: spacing.xs },
  required: { color: colors.error },
  formHint: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs },
  formInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.sm, ...typography.body, backgroundColor: colors.backgroundSecondary },
  formInputDisabled: { opacity: 0.8 },
  formTextArea: { minHeight: 80, textAlignVertical: 'top' },
  methodOptions: { flexDirection: 'row', gap: spacing.sm },
  methodOption: { flex: 1, paddingVertical: spacing.sm, borderRadius: 10, backgroundColor: colors.backgroundTertiary, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  methodOptionActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight + '25' },
  methodOptionText: { ...typography.label, color: colors.textSecondary },
  methodOptionTextActive: { color: colors.primary, fontWeight: '600' },
  modalBtn: { flex: 1 },
});