/**
 * Favorite mutations – add / remove veterinarian favorites (PET_OWNER).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export function useAddFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (veterinarianId: string) =>
      api.post<{ success: boolean; data?: { _id?: string } }>(
        API_ROUTES.FAVORITE.ADD,
        { veterinarianId }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (favoriteId: string) =>
      api.delete(API_ROUTES.FAVORITE.REMOVE(favoriteId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}
