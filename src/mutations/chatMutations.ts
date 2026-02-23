/**
 * Chat mutations – getOrCreateConversation, sendMessage, markConversationRead.
 * Mirrors VeterinaryFrontend chatMutations.js.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export interface GetOrCreateConversationPayload {
  veterinarianId: string;
  petOwnerId?: string;
  appointmentId?: string;
  adminId?: string;
}

export function useGetOrCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GetOrCreateConversationPayload) =>
      api.post<{ _id?: string; data?: { _id?: string } }>(API_ROUTES.CHAT.CONVERSATION, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
}

export interface SendMessagePayload {
  conversationId: string;
  message?: string;
  type?: string;
  veterinarianId: string;
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
