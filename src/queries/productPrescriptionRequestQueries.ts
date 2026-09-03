import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export type PrescriptionEligibility = {
  canPurchase?: boolean;
  status?: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  request?: { reviewNotes?: string | null } | null;
};

export type PharmacyPrescriptionRequest = {
  _id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  originalName?: string | null;
  prescriptionUrl?: string;
  reviewNotes?: string | null;
  createdAt?: string;
  petOwnerId?: { _id?: string; name?: string; fullName?: string; email?: string; phone?: string } | null;
  productId?: { _id?: string; name?: string; selectedVariant?: Record<string, unknown> } | null;
};

export function usePharmacyPrescriptionRequests(
  params: { status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'; page?: number; limit?: number } = {},
  options: { enabled?: boolean; refetchInterval?: number } = {}
) {
  return useQuery({
    queryKey: ['product-prescription-requests', 'pharmacy', params],
    queryFn: () => api.get<{ success?: boolean; data?: { requests?: PharmacyPrescriptionRequest[] } }>(API_ROUTES.PRODUCT_PRESCRIPTION_REQUESTS.PHARMACY, { params: { page: 1, limit: 50, ...params } }),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10_000,
    ...options,
  });
}

export function usePharmacyPendingPrescriptionCount(options: { enabled?: boolean; refetchInterval?: number } = {}) {
  return useQuery({
    queryKey: ['product-prescription-requests', 'pharmacy', 'pending-count'],
    queryFn: () => api.get<{ success?: boolean; data?: { pendingCount?: number } }>(API_ROUTES.PRODUCT_PRESCRIPTION_REQUESTS.PENDING_COUNT),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 15_000,
    ...options,
  });
}

export function useProductPrescriptionEligibility(
  productId: string | null | undefined,
  variantId?: string | null,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ['productPrescriptionEligibility', productId, variantId ?? null],
    queryFn: () => api.get<{ success?: boolean; data?: PrescriptionEligibility }>(
      API_ROUTES.PRODUCT_PRESCRIPTION_REQUESTS.ELIGIBILITY(productId!),
      { params: variantId ? { variantId } : {} }
    ),
    enabled: Boolean(productId) && options.enabled !== false,
  });
}
