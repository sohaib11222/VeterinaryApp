import React, { useMemo, useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useBalance, useWithdrawalRequests, useRequestWithdrawal } from '../../queries/balanceQueries';
import { getErrorMessage } from '../../utils/errorUtils';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/appI18n';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  STRIPE: 'STRIPE',
  BANK_TRANSFER: 'BANK_TRANSFER',
  BANK: 'BANK_TRANSFER',
  PAYPAL: 'PAYPAL',
};

function formatCurrency(amount: number): string {
  const locale = i18n.language?.startsWith('it') ? 'it-IT' : 'en-GB';
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return i18n.t('common.na');
  const d = new Date(dateStr);
  const locale = i18n.language?.startsWith('it') ? 'it-IT' : 'en-GB';
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusBadge({ status, t }: { status: string; t: (key: string, opts?: any) => string }) {
  const s = (status || '').toUpperCase();
  const isApproved = s === 'APPROVED' || s === 'COMPLETED';
  const isPending = s === 'PENDING';
  const isRejected = s === 'REJECTED';
  const label =
    isApproved
      ? t('pharmacyPayouts.status.approved')
      : isPending
        ? t('pharmacyPayouts.status.pending')
        : isRejected
          ? t('pharmacyPayouts.status.rejected')
          : status || t('common.na');
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

function extractRequests(payload: unknown): any[] {
  const outer = (payload as { data?: unknown })?.data ?? payload;
  const d = (outer as { data?: unknown })?.data ?? outer;
  const list = (d as { requests?: unknown[] })?.requests;
  return Array.isArray(list) ? list : [];
}

export function PharmacyPayoutsScreen() {
  const { t } = useTranslation();
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'BANK_TRANSFER' | 'PAYPAL'>('STRIPE');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [page, setPage] = useState(1);

  const { data: balanceData, isLoading: balanceLoading, refetch: refetchBalance } = useBalance({ refetchInterval: 20_000, refetchIntervalInBackground: true });
  const { data: requestsData, isLoading: requestsLoading, refetch: refetchRequests } = useWithdrawalRequests({ page, limit: 20 }, { refetchInterval: 20_000, refetchIntervalInBackground: true });
  const requestWithdrawal = useRequestWithdrawal();

  const balance = useMemo(() => {
    const d = (balanceData as { data?: { balance?: number } })?.data ?? balanceData as { balance?: number };
    return Number(d?.balance ?? 0);
  }, [balanceData]);

  const requests = useMemo(() => extractRequests(requestsData), [requestsData]);
  const pagination = useMemo(() => {
    const d = (requestsData as { data?: { pagination?: { page: number; pages: number; total: number; limit: number } } })?.data ?? requestsData as { pagination?: { page: number; pages: number; total: number; limit: number } };
    const p = d?.pagination;
    return { page: p?.page ?? 1, pages: p?.pages ?? 1, total: p?.total ?? requests.length, limit: p?.limit ?? 10 };
  }, [requestsData, requests.length]);

  const refreshing = balanceLoading || requestsLoading;

  const onRefresh = () => {
    void Promise.all([refetchBalance(), refetchRequests()]);
  };

  const openWithdrawModal = () => {
    setAmount('');
    setPaymentMethod('STRIPE');
    setPayoutDetails('');
    setWithdrawModalOpen(true);
  };

  const submitWithdrawal = async () => {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) {
      Toast.show({ type: 'error', text1: t('pharmacyPayouts.validation.enterValidAmount') });
      return;
    }
    if (n > balance) {
      Toast.show({ type: 'error', text1: t('pharmacyPayouts.validation.amountExceedsBalance') });
      return;
    }
    if (!payoutDetails.trim()) {
      Toast.show({ type: 'error', text1: t('pharmacyPayouts.validation.payoutDetailsRequired') });
      return;
    }
    try {
      await requestWithdrawal.mutateAsync({ amount: n, paymentMethod, paymentDetails: payoutDetails.trim() });
      Toast.show({ type: 'success', text1: t('pharmacyPayouts.toasts.withdrawalRequested') });
      setWithdrawModalOpen(false);
      setAmount('');
      setPayoutDetails('');
    } catch (err) {
      Toast.show({ type: 'error', text1: t('common.failed'), text2: getErrorMessage(err, t('pharmacyPayouts.errors.couldNotSubmitRequest')) });
    }
  };

  const canSubmit =
    amount.trim() &&
    Number(parseFloat(amount)) > 0 &&
    Number(parseFloat(amount)) <= balance &&
    payoutDetails.trim().length > 0 &&
    !requestWithdrawal.isPending;

  return (
    <ScreenContainer padded>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="wallet-outline" size={23} color={colors.primaryDark} /></View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{t('pharmacyPayouts.title', { defaultValue: 'Payment settings' })}</Text>
            <Text style={styles.heroText}>Manage your available balance, payout method, and withdrawal history.</Text>
          </View>
        </View>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>{t('pharmacyPayouts.preferredMethod.title')}</Text>
          <Text style={styles.sectionSubtitle}>
            {t('pharmacyPayouts.preferredMethod.subtitle')}
          </Text>
          <View style={styles.methodRow}>
            <View style={[styles.methodBox, styles.methodBoxActive]}>
              <View style={styles.methodIcon}><Ionicons name="card-outline" size={22} color={colors.primaryDark} /></View>
              <Text style={styles.methodName}>{t('pharmacyPayouts.paymentMethods.stripe')}</Text>
              <Button title={t('pharmacyPayouts.actions.configure')} variant="outline" onPress={openWithdrawModal} style={styles.configureBtn} />
            </View>
          </View>

          <View style={styles.balanceCard}>
            <View style={styles.balanceTopRow}>
              <View style={styles.balanceIcon}><Ionicons name="cash-outline" size={20} color={colors.primaryDark} /></View>
              <View style={styles.balanceCopy}>
                <Text style={styles.balanceLabel}>{t('pharmacyPayouts.balance.available')}</Text>
                <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
              </View>
            </View>
            <Button
              title={t('pharmacyPayouts.actions.requestWithdrawal')}
              onPress={openWithdrawModal}
              disabled={balance <= 0}
              style={styles.withdrawBtn}
              textStyle={styles.withdrawBtnText}
              icon={<Ionicons name="arrow-up-circle-outline" size={17} color={colors.textInverse} />}
            />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>{t('pharmacyPayouts.withdrawalRequests.title')}</Text>
        {requestsLoading && requests.length === 0 ? (
          <View style={styles.loadingRow}><ActivityIndicator size="small" color={colors.primary} /></View>
        ) : requests.length === 0 ? (
          <Card style={styles.card}>
            <Text style={styles.emptyText}>{t('pharmacyPayouts.withdrawalRequests.empty')}</Text>
          </Card>
        ) : (
          <>
            {requests.map((r: any) => (
              <Card key={r._id ?? r.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestDate}>{formatDate(r.requestedAt ?? r.createdAt ?? r.date)}</Text>
                  <StatusBadge status={r.status ?? ''} t={t} />
                </View>
                <View style={styles.requestDetailRow}>
                  <Text style={styles.requestDetailLabel}>{t('pharmacyPayouts.labels.paymentMethod')}</Text>
                  <Text style={styles.requestDetailValue}>
                    {t(`pharmacyPayouts.paymentMethods.${String(PAYMENT_METHOD_LABELS[r.paymentMethod ?? ''] ?? '').toLowerCase()}`, {
                      defaultValue: r.paymentMethod ?? t('common.na'),
                    })}
                  </Text>
                </View>
                <View style={styles.requestDetailRow}>
                  <Text style={styles.requestDetailLabel}>{t('pharmacyPayouts.labels.amount')}</Text>
                  <Text style={styles.requestDetailAmount}>€{Number(r.amount).toFixed(2)}</Text>
                </View>
                {r.netAmount != null && r.netAmount !== r.amount && (
                  <View style={styles.requestDetailRow}>
                    <Text style={styles.requestDetailLabel}>{t('pharmacyPayouts.labels.youReceive')}</Text>
                    <Text style={styles.requestDetailValue}>€{Number(r.netAmount).toFixed(2)}</Text>
                  </View>
                )}
                <View style={styles.requestDetailRow}>
                  <Text style={styles.requestDetailLabel}>{t('pharmacyPayouts.labels.fee')}</Text>
                  <Text style={styles.requestDetailValue}>
                    {r.withdrawalFeePercent != null
                      ? `${Number(r.withdrawalFeePercent).toFixed(0)}%` +
                        (r.withdrawalFeeAmount != null ? ` (€${Number(r.withdrawalFeeAmount).toFixed(2)})` : '')
                      : t('pharmacyPayouts.fee.noFee')}
                  </Text>
                </View>
                {r.totalDeducted != null && r.totalDeducted > 0 && (
                  <View style={styles.requestDetailRow}>
                    <Text style={styles.requestDetailLabel}>{t('pharmacyPayouts.labels.totalDeducted')}</Text>
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
                <Text style={styles.pageText}>{t('pharmacyPayouts.pagination.pageOf', { page, pages: pagination.pages })}</Text>
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
              <Text style={styles.modalTitle}>{t('pharmacyPayouts.modal.title')}</Text>
              <TouchableOpacity onPress={() => setWithdrawModalOpen(false)} hitSlop={12}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('pharmacyPayouts.balance.available')}</Text>
                <TextInput
                  style={[styles.formInput, styles.formInputDisabled]}
                  value={formatCurrency(balance)}
                  editable={false}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('pharmacyPayouts.modal.amountToWithdraw')} <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.formInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder={t('pharmacyPayouts.modal.amountPlaceholder')}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('pharmacyPayouts.modal.paymentMethod')} <Text style={styles.required}>*</Text></Text>
                <View style={styles.methodOptions}>
                  {(['STRIPE', 'BANK_TRANSFER', 'PAYPAL'] as const).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.methodOption, paymentMethod === m && styles.methodOptionActive]}
                      onPress={() => setPaymentMethod(m)}
                    >
                      <Text style={[styles.methodOptionText, paymentMethod === m && styles.methodOptionTextActive]}>
                        {t(`pharmacyPayouts.paymentMethods.${String(PAYMENT_METHOD_LABELS[m]).toLowerCase()}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('pharmacyPayouts.modal.payoutDetails')} <Text style={styles.required}>*</Text></Text>
                <Text style={styles.formHint}>{t('pharmacyPayouts.modal.payoutDetailsHint')}</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={payoutDetails}
                  onChangeText={setPayoutDetails}
                  placeholder={t('pharmacyPayouts.modal.payoutDetailsPlaceholder')}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <Button title={t('common.cancel')} variant="outline" onPress={() => setWithdrawModalOpen(false)} style={styles.modalBtn} />
              <Button title={t('pharmacyPayouts.modal.submitRequest')} onPress={submitWithdrawal} disabled={!canSubmit} loading={requestWithdrawal.isPending} style={styles.modalBtn} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  loadingRow: { padding: spacing.lg, alignItems: 'center' },
  hero: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 18, backgroundColor: colors.successLight, borderWidth: 1, borderColor: colors.primaryLight + '25', marginBottom: spacing.md },
  heroIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondaryLight, marginRight: spacing.md },
  heroCopy: { flex: 1 },
  heroTitle: { ...typography.h3, color: colors.primaryDark },
  heroText: { ...typography.caption, color: colors.primaryDark, opacity: 0.72, marginTop: 3 },
  card: { marginBottom: spacing.md, borderWidth: 1, borderColor: colors.borderLight },
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
  methodIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '1B', marginRight: spacing.sm },
  methodName: { ...typography.body, fontWeight: '600', flex: 1 },
  configureBtn: { minWidth: 82, minHeight: 40, paddingHorizontal: spacing.sm, paddingVertical: 9 },
  balanceCard: { backgroundColor: colors.backgroundTertiary, padding: spacing.md, borderRadius: 14 },
  balanceTopRow: { flexDirection: 'row', alignItems: 'center' },
  balanceIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondaryLight, marginRight: spacing.sm },
  balanceCopy: { flex: 1 },
  balanceLabel: { ...typography.caption, color: colors.textSecondary },
  balanceAmount: { ...typography.h2, fontWeight: '700' },
  withdrawBtn: { alignSelf: 'flex-start', minWidth: 0, minHeight: 43, paddingHorizontal: spacing.md, paddingVertical: 10, marginTop: spacing.md },
  withdrawBtnText: { fontSize: 13 },
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
