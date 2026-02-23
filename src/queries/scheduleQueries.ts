/**
 * Weekly schedule (clinic hours) and reschedule request queries.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export function useWeeklySchedule() {
  return useQuery({
    queryKey: ['weekly-schedule'],
    queryFn: () =>
      api.get<{ success: boolean; data?: unknown }>(API_ROUTES.WEEKLY_SCHEDULE.LIST),
  });
}

export function useWeeklyScheduleSlots(veterinarianId: string | null, date: string | null, enabled = true) {
  return useQuery({
    queryKey: ['weekly-schedule-slots', { veterinarianId, date }],
    queryFn: () =>
      api.get<{ success: boolean; data?: unknown }>(`${API_ROUTES.WEEKLY_SCHEDULE.BASE}/slots`, {
        params: { veterinarianId, date },
      }),
    enabled: !!veterinarianId && !!date && enabled,
  });
}

export function useRescheduleRequests(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['reschedule-requests', params],
    queryFn: () =>
      api.get<{ success: boolean; data?: unknown }>(API_ROUTES.RESCHEDULE_REQUEST.LIST, {
        params,
      }),
  });
}

export function useEligibleRescheduleAppointments() {
  return useQuery({
    queryKey: ['reschedule-requests', 'eligible-appointments'],
    queryFn: () =>
      api.get<{ success: boolean; data?: unknown }>(
        API_ROUTES.RESCHEDULE_REQUEST.ELIGIBLE_APPOINTMENTS
      ),
  });
}
