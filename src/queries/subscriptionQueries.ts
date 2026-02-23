/**
 * Veterinarian subscription: plans and my subscription.
 * Mirrors VeterinaryFrontend subscriptionQueries.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export function useSubscriptionPlans(params?: Record<string, unknown>) {
  const hasParams = !!params && Object.keys(params).length > 0;
  return useQuery({
    queryKey: hasParams ? ['subscription-plans', params] : ['subscription-plans'],
    queryFn: () =>
      api.get<{ success?: boolean; data?: unknown[] }>(
        API_ROUTES.SUBSCRIPTION_PLANS.ACTIVE,
        hasParams ? { params } : undefined
      ),
  });
}

export function useMySubscription() {
  return useQuery({
    queryKey: ['subscriptions', 'my'],
    queryFn: () =>
      api.get<{ success?: boolean; data?: Record<string, unknown> }>(API_ROUTES.SUBSCRIPTIONS.MY_SUBSCRIPTION),
  });
}
