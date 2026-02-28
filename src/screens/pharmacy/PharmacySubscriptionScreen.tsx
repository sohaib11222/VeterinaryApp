import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useSubscriptionPlans } from '../../queries/subscriptionQueries';
import { useMyPetStoreSubscription } from '../../queries/petStoreQueries';
import { useBuyPetStoreSubscription } from '../../mutations/petStoreMutations';
import { getErrorMessage } from '../../utils/errorUtils';
import Toast from 'react-native-toast-message';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/appI18n';

function extractPlans(payload: unknown): any[] {
  const outer = (payload as { data?: unknown })?.data ?? payload;
  const d = (outer as { data?: unknown })?.data ?? outer;
  if (Array.isArray(d)) return d;
  const arr = (d as { plans?: unknown[] })?.plans;
  return Array.isArray(arr) ? arr : [];
}

function formatPrice(price: number | null | undefined): string {
  const locale = i18n.language?.startsWith('it') ? 'it-IT' : 'en-GB';
  const amount = Number(price ?? 0);
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return i18n.t('common.na');
  const d = new Date(dateStr);
  const locale = i18n.language?.startsWith('it') ? 'it-IT' : 'en-GB';
  return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function PharmacySubscriptionScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isParapharmacy = user?.role === 'PARAPHARMACY';
  const plansQuery = useSubscriptionPlans({ planType: 'PET_STORE' });
  const mySubQuery = useMyPetStoreSubscription({ enabled: !isParapharmacy });
  const buyMutation = useBuyPetStoreSubscription();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const plans = useMemo(() => extractPlans(plansQuery.data), [plansQuery.data]);
  const mySub: {
    hasActiveSubscription?: boolean;
    subscriptionPlan?: any;
    startDate?: string;
    endDate?: string;
  } | null = useMemo(() => {
    const outer = (mySubQuery.data as { data?: unknown } | undefined)?.data ?? mySubQuery.data;
    const inner = (outer as { data?: unknown } | undefined)?.data ?? outer;
    return (inner ?? null) as {
      hasActiveSubscription?: boolean;
      subscriptionPlan?: any;
      startDate?: string;
      endDate?: string;
    } | null;
  }, [mySubQuery.data]);
  const hasActiveSubscription = isParapharmacy ? true : !!mySub?.hasActiveSubscription;
  const currentPlan = mySub?.subscriptionPlan;
  const currentPlanId = currentPlan?._id ?? currentPlan?.id;
  const endLabel = mySub?.endDate ? t('pharmacySubscription.current.ends', { date: formatDate(mySub.endDate) }) : '';

  const onBuy = async () => {
    if (!selectedPlanId) return;
    try {
      await buyMutation.mutateAsync({ planId: selectedPlanId });
      Toast.show({ type: 'success', text1: t('pharmacySubscription.toasts.subscriptionUpdated') });
      setSelectedPlanId(null);
    } catch (err) {
      Toast.show({ type: 'error', text1: t('common.failed'), text2: getErrorMessage(err, t('pharmacySubscription.errors.couldNotPurchase')) });
    }
  };

  if (isParapharmacy) {
    return (
      <ScreenContainer padded>
        <Card>
          <Text style={styles.sectionTitle}>{t('pharmacySubscription.title')}</Text>
          <Text style={styles.desc}>{t('pharmacySubscription.parapharmacy.noSubscriptionRequired')}</Text>
        </Card>
      </ScreenContainer>
    );
  }

  if (plansQuery.isLoading || mySubQuery.isLoading) {
    return (
      <ScreenContainer padded>
        <View style={styles.loadingRow}><ActivityIndicator size="small" color={colors.primary} /></View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll padded>
      <Card>
        <Text style={styles.sectionTitle}>{t('pharmacySubscription.current.title')}</Text>
        <View style={styles.statusRow}>
          <Text style={styles.label}>{t('pharmacySubscription.current.status')}</Text>
          <View style={[styles.badge, !hasActiveSubscription && styles.badgeInactive]}>
            <Text style={[styles.badgeText, !hasActiveSubscription && styles.badgeTextInactive]}>
              {hasActiveSubscription ? t('pharmacySubscription.current.active') : t('pharmacySubscription.current.inactive')}
            </Text>
          </View>
        </View>
        {currentPlan && (
          <Text style={styles.desc}>
            {t('pharmacySubscription.current.planLine', {
              planName: currentPlan?.name ?? currentPlan?.title ?? t('common.na'),
              endDate: endLabel,
            })}
          </Text>
        )}
        {!hasActiveSubscription && (
          <Text style={styles.desc}>{t('pharmacySubscription.current.subscribeHint')}</Text>
        )}
      </Card>
      {plansQuery.isError && (
        <Card><Text style={styles.errorText}>{plansQuery.error?.message ?? t('pharmacySubscription.errors.failedToLoadPlans')}</Text></Card>
      )}
      {plans.length > 0 && (
        <ScrollView style={styles.plansScroll} showsVerticalScrollIndicator={false}>
          {plans.map((plan: any) => {
            const id = plan?._id ?? plan?.id;
            const name = plan?.name ?? plan?.title ?? t('pharmacySubscription.plans.planFallback');
            const price = plan?.price ?? plan?.monthlyPrice;
            const isCurrent = id === currentPlanId;
            const isSelected = id === selectedPlanId;
            return (
              <Card key={id} style={styles.planCard}>
                <Text style={styles.planName}>{name}</Text>
                <Text style={styles.planPrice}>{t('pharmacySubscription.plans.pricePerMonth', { price: formatPrice(price) })}</Text>
                {plan?.description ? <Text style={styles.planFeatures}>{plan.description}</Text> : null}
                {!isCurrent && (
                  <TouchableOpacity
                    style={[styles.planBtn, isSelected && styles.planBtnSelected]}
                    onPress={() => setSelectedPlanId(isSelected ? null : id)}
                  >
                    <Text style={[styles.planBtnText, isSelected && styles.planBtnTextSelected]}>
                      {isSelected ? t('pharmacySubscription.plans.selected') : t('pharmacySubscription.plans.select')}
                    </Text>
                  </TouchableOpacity>
                )}
              </Card>
            );
          })}
        </ScrollView>
      )}
      {selectedPlanId && (
        <Button title={t('pharmacySubscription.actions.confirmSubscription')} onPress={onBuy} loading={buyMutation.isPending} style={styles.confirmBtn} />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingRow: { padding: spacing.xl, alignItems: 'center' },
  errorText: { ...typography.body, color: colors.error },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  label: { ...typography.body, marginRight: spacing.sm },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.successLight },
  badgeInactive: { backgroundColor: colors.errorLight },
  badgeText: { ...typography.caption, color: colors.success, fontWeight: '600' },
  badgeTextInactive: { color: colors.error },
  desc: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  plansScroll: { marginTop: spacing.sm },
  planCard: { marginTop: spacing.sm },
  planName: { ...typography.h3 },
  planPrice: { ...typography.h2, color: colors.primary, marginTop: 4 },
  planFeatures: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  planBtn: { marginTop: spacing.sm, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.primary, alignItems: 'center' },
  planBtnSelected: { backgroundColor: colors.primary },
  planBtnText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  planBtnTextSelected: { color: colors.textInverse },
  confirmBtn: { marginTop: spacing.lg },
});
