import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useAppointments } from '../../queries/appointmentQueries';
import { useAcceptAppointment, useRejectAppointment } from '../../mutations/appointmentMutations';
import { getImageUrl } from '../../config/api';
import { getErrorMessage } from '../../utils/errorUtils';

interface AppointmentRequestItem {
  _id: string;
  appointmentNumber: string;
  petName: string;
  petBreed: string;
  petImg: string | null;
  ownerName: string;
  dateTime: string;
  reason: string;
  bookingType: string;
}

function normalizePendingAppointments(response: unknown): AppointmentRequestItem[] {
  const body = response as { data?: { appointments?: unknown[] } };
  const list = Array.isArray(body?.data?.appointments) ? body.data.appointments : [];
  return list.map((a: Record<string, unknown>) => {
    const pet = (a.petId as Record<string, unknown>) || {};
    const owner = (a.petOwnerId as Record<string, unknown>) || {};
    const dateStr = a.appointmentDate
      ? new Date(a.appointmentDate as string).toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '';
    const timeStr = (a.appointmentTime as string) || '';
    return {
      _id: (a._id as string) || '',
      appointmentNumber: (a.appointmentNumber as string) || (a._id as string)?.slice?.(-6) || 'N/A',
      petName: (pet.name as string) || 'Pet',
      petBreed: (pet.breed as string) || '',
      petImg: getImageUrl((pet.photo as string) || undefined) || null,
      ownerName: (owner.fullName as string) || (owner.name as string) || 'Pet Owner',
      dateTime: `${dateStr} ${timeStr}`.trim(),
      reason: (a.reason as string) || 'Consultation',
      bookingType: (a.bookingType as string) === 'ONLINE' ? 'Video Call' : 'Clinic Visit',
    };
  });
}

export function VetPetRequestsScreen() {
  const navigation = useNavigation<any>();
  const stackNav = navigation.getParent();
  const [rejectModal, setRejectModal] = useState<{
    show: boolean;
    appointmentId: string | null;
    reason: string;
  }>({ show: false, appointmentId: null, reason: '' });

  const { data: appointmentsResponse, isLoading } = useAppointments({
    status: 'PENDING',
    limit: 50,
  });
  const acceptAppointment = useAcceptAppointment();
  const rejectAppointment = useRejectAppointment();

  const appointments = useMemo(
    () => normalizePendingAppointments(appointmentsResponse ?? {}),
    [appointmentsResponse]
  );

  const handleAccept = async (appointmentId: string) => {
    try {
      await acceptAppointment.mutateAsync(appointmentId);
      Toast.show({ type: 'success', text1: 'Appointment accepted successfully!' });
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) });
    }
  };

  const handleReject = (appointmentId: string) => {
    setRejectModal({ show: true, appointmentId, reason: '' });
  };

  const confirmReject = async () => {
    const appointmentId = rejectModal.appointmentId;
    if (!appointmentId) return;
    try {
      await rejectAppointment.mutateAsync({
        appointmentId,
        data: { reason: rejectModal.reason || undefined },
      });
      Toast.show({ type: 'success', text1: 'Appointment rejected successfully!' });
      setRejectModal({ show: false, appointmentId: null, reason: '' });
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) });
    }
  };

  const openDetail = (id: string) => {
    stackNav?.navigate('VetAppointmentDetails', { appointmentId: id });
  };

  const renderItem = ({ item }: { item: AppointmentRequestItem }) => (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        {item.petImg ? (
          <Image source={{ uri: item.petImg }} style={styles.petImage} />
        ) : (
          <View style={styles.petImagePlaceholder}>
            <Text style={styles.petImageLetter}>{item.petName.charAt(0) || '?'}</Text>
          </View>
        )}
        <View style={styles.petInfo}>
          <Text style={styles.appointmentNumber}>#{item.appointmentNumber}</Text>
          <Text style={styles.petName}>
            {item.petName}
            {item.petBreed ? ` (${item.petBreed})` : ''}
          </Text>
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>New</Text>
          </View>
          <Text style={styles.owner}>Owner: {item.ownerName}</Text>
        </View>
        <View
          style={[
            styles.typeBadge,
            item.bookingType === 'Video Call' ? styles.typeOnline : styles.typeVisit,
          ]}
        >
          <Text style={styles.typeBadgeText}>{item.bookingType}</Text>
        </View>
      </View>
      <View style={styles.dateTimeRow}>
        <Text style={styles.dateTime}>🕐 {item.dateTime}</Text>
      </View>
      <View style={styles.badgeRow}>
        <View style={styles.reasonBadge}>
          <Text style={styles.badgeText}>{item.reason}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Button
          title={acceptAppointment.isPending ? 'Processing...' : 'Accept'}
          onPress={() => handleAccept(item._id)}
          style={styles.acceptBtn}
          disabled={acceptAppointment.isPending}
        />
        <Button
          title="Reject"
          variant="outline"
          onPress={() => handleReject(item._id)}
          style={styles.rejectBtn}
          disabled={rejectAppointment.isPending}
        />
        <TouchableOpacity style={styles.viewBtn} onPress={() => openDetail(item._id)}>
          <Text style={styles.viewBtnText}>View</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <ScreenContainer padded>
      <Card style={styles.summaryCard}>
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Pending Pet Requests</Text>
          <Text style={styles.summaryCount}>{appointments.length}</Text>
        </View>
      </Card>
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : appointments.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No pending appointment requests</Text>
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
        />
      )}

      <Modal visible={rejectModal.show} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Reject Appointment</Text>
            <Text style={styles.inputLabel}>Reason for Rejection (Optional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Enter reason..."
              placeholderTextColor={colors.textLight}
              value={rejectModal.reason}
              onChangeText={(t) =>
                setRejectModal((prev) => ({ ...prev, reason: t }))
              }
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() =>
                  setRejectModal({ show: false, appointmentId: null, reason: '' })
                }
                style={styles.modalBtn}
              />
              <Button
                title={rejectAppointment.isPending ? 'Rejecting...' : 'Reject Appointment'}
                onPress={confirmReject}
                style={[styles.modalBtn, styles.modalRejectBtn]}
                disabled={rejectAppointment.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  summaryCard: { marginBottom: spacing.sm },
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTitle: { ...typography.h3 },
  summaryCount: { ...typography.h2, color: colors.primary },
  loading: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  loadingText: { ...typography.bodySmall, color: colors.textSecondary },
  empty: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
  list: { paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  petImage: { width: 56, height: 56, borderRadius: 12, marginRight: spacing.sm },
  petImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '30',
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petImageLetter: { ...typography.h3, color: colors.primary },
  petInfo: { flex: 1, minWidth: 0 },
  appointmentNumber: { ...typography.caption, color: colors.textSecondary },
  petName: { ...typography.body, fontWeight: '600' },
  newBadge: { alignSelf: 'flex-start', backgroundColor: colors.secondary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 2 },
  newBadgeText: { fontSize: 10, fontWeight: '600', color: colors.primaryDark },
  owner: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeOnline: { backgroundColor: colors.info + '25' },
  typeVisit: { backgroundColor: colors.success + '25' },
  typeBadgeText: { fontSize: 12, fontWeight: '600' },
  dateTimeRow: { marginTop: spacing.xs },
  dateTime: { ...typography.bodySmall },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: spacing.xs },
  reasonBadge: {
    backgroundColor: colors.primaryLight + '25',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  acceptBtn: { flex: 1, minWidth: 80 },
  rejectBtn: { flex: 1, minWidth: 80 },
  viewBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 20,
    justifyContent: 'center',
  },
  viewBtnText: { ...typography.label, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalBox: { backgroundColor: colors.background, borderRadius: 16, padding: spacing.lg },
  modalTitle: { ...typography.h3, marginBottom: spacing.sm },
  inputLabel: { ...typography.label, marginBottom: spacing.xs },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    ...typography.body,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  modalBtn: { flex: 1 },
  modalRejectBtn: { borderColor: colors.error },
});
