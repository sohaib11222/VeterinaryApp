/**
 * Review queries.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export function useReviewsByVeterinarian(
  veterinarianId: string | null | undefined,
  params: { page?: number; limit?: number } = {}
) {
  return useQuery({
    queryKey: ['reviews', 'veterinarian', veterinarianId, params],
    queryFn: () =>
      api.get<{ success: boolean; data?: { reviews?: unknown[]; pagination?: unknown } }>(
        API_ROUTES.REVIEWS.BY_VETERINARIAN(veterinarianId!),
        { params: { page: 1, limit: 10, ...params } }
      ),
    enabled: !!veterinarianId,
  });
}

export function useMyAppointmentReview(
  appointmentId: string | null | undefined,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: ['reviews', 'appointment', appointmentId, 'mine'],
    queryFn: () =>
      api.get<{ success: boolean; data?: unknown }>(
        API_ROUTES.REVIEWS.MY_APPOINTMENT_REVIEW(appointmentId!)
      ),
    enabled: !!appointmentId && (options.enabled ?? true),
    retry: false,
  });
}
