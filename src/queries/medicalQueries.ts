/**
 * Medical-related queries: vaccines, weight records, vaccinations.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export interface VaccineItem {
  _id: string;
  name: string;
  [key: string]: unknown;
}

export function useVaccines(params: { includeInactive?: boolean } = {}) {
  return useQuery({
    queryKey: ['vaccines', params],
    queryFn: () =>
      api.get<{ success: boolean; data?: VaccineItem[] }>(API_ROUTES.VACCINES.LIST, {
        params,
      }),
  });
}

export interface WeightRecordItem {
  _id: string;
  petId?: { _id: string; name?: string; photo?: string };
  weight?: { value: number; unit?: string };
  date?: string;
  notes?: string;
  recordedBy?: { name?: string };
  relatedAppointmentId?: string;
  [key: string]: unknown;
}

export function useWeightRecords(params: { petId?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ['weight-records', params],
    queryFn: () =>
      api.get<{ success: boolean; data?: { records?: WeightRecordItem[]; pagination?: unknown } }>(
        API_ROUTES.WEIGHT_RECORDS.LIST,
        { params }
      ),
  });
}

export function useLatestWeightRecord(petId: string | null | undefined) {
  return useQuery({
    queryKey: ['weight-records', 'latest', petId],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data?: { records?: WeightRecordItem[] } }>(
        API_ROUTES.WEIGHT_RECORDS.LIST,
        { params: { petId, page: 1, limit: 1 } }
      );
      const payload = (res as { data?: { records?: WeightRecordItem[] } })?.data ?? res;
      const records = (payload as { records?: WeightRecordItem[] })?.records ?? [];
      return records.length > 0 ? records[0] : null;
    },
    enabled: !!petId,
  });
}

export function useVaccinations(params: { page?: number; limit?: number; petId?: string } = {}) {
  return useQuery({
    queryKey: ['vaccinations', params],
    queryFn: () =>
      api.get<{ success: boolean; data?: { vaccinations?: unknown[]; pagination?: unknown } }>(
        API_ROUTES.VACCINATIONS.LIST,
        { params }
      ),
  });
}

export function useUpcomingVaccinations(params: { petId?: string } = {}) {
  return useQuery({
    queryKey: ['vaccinations', 'upcoming', params],
    queryFn: () =>
      api.get<{ success: boolean; data?: { vaccinations?: unknown[] } }>(
        API_ROUTES.VACCINATIONS.UPCOMING,
        { params }
      ),
  });
}

export interface MedicalRecordItem {
  _id: string;
  petId?: { _id: string; name?: string };
  title?: string;
  description?: string;
  recordType?: string;
  fileUrl?: string;
  fileName?: string;
  uploadedDate?: string;
  [key: string]: unknown;
}

export function useMedicalRecords(params: { page?: number; limit?: number; petId?: string; recordType?: string } = {}) {
  return useQuery({
    queryKey: ['medical-records', params],
    queryFn: () =>
      api.get<{ success: boolean; data?: { records?: MedicalRecordItem[]; pagination?: { page?: number; limit?: number; total?: number; pages?: number } } }>(
        API_ROUTES.MEDICAL_RECORDS.LIST,
        { params }
      ),
  });
}
