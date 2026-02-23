/**
 * Pet mutations – delete pet (pet owner).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export function useDeletePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (petId: string) => api.delete(API_ROUTES.PETS.DELETE(petId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });
}
