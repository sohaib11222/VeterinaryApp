import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export interface SupportTicketListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  priority?: string;
}

function stableKey(params: SupportTicketListParams) {
  return JSON.stringify(Object.keys(params).sort().reduce((result, key) => ({ ...result, [key]: params[key as keyof SupportTicketListParams] }), {}));
}

export function useSupportTickets(params: SupportTicketListParams = {}, options: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['support-tickets', stableKey(params)],
    queryFn: () => api.get(API_ROUTES.SUPPORT_TICKETS.LIST, { params: { limit: 50, page: 1, ...params } }),
    refetchInterval: 15_000,
    refetchOnReconnect: true,
    ...options,
  });
}

export function useSupportTicket(ticketId: string | undefined, options: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: () => api.get(API_ROUTES.SUPPORT_TICKETS.GET(ticketId!)),
    enabled: Boolean(ticketId),
    refetchInterval: 10_000,
    refetchOnReconnect: true,
    ...options,
  });
}

export function useSupportTicketUnreadCount(options: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['support-tickets', 'unread-count'],
    queryFn: () => api.get(API_ROUTES.SUPPORT_TICKETS.UNREAD_COUNT),
    refetchInterval: 15_000,
    refetchOnReconnect: true,
    ...options,
  });
}
