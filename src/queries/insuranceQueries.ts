/**
 * Insurance companies list (for vet profile – accepted insurances).
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export function useInsuranceCompanies() {
  return useQuery({
    queryKey: ['insurance', 'companies'],
    queryFn: () =>
      api.get<{ success?: boolean; data?: Array<{ _id: string; name?: string }> }>(
        API_ROUTES.INSURANCE.LIST
      ),
  });
}
