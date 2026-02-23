/**
 * Review mutations.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export interface CreateReviewPayload {
  veterinarianId: string;
  appointmentId?: string;
  petId?: string;
  rating: number;
  reviewText: string;
  reviewType: 'APPOINTMENT' | 'OVERALL';
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReviewPayload) =>
      api.post(API_ROUTES.REVIEWS.CREATE, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      if (variables?.appointmentId) {
        queryClient.invalidateQueries({
          queryKey: ['reviews', 'appointment', variables.appointmentId, 'mine'],
        });
      }
    },
  });
}
