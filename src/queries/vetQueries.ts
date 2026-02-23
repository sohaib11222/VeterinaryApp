/**
 * Vet-specific queries (authenticated as VETERINARIAN).
 * Uses /veterinarians/reviews and /veterinarians/invoices.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export function useVetReviews(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ['vet', 'reviews', params],
    queryFn: () =>
      api.get<{ data?: { reviews?: unknown[]; pagination?: unknown }; reviews?: unknown[] }>(
        API_ROUTES.VETERINARIANS.REVIEWS,
        { params: { limit: params.limit ?? 50, page: params.page ?? 1, ...params } }
      ),
  });
}

export function useVetInvoices(params: { page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ['vet', 'invoices', params],
    queryFn: () =>
      api.get<{ data?: { invoices?: unknown[]; transactions?: unknown[]; pagination?: unknown } }>(
        API_ROUTES.VETERINARIANS.INVOICES,
        { params: { limit: params.limit ?? 50, page: params.page ?? 1, ...params } }
      ),
  });
}

export function useVetInvoice(transactionId: string | null | undefined) {
  return useQuery({
    queryKey: ['vet', 'invoice', transactionId],
    queryFn: () =>
      api.get<{ data?: unknown }>(API_ROUTES.VETERINARIANS.INVOICE(transactionId!)),
    enabled: !!transactionId,
  });
}
