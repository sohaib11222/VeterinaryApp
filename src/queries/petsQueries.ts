/**
 * Pets queries – list current user's pets (pet owner).
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export function usePets() {
  return useQuery({
    queryKey: ['pets'],
    queryFn: () =>
      api.get<{ success: boolean; data?: unknown }>(API_ROUTES.PETS.LIST),
  });
}
