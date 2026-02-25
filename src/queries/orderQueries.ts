/**
 * Order queries – list and get by id.
 * Backend list returns { success, data: { orders, pagination } } (filtered by role).
 * Backend get returns { success, data: order }.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export interface OrderListParams {
  status?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
}

export function useOrders(params: OrderListParams = {}) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () =>
      api.get<{ success: boolean; data?: { orders?: unknown[]; pagination?: unknown } }>(
        API_ROUTES.ORDERS.LIST,
        { params }
      ),
  });
}

export function useOrder(orderId: string | null | undefined) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () =>
      api.get<{ success: boolean; data?: unknown }>(
        API_ROUTES.ORDERS.GET(orderId!)
      ),
    enabled: !!orderId,
  });
}
