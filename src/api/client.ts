/**
 * Axios client for Veterinary Backend.
 * - Attaches Bearer token from SecureStore on each request.
 * - On 401, clears storage and rejects with a normalized error.
 */
import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/api';

const AUTH_TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
const LANGUAGE_KEY = 'app_language';

export { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY, LANGUAGE_KEY };

let currentLanguage: string | null = null;

export const setApiLanguage = (lang: string | null) => {
  const cleaned = String(lang || '').trim();
  currentLanguage = cleaned ? cleaned : null;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      let langToSend = currentLanguage;
      if (!langToSend) {
        const storedLang = await SecureStore.getItemAsync(LANGUAGE_KEY);
        const cleaned = String(storedLang || '').trim();
        if (cleaned) {
          langToSend = cleaned;
          currentLanguage = cleaned;
        }
      }
      if (langToSend) {
        (config.headers as any)['Accept-Language'] = langToSend;
      }
    } catch {
      // ignore
    }
    // FormData upload: do not send Content-Type so runtime sets multipart/form-data with boundary
    if (config.data && typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface ApiError {
  status: number;
  message: string;
  data: unknown;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      try {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
      } catch {
        // ignore
      }
    }

    const status = error.response?.status ?? 0;
    const data = error.response?.data as { message?: string } | undefined;

    let message: string;
    if (error.response) {
      message = data?.message ?? error.message ?? 'An unexpected error occurred';
    } else if (error.request) {
      message =
        'Cannot reach server. Ensure the backend is running and the app is using the correct API URL. ' +
        'On a physical device, set EXPO_PUBLIC_API_BASE_URL to your computer IP (e.g. http://192.168.1.x:5000/api) in .env and restart.';
    } else {
      message = error.message ?? 'An unexpected error occurred';
    }

    return Promise.reject({
      status,
      message,
      data: error.response?.data,
    } as ApiError);
  }
);
