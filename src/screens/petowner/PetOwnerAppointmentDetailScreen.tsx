import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { PetOwnerStackParamList } from '../../navigation/types';
import Toast from 'react-native-toast-message';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useAppointment } from '../../queries/appointmentQueries';
import { useCancelAppointment } from '../../mutations/appointmentMutations';
import { useGetOrCreateConversation } from '../../mutations/chatMutations';
import { useMyAppointmentReview } from '../../queries/reviewQueries';
import { useCreateReview } from '../../mutations/reviewMutations';
import { getImageUrl } from '../../config/api';
import { getErrorMessage } from '../../utils/errorUtils';
import { useEligibleRescheduleAppointments } from '../../queries/scheduleQueries';
import { useTranslation } from 'react-i18next';

type Route = RouteProp<PetOwnerStackParamList, 'PetOwnerAppointmentDetails'>;

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: colors.info,
  PENDING: colors.warning,
  COMPLETED: colors.success,
  CANCELLED: colors.error,
  REJECTED: colors.error,
  NO_SHOW: colors.textSecondary,
};

export function PetOwnerAppointmentDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const appointmentId = route.params?.appointmentId ?? null;
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const { data: appointmentResponse, isLoading, refetch } = useAppointment(appointmentId);
  const cancelAppointment = useCancelAppointment();
  const getOrCreateConversation = useGetOrCreateConversation();
  const createReview = useCreateReview();
  const eligibleRescheduleQuery = useEligibleRescheduleAppointments();
  const { data: myReviewRes } = useMyAppointmentReview(appointmentId, {
    enabled: !!appointmentId,
  });
  const existingReview = useMemo(
    () => (myReviewRes as { data?: unknown })?.data ?? null,
    [myReviewRes]
  );

  const appointment = useMemo(() => {
    const body = appointmentResponse as { data?: unknown };
    return body?.data ?? appointmentResponse;
  }, [appointmentResponse]) as Record<string, unknown> | null;

  const eligibleAppointmentIds = useMemo(() => {
    const outer = (eligibleRescheduleQuery.data as { data?: unknown })?.data ?? eligibleRescheduleQuery.data;
    const payload = (outer as { data?: unknown })?.data ?? outer;
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { appointments?: unknown[] })?.appointments)
        ? (payload as { appointments: unknown[] }).appointments
        : [];
    return new Set(
      (list || [])
        .map((a) => String((a as { _id?: unknown })?._id ?? ''))
        .filter(Boolean)
    );
  }, [eligibleRescheduleQuery.data]);

  const vet = (appointment?.veterinarianId as Record<string, unknown>) || {};
  const pet = (appointment?.petId as Record<string, unknown>) || {};
  const status = String((appointment?.status as string) || '').toUpperCase();
  const dateStr = appointment?.appointmentDate
    ? new Date(appointment.appointmentDate as string).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';
  const timeStr = (appointment?.appointmentTime as string) || '';
  const vetImage = getImageUrl((vet.profileImage as string) || undefined);
  const statusColor = STATUS_COLORS[status] || colors.warning;

  const canCancel = ['PENDING', 'CONFIRMED'].includes(status);
  const canJoinVideo =
    status === 'CONFIRMED' && (appointment?.bookingType as string) === 'ONLINE';

  const canRequestReschedule = useMemo(() => {
    if (!appointmentId || !appointment) return false;
    if (status !== 'CONFIRMED') return false;
    if ((appointment?.bookingType as string) !== 'ONLINE') return false;
    if (!appointment?.appointmentDate || !appointment?.appointmentTime) return false;

    const dt = new Date(appointment.appointmentDate as string);
    const [h, m] = String(appointment.appointmentTime || '00:00')
      .split(':')
      .map(Number);
    dt.setHours(h || 0, m || 0, 0, 0);
    const hasPassed = dt.getTime() < Date.now();
    if (!hasPassed) return false;

    return eligibleAppointmentIds.has(String(appointmentId));
  }, [appointment, appointmentId, eligibleAppointmentIds, status]);
  const vetId = (vet as { _id?: string })?._id ?? (appointment?.veterinarianId as string) ?? '';
  const ownerId = (appointment?.petOwnerId as { _id?: string })?._id ?? (appointment?.petOwnerId as string) ?? '';

  const openChat = async () => {
    if (status !== 'CONFIRMED' || !appointmentId || !vetId || !ownerId) return;
    try {
      const res = await getOrCreateConversation.mutateAsync({
        veterinarianId: vetId,
        petOwnerId: ownerId,
        appointmentId,
      });
      const conv = (res as { _id?: string; data?: { _id?: string } })?.data ?? (res as { _id?: string });
      const conversationId = conv?._id;
      if (!conversationId) {
        Toast.show({ type: 'error', text1: t('petOwnerAppointmentDetail.errors.couldNotOpenChat') });
        return;
      }
      const stackNav = navigation.getParent();
      stackNav?.navigate('PetOwnerChatDetail', {
        conversationId: String(conversationId),
        veterinarianId: vetId,
        petOwnerId: ownerId,
        appointmentId,
        conversationType: 'VETERINARIAN_PET_OWNER',
        title: (vet.name as string) || (vet.fullName as string) || t('common.veterinarian'),
        subtitle: t('common.chat'),
        peerImageUri: vetImage ?? undefined,
      });
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) });
    }
  };

  const handleCancel = async () => {
    if (!appointmentId) return;
    try {
      await cancelAppointment.mutateAsync({
        appointmentId,
        data: { reason: cancelReason || undefined },
      });
      Toast.show({ type: 'success', text1: t('petOwnerAppointmentDetail.toasts.cancelled') });
      setShowCancelModal(false);
      refetch();
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) });
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewText.trim()) {
      Toast.show({ type: 'error', text1: t('petOwnerAppointmentDetail.toasts.reviewRequired') });
      return;
    }
    const veterinarianId = (appointment?.veterinarianId as { _id?: string })?._id ?? (appointment?.veterinarianId as string);
    if (!veterinarianId) {
      Toast.show({ type: 'error', text1: t('petOwnerAppointmentDetail.toasts.vetNotFound') });
      return;
    }
    try {
      await createReview.mutateAsync({
        veterinarianId,
        appointmentId: appointmentId!,
        petId: (appointment?.petId as { _id?: string })?._id ?? (appointment?.petId as string),
        rating: reviewRating,
        reviewText: reviewText.trim(),
        reviewType: 'APPOINTMENT',
      });
      Toast.show({ type: 'success', text1: t('petOwnerAppointmentDetail.toasts.reviewSubmitted') });
      setShowReviewModal(false);
      setReviewRating(5);
      setReviewText('');
      refetch();
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) });
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer padded>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('petOwnerAppointmentDetail.loading')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!appointmentId || !appointment) {
    return (
      <ScreenContainer padded>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t('petOwnerAppointmentDetail.notFound')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll padded>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card>
          <Text style={styles.appointmentNumber}>
            {(appointment.appointmentNumber as string) || (appointment._id as string)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '25' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
          </View>

          <View style={styles.vetRow}>
            {vetImage ? (
              <Image source={{ uri: vetImage }} style={styles.vetImage} />
            ) : (
              <View style={styles.vetImagePlaceholder}>
<Text style={styles.vetImageLetter}>
                {(vet.name as string)?.charAt(0) || t('petOwnerAppointmentDetail.defaults.vetAvatarLetter')}
              </Text>
              </View>
            )}
            <View style={styles.vetInfo}>
              <Text style={styles.label}>{t('common.veterinarian')}</Text>
              <Text style={styles.value}>
                {(vet.name as string) || (vet.fullName as string) || t('common.veterinarian')}
              </Text>
              <Text style={styles.contact}>{(vet.email as string) || t('common.na')}</Text>
              <Text style={styles.contact}>{(vet.phone as string) || t('common.na')}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>{t('appointments.labels.pet')}</Text>
            <Text style={styles.value}>
              {(pet.name as string) || t('common.pet')}
              {(pet.breed as string) ? ` (${pet.breed})` : ''}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>{t('petOwnerAppointmentDetail.labels.dateTime')}</Text>
            <Text style={styles.value}>{`${dateStr} ${timeStr}`}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>{t('petOwnerAppointmentDetail.labels.type')}</Text>
            <Text style={styles.value}>
              {(appointment.bookingType as string) === 'ONLINE'
                ? t('petOwnerAppointmentDetail.bookingTypes.videoCall')
                : t('petOwnerAppointmentDetail.bookingTypes.clinicVisit')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>{t('petOwnerAppointmentDetail.labels.reason')}</Text>
            <Text style={styles.value}>
              {(appointment.reason as string) || t('petOwnerAppointmentDetail.defaults.consultation')}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>{t('petOwnerAppointmentDetail.labels.consultationFee')}</Text>
            <Text style={styles.value}>€50</Text>
          </View>
          {(appointment.petSymptoms as string) && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>{t('petOwnerAppointmentDetail.labels.petSymptoms')}</Text>
              <Text style={styles.value}>{appointment.petSymptoms as string}</Text>
            </View>
          )}
          {(appointment.notes as string) && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>{t('petOwnerAppointmentDetail.labels.notes')}</Text>
              <Text style={styles.value}>{appointment.notes as string}</Text>
            </View>
          )}

          {canJoinVideo && (
            <Button
              title={t('petOwnerAppointmentDetail.actions.joinVideoCall')}
              onPress={() => {
                navigation.navigate('PetOwnerVideoCall', { appointmentId });
              }}
              style={styles.btn}
            />
          )}

          {canRequestReschedule && (
            <Card style={styles.rescheduleCard}>
              <Text style={styles.rescheduleTitle}>{t('petOwnerAppointmentDetail.reschedule.title')}</Text>
              <Text style={styles.rescheduleText}>
                {t('petOwnerAppointmentDetail.reschedule.subtitle')}
              </Text>
              <Button
                title={t('petOwnerAppointmentDetail.reschedule.action')}
                onPress={() =>
                  navigation.navigate('PetOwnerRequestReschedule', { appointmentId: String(appointmentId) })
                }
                style={styles.rescheduleBtn}
              />
            </Card>
          )}
          {status === 'CONFIRMED' && (
            <Button
              title={t('petOwnerAppointmentDetail.actions.chatWithVet')}
              variant="outline"
              onPress={openChat}
              style={styles.btn}
              disabled={getOrCreateConversation.isPending}
            />
          )}
          {status === 'COMPLETED' && (
            <>
              <Button
                title={t('petOwnerAppointmentDetail.actions.viewPrescription')}
                onPress={() => navigation.navigate('PetOwnerPrescription', { appointmentId })}
                style={styles.btn}
              />
              {existingReview ? (
                <View style={styles.reviewBadge}>
                  <Text style={styles.reviewBadgeText}>{t('petOwnerAppointmentDetail.review.submitted')}</Text>
                </View>
              ) : (
                <Button
                  title={t('petOwnerAppointmentDetail.review.write')}
                  onPress={() => setShowReviewModal(true)}
                  style={styles.btn}
                />
              )}
            </>
          )}
          {canCancel && (
            <Button
              title={t('petOwnerAppointmentDetail.actions.cancelAppointment')}
              variant="outline"
              onPress={() => setShowCancelModal(true)}
              style={StyleSheet.flatten([styles.btn, styles.cancelBtn])}
              disabled={cancelAppointment.isPending}
            />
          )}
        </Card>
      </ScrollView>

      <Modal visible={showReviewModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('petOwnerAppointmentDetail.reviewModal.title')}</Text>
            <Text style={styles.inputLabel}>{t('petOwnerAppointmentDetail.reviewModal.ratingLabel')}</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.starBtn, reviewRating >= n && styles.starBtnActive]}
                  onPress={() => setReviewRating(n)}
                >
                  <Text style={[styles.starText, reviewRating >= n && styles.starTextActive]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputLabel}>{t('petOwnerAppointmentDetail.reviewModal.reviewLabel')}</Text>
            <TextInput
              style={styles.textArea}
              placeholder={t('petOwnerAppointmentDetail.reviewModal.reviewPlaceholder')}
              placeholderTextColor={colors.textLight}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalActions}>
              <Button
                title={t('common.cancel')}
                variant="outline"
                onPress={() => setShowReviewModal(false)}
                style={styles.modalBtn}
              />
              <Button
                title={createReview.isPending ? t('petOwnerAppointmentDetail.reviewModal.submitting') : t('petOwnerAppointmentDetail.reviewModal.submit')}
                onPress={handleReviewSubmit}
                style={styles.modalBtn}
                disabled={createReview.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showCancelModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('petOwnerAppointmentDetail.cancelModal.title')}</Text>
            <Text style={styles.modalText}>
              {t('petOwnerAppointmentDetail.cancelModal.message')}
            </Text>
            <Text style={styles.inputLabel}>{t('petOwnerAppointmentDetail.cancelModal.reasonLabel')}</Text>
            <TextInput
              style={styles.textArea}
              placeholder={t('petOwnerAppointmentDetail.cancelModal.reasonPlaceholder')}
              placeholderTextColor={colors.textLight}
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <Button
                title={t('petOwnerAppointmentDetail.cancelModal.keep')}
                variant="outline"
                onPress={() => setShowCancelModal(false)}
                style={styles.modalBtn}
              />
              <Button
                title={cancelAppointment.isPending ? t('petOwnerAppointmentDetail.cancelModal.cancelling') : t('petOwnerAppointmentDetail.actions.cancelAppointment')}
                onPress={handleCancel}
                style={StyleSheet.flatten([styles.modalBtn, styles.modalCancelBtn])}
                disabled={cancelAppointment.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.xxl },
  loading: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  loadingText: { ...typography.bodySmall, color: colors.textSecondary },
  empty: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyTitle: { ...typography.h3 },
  appointmentNumber: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  statusText: { ...typography.label },
  vetRow: { flexDirection: 'row', marginBottom: spacing.md },
  vetImage: { width: 56, height: 56, borderRadius: 12, marginRight: spacing.sm },
  vetImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '30',
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vetImageLetter: { ...typography.h2, color: colors.primary },
  vetInfo: { flex: 1 },
  label: { ...typography.caption, color: colors.textSecondary },
  value: { ...typography.body, marginTop: 2 },
  contact: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  detailRow: { marginBottom: spacing.sm },
  btn: { marginTop: spacing.lg },
  rescheduleCard: { marginTop: spacing.lg, backgroundColor: colors.warning + '10', borderColor: colors.warning + '40' },
  rescheduleTitle: { ...typography.h3, marginBottom: 4 },
  rescheduleText: { ...typography.bodySmall, color: colors.textSecondary },
  rescheduleBtn: { marginTop: spacing.md },
  cancelBtn: { borderColor: colors.error },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalBox: { backgroundColor: colors.background, borderRadius: 16, padding: spacing.lg },
  modalTitle: { ...typography.h3, marginBottom: spacing.sm },
  modalText: { ...typography.bodySmall, marginBottom: spacing.md },
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
  modalCancelBtn: { borderColor: colors.error },
  reviewBadge: { marginTop: spacing.md, padding: spacing.sm, backgroundColor: colors.success + '25', borderRadius: 12, alignSelf: 'flex-start' },
  reviewBadgeText: { ...typography.label, color: colors.success },
  ratingRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },
  starBtn: { padding: spacing.sm },
  starBtnActive: {},
  starText: { fontSize: 28, color: colors.border },
  starTextActive: { color: colors.warning },
});
