/**
 * Chat queries – conversations, messages, unread count.
 * Mirrors VeterinaryFrontend chatQueries.js; backend returns { data: { conversations?, messages?, pagination? } } or similar.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

function stableParamsKey(params: Record<string, unknown> = {}): string {
  const keys = Object.keys(params).sort();
  const normalized: Record<string, unknown> = {};
  keys.forEach((k) => {
    normalized[k] = params[k];
  });
  return JSON.stringify(normalized);
}

export interface ConversationsParams {
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export function useConversations(params: ConversationsParams = {}, queryOptions: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['chat', 'conversations', stableParamsKey(params)],
    queryFn: () =>
      api.get<{ data?: { conversations?: unknown[]; pagination?: unknown }; conversations?: unknown[] }>(
        API_ROUTES.CHAT.CONVERSATIONS,
        { params: { limit: params.limit ?? 50, page: params.page ?? 1, ...params } }
      ),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30_000,
    ...queryOptions,
  });
}

export function useMessages(
  conversationId: string | null | undefined,
  params: { page?: number; limit?: number } = {},
  queryOptions: Record<string, unknown> = {}
) {
  return useQuery({
    queryKey: ['chat', 'messages', conversationId, stableParamsKey(params)],
    queryFn: () =>
      api.get<{ data?: { messages?: unknown[]; pagination?: unknown }; messages?: unknown[] }>(
        API_ROUTES.CHAT.MESSAGES(conversationId!),
        { params: { limit: params.limit ?? 50, page: params.page ?? 1, ...params } }
      ),
    enabled: !!conversationId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 10_000,
    ...queryOptions,
  });
}

export function useUnreadChatCount(queryOptions: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['chat', 'unread-count'],
    queryFn: () =>
      api.get<{ data?: { unreadCount?: number }; unreadCount?: number }>(API_ROUTES.CHAT.UNREAD_COUNT),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 15_000,
    ...queryOptions,
  });
}
