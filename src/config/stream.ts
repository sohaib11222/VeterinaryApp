/**
 * Stream.io Video Configuration
 * Stream API key is safe to keep in the client (public key), as in mydoctor-app.
 */

export const STREAM_API_KEY = '3cp572t2hewb';

if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log('📹 Stream API Key configured:', STREAM_API_KEY ? `${STREAM_API_KEY.substring(0, 4)}...` : 'MISSING');
}
