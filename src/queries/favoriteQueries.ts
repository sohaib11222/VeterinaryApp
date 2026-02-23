/**
 * Favorite queries – list pet owner's favorite veterinarians.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export function useFavorites(
  petOwnerId: string | null | undefined,
  params: { page?: number; limit?: number } = {}
) {
  return useQuery({
    queryKey: ['favorites', petOwnerId, params],
    queryFn: () =>
      api.get<{ success: boolean; data?: { favorites?: unknown[]; pagination?: unknown } }>(
        API_ROUTES.FAVORITE.LIST(petOwnerId!),
        { params: { limit: 500, ...params } }
      ),
    enabled: !!petOwnerId,
  });
}
