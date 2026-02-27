/**
 * User profile mutations – update profile, upload profile image.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';
import { uploadProfileImage as uploadProfileImageXhr } from '../services/upload';
import { copyToCacheUri, deleteCacheFiles, getExtensionFromMime } from '../utils/fileUpload';

export interface UpdateUserProfilePayload {
  name?: string;
  phone?: string | null;
  dob?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  profileImage?: string | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    zip?: string | null;
  };
  emergencyContact?: {
    name?: string | null;
    phone?: string | null;
    relation?: string | null;
  };
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserProfilePayload) =>
      api.put<{ success?: boolean; data?: unknown }>(API_ROUTES.USERS.PROFILE, data),
    onSuccess: (_, __, context) => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

/** File (web) or RN asset { uri, name, type } for profile image upload */
export type ProfileImageInput = File | { uri: string; name: string; type?: string };

function guessImageMimeFromName(name: string): string {
  const ext = String(name || '').split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  return 'image/jpeg';
}

function ensureImageName(name: string, mime: string): string {
  const trimmed = String(name || '').trim();
  if (trimmed && trimmed.includes('.')) return trimmed;
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  return `profile-${Date.now()}.${ext}`;
}

export function useUploadProfileImage() {
  return useMutation({
    mutationFn: async (file: ProfileImageInput) => {
      const picked = file as { uri?: string; name?: string; type?: string; mimeType?: string };
      if (picked?.uri) {
        const tempUris: string[] = [];
        try {
          const rawName = picked.name ?? '';
          const rawMime = picked.type ?? picked.mimeType ?? '';
          const mime = rawMime && rawMime !== 'application/octet-stream' ? rawMime : guessImageMimeFromName(rawName);
          const name = ensureImageName(rawName, mime);
          const ext = getExtensionFromMime(mime);
          const uri = await copyToCacheUri(picked.uri, 0, ext);
          tempUris.push(uri);
          return uploadProfileImageXhr({ uri, name, type: mime });
        } finally {
          if (tempUris.length > 0) {
            await deleteCacheFiles(tempUris).catch(() => {});
          }
        }
      }

      const formData = new FormData();
      formData.append('file', file as unknown as Blob & { uri?: string; name?: string; type?: string });
      return api.upload<{ success?: boolean; data?: { url?: string } }>(API_ROUTES.UPLOAD.PROFILE, formData);
    },
  });
}
