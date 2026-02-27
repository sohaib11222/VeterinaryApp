import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import {
  ParticipantView,
  StreamCall,
  StreamVideo,
  useCallStateHooks,
} from '@stream-io/video-react-native-sdk';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext';
import { useVideoCall } from '../../hooks/useVideoCall';
import { useAppointment } from '../../queries/appointmentQueries';
import * as videoApi from '../../services/video';
import { colors } from '../../theme/colors';

type Params = { appointmentId: string };
type AnyRoute = RouteProp<Record<string, Params>, string>;

type ParticipantLike = {
  userId?: string;
  name?: string;
  isLocalParticipant: boolean;
};

function checkAppointmentTime(appointment: Record<string, unknown> | null) {
  if (!appointment) return { isValid: false, message: 'Appointment not found', startTime: null, endTime: null } as const;

  const tzOffsetMinutes =
    typeof (appointment as any).timezoneOffset === 'number' && Number.isFinite((appointment as any).timezoneOffset)
      ? (appointment as any).timezoneOffset
      : null;

  // If backend didn't provide timezone offset, do not block client-side.
  if (tzOffsetMinutes === null) {
    return { isValid: true, message: null, startTime: null, endTime: null } as const;
  }

  const now = new Date();
  const appointmentDateUTC = new Date(String((appointment as any).appointmentDate));
  const appointmentDateInTz = new Date(appointmentDateUTC.getTime() + tzOffsetMinutes * 60 * 1000);

  const year = appointmentDateInTz.getUTCFullYear();
  const month = appointmentDateInTz.getUTCMonth() + 1;
  const day = appointmentDateInTz.getUTCDate();

  const [startHours, startMinutes] = String((appointment as any).appointmentTime || '')
    .split(':')
    .map(Number);

  const appointmentStartDateTimeUTC = new Date(Date.UTC(year, month - 1, day, startHours, startMinutes, 0, 0));
  const appointmentStartDateTime = new Date(appointmentStartDateTimeUTC.getTime() - tzOffsetMinutes * 60 * 1000);

  const duration = Number((appointment as any).appointmentDuration || 30);
  let appointmentEndDateTime: Date;

  if ((appointment as any).appointmentEndTime) {
    const [endHours, endMinutes] = String((appointment as any).appointmentEndTime || '')
      .split(':')
      .map(Number);

    const startTimeMinutes = startHours * 60 + startMinutes;
    const endTimeMinutes = endHours * 60 + endMinutes;
    let endYear = year;
    let endMonth = month - 1;
    let endDay = day;

    if (endTimeMinutes < startTimeMinutes && startTimeMinutes - endTimeMinutes > 12 * 60) {
      const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
      endYear = nextDay.getUTCFullYear();
      endMonth = nextDay.getUTCMonth();
      endDay = nextDay.getUTCDate();
    }

    const appointmentEndDateTimeUTC = new Date(Date.UTC(endYear, endMonth, endDay, endHours, endMinutes, 0, 0));
    appointmentEndDateTime = new Date(appointmentEndDateTimeUTC.getTime() - tzOffsetMinutes * 60 * 1000);
  } else {
    appointmentEndDateTime = new Date(appointmentStartDateTime.getTime() + duration * 60 * 1000);
  }

  const bufferTime = 2 * 60 * 1000;
  const earliestAllowedTime = new Date(appointmentStartDateTime.getTime() - bufferTime);

  if (now < earliestAllowedTime) {
    return {
      isValid: false,
      message: `Video call is only available within the appointment window. It will be available 2 minutes before the start time. Your appointment starts at ${appointmentStartDateTime.toLocaleString()}.`,
      startTime: appointmentStartDateTime,
      endTime: appointmentEndDateTime,
    } as const;
  }

  if (now > appointmentEndDateTime) {
    return {
      isValid: false,
      message: `The appointment time has passed. The appointment window was from ${appointmentStartDateTime.toLocaleString()} to ${appointmentEndDateTime.toLocaleString()}. Video call is no longer available.`,
      startTime: appointmentStartDateTime,
      endTime: appointmentEndDateTime,
    } as const;
  }

  return { isValid: true, message: null, startTime: appointmentStartDateTime, endTime: appointmentEndDateTime } as const;
}

export function VideoCallScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<AnyRoute>();
  const { user } = useAuth();

  const appointmentId = (route.params as any)?.appointmentId as string | undefined;
  const { data: appointmentRes, isLoading: appointmentLoading } = useAppointment(appointmentId ?? null);
  const appointment = useMemo(() => {
    const outer = (appointmentRes as any)?.data ?? appointmentRes;
    return (outer?.data ?? outer) as Record<string, unknown> | null;
  }, [appointmentRes]);

  const { client, call, loading, error, startCall, endCall } = useVideoCall(appointmentId ?? null);

  const startCallRef = useRef(false);
  const errorShownRef = useRef(false);
  const [timeValidationError, setTimeValidationError] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);

  useEffect(() => {
    if (!appointment || appointmentLoading || errorShownRef.current) return;
    const check = checkAppointmentTime(appointment);
    if (!check.isValid) {
      errorShownRef.current = true;
      setTimeValidationError(check.message);
      Alert.alert('Appointment Time Issue', check.message ?? '', [{ text: 'OK', onPress: () => navigation.goBack() }], {
        cancelable: false,
      });
    }
  }, [appointment, appointmentLoading, navigation]);

  useEffect(() => {
    if (!appointmentId || !user) return;
    if (startCallRef.current) return;
    if (loading || appointmentLoading) return;
    if (timeValidationError) return;

    const check = checkAppointmentTime(appointment);
    if (!check.isValid) {
      if (!errorShownRef.current) {
        errorShownRef.current = true;
        setTimeValidationError(check.message);
        Alert.alert('Appointment Time Issue', check.message ?? '', [{ text: 'OK', onPress: () => navigation.goBack() }], {
          cancelable: false,
        });
      }
      return;
    }

    startCallRef.current = true;
    startCall()
      .then(() => {
        setIsCallActive(true);
        Toast.show({ type: 'success', text1: 'Video Call Started', text2: 'You are now connected' });
      })
      .catch((err: any) => {
        startCallRef.current = false;
        setIsCallActive(false);
        const message = err?.response?.data?.message || err?.message || 'Failed to start video call';

        const looksTimeRelated =
          message.includes('Communication window') ||
          message.includes('appointment time') ||
          message.includes('appointment window') ||
          message.includes('time window') ||
          message.includes('not arrived') ||
          message.includes('expired') ||
          message.includes('time has passed');

        if (looksTimeRelated) {
          if (!errorShownRef.current) {
            errorShownRef.current = true;
            setTimeValidationError(message);
            Alert.alert('Appointment Time Issue', message, [{ text: 'OK', onPress: () => navigation.goBack() }], {
              cancelable: false,
            });
          }
          return;
        }

        if (String(message).toLowerCase().includes('permission')) {
          Toast.show({ type: 'error', text1: 'Permission Required', text2: message, visibilityTime: 8000 });
          return;
        }

        Toast.show({ type: 'error', text1: 'Error', text2: message });
      });
  }, [appointment, appointmentId, appointmentLoading, loading, navigation, startCall, timeValidationError, user]);

  const handleEndCall = async () => {
    try {
      setIsCallActive(false);
      try {
        if (appointmentId) {
          const sessionData = await videoApi.getVideoSessionByAppointment(appointmentId);
          const payload = (sessionData as any)?.data ?? sessionData;
          const data = payload?.data ?? payload;
          const sessionId = data?.sessionId;
          if (sessionId) {
            await videoApi.endVideoSession(String(sessionId));
          }
        }
      } catch {
        // ignore
      }
      await endCall();
    } finally {
      Toast.show({ type: 'success', text1: 'Call Ended' });
      navigation.goBack();
    }
  };

  // Android back button handling (confirm end)
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const backHandler = require('react-native').BackHandler;
    const sub = backHandler.addEventListener('hardwareBackPress', () => {
      if (isCallActive && call) {
        Alert.alert('End Call?', 'Are you sure you want to end the call?', [
          { text: 'Stay in Call', style: 'cancel' },
          { text: 'End Call', style: 'destructive', onPress: handleEndCall },
        ]);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [call, isCallActive]);

  if (timeValidationError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorTitle}>Appointment Time Issue</Text>
          <Text style={styles.errorText}>{timeValidationError}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Back to Appointments</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading || appointmentLoading || !client || !call) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Initializing video call...</Text>
          {appointmentLoading ? <Text style={styles.loadingSubtext}>Loading appointment details...</Text> : null}
          {!client ? <Text style={styles.loadingSubtext}>Connecting to server...</Text> : null}
          {!call ? <Text style={styles.loadingSubtext}>Creating call session...</Text> : null}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <VideoCallContent onEndCall={handleEndCall} />
      </StreamCall>
    </StreamVideo>
  );
}

function VideoCallContent({ onEndCall }: { onEndCall: () => void }) {
  const { user } = useAuth();
  const currentUserId = (user as any)?._id ?? (user as any)?.id;
  const role = String((user as any)?.role ?? '').toUpperCase();

  const { useCallCallingState, useParticipants, useCameraState, useMicrophoneState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participants = useParticipants() as unknown as ParticipantLike[];
  const cameraState = useCameraState();
  const micState = useMicrophoneState();

  useEffect(() => {
    const enableCameraIfNeeded = async () => {
      try {
        if (callingState !== 'joined') return;
        if (!cameraState?.camera?.enabled) {
          await cameraState?.camera?.enable?.();
        }
      } catch {
        // ignore
      }
    };
    enableCameraIfNeeded();
  }, [callingState, cameraState?.camera?.enabled]);

  if (callingState !== 'joined') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Joining call...</Text>
          <Text style={styles.loadingSubtext}>State: {callingState}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const localParticipant =
    (currentUserId
      ? participants.find((p: ParticipantLike) => String(p.userId ?? '') === String(currentUserId))
      : undefined) || participants.find((p: ParticipantLike) => p.isLocalParticipant);

  const remoteParticipants = participants.filter((p: ParticipantLike) => !p.isLocalParticipant);
  const uniqueRemoteParticipants: ParticipantLike[] = Array.from(
    new Map<string, ParticipantLike>(
      remoteParticipants
        .map((p: ParticipantLike) => [String(p.userId ?? ''), p] as const)
        .filter(([k]) => !!k)
    ).values()
  );

  const toggleMic = async () => {
    try {
      if (micState.microphone.enabled) await micState.microphone.disable();
      else await micState.microphone.enable();
    } catch {
      // ignore
    }
  };

  const toggleCamera = async () => {
    try {
      if (cameraState.camera.enabled) await cameraState.camera.disable();
      else await cameraState.camera.enable();
    } catch {
      // ignore
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.videoContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Video Consultation</Text>
          <Text style={styles.participantCount}>
            {localParticipant && uniqueRemoteParticipants.length > 0 ? '2 participants' : '1 participant'}
          </Text>
        </View>

        <View style={styles.videoArea}>
          <View style={styles.remoteVideoContainer}>
            {uniqueRemoteParticipants.length > 0 ? (
              <ParticipantView participant={uniqueRemoteParticipants[0] as any} supportedReactions={[]} videoZOrder={0} style={styles.participantView} />
            ) : (
              <View style={styles.waitingContainer}>
                <Ionicons name="person-outline" size={64} color={colors.textSecondary} />
                <Text style={styles.waitingText}>
                  {role === 'VETERINARIAN' ? 'Waiting for pet owner...' : 'Waiting for veterinarian...'}
                </Text>
              </View>
            )}

            {uniqueRemoteParticipants.length > 0 ? (
              <View style={styles.participantLabel}>
                <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.participantLabelText} numberOfLines={1}>
                  {role === 'VETERINARIAN' ? 'Pet Owner' : 'Veterinarian'}: {uniqueRemoteParticipants[0]?.name || 'User'}
                </Text>
              </View>
            ) : null}
          </View>

          {localParticipant ? (
            <View style={styles.localVideoContainer}>
              <ParticipantView participant={localParticipant as any} supportedReactions={[]} videoZOrder={1} style={styles.participantView} />
              <View style={styles.participantLabel}>
                <View style={[styles.statusDot, { backgroundColor: '#2196F3' }]} />
                <Text style={styles.participantLabelText}>You</Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.controlsContainer}>
          <View style={styles.controlsBar}>
            <TouchableOpacity
              onPress={toggleMic}
              style={[styles.controlButton, { backgroundColor: micState.microphone.enabled ? '#4CAF50' : '#dc3545' }]}
            >
              <Text style={styles.controlIcon}>{micState.microphone.enabled ? '🎤' : '🔇'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleCamera}
              style={[styles.controlButton, { backgroundColor: cameraState.camera.enabled ? '#4CAF50' : '#dc3545' }]}
            >
              <Text style={styles.controlIcon}>{cameraState.camera.enabled ? '📷' : '🚫'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onEndCall} style={[styles.controlButton, styles.endCallButton]}>
              <Text style={styles.controlIcon}>📞</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  loadingText: { color: '#fff', fontSize: 18, marginTop: 16, fontWeight: '600' },
  loadingSubtext: { color: '#999', fontSize: 14, marginTop: 8 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#000' },
  errorTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  errorText: { color: '#999', fontSize: 16, textAlign: 'center', marginBottom: 24 },
  backButton: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  videoContainer: { flex: 1, backgroundColor: '#000' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  participantCount: { color: '#fff', fontSize: 14 },
  videoArea: { flex: 1, position: 'relative', overflow: 'visible' },
  remoteVideoContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 0,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },
  localVideoContainer: {
    width: 120,
    height: 160,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'absolute',
    right: 12,
    top: Platform.OS === 'ios' ? 90 : 70,
    zIndex: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  participantView: { width: '100%', height: '100%' },
  waitingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  waitingText: { color: '#fff', fontSize: 16, marginTop: 16 },
  participantLabel: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 260,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  participantLabelText: { color: '#fff', fontSize: 14, fontWeight: '500', flexShrink: 1 },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  controlButton: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  endCallButton: { backgroundColor: '#dc3545' },
  controlIcon: { fontSize: 20, color: '#fff' },
});
