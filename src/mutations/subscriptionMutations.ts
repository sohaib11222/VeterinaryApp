/**
 * Veterinarian subscription purchase.
 * Mirrors VeterinaryFrontend subscriptionMutations.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export function usePurchaseSubscriptionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { planId: string }) =>
      api.post<{ success?: boolean; data?: unknown }>(API_ROUTES.SUBSCRIPTIONS.PURCHASE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'my'] });
    },
  });
}
