/**
 * Pet mutations – delete pet (pet owner).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';
import { uploadPetImages } from '../services/upload';
import { copyToCacheUri, deleteCacheFiles, getExtensionFromMime } from '../utils/fileUpload';

type PetFileInput = File | { uri: string; name?: string; type?: string; mimeType?: string };

export function useDeletePet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (petId: string) => api.delete(API_ROUTES.PETS.DELETE(petId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });
}

export function useCreatePetWithUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { data: Record<string, unknown>; file?: PetFileInput | null }) => {
      const file = payload.file ?? null;
      let photo: string | undefined;
      let photos: string[] | undefined;

      if (file) {
        const picked = file as { uri?: string; name?: string; type?: string; mimeType?: string };
        if (picked?.uri) {
          const tempUris: string[] = [];
          try {
            const mime = picked.type ?? picked.mimeType ?? 'image/jpeg';
            const name = picked.name ?? `pet-${Date.now()}`;
            const ext = getExtensionFromMime(mime);
            const uri = await copyToCacheUri(picked.uri, 0, ext);
            tempUris.push(uri);
            const uploadRes = await uploadPetImages([{ uri, name, type: mime }]);
            const urls = (uploadRes as { data?: { urls?: string[] } })?.data?.urls;
            const list = Array.isArray(urls) ? urls : [];
            if (list.length > 0) {
              photos = list;
              photo = list[0];
            }
          } finally {
            if (tempUris.length > 0) await deleteCacheFiles(tempUris).catch(() => {});
          }
        } else {
          const formData = new FormData();
          formData.append('pet', file as unknown as Blob);
          const uploadRes = await api.upload(API_ROUTES.UPLOAD.PET, formData);
          const urls = (uploadRes as { data?: { urls?: string[] } })?.data?.urls;
          const list = Array.isArray(urls) ? urls : [];
          if (list.length > 0) {
            photos = list;
            photo = list[0];
          }
        }
      }

      return api.post(API_ROUTES.PETS.CREATE, {
        ...(payload.data || {}),
        ...(photo ? { photo } : {}),
        ...(photos && photos.length > 0 ? { photos } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });
}

export function useUpdatePetWithUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { petId: string; data: Record<string, unknown>; file?: PetFileInput | null }) => {
      const file = payload.file ?? null;
      let photo: string | undefined;
      let photos: string[] | undefined;

      if (file) {
        const picked = file as { uri?: string; name?: string; type?: string; mimeType?: string };
        if (picked?.uri) {
          const tempUris: string[] = [];
          try {
            const mime = picked.type ?? picked.mimeType ?? 'image/jpeg';
            const name = picked.name ?? `pet-${Date.now()}`;
            const ext = getExtensionFromMime(mime);
            const uri = await copyToCacheUri(picked.uri, 0, ext);
            tempUris.push(uri);
            const uploadRes = await uploadPetImages([{ uri, name, type: mime }]);
            const urls = (uploadRes as { data?: { urls?: string[] } })?.data?.urls;
            const list = Array.isArray(urls) ? urls : [];
            if (list.length > 0) {
              photos = list;
              photo = list[0];
            }
          } finally {
            if (tempUris.length > 0) await deleteCacheFiles(tempUris).catch(() => {});
          }
        } else {
          const formData = new FormData();
          formData.append('pet', file as unknown as Blob);
          const uploadRes = await api.upload(API_ROUTES.UPLOAD.PET, formData);
          const urls = (uploadRes as { data?: { urls?: string[] } })?.data?.urls;
          const list = Array.isArray(urls) ? urls : [];
          if (list.length > 0) {
            photos = list;
            photo = list[0];
          }
        }
      }

      return api.put(API_ROUTES.PETS.UPDATE(payload.petId), {
        ...(payload.data || {}),
        ...(photo ? { photo } : {}),
        ...(photos && photos.length > 0 ? { photos } : {}),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      if (variables?.petId) queryClient.invalidateQueries({ queryKey: ['pet', variables.petId] });
    },
  });
}
