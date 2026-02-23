/**
 * Auth & system queries – read-only, TanStack Query.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.get<{ success: boolean; message?: string }>(API_ROUTES.HEALTH),
    refetchOnWindowFocus: false,
  });
}

/** Current user (authenticated). Backend returns { success, message, data: user } */
export interface MeUser {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
}

export async function getMeApi(): Promise<MeUser> {
  const res = await api.get<{ success: boolean; data?: MeUser }>(API_ROUTES.USERS.ME);
  const data = (res as { data?: MeUser })?.data ?? (res as unknown as MeUser);
  return data;
}

export function useMe(enabled: boolean) {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: getMeApi,
    enabled,
  });
}
