import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useSubscriptionPlans, useMySubscription } from '../../queries/subscriptionQueries';
import { usePurchaseSubscriptionPlan } from '../../mutations/subscriptionMutations';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

type PlanItem = {
  _id: string;
  name?: string;
  price?: number;
  features?: string[];
  durationInDays?: number;
};

function normalizePlans(response: unknown): PlanItem[] {
  const body = response as { data?: unknown[] };
  const list = Array.isArray(body?.data) ? body.data : [];
  const byName = new Map<string, PlanItem>();
  list.forEach((p) => {
    const rec = p as Record<string, unknown>;
    const name = String(rec?.name ?? '').trim().toUpperCase();
    if (!name) return;
    if (!byName.has(name)) byName.set(name, rec as PlanItem);
  });
  return Array.from(byName.values());
}

export function VetSubscriptionScreen() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('it') ? 'it-IT' : 'en-US';
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null);

  const { data: plansResponse, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: myResponse, isLoading: myLoading } = useMySubscription();
  const purchase = usePurchaseSubscriptionPlan();

  const plans = useMemo(() => normalizePlans(plansResponse ?? {}), [plansResponse]);

  const mySubscription = useMemo(() => {
    const payload = (myResponse as { data?: Record<string, unknown> })?.data ?? myResponse as Record<string, unknown>;
    return payload ?? null;
  }, [myResponse]);

  const currentPlanId = (mySubscription as { subscriptionPlan?: { _id?: string } } | null)?.subscriptionPlan?._id;
  const expiresAt = mySubscription?.expiresAt as string | undefined;
  const hasActiveSubscription = !!mySubscription?.hasActiveSubscription;
  const usage = mySubscription?.usage as Record<string, number> | undefined;
  const remaining = mySubscription?.remaining as Record<string, number | null> | undefined;

  const handleUpgrade = (plan: PlanItem) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!selectedPlan?._id) return;
    try {
      await purchase.mutateAsync({ planId: selectedPlan._id });
      Toast.show({ type: 'success', text1: t('vetSubscription.toasts.updated') });
      setShowPaymentModal(false);
      setSelectedPlan(null);
    } catch (err) {
      Toast.show({ type: 'error', text1: (err as { message?: string })?.message ?? t('vetSubscription.errors.purchaseFailed') });
    }
  };

  if (plansLoading || myLoading) {
    return (
      <ScreenContainer padded>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll padded>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.currentCard}>
          <View style={styles.currentRow}>
            <View>
              <Text style={styles.currentLabel}>
                {hasActiveSubscription
                  ? t('vetSubscription.currentPlan', { plan: (mySubscription?.subscriptionPlan as { name?: string })?.name ?? '—' })
                  : t('vetSubscription.noActivePlan')}
              </Text>
              <Text style={styles.currentSub}>
                {hasActiveSubscription && expiresAt
                  ? t('vetSubscription.renewsOn', { date: new Date(expiresAt).toLocaleDateString(locale) })
                  : t('vetSubscription.subscribeToUnlock')}
              </Text>
              {hasActiveSubscription && usage && remaining && (
                <Text style={styles.usageText}>
                  {t('vetSubscription.usage', {
                    privateUsed: usage.privateConsultations ?? 0,
                    privateTotal: remaining.privateConsultations === null
                      ? t('vetSubscription.unlimited')
                      : (usage.privateConsultations ?? 0) + (remaining.privateConsultations ?? 0),
                    videoUsed: usage.videoConsultations ?? 0,
                    videoTotal: remaining.videoConsultations === null
                      ? t('vetSubscription.unlimited')
                      : (usage.videoConsultations ?? 0) + (remaining.videoConsultations ?? 0),
                    chatUsed: usage.chatSessions ?? 0,
                    chatTotal: remaining.chatSessions === null
                      ? t('vetSubscription.unlimited')
                      : (usage.chatSessions ?? 0) + (remaining.chatSessions ?? 0),
                  })}
                </Text>
              )}
            </View>
            <View style={[styles.badge, hasActiveSubscription ? styles.badgeActive : styles.badgeInactive]}>
              <Text style={styles.badgeText}>{hasActiveSubscription ? t('vetSubscription.status.active') : t('vetSubscription.status.inactive')}</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>{t('vetSubscription.sectionTitle')}</Text>
        {plans.map((plan) => {
          const isCurrent = currentPlanId && String(plan._id) === String(currentPlanId);
          const popular = String(plan?.name ?? '').toUpperCase() === 'PRO';
          return (
            <Card key={plan._id} style={[styles.planCard, popular && styles.planCardPopular, isCurrent && styles.planCardCurrent]}>
              {popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>{t('vetSubscription.badges.mostPopular')}</Text>
                </View>
              )}
              {isCurrent && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>{t('vetSubscription.badges.currentPlan')}</Text>
                </View>
              )}
              <Text style={styles.planName}>{t('vetSubscription.planName', { name: plan?.name ?? t('vetSubscription.planFallback') })}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>€{Number(plan?.price ?? 0)}</Text>
                <Text style={styles.perMonth}>{t('vetSubscription.perMonth')}</Text>
              </View>
              {(plan?.features?.length ?? 0) > 0 && (
                <View style={styles.features}>
                  {(plan.features ?? []).map((f: string, idx: number) => (
                    <Text key={idx} style={styles.featureItem}>✓ {f}</Text>
                  ))}
                </View>
              )}
              {isCurrent ? (
                <Button title={t('vetSubscription.badges.currentPlan')} variant="outline" disabled onPress={() => {}} style={styles.planBtn} />
              ) : (
                <Button
                  title={t('vetSubscription.actions.choosePlan')}
                  onPress={() => handleUpgrade(plan)}
                  style={[styles.planBtn, popular && styles.planBtnPrimary]}
                />
              )}
            </Card>
          );
        })}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>{t('vetSubscription.info.title')}</Text>
          <Text style={styles.infoText}>{t('vetSubscription.info.body')}</Text>
        </View>
      </ScrollView>

      <Modal visible={showPaymentModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowPaymentModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('vetSubscription.modal.title')}</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)} hitSlop={12}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalPlanName}>{t('vetSubscription.modal.selectedPlan', { name: selectedPlan?.name ?? '—' })}</Text>
              <Text style={styles.modalPrice}>{t('vetSubscription.modal.pricePerMonth', { price: Number(selectedPlan?.price ?? 0) })}</Text>
              <Text style={styles.modalHint}>{t('vetSubscription.modal.hint')}</Text>
            </View>
            <View style={styles.modalFooter}>
              <Button title={t('common.cancel')} variant="outline" onPress={() => setShowPaymentModal(false)} style={styles.modalBtn} />
              <Button
                title={purchase.isPending ? t('vetSubscription.actions.processing') : t('vetSubscription.actions.payNow')}
                onPress={handlePayment}
                disabled={purchase.isPending}
                style={styles.modalBtn}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  currentCard: { marginBottom: spacing.md },
  currentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  currentLabel: { ...typography.h3, marginBottom: 4 },
  currentSub: { ...typography.bodySmall, color: colors.textSecondary },
  usageText: { ...typography.caption, color: colors.textSecondary, marginTop: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  badgeActive: { backgroundColor: colors.successLight },
  badgeInactive: { backgroundColor: colors.backgroundTertiary },
  badgeText: { ...typography.label, fontWeight: '600' },
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  planCard: { marginBottom: spacing.sm, position: 'relative' },
  planCardPopular: { borderWidth: 2, borderColor: colors.primary },
  planCardCurrent: { borderWidth: 2, borderColor: colors.success },
  popularBadge: { position: 'absolute', top: spacing.sm, right: spacing.sm, backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  popularBadgeText: { ...typography.caption, color: colors.textInverse, fontWeight: '600' },
  currentBadge: { position: 'absolute', top: spacing.sm, right: spacing.sm, backgroundColor: colors.success, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  currentBadgeText: { ...typography.caption, color: colors.textInverse, fontWeight: '600' },
  planName: { ...typography.h3, textAlign: 'center', marginBottom: spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: spacing.sm },
  price: { ...typography.h1, color: colors.primary },
  perMonth: { ...typography.bodySmall, color: colors.textSecondary, marginLeft: 4 },
  features: { marginBottom: spacing.md },
  featureItem: { ...typography.bodySmall, marginTop: 4 },
  planBtn: { marginTop: spacing.xs },
  planBtnPrimary: {},
  infoBox: { marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.primaryLight + '20', borderRadius: 12 },
  infoTitle: { ...typography.label, marginBottom: 4 },
  infoText: { ...typography.bodySmall, color: colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.background, borderRadius: 16, width: '100%', maxWidth: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  modalTitle: { ...typography.h3 },
  modalClose: { fontSize: 20, color: colors.textSecondary },
  modalBody: { padding: spacing.md },
  modalPlanName: { ...typography.body, fontWeight: '600' },
  modalPrice: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  modalHint: { ...typography.caption, color: colors.textLight, marginTop: 8 },
  modalFooter: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  modalBtn: { flex: 1 },
});
