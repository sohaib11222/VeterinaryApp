import { useMutation } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';

/** Upload a single file for chat (image or document). Backend returns { data: { url } }. Uses longer timeout for large files. */
export function useUploadChatFile() {
  return useMutation({
    mutationFn: (formData: FormData) =>
      api.upload<{ success?: boolean; data?: { url?: string } }>(API_ROUTES.UPLOAD.CHAT, formData, { timeout: 60000 }),
  });
}
