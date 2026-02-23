/**
 * Prescription queries.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { apiClient } from '../api/client';
import { API_ROUTES } from '../api/apiConfig';

export function useMyPrescriptions(
  params: { page?: number; limit?: number; petId?: string } = {},
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ['prescriptions', 'mine', params],
    queryFn: () =>
      api.get<{ success?: boolean; data?: { prescriptions?: unknown[] } }>(
        API_ROUTES.PRESCRIPTIONS.LIST_MINE,
        { params }
      ),
    enabled: options.enabled ?? true,
  });
}

export function usePrescriptionByAppointment(
  appointmentId: string | null | undefined,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ['prescriptions', 'appointment', appointmentId],
    queryFn: async () => {
      try {
        return await api.get<{ success: boolean; data?: unknown }>(
          API_ROUTES.PRESCRIPTIONS.BY_APPOINTMENT(appointmentId!)
        );
      } catch (err: unknown) {
        if ((err as { status?: number })?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!appointmentId && (options.enabled ?? true),
    retry: false,
  });
}

export async function downloadPrescriptionPdf(prescriptionId: string): Promise<Blob | ArrayBuffer> {
  const res = await apiClient.get(API_ROUTES.PRESCRIPTIONS.PDF(prescriptionId), {
    responseType: 'blob',
  });
  return res?.data as Blob | ArrayBuffer;
}
