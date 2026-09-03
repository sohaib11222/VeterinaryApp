import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../contexts/AuthContext';
import { rootNavigationRef } from '../../navigation/navigationRef';
import * as videoApi from '../../services/video';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type IncomingSession = {
  _id?: string;
  appointmentId?: { _id?: string; appointmentNumber?: string } | string;
  caller?: { name?: string; profileImage?: string | null } | null;
};

function responseData(value: unknown): any {
  const first = (value as { data?: unknown })?.data ?? value;
  return (first as { data?: unknown })?.data ?? first;
}

/**
 * Foreground incoming-call experience for both appointment participants.
 * The server is the source of truth: this component only displays sessions
 * returned from `/video/incoming`, so cancelled and expired calls disappear
 * automatically on the next poll.
 */
export function IncomingCallNotifier() {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState<IncomingSession | null>(null);
  const [answering, setAnswering] = useState(false);
  const [declining, setDeclining] = useState(false);
  const role = String(user?.role ?? '').toUpperCase();
  const isAppointmentParticipant = role === 'VETERINARIAN' || role === 'PET_OWNER';

  useEffect(() => {
    if (!isAppointmentParticipant) {
      setIncoming(null);
      return;
    }

    let disposed = false;
    const refresh = async () => {
      try {
        const payload = responseData(await videoApi.getIncomingVideoSessions());
        const next = Array.isArray(payload?.sessions) ? (payload.sessions[0] as IncomingSession | undefined) : undefined;
        if (!disposed) setIncoming(next ?? null);
      } catch {
        // Polling must never interrupt the user while the app is open.
      }
    };

    refresh();
    const timer = setInterval(refresh, 2_000);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, [isAppointmentParticipant]);

  useEffect(() => {
    const sessionId = incoming?._id ? String(incoming._id) : null;
    if (!sessionId) {
      Vibration.cancel();
      return;
    }

    const pulse = () => Vibration.vibrate([0, 240, 160, 320]);
    pulse();
    const timer = setInterval(pulse, 1_700);
    return () => {
      clearInterval(timer);
      Vibration.cancel();
    };
  }, [incoming?._id]);

  const dismiss = () => {
    Vibration.cancel();
    setIncoming(null);
  };

  const handleAccept = async () => {
    const sessionId = incoming?._id ? String(incoming._id) : '';
    const appointmentRaw = incoming?.appointmentId;
    const appointmentId = typeof appointmentRaw === 'object' ? appointmentRaw?._id : appointmentRaw;
    if (!sessionId || !appointmentId) return;

    setAnswering(true);
    try {
      const acceptedCall = responseData(await videoApi.acceptVideoSession(sessionId));
      dismiss();
      if (!rootNavigationRef.isReady()) throw new Error('Navigation is not ready');

      (rootNavigationRef as any).navigate(
        'Main',
        {
          screen: role === 'VETERINARIAN' ? 'VetStartAppointment' : 'PetOwnerVideoCall',
          params: { appointmentId: String(appointmentId), mode: 'answer', videoCall: acceptedCall },
        }
      );
    } catch (error: any) {
      await videoApi.endVideoSession(sessionId).catch(() => {});
      dismiss();
      Toast.show({ type: 'error', text1: 'Unable to answer call', text2: error?.message ?? 'Please ask the caller to try again.' });
    } finally {
      setAnswering(false);
    }
  };

  const handleDecline = async () => {
    const sessionId = incoming?._id ? String(incoming._id) : '';
    if (!sessionId) return;
    setDeclining(true);
    try {
      await videoApi.endVideoSession(sessionId);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Unable to decline call', text2: error?.message ?? undefined });
    } finally {
      dismiss();
      setDeclining(false);
    }
  };

  const appointmentNumber = typeof incoming?.appointmentId === 'object' ? incoming.appointmentId?.appointmentNumber : null;
  const callerName = incoming?.caller?.name || 'Incoming appointment call';

  return (
    <Modal visible={Boolean(incoming)} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.ringHalo}>
            <View style={styles.ringIcon}>
              <Ionicons name="videocam" size={30} color={colors.textInverse} />
            </View>
          </View>
          <Text style={styles.eyebrow}>INCOMING VIDEO CALL</Text>
          <Text style={styles.callerName} numberOfLines={1}>{callerName}</Text>
          <Text style={styles.subtitle}>{appointmentNumber ? `${appointmentNumber} · ` : ''}Appointment consultation</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              accessibilityRole="button"
              style={[styles.callAction, styles.declineAction, (declining || answering) && styles.actionDisabled]}
              onPress={handleDecline}
              disabled={declining || answering}
            >
              {declining ? <ActivityIndicator color={colors.textInverse} /> : <Ionicons name="call-outline" size={25} color={colors.textInverse} style={styles.declineIcon} />}
              <Text style={styles.actionText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              style={[styles.callAction, styles.acceptAction, (declining || answering) && styles.actionDisabled]}
              onPress={handleAccept}
              disabled={declining || answering}
            >
              {answering ? <ActivityIndicator color={colors.textInverse} /> : <Ionicons name="videocam-outline" size={25} color={colors.textInverse} />}
              <Text style={styles.actionText}>{answering ? 'Connecting' : 'Accept'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, backgroundColor: 'rgba(8, 31, 25, 0.64)' },
  card: { width: '100%', maxWidth: 390, backgroundColor: colors.background, borderRadius: 30, padding: spacing.xl, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.3, shadowRadius: 28, elevation: 14 },
  ringHalo: { width: 108, height: 108, borderRadius: 54, backgroundColor: colors.successLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  ringIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', shadowColor: colors.success, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 5 },
  eyebrow: { fontSize: 10, letterSpacing: 1.35, color: colors.primary, fontWeight: '800', marginBottom: spacing.sm },
  callerName: { ...typography.h2, color: colors.primaryDark, textAlign: 'center', marginBottom: 5 },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
  actions: { flexDirection: 'row', width: '100%', justifyContent: 'space-evenly', gap: spacing.xl, marginTop: spacing.xl },
  callAction: { flex: 1, maxWidth: 118, minHeight: 86, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', gap: 6 },
  declineAction: { backgroundColor: colors.error },
  acceptAction: { backgroundColor: colors.success },
  actionDisabled: { opacity: 0.62 },
  declineIcon: { transform: [{ rotate: '135deg' }] },
  actionText: { ...typography.bodySmall, color: colors.textInverse, fontWeight: '800' },
});
