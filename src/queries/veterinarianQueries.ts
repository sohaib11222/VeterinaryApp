/**
 * Veterinarian queries – list (public search) and public profile.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export interface VeterinarianListParams {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  specialization?: string;
  isAvailableOnline?: boolean;
}

export function useVeterinarians(params: VeterinarianListParams = {}) {
  return useQuery({
    queryKey: ['veterinarians', params],
    queryFn: () =>
      api.get<{ success: boolean; data?: { veterinarians?: unknown[]; pagination?: unknown } }>(
        API_ROUTES.VETERINARIANS.LIST,
        { params: { limit: 12, page: 1, ...params } }
      ),
  });
}

export function useVeterinarianPublicProfile(veterinarianId: string | null | undefined) {
  return useQuery({
    queryKey: ['veterinarian', 'public', veterinarianId],
    queryFn: () =>
      api.get<{ success: boolean; data?: unknown }>(
        API_ROUTES.VETERINARIANS.PUBLIC_PROFILE(veterinarianId!)
      ),
    enabled: !!veterinarianId,
  });
}

/** Get own veterinarian profile (authenticated as VETERINARIAN). */
export function useVeterinarianProfile() {
  return useQuery({
    queryKey: ['veterinarian', 'profile'],
    queryFn: () =>
      api.get<{ success?: boolean; data?: Record<string, unknown> }>(API_ROUTES.VETERINARIANS.PROFILE),
  });
}
