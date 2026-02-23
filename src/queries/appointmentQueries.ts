/**
 * Appointment queries – list and get by id.
 * Backend list returns { success, message, data: { appointments, pagination } }.
 * Backend get returns { success, message, data: appointment }.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export interface AppointmentListParams {
  status?: string;
  limit?: number;
  page?: number;
  fromDate?: string;
  toDate?: string;
}

export function useAppointments(params: AppointmentListParams = {}) {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: () =>
      api.get<{ success: boolean; data?: { appointments?: unknown[]; pagination?: unknown } }>(
        API_ROUTES.APPOINTMENTS.LIST,
        { params: { limit: params.limit ?? 50, ...params } }
      ),
  });
}

export function useAppointment(appointmentId: string | null | undefined) {
  return useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () =>
      api.get<{ success: boolean; data?: unknown }>(
        API_ROUTES.APPOINTMENTS.GET(appointmentId!)
      ),
    enabled: !!appointmentId,
  });
}
