/**
 * Veterinarian profile update (authenticated as VETERINARIAN).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export interface UpdateVeterinarianProfilePayload {
  title?: string;
  biography?: string;
  consultationFees?: { clinic?: number | null; online?: number | null };
  memberships?: Array<{ name: string }>;
  specializations?: string[];
  education?: Array<{ degree?: string; college?: string; year?: string }>;
  experience?: Array<{ hospital?: string; fromYear?: string; toYear?: string; designation?: string }>;
  awards?: Array<{ title?: string; year?: string }>;
  clinics?: Array<{
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    lat?: number | null;
    lng?: number | null;
    images?: string[];
    timings?: Array<{ dayOfWeek?: string; startTime?: string; endTime?: string }>;
  }>;
  services?: Array<{ name?: string; price?: number | null; description?: string | null }>;
  insuranceCompanies?: string[];
  [key: string]: unknown;
}

export function useUpdateVeterinarianProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateVeterinarianProfilePayload) =>
      api.put<{ success?: boolean; data?: unknown }>(API_ROUTES.VETERINARIANS.PROFILE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['veterinarian', 'profile'] });
    },
  });
}
