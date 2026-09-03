import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

function invalidateSupport(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
  queryClient.invalidateQueries({ queryKey: ['support-ticket'] });
  queryClient.invalidateQueries({ queryKey: ['notifications'] });
}

export function useUploadSupportTicketAttachments() {
  return useMutation({
    mutationFn: (formData: FormData) => api.upload(API_ROUTES.SUPPORT_TICKETS.UPLOAD_ATTACHMENTS, formData, { timeout: 60_000 }),
  });
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => api.post(API_ROUTES.SUPPORT_TICKETS.CREATE, data),
    onSuccess: () => invalidateSupport(queryClient),
  });
}

export function useReplyToSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: string; data: unknown }) => api.post(API_ROUTES.SUPPORT_TICKETS.REPLY(ticketId), data),
    onSuccess: () => invalidateSupport(queryClient),
  });
}

export function useReopenSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) => api.post(API_ROUTES.SUPPORT_TICKETS.REOPEN(ticketId)),
    onSuccess: () => invalidateSupport(queryClient),
  });
}
