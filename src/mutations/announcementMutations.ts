/**
 * Mark announcement as read (veterinarian).
 * Mirrors VeterinaryFrontend announcementMutations.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export function useMarkAnnouncementAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (announcementId: string) =>
      api.post<{ success?: boolean }>(API_ROUTES.ANNOUNCEMENTS.MARK_READ(announcementId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', 'veterinarian'] });
      queryClient.invalidateQueries({ queryKey: ['announcements', 'unread-count'] });
    },
  });
}
