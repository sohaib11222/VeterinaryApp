/**
 * Specialization queries – list for filters.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export function useSpecializations() {
  return useQuery({
    queryKey: ['specializations'],
    queryFn: () =>
      api.get<{ success: boolean; data?: unknown }>(API_ROUTES.SPECIALIZATIONS.LIST),
  });
}
