/**
 * Announcements for veterinarians.
 * Mirrors VeterinaryFrontend announcementQueries.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

function stableParamsKey(params: Record<string, unknown> = {}): string {
  const keys = Object.keys(params).sort();
  const normalized: Record<string, unknown> = {};
  keys.forEach((k) => { normalized[k] = params[k]; });
  return JSON.stringify(normalized);
}

export function useVeterinarianAnnouncements(
  params: { page?: number; limit?: number; isRead?: boolean } = {},
  queryOptions: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ['announcements', 'veterinarian', stableParamsKey(params)],
    queryFn: () =>
      api.get<{ success?: boolean; data?: { announcements?: unknown[]; pagination?: { page: number; pages: number; total: number } } }>(
        API_ROUTES.ANNOUNCEMENTS.VETERINARIAN_LIST,
        { params: { page: params.page ?? 1, limit: params.limit ?? 20, ...(params.isRead !== undefined ? { isRead: params.isRead } : {}) } }
      ),
    refetchOnWindowFocus: false,
    staleTime: 30_000,
    ...queryOptions,
  });
}

export function useUnreadAnnouncementCount(queryOptions: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['announcements', 'unread-count'],
    queryFn: () =>
      api.get<{ success?: boolean; data?: { unreadCount?: number } }>(API_ROUTES.ANNOUNCEMENTS.UNREAD_COUNT),
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    ...queryOptions,
  });
}
