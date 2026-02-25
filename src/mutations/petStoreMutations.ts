/**
 * Pet store (pharmacy/parapharmacy) mutations.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export function useCreatePetStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post<{ success: boolean; data?: unknown }>(API_ROUTES.PET_STORES.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-stores'] });
      queryClient.invalidateQueries({ queryKey: ['pet-store', 'me'] });
    },
  });
}

export function useUpdatePetStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ petStoreId, data }: { petStoreId: string; data: Record<string, unknown> }) =>
      api.put<{ success: boolean; data?: unknown }>(API_ROUTES.PET_STORES.UPDATE(petStoreId), data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pet-stores'] });
      queryClient.invalidateQueries({ queryKey: ['pet-store', 'me'] });
      if (variables?.petStoreId) {
        queryClient.invalidateQueries({ queryKey: ['pet-store', variables.petStoreId] });
      }
    },
  });
}

/** Body: { planId: string } */
export function useBuyPetStoreSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { planId: string }) =>
      api.post<{ success: boolean; data?: unknown }>(API_ROUTES.PET_STORES.BUY_SUBSCRIPTION, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pet-store', 'my-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'mine'] });
    },
  });
}
