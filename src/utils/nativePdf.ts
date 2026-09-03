import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import { API_BASE_URL } from '../config/api';
import { AUTH_TOKEN_KEY } from '../api/client';

function endpointUrl(endpoint: string): string {
  return `${String(API_BASE_URL).replace(/\/$/, '')}/${String(endpoint).replace(/^\//, '')}`;
}

function safeFilename(filename: string, defaultFilename = 'document.pdf'): string {
  const trimmed = String(filename || defaultFilename).trim();
  const cleaned = trimmed.replace(/[^a-z0-9._-]/gi, '-');
  return cleaned || defaultFilename;
}

/** Downloads a private API document using the active session and opens the native share sheet. */
export async function downloadAndShareFile(endpoint: string, filename: string, mimeType = 'application/octet-stream'): Promise<string> {
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  const directory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!directory) throw new Error('A local download directory is unavailable on this device.');

  const safeName = safeFilename(filename, 'attachment');
  const uri = `${directory}${safeName}`;
  const result = await FileSystem.downloadAsync(endpointUrl(endpoint), uri, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: mimeType,
    },
  });

  if (result.status < 200 || result.status >= 300) throw new Error('Unable to download this attachment.');
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, { mimeType, dialogTitle: safeName });
  }
  return result.uri;
}

/** Downloads an authenticated PDF to the device and opens the platform share sheet. */
export async function downloadAndSharePdf(endpoint: string, filename: string): Promise<string> {
  return downloadAndShareFile(endpoint, safeFilename(filename, 'document.pdf'), 'application/pdf');
}
