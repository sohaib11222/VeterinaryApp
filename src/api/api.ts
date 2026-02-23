/**
 * API helper: methods return response.data (backend JSON body).
 * Backend success shape: { success: true, message, data?: ... }
 */
import { apiClient } from './client';

export const api = {
  get: async <T = unknown>(url: string, config = {}) => {
    const res = await apiClient.get<T>(url, config);
    return res.data;
  },
  post: async <T = unknown>(url: string, data: unknown = {}, config = {}) => {
    const res = await apiClient.post<T>(url, data, config);
    return res.data;
  },
  put: async <T = unknown>(url: string, data: unknown = {}, config = {}) => {
    const res = await apiClient.put<T>(url, data, config);
    return res.data;
  },
  patch: async <T = unknown>(url: string, data: unknown = {}, config = {}) => {
    const res = await apiClient.patch<T>(url, data, config);
    return res.data;
  },
  delete: async <T = unknown>(url: string, config = {}) => {
    const res = await apiClient.delete<T>(url, config);
    return res.data;
  },
  /** Upload FormData (multipart/form-data). Content-Type is cleared in client interceptor for FormData. */
  upload: async <T = unknown>(url: string, formData: FormData, config = {}) => {
    const res = await apiClient.post<T>(url, formData, config);
    return res.data;
  },
};
