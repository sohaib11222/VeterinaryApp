/**
 * File upload using XMLHttpRequest so React Native sends multipart files correctly.
 * Axios often fails to send FormData file objects { uri, name, type } to the server.
 * Reference: mydoctor-app services/upload.ts
 */
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/api';
import { AUTH_TOKEN_KEY } from '../api/client';

export interface FileForUpload {
  uri: string;
  name: string;
  type: string;
}

function getFullUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * Upload veterinarian documents (multiple files under field name 'veterinarianDocs').
 */
export function uploadVeterinarianDocs(files: FileForUpload[]): Promise<{ success: boolean; data?: { urls?: string[] }; message?: string }> {
  return new Promise((resolve, reject) => {
    SecureStore.getItemAsync(AUTH_TOKEN_KEY).then((token) => {
      const url = getFullUrl('/upload/veterinarian-docs');
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.timeout = 60000;

      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const body = JSON.parse(xhr.responseText);
            resolve(body);
          } catch {
            reject(new Error('Invalid response'));
          }
        } else {
          let errData: { message?: string } = { message: `Upload failed: HTTP ${xhr.status}` };
          try {
            const parsed = JSON.parse(xhr.responseText);
            if (parsed?.message) errData = parsed;
          } catch {
            if (xhr.responseText) errData = { message: xhr.responseText };
          }
          reject(Object.assign(new Error(errData?.message ?? 'Upload failed'), { response: { status: xhr.status, data: errData } }));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.ontimeout = () => reject(new Error('Upload timeout'));

      const formData = new FormData();
      files.forEach((f) => {
        formData.append('veterinarianDocs', {
          uri: f.uri,
          type: f.type,
          name: f.name,
        } as any);
      });

      xhr.send(formData as any);
    }).catch(reject);
  });
}

/**
 * Upload one pet store document (field name 'petStore', plus body 'docType').
 */
export function uploadPetStoreDoc(
  file: FileForUpload,
  docType: string
): Promise<{ success: boolean; data?: { urls?: string[] }; message?: string }> {
  return new Promise((resolve, reject) => {
    SecureStore.getItemAsync(AUTH_TOKEN_KEY).then((token) => {
      const url = getFullUrl('/upload/pet-store-docs');
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.timeout = 60000;

      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const body = JSON.parse(xhr.responseText);
            resolve(body);
          } catch {
            reject(new Error('Invalid response'));
          }
        } else {
          let errData: { message?: string } = { message: `Upload failed: HTTP ${xhr.status}` };
          try {
            const parsed = JSON.parse(xhr.responseText);
            if (parsed?.message) errData = parsed;
          } catch {
            if (xhr.responseText) errData = { message: xhr.responseText };
          }
          reject(Object.assign(new Error(errData?.message ?? 'Upload failed'), { response: { status: xhr.status, data: errData } }));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.ontimeout = () => reject(new Error('Upload timeout'));

      const formData = new FormData();
      formData.append('docType', docType);
      formData.append('petStore', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);

      xhr.send(formData as any);
    }).catch(reject);
  });
}
