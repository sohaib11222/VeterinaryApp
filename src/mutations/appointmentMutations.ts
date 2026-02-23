/**
 * Appointment mutations – create, accept, reject, cancel, complete, update status.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export interface CreateAppointmentPayload {
  veterinarianId: string;
  petOwnerId?: string;
  petId: string;
  appointmentDate: string;
  appointmentTime: string;
  bookingType?: 'VISIT' | 'ONLINE';
  reason: string;
  petSymptoms?: string;
  timezoneOffset?: number;
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) =>
      api.post<{ success: boolean; data?: { _id?: string } }>(
        API_ROUTES.APPOINTMENTS.CREATE,
        payload
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useAcceptAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appointmentId: string) =>
      api.post(API_ROUTES.APPOINTMENTS.ACCEPT(appointmentId)),
    onSuccess: (_, appointmentId) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', appointmentId] });
    },
  });
}

export function useRejectAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId, data }: { appointmentId: string; data?: { reason?: string } }) =>
      api.post(API_ROUTES.APPOINTMENTS.REJECT(appointmentId), data ?? {}),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      if (variables?.appointmentId) {
        queryClient.invalidateQueries({ queryKey: ['appointment', variables.appointmentId] });
      }
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId, data }: { appointmentId: string; data?: { reason?: string } }) =>
      api.post(API_ROUTES.APPOINTMENTS.CANCEL(appointmentId), data ?? {}),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      if (variables?.appointmentId) {
        queryClient.invalidateQueries({ queryKey: ['appointment', variables.appointmentId] });
      }
    },
  });
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      appointmentId,
      data,
    }: {
      appointmentId: string;
      data?: {
        vaccinations?: Array<{
          vaccineId: string;
          vaccinationDate: string;
          nextDueDate?: string | null;
          batchNumber?: string | null;
          notes?: string | null;
        }>;
        weightRecord?: {
          weight: { value: number; unit: string };
          date: string;
          notes?: string | null;
        };
      };
    }) =>
      api.post(API_ROUTES.APPOINTMENTS.COMPLETE(appointmentId), data ?? {}),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      if (variables?.appointmentId) {
        queryClient.invalidateQueries({ queryKey: ['appointment', variables.appointmentId] });
      }
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      appointmentId,
      data,
    }: {
      appointmentId: string;
      data: { status: string };
    }) =>
      api.put(API_ROUTES.APPOINTMENTS.UPDATE_STATUS(appointmentId), data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      if (variables?.appointmentId) {
        queryClient.invalidateQueries({ queryKey: ['appointment', variables.appointmentId] });
      }
    },
  });
}
