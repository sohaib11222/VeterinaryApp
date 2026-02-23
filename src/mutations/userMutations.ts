/**
 * User profile mutations – update profile, upload profile image.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

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

export function useUploadProfileImage() {
  return useMutation({
    mutationFn: (file: ProfileImageInput) => {
      const formData = new FormData();
      // Web: File; RN: { uri, name, type }
      formData.append('file', file as unknown as Blob & { uri?: string; name?: string; type?: string });
      return api.upload<{ success?: boolean; data?: { url?: string } }>(
        API_ROUTES.UPLOAD.PROFILE,
        formData
      );
    },
  });
}
