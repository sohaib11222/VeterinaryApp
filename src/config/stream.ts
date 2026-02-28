/**
 * Stream.io Video Configuration
 * Stream API key is safe to keep in the client (public key).
 * Keep it in sync with backend STREAM_API_KEY (the token is signed with the matching secret).
 */

const envKey = typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_STREAM_API_KEY : undefined;

export const STREAM_API_KEY =
  (typeof envKey === 'string' && envKey.trim() ? envKey.trim() : null) ??
  'vagm3eern9xq';

if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log('📹 Stream API Key configured:', STREAM_API_KEY ? `${STREAM_API_KEY.substring(0, 4)}...` : 'MISSING');
}
