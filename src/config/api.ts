import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Veterinary API base URL.
 * - .env: set EXPO_PUBLIC_API_BASE_URL for physical device (e.g. http://192.168.1.5:5000/api)
 * - Android emulator: 10.0.2.2 is the host machine (default below)
 * - iOS simulator: localhost usually works
 */
function getApiBaseUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.apiBaseUrl;
  if (fromExtra && typeof fromExtra === 'string' && fromExtra.trim()) return fromExtra.trim();
  const envUrl = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) return envUrl.trim();
  const debuggerHost =
    (Constants as any)?.expoGoConfig?.debuggerHost ??
    (Constants as any)?.manifest?.debuggerHost ??
    (Constants as any)?.manifest2?.extra?.expoClient?.debuggerHost;
  if (debuggerHost && typeof debuggerHost === 'string') {
    const host = debuggerHost.split(':')[0];
    if (host && host !== 'localhost') {
      return `http://${host}:5000/api`;
    }
  }
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000/api';
  return 'http://localhost:5000/api';
}

export const API_BASE_URL = getApiBaseUrl();

/** Origin for static assets (strip /api so /uploads/* resolve). */
export function getApiOrigin(): string {
  const base = API_BASE_URL || '';
  return base.replace(/\/api(\/.*)?$/, '') || base;
}

/** Full URL for an uploaded image path. Supports relative backend paths and device-local picker URIs. */
export function getImageUrl(path: unknown): string | null {
  const rawPath = typeof path === 'string'
    ? path
    : (path && typeof path === 'object'
      ? ((path as { url?: unknown; fileUrl?: unknown; uri?: unknown; path?: unknown }).url
        ?? (path as { fileUrl?: unknown }).fileUrl
        ?? (path as { uri?: unknown }).uri
        ?? (path as { path?: unknown }).path)
      : null);
  if (!rawPath || typeof rawPath !== 'string') return null;
  const t = rawPath.trim();
  if (!t) return null;
  if (/^(https?:|file:|content:|data:)/i.test(t)) return t;
  const normalized = `/${t.replace(/\\/g, '/').replace(/^\/+/, '')}`;

  // Production routes the API through /api, including the mirrored static
  // upload route. Going through API_BASE_URL works on the deployed domain,
  // Android emulator and physical-device development server alike.
  if (normalized.startsWith('/uploads/')) {
    return `${String(API_BASE_URL || '').replace(/\/+$/, '')}${normalized}`;
  }
  const origin = getApiOrigin();
  return `${origin}${normalized}`;
}
