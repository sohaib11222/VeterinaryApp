/**
 * Order mutations – create, pay, cancel.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export interface CreateOrderPayload {
  items: { productId: string; quantity: number }[];
  shippingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country?: string;
    zip: string;
  };
  paymentMethod?: string;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderPayload) =>
      api.post<{ success: boolean; data?: unknown }>(API_ROUTES.ORDERS.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function usePayForOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data?: { paymentMethod?: string } }) =>
      api.post<{ success: boolean; data?: unknown }>(
        API_ROUTES.ORDERS.PAY(orderId),
        data ?? {}
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (variables?.orderId) {
        queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      }
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) =>
      api.post<{ success: boolean; data?: unknown }>(API_ROUTES.ORDERS.CANCEL(orderId)),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: { status: string } }) =>
      api.put<{ success: boolean; data?: unknown }>(API_ROUTES.ORDERS.UPDATE_STATUS(orderId), data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (variables?.orderId) {
        queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      }
    },
  });
}

export function useUpdateShippingFee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: { shippingFee: number } }) =>
      api.put<{ success: boolean; data?: unknown }>(API_ROUTES.ORDERS.UPDATE_SHIPPING(orderId), data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (variables?.orderId) {
        queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      }
    },
  });
}
