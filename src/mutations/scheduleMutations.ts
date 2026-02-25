/**
 * Weekly schedule and reschedule request mutations.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export function useUpsertWeeklyScheduleDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { dayOfWeek: string; timeSlots?: Array<{ startTime: string; endTime: string; isAvailable?: boolean }> }) =>
      api.post(API_ROUTES.WEEKLY_SCHEDULE.BASE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-schedule'] });
    },
  });
}

export function useUpdateAppointmentDuration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (duration: number) =>
      api.put(`${API_ROUTES.WEEKLY_SCHEDULE.BASE}/duration`, { duration }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-schedule'] });
    },
  });
}

export function useAddTimeSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      dayOfWeek,
      payload,
    }: {
      dayOfWeek: string;
      payload: { startTime: string; endTime: string; isAvailable?: boolean };
    }) =>
      api.post(
        `${API_ROUTES.WEEKLY_SCHEDULE.BASE}/day/${dayOfWeek}/slot`,
        payload
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-schedule'] });
    },
  });
}

export function useUpdateTimeSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      dayOfWeek,
      slotId,
      payload,
    }: {
      dayOfWeek: string;
      slotId: string;
      payload: { startTime?: string; endTime?: string; isAvailable?: boolean };
    }) =>
      api.put(
        `${API_ROUTES.WEEKLY_SCHEDULE.BASE}/day/${dayOfWeek}/slot/${slotId}`,
        payload
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-schedule'] });
    },
  });
}

export function useDeleteTimeSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dayOfWeek, slotId }: { dayOfWeek: string; slotId: string }) =>
      api.delete(
        `${API_ROUTES.WEEKLY_SCHEDULE.BASE}/day/${dayOfWeek}/slot/${slotId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-schedule'] });
    },
  });
}

export function useCreateRescheduleRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) =>
      api.post(API_ROUTES.RESCHEDULE_REQUEST.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reschedule-requests'] });
      queryClient.invalidateQueries({
        queryKey: ['reschedule-requests', 'eligible-appointments'],
      });
    },
  });
}

export function useApproveRescheduleRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: unknown }) =>
      api.post(API_ROUTES.RESCHEDULE_REQUEST.APPROVE(id), data ?? {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reschedule-requests'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useRejectRescheduleRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.post(API_ROUTES.RESCHEDULE_REQUEST.REJECT(id), { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reschedule-requests'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function usePayRescheduleFee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentMethod }: { id: string; paymentMethod?: string }) =>
      api.post(API_ROUTES.RESCHEDULE_REQUEST.PAY(id), { paymentMethod }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reschedule-requests'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
