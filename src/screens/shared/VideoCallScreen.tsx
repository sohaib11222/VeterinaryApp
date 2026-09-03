import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ParticipantView, StreamCall, StreamVideo, useCallStateHooks } from '@stream-io/video-react-native-sdk';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../contexts/AuthContext';
import { useVideoCall } from '../../hooks/useVideoCall';
import * as videoApi from '../../services/video';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type VideoRouteParams = { appointmentId?: string; mode?: 'outgoing' | 'answer'; videoCall?: unknown };
type AnyRoute = RouteProp<Record<string, VideoRouteParams>, string>;
type Phase = 'preparing' | 'ringing' | 'joining' | 'active' | 'error';
type ParticipantLike = { userId?: string; name?: string; isLocalParticipant: boolean };

function responseData(value: unknown): any {
  const first = (value as { data?: unknown })?.data ?? value;
  return (first as { data?: unknown })?.data ?? first;
}

function sessionIdFrom(payload: unknown): string {
  const data = responseData(payload);
  return String(data?.sessionId || data?.session?._id || '').trim();
}

function terminalSessionStatus(status: string) {
  return ['DECLINED', 'MISSED', 'ENDED'].includes(status);
}

/** Full-screen appointment call room with the same ringing → accepted → joined lifecycle as web. */
export function VideoCallScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<AnyRoute>();
  const { user } = useAuth();
  const appointmentId = route.params?.appointmentId ? String(route.params.appointmentId) : '';
  const mode = route.params?.mode ?? 'outgoing';
  const acceptedPayload = route.params?.videoCall;
  const { client, call, loading, error, startCall, getSession, prepareOutgoingCall, joinActiveCall, endCall } = useVideoCall(appointmentId || null);
  const [phase, setPhase] = useState<Phase>(mode === 'answer' ? 'joining' : 'preparing');
  const [sessionPayload, setSessionPayload] = useState<unknown>(acceptedPayload ?? null);
  const [callError, setCallError] = useState<string | null>(null);
  const didStart = useRef(false);
  const didJoin = useRef(false);

  const participantRole = String(user?.role ?? '').toUpperCase();

  useEffect(() => {
    if (!appointmentId || didStart.current) return;
    didStart.current = true;

    const begin = async () => {
      let callPayload: unknown = mode === 'answer' ? acceptedPayload : null;
      try {
        if (mode === 'answer') {
          if (!acceptedPayload) throw new Error('The call details are unavailable. Ask the caller to try again.');
          setPhase('joining');
          await joinActiveCall(acceptedPayload);
          didJoin.current = true;
          setPhase('active');
          return;
        }

        setPhase('preparing');
        const created = await startCall();
        callPayload = created;
        setSessionPayload(created);
        await prepareOutgoingCall(created);
        setPhase('ringing');
      } catch (startError: any) {
        // Never leave the other participant ringing or waiting when this
        // device cannot prepare/join the shared Stream room.
        const failedSessionId = sessionIdFrom(callPayload);
        if (failedSessionId) await videoApi.endVideoSession(failedSessionId).catch(() => {});
        const message = startError?.response?.data?.message || startError?.message || 'Unable to start the video call.';
        setCallError(message);
        setPhase('error');
      }
    };
    begin();
  }, [acceptedPayload, appointmentId, joinActiveCall, mode, prepareOutgoingCall, startCall]);

  useEffect(() => {
    if (phase !== 'ringing' || !appointmentId || didJoin.current) return;
    let disposed = false;

    const waitForAnswer = async () => {
      let latest: unknown = null;
      try {
        latest = await getSession();
        if (disposed) return;
        const sessionResult = latest as { session?: { status?: string }; status?: string };
        const status = String(sessionResult?.session?.status ?? sessionResult?.status ?? '').toUpperCase();
        if (status === 'ACTIVE') {
          didJoin.current = true;
          setPhase('joining');
          await joinActiveCall(latest);
          if (!disposed) setPhase('active');
          return;
        }
        if (terminalSessionStatus(status)) {
          setCallError(status === 'DECLINED' ? 'The other participant declined the call.' : 'This call is no longer available.');
          setPhase('error');
        }
      } catch (pollError: any) {
        const activeSessionId = sessionIdFrom(latest);
        if (activeSessionId) await videoApi.endVideoSession(activeSessionId).catch(() => {});
        const message = pollError?.response?.data?.message || pollError?.message || '';
        if (message && !/not found/i.test(message)) {
          setCallError(message);
          setPhase('error');
        }
      }
    };

    waitForAnswer();
    const timer = setInterval(waitForAnswer, 1_500);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, [appointmentId, getSession, joinActiveCall, phase]);

  const endServerSession = async () => {
    const candidate = sessionIdFrom(sessionPayload);
    if (candidate) {
      await videoApi.endVideoSession(candidate).catch(() => {});
      return;
    }
    if (appointmentId) {
      const current = await videoApi.getVideoSessionByAppointment(appointmentId).catch(() => null);
      const currentSessionId = sessionIdFrom(current);
      if (currentSessionId) await videoApi.endVideoSession(currentSessionId).catch(() => {});
    }
  };

  const handleEndCall = async () => {
    await endServerSession();
    await endCall();
    navigation.goBack();
  };

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const BackHandler = require('react-native').BackHandler;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (phase === 'active' || phase === 'ringing') {
        Alert.alert('Leave video call?', phase === 'ringing' ? 'This will cancel the call.' : 'This will end the call for both participants.', [
          { text: 'Stay', style: 'cancel' },
          { text: phase === 'ringing' ? 'Cancel call' : 'End call', style: 'destructive', onPress: handleEndCall },
        ]);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [phase]);

  const activeError = callError || error;
  if (phase === 'error' || activeError) {
    return (
      <SafeAreaView style={styles.darkScreen}>
        <View style={styles.feedbackCard}>
          <View style={[styles.feedbackIcon, styles.feedbackIconError]}><Ionicons name="alert-circle-outline" size={36} color={colors.error} /></View>
          <Text style={styles.feedbackTitle}>Video call unavailable</Text>
          <Text style={styles.feedbackCopy}>{activeError || 'Please return to the appointment and try again.'}</Text>
          <TouchableOpacity style={styles.primaryFeedbackButton} onPress={() => navigation.goBack()}><Text style={styles.primaryFeedbackText}>Back to appointment</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'ringing') {
    return (
      <SafeAreaView style={styles.darkScreen}>
        <View style={styles.ringingContainer}>
          <View style={styles.ringingHaloOuter}><View style={styles.ringingHaloInner}><Ionicons name="videocam" size={36} color={colors.textInverse} /></View></View>
          <Text style={styles.ringingOverline}>VIDEO CONSULTATION</Text>
          <Text style={styles.ringingTitle}>Calling your appointment participant</Text>
          <Text style={styles.ringingCopy}>Ringing securely… You will join automatically when they accept.</Text>
          <View style={styles.ringingDots}><View style={styles.ringingDotActive} /><View style={styles.ringingDot} /><View style={styles.ringingDot} /></View>
        </View>
        <TouchableOpacity style={styles.cancelCallButton} onPress={handleEndCall}><Ionicons name="call-outline" size={20} color={colors.textInverse} style={styles.cancelCallIcon} /><Text style={styles.cancelCallText}>Cancel call</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (phase !== 'active' || loading || !client || !call) {
    const joining = mode === 'answer' || phase === 'joining';
    return (
      <SafeAreaView style={styles.darkScreen}>
        <View style={styles.ringingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.ringingTitle, styles.loadingTitle]}>{joining ? 'Joining video call…' : 'Preparing secure call…'}</Text>
          <Text style={styles.ringingCopy}>{joining ? 'Connecting you to the shared consultation room.' : 'Setting up the appointment call for both participants.'}</Text>
        </View>
        <TouchableOpacity style={styles.cancelCallButton} onPress={handleEndCall}><Ionicons name="close" size={21} color={colors.textInverse} /><Text style={styles.cancelCallText}>Cancel</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <VideoCallContent role={participantRole} onEndCall={handleEndCall} />
      </StreamCall>
    </StreamVideo>
  );
}

function VideoCallContent({ role, onEndCall }: { role: string; onEndCall: () => void }) {
  const { user } = useAuth();
  const currentUserId = String((user as any)?._id ?? (user as any)?.id ?? '');
  const { useCallCallingState, useParticipants, useCameraState, useMicrophoneState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participants = useParticipants() as unknown as ParticipantLike[];
  const cameraState = useCameraState();
  const microphoneState = useMicrophoneState();
  const endHandledRef = useRef(false);

  useEffect(() => {
    if (callingState !== 'joined' || cameraState?.camera?.enabled) return;
    cameraState?.camera?.enable?.().catch(() => {});
  }, [callingState, cameraState?.camera?.enabled]);

  useEffect(() => {
    // When either participant ends the server session, Stream transitions the
    // other participant out of `joined`. Return both sides to their
    // appointment instead of leaving the remote participant on a spinner.
    if (!['left', 'ended'].includes(String(callingState)) || endHandledRef.current) return;
    endHandledRef.current = true;
    Toast.show({ type: 'info', text1: 'Video call ended', text2: 'You can call again while the appointment is still active.' });
    onEndCall();
  }, [callingState, onEndCall]);

  const localParticipant = useMemo(
    () => participants.find((participant) => String(participant.userId ?? '') === currentUserId) || participants.find((participant) => participant.isLocalParticipant),
    [currentUserId, participants]
  );
  const remoteParticipant = useMemo(() => participants.find((participant) => !participant.isLocalParticipant), [participants]);

  const toggleMicrophone = async () => {
    if (microphoneState.microphone.enabled) await microphoneState.microphone.disable().catch(() => {});
    else await microphoneState.microphone.enable().catch(() => {});
  };
  const toggleCamera = async () => {
    if (cameraState.camera.enabled) await cameraState.camera.disable().catch(() => {});
    else await cameraState.camera.enable().catch(() => {});
  };

  if (callingState !== 'joined') {
    return (
      <SafeAreaView style={styles.darkScreen}><View style={styles.ringingContainer}><ActivityIndicator size="large" color={colors.accent} /><Text style={[styles.ringingTitle, styles.loadingTitle]}>Joining consultation…</Text><Text style={styles.ringingCopy}>Connecting your camera and microphone.</Text></View></SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.darkScreen}>
      <View style={styles.callHeader}>
        <View><Text style={styles.callHeaderTitle}>Video consultation</Text><Text style={styles.callHeaderSub}>{remoteParticipant ? 'Connected securely' : `Waiting for ${role === 'VETERINARIAN' ? 'pet owner' : 'veterinarian'}…`}</Text></View>
        <View style={[styles.connectionPill, remoteParticipant ? styles.connectionPillActive : undefined]}><View style={styles.connectionDot} /><Text style={styles.connectionPillText}>{remoteParticipant ? 'Live' : 'Waiting'}</Text></View>
      </View>
      <View style={styles.videoArea}>
        <View style={styles.remoteVideo}>
          {remoteParticipant ? <ParticipantView participant={remoteParticipant as any} supportedReactions={[]} videoZOrder={0} style={styles.participantView} /> : <View style={styles.waitingState}><View style={styles.waitingAvatar}><Ionicons name="person-outline" size={44} color={colors.primaryLight} /></View><Text style={styles.waitingTitle}>Waiting for the other participant</Text><Text style={styles.waitingCopy}>They will appear here as soon as they join.</Text></View>}
          {remoteParticipant ? <View style={styles.nameBadge}><View style={styles.nameBadgeDot} /><Text style={styles.nameBadgeText} numberOfLines={1}>{remoteParticipant.name || (role === 'VETERINARIAN' ? 'Pet owner' : 'Veterinarian')}</Text></View> : null}
        </View>
        {localParticipant ? <View style={styles.localVideo}><ParticipantView participant={localParticipant as any} supportedReactions={[]} videoZOrder={1} style={styles.participantView} /><Text style={styles.localLabel}>You</Text></View> : null}
      </View>
      <View style={styles.controlDock}>
        <TouchableOpacity onPress={toggleMicrophone} style={[styles.controlButton, !microphoneState.microphone.enabled && styles.controlButtonMuted]}><Ionicons name={microphoneState.microphone.enabled ? 'mic-outline' : 'mic-off-outline'} size={23} color={colors.textInverse} /></TouchableOpacity>
        <TouchableOpacity onPress={toggleCamera} style={[styles.controlButton, !cameraState.camera.enabled && styles.controlButtonMuted]}><Ionicons name={cameraState.camera.enabled ? 'videocam-outline' : 'videocam-off-outline'} size={24} color={colors.textInverse} /></TouchableOpacity>
        <TouchableOpacity onPress={onEndCall} style={[styles.controlButton, styles.endButton]}><Ionicons name="call-outline" size={25} color={colors.textInverse} style={styles.cancelCallIcon} /></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  darkScreen: { flex: 1, backgroundColor: '#08251E' },
  ringingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 34 },
  ringingHaloOuter: { width: 142, height: 142, borderRadius: 71, backgroundColor: 'rgba(89, 199, 151, 0.16)', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  ringingHaloInner: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.success, justifyContent: 'center', alignItems: 'center', shadowColor: colors.success, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 25, elevation: 8 },
  ringingOverline: { fontSize: 11, fontWeight: '800', letterSpacing: 1.65, color: colors.accentLight, marginBottom: spacing.sm },
  ringingTitle: { fontSize: 25, lineHeight: 32, color: colors.textInverse, fontWeight: '800', textAlign: 'center', marginBottom: spacing.sm },
  loadingTitle: { marginTop: spacing.lg },
  ringingCopy: { fontSize: 15, lineHeight: 22, color: 'rgba(255,255,255,0.7)', textAlign: 'center', maxWidth: 300 },
  ringingDots: { flexDirection: 'row', gap: 7, marginTop: 28 },
  ringingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.28)' },
  ringingDotActive: { width: 24, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  cancelCallButton: { position: 'absolute', left: 24, right: 24, bottom: Platform.OS === 'ios' ? 34 : 25, height: 56, borderRadius: 18, backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  cancelCallIcon: { transform: [{ rotate: '135deg' }] },
  cancelCallText: { fontSize: 16, fontWeight: '800', color: colors.textInverse },
  feedbackCard: { marginHorizontal: spacing.lg, backgroundColor: colors.background, borderRadius: 28, padding: spacing.xl, alignItems: 'center' },
  feedbackIcon: { width: 72, height: 72, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  feedbackIconError: { backgroundColor: colors.errorLight },
  feedbackTitle: { fontSize: 22, fontWeight: '800', color: colors.primaryDark, marginBottom: spacing.sm, textAlign: 'center' },
  feedbackCopy: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, textAlign: 'center', marginBottom: spacing.xl },
  primaryFeedbackButton: { width: '100%', minHeight: 52, backgroundColor: colors.primary, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  primaryFeedbackText: { color: colors.textInverse, fontSize: 15, fontWeight: '800' },
  callHeader: { position: 'absolute', zIndex: 4, top: Platform.OS === 'ios' ? 16 : 12, left: 18, right: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 18, backgroundColor: 'rgba(4, 15, 12, 0.56)' },
  callHeaderTitle: { color: colors.textInverse, fontSize: 15, fontWeight: '800' },
  callHeaderSub: { color: 'rgba(255,255,255,0.66)', fontSize: 11, marginTop: 2 },
  connectionPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 },
  connectionPillActive: { backgroundColor: 'rgba(79, 202, 139, 0.25)' },
  connectionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accentLight },
  connectionPillText: { fontSize: 11, color: colors.textInverse, fontWeight: '700' },
  videoArea: { flex: 1, position: 'relative' },
  remoteVideo: { flex: 1, overflow: 'hidden', backgroundColor: '#0D342A' },
  participantView: { width: '100%', height: '100%' },
  waitingState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  waitingAvatar: { width: 86, height: 86, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  waitingTitle: { color: colors.textInverse, fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  waitingCopy: { color: 'rgba(255,255,255,0.62)', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  nameBadge: { position: 'absolute', bottom: 130, left: 18, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 14, backgroundColor: 'rgba(3, 13, 10, 0.58)', maxWidth: '65%' },
  nameBadgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  nameBadgeText: { flex: 1, color: colors.textInverse, fontSize: 12, fontWeight: '700' },
  localVideo: { position: 'absolute', width: 112, height: 152, right: 18, top: Platform.OS === 'ios' ? 100 : 82, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', backgroundColor: '#163F34' },
  localLabel: { position: 'absolute', left: 8, bottom: 7, color: colors.textInverse, fontWeight: '700', fontSize: 11, backgroundColor: 'rgba(0,0,0,0.4)', overflow: 'hidden', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  controlDock: { position: 'absolute', zIndex: 5, left: 18, right: 18, bottom: Platform.OS === 'ios' ? 26 : 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 12, borderRadius: 26, backgroundColor: 'rgba(4, 15, 12, 0.76)' },
  controlButton: { width: 54, height: 54, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.17)', alignItems: 'center', justifyContent: 'center' },
  controlButtonMuted: { backgroundColor: 'rgba(229, 196, 106, 0.36)' },
  endButton: { backgroundColor: colors.error },
});
