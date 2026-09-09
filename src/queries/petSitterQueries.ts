import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export type PetSitterListParams = { search?: string; petType?: string; page?: number; limit?: number };

export function usePetSitters(params: PetSitterListParams = {}) {
  return useQuery({
    queryKey: ['pet-sitters', params],
    queryFn: () => api.get(API_ROUTES.PET_SITTERS.LIST, { params: { page: 1, limit: 30, ...params } }),
    refetchInterval: 30_000,
  });
}

export function usePetSitter(petSitterId: string | null | undefined) {
  return useQuery({
    queryKey: ['pet-sitter', petSitterId],
    queryFn: () => api.get(API_ROUTES.PET_SITTERS.PUBLIC_PROFILE(petSitterId!)),
    enabled: Boolean(petSitterId),
  });
}

export function useMyPetSitterProfile() {
  return useQuery({
    queryKey: ['pet-sitter', 'me'],
    queryFn: () => api.get(API_ROUTES.PET_SITTERS.ME),
    refetchInterval: 30_000,
  });
}
