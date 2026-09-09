/**
 * Chat mutations – getOrCreateConversation, sendMessage, markConversationRead.
 * Mirrors VeterinaryFrontend chatMutations.js.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export interface GetOrCreateConversationPayload {
  veterinarianId?: string;
  petSitterId?: string;
  businessId?: string;
  petOwnerId?: string;
  appointmentId?: string;
  adminId?: string;
}

type ConversationLike = { _id?: string; id?: string; data?: unknown; conversation?: unknown };

/** The API uses `{ success, data: conversation }`; tolerate legacy nested envelopes too. */
export function getConversationFromResponse(response: unknown): ConversationLike | null {
  const value = response as ConversationLike | null | undefined;
  const candidates: unknown[] = [
    value,
    value?.conversation,
    value?.data,
    (value?.data as ConversationLike | undefined)?.conversation,
    (value?.data as ConversationLike | undefined)?.data,
    ((value?.data as ConversationLike | undefined)?.data as ConversationLike | undefined)?.conversation,
  ];
  return (candidates.find((candidate) => {
    const item = candidate as ConversationLike | null | undefined;
    return !!(item?._id || item?.id);
  }) as ConversationLike | undefined) ?? null;
}

export function getConversationId(response: unknown): string | null {
  const conversation = getConversationFromResponse(response);
  const id = conversation?._id ?? conversation?.id;
  return id ? String(id) : null;
}

export function useGetOrCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: GetOrCreateConversationPayload) => {
      const response = await api.post(API_ROUTES.CHAT.CONVERSATION, data);
      const conversation = getConversationFromResponse(response);
      if (!conversation) throw new Error('The conversation could not be prepared.');
      return conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
}

export interface SendMessagePayload {
  conversationId: string;
  message?: string;
  type?: string;
  veterinarianId?: string;
  petSitterId?: string;
  businessId?: string;
  petOwnerId?: string;
  appointmentId?: string;
  adminId?: string;
  attachments?: unknown[];
  fileUrl?: string;
  fileName?: string;
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendMessagePayload) => api.post(API_ROUTES.CHAT.SEND, data),
    onSuccess: (_, variables) => {
      const conversationId = variables?.conversationId;
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'messages', conversationId] });
      }
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'unread-count'] });
    },
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      api.post(API_ROUTES.CHAT.MARK_READ(conversationId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'unread-count'] });
    },
  });
}

/** Only the assigned veterinarian can close a doctor–pet owner conversation. */
export function useMarkConversationComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      api.post(API_ROUTES.CHAT.MARK_COMPLETE(conversationId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'unread-count'] });
    },
  });
}
