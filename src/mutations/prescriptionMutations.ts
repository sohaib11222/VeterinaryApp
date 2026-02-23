/**
 * Prescription mutations.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

export interface MedicationItem {
  name: string;
  strength?: string | null;
  form?: string | null;
  route?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  quantity?: string | null;
  refills?: number;
  instructions?: string | null;
  substitutionAllowed?: boolean;
  isPrn?: boolean;
}

export interface UpsertPrescriptionPayload {
  diagnosis?: string | null;
  clinicalNotes?: string | null;
  allergies?: string | null;
  advice?: string | null;
  followUp?: string | null;
  tests?: string[];
  medications: MedicationItem[];
  status?: string;
}

export function useUpsertPrescriptionForAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      appointmentId,
      data,
    }: {
      appointmentId: string;
      data: UpsertPrescriptionPayload;
    }) =>
      api.post(API_ROUTES.PRESCRIPTIONS.UPSERT_FOR_APPOINTMENT(appointmentId), data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      if (variables?.appointmentId) {
        queryClient.invalidateQueries({
          queryKey: ['prescriptions', 'appointment', variables.appointmentId],
        });
      }
    },
  });
}
