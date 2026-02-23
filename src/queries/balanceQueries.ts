/**
 * Balance and withdrawal requests (vet/pet-owner).
 * GET /balance, GET /balance/withdraw/requests, POST /balance/withdraw/request.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export function useBalance() {
  return useQuery({
    queryKey: ['balance'],
    queryFn: () =>
      api.get<{ success?: boolean; data?: { balance?: number } }>(API_ROUTES.BALANCE.GET),
  });
}

export interface WithdrawalRequestItem {
  _id: string;
  amount: number;
  status: string;
  paymentMethod?: string;
  paymentDetails?: string;
  requestedAt?: string;
  createdAt?: string;
  withdrawalFeePercent?: number | null;
  withdrawalFeeAmount?: number | null;
  totalDeducted?: number | null;
  netAmount?: number | null;
  [key: string]: unknown;
}

export function useWithdrawalRequests(params: { page?: number; limit?: number; status?: string } = {}) {
  return useQuery({
    queryKey: ['balance', 'withdrawal-requests', params],
    queryFn: () =>
      api.get<{
        success?: boolean;
        data?: { requests?: WithdrawalRequestItem[]; pagination?: { page: number; limit: number; total: number; pages: number } };
      }>(API_ROUTES.BALANCE.WITHDRAW_REQUESTS, {
        params: { page: params.page ?? 1, limit: params.limit ?? 20, ...(params.status ? { status: params.status } : {}) },
      }),
  });
}

export function useRequestWithdrawal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { amount: number; paymentMethod: string; paymentDetails: string }) =>
      api.post<{ success?: boolean; data?: unknown }>(API_ROUTES.BALANCE.WITHDRAW_REQUEST, {
        amount: payload.amount,
        paymentMethod: payload.paymentMethod,
        paymentDetails: payload.paymentDetails,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['balance', 'withdrawal-requests'] });
    },
  });
}
