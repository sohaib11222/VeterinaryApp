/**
 * Notification Queries
 * Mirrors VeterinaryFrontend notificationQueries.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

type NotificationListParams = {
  type?: string;
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
};

function stableParamsKey(params: Record<string, unknown> = {}): string {
  const keys = Object.keys(params).sort();
  const normalized: Record<string, unknown> = {};
  keys.forEach((k) => {
    normalized[k] = params[k];
  });
  return JSON.stringify(normalized);
}

export function useNotifications(
  params: NotificationListParams = {},
  queryOptions: { enabled?: boolean; refetchInterval?: number } = {}
) {
  return useQuery({
    queryKey: ['notifications', stableParamsKey(params)],
    queryFn: () => api.get(API_ROUTES.NOTIFICATIONS.LIST, { params }),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30_000,
    ...queryOptions,
  });
}

export function useUnreadNotificationsCount(queryOptions: { enabled?: boolean; refetchInterval?: number } = {}) {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get(API_ROUTES.NOTIFICATIONS.UNREAD_COUNT),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 60_000,
    ...queryOptions,
  });
}
