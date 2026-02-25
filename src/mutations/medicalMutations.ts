/**
 * Medical mutations: weight records, vaccinations.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';
import { uploadMedicalRecordFiles } from '../services/upload';
import { copyToCacheUri, deleteCacheFiles, getExtensionFromMime } from '../utils/fileUpload';

export interface CreateWeightRecordPayload {
  petId: string;
  weight: { value: number; unit?: string };
  date?: string;
  notes?: string | null;
  relatedAppointmentId?: string | null;
}

export function useCreateWeightRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWeightRecordPayload) =>
      api.post(API_ROUTES.WEIGHT_RECORDS.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-records'] });
    },
  });
}

export interface CreateVaccinationPayload {
  petId: string;
  vaccineId?: string | null;
  vaccinationType?: string | null;
  vaccinationDate: string;
  nextDueDate?: string | null;
  batchNumber?: string | null;
  notes?: string | null;
  relatedAppointmentId?: string | null;
}

export function useCreateVaccination() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVaccinationPayload) =>
      api.post(API_ROUTES.VACCINATIONS.CREATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations'] });
      queryClient.invalidateQueries({ queryKey: ['vaccinations', 'upcoming'] });
    },
  });
}

export interface CreateMedicalRecordPayload {
  petId: string;
  title: string;
  description?: string | null;
  recordType?: string;
  fileUrl?: string;
  fileName?: string | null;
  fileSize?: number | null;
}

/** File (web) or RN document picker asset */
type FileInput = File | { uri: string; name: string; mimeType?: string };

export function useCreateMedicalRecordWithUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      petId: string;
      title: string;
      description?: string | null;
      recordType?: string;
      file: FileInput | null;
    }) => {
      if (!payload.file) throw new Error('File is required');
      let fileUrl: string | null = null;

      const picked = payload.file as { uri?: string; name?: string; mimeType?: string };
      if (picked?.uri) {
        const tempUris: string[] = [];
        try {
          const mime = picked.mimeType ?? 'application/octet-stream';
          const name = picked.name ?? `file-${Date.now()}`;
          const ext = getExtensionFromMime(mime);
          const uri = await copyToCacheUri(picked.uri, 0, ext);
          tempUris.push(uri);
          const uploadRes = await uploadMedicalRecordFiles([{ uri, name, type: mime }]);
          const urls = (uploadRes as { data?: { urls?: string[] } })?.data?.urls;
          fileUrl = Array.isArray(urls) && urls.length > 0 ? urls[0] : null;
        } finally {
          if (tempUris.length > 0) {
            await deleteCacheFiles(tempUris).catch(() => {});
          }
        }
      } else {
        const formData = new FormData();
        formData.append('medicalRecords', payload.file as unknown as Blob);
        const uploadRes = await api.upload(API_ROUTES.UPLOAD.MEDICAL_RECORDS, formData);
        const urls = (uploadRes as { data?: { urls?: string[] } })?.data?.urls;
        fileUrl = Array.isArray(urls) && urls.length > 0 ? urls[0] : null;
      }

      if (!fileUrl) throw new Error('File upload failed');
      const fileName = (payload.file as { name?: string }).name ?? null;
      return api.post(API_ROUTES.MEDICAL_RECORDS.CREATE, {
        petId: payload.petId,
        title: payload.title,
        description: payload.description ?? null,
        recordType: payload.recordType ?? 'GENERAL',
        fileUrl,
        fileName,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records'] });
    },
  });
}

export function useDeleteMedicalRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recordId: string) =>
      api.delete(API_ROUTES.MEDICAL_RECORDS.DELETE(recordId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records'] });
    },
  });
}
