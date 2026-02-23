/**
 * Pet owner queries – dashboard, appointments, payments (invoices).
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export interface PetOwnerPaymentsParams {
  status?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export function usePetOwnerPayments(params: PetOwnerPaymentsParams = {}) {
  return useQuery({
    queryKey: ['petOwner', 'payments', params],
    queryFn: () =>
      api.get<{ success?: boolean; data?: { transactions?: unknown[]; pagination?: { page?: number; limit?: number; total?: number; pages?: number } } }>(
        API_ROUTES.PET_OWNER.PAYMENTS,
        { params }
      ),
  });
}

export function usePaymentTransaction(transactionId: string | null | undefined) {
  return useQuery({
    queryKey: ['payment', 'transaction', transactionId],
    queryFn: () =>
      api.get<{ success?: boolean; data?: unknown }>(
        API_ROUTES.PAYMENT.TRANSACTION(transactionId!)
      ),
    enabled: !!transactionId,
  });
}
