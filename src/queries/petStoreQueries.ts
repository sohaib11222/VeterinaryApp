/**
 * Pet store queries – list and get by id.
 * Backend list returns { success, data: { petStores, pagination } }.
 * Backend get returns { success, data: petStore } (with ownerId populated).
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export interface PetStoreListParams {
  kind?: string;
  search?: string;
  city?: string;
  page?: number;
  limit?: number;
  ownerId?: string;
  includeInactive?: boolean;
}

export function usePetStores(params: PetStoreListParams = {}) {
  return useQuery({
    queryKey: ['pet-stores', params],
    queryFn: () =>
      api.get<{ success: boolean; data?: { petStores?: unknown[]; pagination?: unknown } }>(
        API_ROUTES.PET_STORES.LIST,
        { params }
      ),
  });
}

export function usePetStore(petStoreId: string | null | undefined) {
  return useQuery({
    queryKey: ['pet-store', petStoreId],
    queryFn: () =>
      api.get<{ success: boolean; data?: unknown }>(
        API_ROUTES.PET_STORES.GET(petStoreId!)
      ),
    enabled: !!petStoreId,
  });
}
