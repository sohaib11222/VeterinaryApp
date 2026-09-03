import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export type SubmitProductPrescriptionPayload = {
  productId: string;
  variantId?: string | null;
  prescriptionUrl: string;
  originalName: string;
  mimeType?: string | null;
};

export function useSubmitProductPrescriptionRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitProductPrescriptionPayload) =>
      api.post<{ success?: boolean; data?: unknown }>(API_ROUTES.PRODUCT_PRESCRIPTION_REQUESTS.BASE, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['productPrescriptionEligibility', variables.productId, variables.variantId ?? null],
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useReviewProductPrescriptionRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, status, reviewNotes }: { requestId: string; status: 'APPROVED' | 'REJECTED'; reviewNotes?: string }) =>
      api.put<{ success?: boolean; data?: unknown }>(API_ROUTES.PRODUCT_PRESCRIPTION_REQUESTS.REVIEW(requestId), { status, reviewNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-prescription-requests'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
