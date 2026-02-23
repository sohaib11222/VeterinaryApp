/**
 * Copy a file from content:// or any URI to a temp file:// in cache.
 * Android's HTTP layer often cannot read content:// URIs for FormData,
 * which causes "no files uploaded". Copying to file:// fixes this.
 */
import * as FileSystem from 'expo-file-system';

export async function copyToCacheUri(
  sourceUri: string,
  index: number,
  extension: string
): Promise<string> {
  const dir = FileSystem.cacheDirectory ?? '';
  const ext = extension.startsWith('.') ? extension : extension ? `.${extension}` : '';
  const dest = `${dir}upload-${Date.now()}-${index}${ext}`.replace(/\/\/+/g, '/');
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}

export async function deleteCacheFiles(uris: string[]): Promise<void> {
  await Promise.all(uris.map((uri) => FileSystem.deleteAsync(uri, { idempotent: true })));
}

export function getExtensionFromMime(mime: string): string {
  if (mime.includes('pdf')) return 'pdf';
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('word') || mime.includes('document')) return 'docx';
  return 'jpg';
}
