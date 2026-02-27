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

const NETWORK_ERROR_MESSAGE =
  'Cannot reach server. Ensure the backend is running and the app is using the correct API URL. ' +
  'On a physical device, set EXPO_PUBLIC_API_BASE_URL to your computer IP (e.g. http://192.168.1.x:5000/api) in .env and restart.';

function getFullUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

function parseXhrJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function buildHttpError(status: number, responseText: string) {
  const parsed = parseXhrJson(responseText);
  const msg = (parsed as { message?: string } | null)?.message || `Upload failed: HTTP ${status}`;
  return Object.assign(new Error(msg), { response: { status, data: parsed ?? { message: msg } } });
}

function buildNetworkError(url: string) {
  const msg = `${NETWORK_ERROR_MESSAGE} (API_BASE_URL: ${API_BASE_URL}, URL: ${url})`;
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[upload] network error', { apiBaseUrl: API_BASE_URL, url });
  }
  return new Error(msg);
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
          reject(buildHttpError(xhr.status, xhr.responseText));
        }
      };

      xhr.onerror = () => reject(buildNetworkError(url));
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

export function uploadChatFile(file: FileForUpload): Promise<{ success: boolean; data?: { url?: string }; message?: string }> {
  return new Promise((resolve, reject) => {
    SecureStore.getItemAsync(AUTH_TOKEN_KEY).then((token) => {
      const url = getFullUrl('/upload/chat');
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.timeout = 60000;

      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const body = parseXhrJson(xhr.responseText);
          if (body) resolve(body);
          else reject(new Error('Invalid response'));
        } else {
          reject(buildHttpError(xhr.status, xhr.responseText));
        }
      };

      xhr.onerror = () => reject(buildNetworkError(url));
      xhr.ontimeout = () => reject(new Error('Upload timeout'));

      const formData = new FormData();
      formData.append('file', { uri: file.uri, type: file.type, name: file.name } as any);
      xhr.send(formData as any);
    }).catch(reject);
  });
}

export function uploadProfileImage(file: FileForUpload): Promise<{ success: boolean; data?: { url?: string }; message?: string }> {
  return new Promise((resolve, reject) => {
    SecureStore.getItemAsync(AUTH_TOKEN_KEY).then((token) => {
      const url = getFullUrl('/upload/profile');
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.timeout = 60000;

      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const body = parseXhrJson(xhr.responseText);
          if (body) resolve(body);
          else reject(new Error('Invalid response'));
        } else {
          reject(buildHttpError(xhr.status, xhr.responseText));
        }
      };

      xhr.onerror = () => reject(buildNetworkError(url));
      xhr.ontimeout = () => reject(new Error('Upload timeout'));

      const formData = new FormData();
      formData.append('file', { uri: file.uri, type: file.type, name: file.name } as any);
      xhr.send(formData as any);
    }).catch(reject);
  });
}

export function uploadPetImages(files: FileForUpload[]): Promise<{ success: boolean; data?: { urls?: string[] }; message?: string }> {
  return new Promise((resolve, reject) => {
    SecureStore.getItemAsync(AUTH_TOKEN_KEY).then((token) => {
      const url = getFullUrl('/upload/pet');
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.timeout = 60000;

      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const body = parseXhrJson(xhr.responseText);
          if (body) resolve(body);
          else reject(new Error('Invalid response'));
        } else {
          reject(buildHttpError(xhr.status, xhr.responseText));
        }
      };

      xhr.onerror = () => reject(buildNetworkError(url));
      xhr.ontimeout = () => reject(new Error('Upload timeout'));

      const formData = new FormData();
      files.forEach((f) => {
        formData.append('pet', { uri: f.uri, type: f.type, name: f.name } as any);
      });
      xhr.send(formData as any);
    }).catch(reject);
  });
}

export function uploadMedicalRecordFiles(files: FileForUpload[]): Promise<{ success: boolean; data?: { urls?: string[] }; message?: string }> {
  return new Promise((resolve, reject) => {
    SecureStore.getItemAsync(AUTH_TOKEN_KEY).then((token) => {
      const url = getFullUrl('/upload/medical-records');
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.timeout = 60000;

      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const body = parseXhrJson(xhr.responseText);
          if (body) resolve(body);
          else reject(new Error('Invalid response'));
        } else {
          reject(buildHttpError(xhr.status, xhr.responseText));
        }
      };

      xhr.onerror = () => reject(buildNetworkError(url));
      xhr.ontimeout = () => reject(new Error('Upload timeout'));

      const formData = new FormData();
      files.forEach((f) => {
        formData.append('medicalRecords', { uri: f.uri, type: f.type, name: f.name } as any);
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
          reject(buildHttpError(xhr.status, xhr.responseText));
        }
      };

      xhr.onerror = () => reject(buildNetworkError(url));
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

/**
 * Upload pet store logo (single file, field name 'file').
 */
export function uploadPetStoreLogo(file: FileForUpload): Promise<{ success: boolean; data?: { url?: string }; url?: string; message?: string }> {
  return new Promise((resolve, reject) => {
    SecureStore.getItemAsync(AUTH_TOKEN_KEY).then((token) => {
      const url = getFullUrl('/upload/pet-store');
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.timeout = 60000;
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const body = JSON.parse(xhr.responseText);
            resolve(body);
          } catch {
            reject(new Error('Invalid response'));
          }
        } else {
          reject(buildHttpError(xhr.status, xhr.responseText));
        }
      };
      xhr.onerror = () => reject(buildNetworkError(url));
      xhr.ontimeout = () => reject(new Error('Upload timeout'));
      const formData = new FormData();
      formData.append('file', { uri: file.uri, type: file.type, name: file.name } as any);
      xhr.send(formData as any);
    }).catch(reject);
  });
}

/**
 * Upload product images (multiple files under field name 'product').
 */
export function uploadProductImages(files: FileForUpload[]): Promise<{ success: boolean; data?: { urls?: string[] }; urls?: string[]; message?: string }> {
  return new Promise((resolve, reject) => {
    SecureStore.getItemAsync(AUTH_TOKEN_KEY).then((token) => {
      const url = getFullUrl('/upload/product');
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
          reject(buildHttpError(xhr.status, xhr.responseText));
        }
      };

      xhr.onerror = () => reject(buildNetworkError(url));
      xhr.ontimeout = () => reject(new Error('Upload timeout'));

      const formData = new FormData();
      files.forEach((f) => {
        formData.append('product', {
          uri: f.uri,
          type: f.type,
          name: f.name,
        } as any);
      });

      xhr.send(formData as any);
    }).catch(reject);
  });
}
