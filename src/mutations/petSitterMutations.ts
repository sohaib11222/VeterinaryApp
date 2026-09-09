import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

function refresh(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['pet-sitters'] });
  queryClient.invalidateQueries({ queryKey: ['pet-sitter'] });
}

export function useUpdateMyPetSitterProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.patch(API_ROUTES.PET_SITTERS.UPDATE_ME, data),
    onSuccess: () => refresh(queryClient),
  });
}

export function useUploadPetSitterDocuments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => api.upload(API_ROUTES.PET_SITTERS.UPLOAD_DOCUMENTS, formData, { timeout: 60_000 }),
    onSuccess: () => refresh(queryClient),
  });
}
