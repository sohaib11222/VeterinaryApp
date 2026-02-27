import { useState, useCallback, useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { StreamVideoClient, Call } from '@stream-io/video-react-native-sdk';
import { useAuth } from '../contexts/AuthContext';
import { STREAM_API_KEY } from '../config/stream';
import * as videoApi from '../services/video';

export function useVideoCall(appointmentId: string | null | undefined) {
  const { user } = useAuth();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestMediaPermissions = useCallback(async () => {
    if (Platform.OS === 'android') {
      const cameraPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs access to your camera for video calls',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      const audioPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone for video calls',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (cameraPermission !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error('Camera permission is required for video calls');
      }
      if (audioPermission !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error('Microphone permission is required for video calls');
      }
      return true;
    }

    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraStatus.granted) {
      throw new Error('Camera permission is required for video calls');
    }

    return true;
  }, []);

  const startCall = useCallback(async () => {
    if (!appointmentId || !user) return;

    setLoading(true);
    setError(null);

    try {
      if (!STREAM_API_KEY) {
        throw new Error('Missing EXPO_PUBLIC_STREAM_API_KEY in app environment');
      }

      await requestMediaPermissions();

      const sessionData = await videoApi.startVideoSession(String(appointmentId));
      const payload = (sessionData as any)?.data ?? sessionData;
      const data = payload?.data ?? payload;

      const streamToken = data?.streamToken;
      const streamCallId = data?.streamCallId || data?.sessionId || `appointment-${appointmentId}`;

      if (!streamToken) {
        throw new Error('No Stream token received from backend');
      }

      const userId = (user as any)?._id ?? (user as any)?.id ?? '';
      if (!userId) throw new Error('Missing user id');

      const streamClient = new StreamVideoClient({
        apiKey: STREAM_API_KEY,
        user: {
          id: String(userId),
          name: (user as any)?.fullName || (user as any)?.name || (user as any)?.email || 'User',
        },
        token: streamToken,
      });

      setClient(streamClient);

      const streamCall = streamClient.call('default', String(streamCallId));
      await streamCall.join({ create: true });

      try {
        await streamCall.camera.enable();
      } catch {}
      try {
        await streamCall.microphone.enable();
      } catch {}

      setCall(streamCall);

      return { streamClient, streamCall };
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to start video call';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [appointmentId, requestMediaPermissions, user]);

  const endCall = useCallback(async () => {
    if (call) {
      try {
        await call.leave();
      } catch {}
    }

    if (client) {
      try {
        await client.disconnectUser();
      } catch {}
    }

    setCall(null);
    setClient(null);
  }, [call, client]);

  useEffect(() => {
    const currentCall = call;
    return () => {
      if (currentCall) {
        currentCall.leave().catch(() => {});
      }
    };
  }, [call]);

  return {
    client,
    call,
    loading,
    error,
    startCall,
    endCall,
  };
}
