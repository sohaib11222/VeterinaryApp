/**
 * Payment mutations – process appointment payment.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export function useProcessAppointmentPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      appointmentId,
      amount,
      paymentMethod = 'CARD',
    }: {
      appointmentId: string;
      amount: number;
      paymentMethod?: string;
    }) =>
      api.post(API_ROUTES.PAYMENT.PROCESS_APPOINTMENT, {
        appointmentId,
        amount,
        paymentMethod,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
