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

function extractPlans(payload: unknown): any[] {
  const outer = (payload as { data?: unknown })?.data ?? payload;
  const d = (outer as { data?: unknown })?.data ?? outer;
  if (Array.isArray(d)) return d;
  const arr = (d as { plans?: unknown[] })?.plans;
  return Array.isArray(arr) ? arr : [];
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return '€0.00';
  return `€${Number(price).toFixed(2)}`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function PharmacySubscriptionScreen() {
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

  const onBuy = async () => {
    if (!selectedPlanId) return;
    try {
      await buyMutation.mutateAsync({ planId: selectedPlanId });
      Toast.show({ type: 'success', text1: 'Subscription updated' });
      setSelectedPlanId(null);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed', text2: getErrorMessage(err, 'Could not purchase subscription') });
    }
  };

  if (isParapharmacy) {
    return (
      <ScreenContainer padded>
        <Card>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <Text style={styles.desc}>Parapharmacy accounts do not require a subscription.</Text>
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
        <Text style={styles.sectionTitle}>Current Subscription</Text>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Status</Text>
          <View style={[styles.badge, !hasActiveSubscription && styles.badgeInactive]}>
            <Text style={[styles.badgeText, !hasActiveSubscription && styles.badgeTextInactive]}>{hasActiveSubscription ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>
        {currentPlan && (
          <Text style={styles.desc}>
            Plan: {currentPlan?.name ?? currentPlan?.title ?? '—'}. {mySub?.endDate ? `Ends ${formatDate(mySub.endDate)}` : ''}
          </Text>
        )}
        {!hasActiveSubscription && (
          <Text style={styles.desc}>Subscribe to manage products and receive orders.</Text>
        )}
      </Card>
      {plansQuery.isError && (
        <Card><Text style={styles.errorText}>{plansQuery.error?.message ?? 'Failed to load plans'}</Text></Card>
      )}
      {plans.length > 0 && (
        <ScrollView style={styles.plansScroll} showsVerticalScrollIndicator={false}>
          {plans.map((plan: any) => {
            const id = plan?._id ?? plan?.id;
            const name = plan?.name ?? plan?.title ?? 'Plan';
            const price = plan?.price ?? plan?.monthlyPrice;
            const isCurrent = id === currentPlanId;
            const isSelected = id === selectedPlanId;
            return (
              <Card key={id} style={styles.planCard}>
                <Text style={styles.planName}>{name}</Text>
                <Text style={styles.planPrice}>{formatPrice(price)}/month</Text>
                {plan?.description ? <Text style={styles.planFeatures}>{plan.description}</Text> : null}
                {!isCurrent && (
                  <TouchableOpacity
                    style={[styles.planBtn, isSelected && styles.planBtnSelected]}
                    onPress={() => setSelectedPlanId(isSelected ? null : id)}
                  >
                    <Text style={[styles.planBtnText, isSelected && styles.planBtnTextSelected]}>{isSelected ? 'Selected' : 'Select'}</Text>
                  </TouchableOpacity>
                )}
              </Card>
            );
          })}
        </ScrollView>
      )}
      {selectedPlanId && (
        <Button title="Confirm subscription" onPress={onBuy} loading={buyMutation.isPending} style={styles.confirmBtn} />
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
