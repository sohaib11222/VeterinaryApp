import { useMutation } from '@tanstack/react-query';
import { api } from '../api/api';
import { API_ROUTES } from '../api/apiConfig';
import { uploadChatFile, type FileForUpload } from '../services/upload';

/** Upload a single file for chat (image or document). Backend returns { data: { url } }. Uses longer timeout for large files. */
export function useUploadChatFile() {
  return useMutation({
    mutationFn: (payload: FormData | FileForUpload) => {
      if (payload && typeof FormData !== 'undefined' && payload instanceof FormData) {
        return api.upload<{ success?: boolean; data?: { url?: string } }>(API_ROUTES.UPLOAD.CHAT, payload, { timeout: 60000 });
      }
      return uploadChatFile(payload as FileForUpload);
    },
  });
}
