import { useCallback, useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Call, StreamVideoClient } from '@stream-io/video-react-native-sdk';
import { useAuth } from '../contexts/AuthContext';
import { STREAM_API_KEY } from '../config/stream';
import * as videoApi from '../services/video';

type VideoCredentials = {
  streamToken?: string;
  streamCallId?: string;
  streamApiKey?: string;
  streamMembers?: unknown[];
  session?: { status?: string; sessionId?: string; callId?: string; veterinarianId?: unknown; petOwnerId?: unknown };
  sessionId?: string;
  status?: string;
};

type SessionLike = {
  status?: string;
  sessionId?: string;
  callId?: string;
  veterinarianId?: unknown;
  petOwnerId?: unknown;
};

function responseData(value: unknown): VideoCredentials {
  const first = (value as { data?: unknown })?.data ?? value;
  return ((first as { data?: unknown })?.data ?? first ?? {}) as VideoCredentials;
}

function userIdFrom(value: unknown): string {
  if (value && typeof value === 'object') {
    const entity = value as { _id?: unknown; id?: unknown };
    return String(entity._id ?? entity.id ?? '').trim();
  }
  return String(value ?? '').trim();
}

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

function within<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}

const MEDIA_PERMISSION_TIMEOUT_MS = 12_000;
const STREAM_PREPARE_TIMEOUT_MS = 15_000;
const STREAM_JOIN_TIMEOUT_MS = 20_000;
const STREAM_JOIN_RETRY_DELAY_MS = 750;
const STREAM_JOIN_ATTEMPTS = 4;

/**
 * Mobile implementation of the same two-stage Stream flow used on web:
 * caller creates a private call and waits; recipient accepts on the server;
 * both users then join the exact same ACTIVE Stream call with fresh tokens.
 */
export function useVideoCall(appointmentId: string | null | undefined) {
  const { user } = useAuth();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<StreamVideoClient | null>(null);
  const callRef = useRef<Call | null>(null);
  const joiningPromiseRef = useRef<Promise<unknown> | null>(null);

  const requestMediaPermissions = useCallback(async () => {
    if (Platform.OS === 'android') {
      const [cameraPermission, audioPermission] = await Promise.all([
        PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
          title: 'Camera permission',
          message: 'Camera access is needed for your video consultation.',
          buttonNeutral: 'Ask later',
          buttonNegative: 'Cancel',
          buttonPositive: 'Allow',
        }),
        PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
          title: 'Microphone permission',
          message: 'Microphone access is needed for your video consultation.',
          buttonNeutral: 'Ask later',
          buttonNegative: 'Cancel',
          buttonPositive: 'Allow',
        }),
      ]);
      if (cameraPermission !== PermissionsAndroid.RESULTS.GRANTED || audioPermission !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error('Camera and microphone permissions are required for video calls.');
      }
      return;
    }

    const [cameraStatus, microphoneStatus] = await Promise.all([
      ImagePicker.requestCameraPermissionsAsync(),
      Audio.requestPermissionsAsync(),
    ]);
    if (!cameraStatus.granted || !microphoneStatus.granted) {
      throw new Error('Camera and microphone permissions are required for video calls.');
    }
  }, []);

  const connectionDetails = useCallback((payload: unknown) => {
    const data = responseData(payload);
    const session = (data.session ?? data) as SessionLike;
    const currentUserId = userIdFrom((user as any)?._id ?? (user as any)?.id);
    const streamApiKey = String(data.streamApiKey || STREAM_API_KEY || '').trim();
    const streamToken = String(data.streamToken || '').trim();
    const streamCallId = String(data.streamCallId || session?.sessionId || session?.callId || '').trim();
    const memberIds = [...new Set((Array.isArray(data.streamMembers) ? data.streamMembers : [session?.veterinarianId, session?.petOwnerId])
      .map(userIdFrom)
      .filter(Boolean))];

    if (!currentUserId || !streamApiKey || !streamToken || !streamCallId) {
      throw new Error('The video-call connection details are incomplete. Please try again.');
    }
    return { data, session, currentUserId, streamApiKey, streamToken, streamCallId, memberIds };
  }, [user]);

  const createResources = useCallback((payload: unknown) => {
    const details = connectionDetails(payload);
    const streamClient = new StreamVideoClient({
      apiKey: details.streamApiKey,
      user: {
        id: details.currentUserId,
        name: (user as any)?.fullName || (user as any)?.name || (user as any)?.email || 'User',
      },
      token: details.streamToken,
    });
    return { ...details, streamClient, streamCall: streamClient.call('default', details.streamCallId) };
  }, [connectionDetails, user]);

  /** Creates the shared Stream room without joining it while it is ringing. */
  const prepareOutgoingCall = useCallback(async (payload: unknown) => {
    const resources = createResources(payload);
    try {
      const members = resources.memberIds.map((id) => ({ user_id: id }));
      // Match the working web lifecycle: create a member-only call while it
      // rings, then disconnect this temporary client. Both participants join
      // fresh authenticated clients only after the server marks it ACTIVE.
      await within(
        resources.streamCall.getOrCreate(members.length > 0 ? { data: { members } } : undefined),
        STREAM_PREPARE_TIMEOUT_MS,
        'The video service did not prepare the shared call in time. Please try again.',
      );
      return { streamCallId: resources.streamCallId };
    } catch (error) {
      throw error;
    } finally {
      await resources.streamClient.disconnectUser().catch(() => {});
    }
  }, [createResources]);

  const startCall = useCallback(async () => {
    if (!appointmentId || !user) throw new Error('Appointment details are missing.');
    setLoading(true);
    setError(null);
    try {
      return responseData(await videoApi.startVideoSession(String(appointmentId)));
    } catch (requestError: any) {
      const message = requestError?.response?.data?.message || requestError?.message || 'Unable to start video call.';
      setError(message);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, [appointmentId, user]);

  const getSession = useCallback(async () => {
    if (!appointmentId || !user) throw new Error('Appointment details are missing.');
    return responseData(await videoApi.getVideoSessionByAppointment(String(appointmentId)));
  }, [appointmentId, user]);

  /** Joins an already ACTIVE session; neither participant can replace its call id. */
  const joinActiveCall = useCallback((knownPayload?: unknown) => {
    // The caller's acceptance poll can run again before a network join
    // finishes. Share one in-flight join instead of creating two clients for
    // the same user/call and letting one disconnect the other.
    if (joiningPromiseRef.current) return joiningPromiseRef.current;

    const task = (async () => {
      setLoading(true);
      setError(null);
      let resources: ReturnType<typeof createResources> | null = null;
      try {
        const payload = knownPayload ? responseData(knownPayload) : await getSession();
        const activeSession = payload.session ?? payload;
        if (String(activeSession?.status ?? '').toUpperCase() !== 'ACTIVE') {
          throw new Error('The other participant has not accepted the call yet.');
        }

        await within(
          requestMediaPermissions(),
          MEDIA_PERMISSION_TIMEOUT_MS,
          'Camera and microphone access timed out. Check the permission prompt and try again.',
        );

        let lastError: unknown = null;
        for (let attempt = 0; attempt < STREAM_JOIN_ATTEMPTS; attempt += 1) {
          resources = createResources(payload);
          try {
            await within(
              resources.streamCall.join({ create: false }),
              STREAM_JOIN_TIMEOUT_MS,
              'The video service did not connect in time. Please check your connection and call again.',
            );
            lastError = null;
            break;
          } catch (joinError) {
            lastError = joinError;
            await resources.streamClient.disconnectUser().catch(() => {});
            resources = null;
            if (attempt < STREAM_JOIN_ATTEMPTS - 1) await delay(STREAM_JOIN_RETRY_DELAY_MS);
          }
        }
        if (!resources || lastError) throw lastError || new Error('Unable to join the video call.');

        await Promise.allSettled([resources.streamCall.camera.enable(), resources.streamCall.microphone.enable()]);
        clientRef.current = resources.streamClient;
        callRef.current = resources.streamCall;
        setClient(resources.streamClient);
        setCall(resources.streamCall);
        return resources;
      } catch (joinError: any) {
        await resources?.streamClient.disconnectUser().catch(() => {});
        const message = joinError?.response?.data?.message || joinError?.message || 'Unable to join video call.';
        setError(message);
        throw joinError;
      } finally {
        setLoading(false);
      }
    })();

    joiningPromiseRef.current = task;
    void task.then(
      () => { if (joiningPromiseRef.current === task) joiningPromiseRef.current = null; },
      () => { if (joiningPromiseRef.current === task) joiningPromiseRef.current = null; },
    );
    return task;
  }, [createResources, getSession, requestMediaPermissions]);

  const endCall = useCallback(async () => {
    const currentCall = callRef.current;
    const currentClient = clientRef.current;
    callRef.current = null;
    clientRef.current = null;
    setCall(null);
    setClient(null);
    await currentCall?.leave().catch(() => {});
    await currentClient?.disconnectUser().catch(() => {});
  }, []);

  useEffect(() => () => {
    const currentCall = callRef.current;
    const currentClient = clientRef.current;
    callRef.current = null;
    clientRef.current = null;
    currentCall?.leave().catch(() => {});
    currentClient?.disconnectUser().catch(() => {});
  }, []);

  return { client, call, loading, error, startCall, getSession, prepareOutgoingCall, joinActiveCall, endCall };
}
