/**
 * User queries – get user by ID (for profile settings).
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export interface UserProfile {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  profileImage?: string;
  address?: { line1?: string; line2?: string; city?: string; state?: string; country?: string; zip?: string };
  emergencyContact?: { name?: string; phone?: string; relation?: string };
  [key: string]: unknown;
}

export function useUserById(userId: string | null | undefined, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () =>
      api.get<{ success?: boolean; data?: UserProfile }>(API_ROUTES.USERS.GET(userId!)),
    enabled: !!userId && (options.enabled ?? true),
    ...options,
  });
}
