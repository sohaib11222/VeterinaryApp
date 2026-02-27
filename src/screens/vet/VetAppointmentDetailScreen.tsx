import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { VetStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useAuth } from '../../contexts/AuthContext';
import { useAppointment } from '../../queries/appointmentQueries';
import {
  useAcceptAppointment,
  useRejectAppointment,
  useCompleteAppointment,
  useUpdateAppointmentStatus,
} from '../../mutations/appointmentMutations';
import { useGetOrCreateConversation } from '../../mutations/chatMutations';
import { useVaccines } from '../../queries/medicalQueries';
import { getErrorMessage } from '../../utils/errorUtils';

type Nav = NativeStackNavigationProp<VetStackParamList, 'VetAppointmentDetails'>;
type Route = RouteProp<VetStackParamList, 'VetAppointmentDetails'>;

const STATUS_COLORS: Record<string, string> = {
  PENDING: colors.warning,
  CONFIRMED: colors.info,
  COMPLETED: colors.success,
  CANCELLED: colors.error,
  REJECTED: colors.error,
  NO_SHOW: colors.textSecondary,
};

export function VetAppointmentDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const appointmentId = route.params?.appointmentId ?? null;
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const todayStr = new Date().toISOString().slice(0, 10);
  const [vaccinationsDraft, setVaccinationsDraft] = useState<Array<{ vaccineId: string; vaccinationDate: string; nextDueDate: string; batchNumber: string; notes: string }>>([
    { vaccineId: '', vaccinationDate: todayStr, nextDueDate: '', batchNumber: '', notes: '' },
  ]);
  const [weightDraft, setWeightDraft] = useState<{ value: string; unit: 'kg' | 'lbs'; notes: string }>({ value: '', unit: 'kg', notes: '' });

  const { user } = useAuth();
  const currentUserId = (user as { id?: string })?.id ?? (user as { _id?: string })?._id ?? '';
  const { data: appointmentResponse, isLoading, refetch } = useAppointment(appointmentId);

  const acceptAppointment = useAcceptAppointment();
  const rejectAppointment = useRejectAppointment();
  const completeAppointment = useCompleteAppointment();
  const updateStatus = useUpdateAppointmentStatus();
  const getOrCreateConversation = useGetOrCreateConversation();
  const { data: vaccinesResponse } = useVaccines();
  const vaccines = useMemo(() => {
    const outer = (vaccinesResponse as { data?: unknown })?.data ?? vaccinesResponse;
    const list = (outer as { data?: unknown })?.data ?? outer;
    if (!Array.isArray(list)) return [];
    return list.filter((v): v is { _id: string; name: string } => {
      const o = v as { _id?: unknown; name?: unknown };
      return typeof o?._id === 'string' && typeof o?.name === 'string';
    });
  }, [vaccinesResponse]);

  const appointment = useMemo(() => {
    const body = appointmentResponse as { data?: unknown };
    return body?.data ?? appointmentResponse;
  }, [appointmentResponse]) as Record<string, unknown> | null;

  const pet = (appointment?.petId as Record<string, unknown>) || {};
  const owner = (appointment?.petOwnerId as Record<string, unknown>) || {};
  const status = String((appointment?.status as string) || '').toUpperCase();
  const dateStr = appointment?.appointmentDate
    ? new Date(appointment.appointmentDate as string).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';
  const timeStr = (appointment?.appointmentTime as string) || '';

  const canAccept = status === 'PENDING';
  const canReject = status === 'PENDING';
  const canComplete = status === 'CONFIRMED';
  const canMarkNoShow = status === 'CONFIRMED';
  const canStartVideo = status === 'CONFIRMED' && (appointment?.bookingType as string) === 'ONLINE';
  const canPrescription = status === 'COMPLETED';
  const ownerId = (owner as { _id?: string })?._id ?? (appointment?.petOwnerId as string) ?? '';

  const openChat = async () => {
    if (status !== 'CONFIRMED' || !appointmentId || !currentUserId || !ownerId) return;
    try {
      const res = await getOrCreateConversation.mutateAsync({
        veterinarianId: currentUserId,
        petOwnerId: ownerId,
        appointmentId,
      });
      const conv = (res as { _id?: string; data?: { _id?: string } })?.data ?? (res as { _id?: string });
      const conversationId = conv?._id;
      if (!conversationId) {
        Toast.show({ type: 'error', text1: t('vetAppointmentDetail.errors.couldNotOpenChat') });
        return;
      }
      const stackNav = navigation.getParent();
      stackNav?.navigate('VetChatDetail', {
        conversationId: String(conversationId),
        conversationType: 'VETERINARIAN_PET_OWNER',
        petOwnerId: ownerId,
        appointmentId,
        title: (owner.name as string) || (owner.fullName as string) || t('common.petOwner'),
        subtitle: t('common.chat'),
      });
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) });
    }
  };

  const statusColor = STATUS_COLORS[status] || colors.warning;
  const isProcessing =
    acceptAppointment.isPending ||
    rejectAppointment.isPending ||
    completeAppointment.isPending ||
    updateStatus.isPending;

  const handleAccept = async () => {
    if (!appointmentId) return;
    try {
      await acceptAppointment.mutateAsync(appointmentId);
      Toast.show({ type: 'success', text1: t('vetAppointmentDetail.toasts.accepted') });
      refetch();
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) });
    }
  };

  const handleReject = async () => {
    if (!appointmentId) return;
    try {
      await rejectAppointment.mutateAsync({
        appointmentId,
        data: { reason: rejectReason || undefined },
      });
      Toast.show({ type: 'success', text1: t('vetAppointmentDetail.toasts.rejected') });
      setShowRejectModal(false);
      refetch();
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) });
    }
  };

  const openCompleteModal = () => {
    setVaccinationsDraft([
      { vaccineId: '', vaccinationDate: todayStr, nextDueDate: '', batchNumber: '', notes: '' },
    ]);
    setWeightDraft({ value: '', unit: 'kg', notes: '' });
    setShowCompleteModal(true);
  };

  const handleCompleteSubmit = async () => {
    if (!appointmentId) return;
    const filtered = vaccinationsDraft
      .filter((v) => v && String(v.vaccineId || '').trim())
      .map((v) => ({
        vaccineId: v.vaccineId,
        vaccinationDate: v.vaccinationDate || new Date().toISOString().slice(0, 10),
        nextDueDate: v.nextDueDate || null,
        batchNumber: v.batchNumber || null,
        notes: v.notes || null,
      }));
    const weightVal = Number(weightDraft.value);
    const hasWeight = Number.isFinite(weightVal) && weightDraft.value !== '' && weightVal > 0;
    try {
      await completeAppointment.mutateAsync({
        appointmentId,
        data: {
          ...(filtered.length > 0 ? { vaccinations: filtered } : {}),
          ...(hasWeight
            ? {
                weightRecord: {
                  weight: { value: weightVal, unit: weightDraft.unit || 'kg' },
                  date: new Date().toISOString(),
                  notes: weightDraft.notes || null,
                },
              }
            : {}),
        },
      });
      Toast.show({ type: 'success', text1: t('vetAppointmentDetail.toasts.completed') });
      setShowCompleteModal(false);
      refetch();
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) });
    }
  };

  const handleNoShow = async () => {
    if (!appointmentId) return;
    try {
      await updateStatus.mutateAsync({ appointmentId, data: { status: 'NO_SHOW' } });
      Toast.show({ type: 'success', text1: t('vetAppointmentDetail.toasts.noShow') });
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
          <Text style={styles.loadingText}>{t('vetAppointmentDetail.loading')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!appointmentId || !appointment) {
    return (
      <ScreenContainer padded>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t('vetAppointmentDetail.notFound.title')}</Text>
          <Text style={styles.emptySubtitle}>{t('vetAppointmentDetail.notFound.subtitle')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll padded>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card>
          <View style={styles.petRow}>
            <View style={styles.petAvatar}>
              <Text style={styles.petAvatarText}>
                {(pet?.name as string)?.charAt(0) || '?'}
              </Text>
            </View>
            <View style={styles.petInfo}>
              <Text style={styles.appointmentNumber}>
                {(appointment.appointmentNumber as string) || (appointment._id as string)}
              </Text>
              <Text style={styles.petName}>
                {(pet.name as string) || t('common.pet')}
                {(pet.breed as string) ? ` (${pet.breed})` : ''}
              </Text>
              {status === 'PENDING' && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>{t('vetAppointmentDetail.badges.new')}</Text>
                </View>
              )}
              <Text style={styles.ownerLabel}>
                {t('vetAppointmentDetail.labels.owner')}: {(owner.name as string) || (owner.fullName as string) || '—'}
              </Text>
              <Text style={styles.contact}>{(owner.email as string) || '—'}</Text>
              <Text style={styles.contact}>{(owner.phone as string) || '—'}</Text>
            </View>
          </View>

          <View style={styles.typeRow}>
            <Text style={styles.typeLabel}>{t('vetAppointmentDetail.labels.typeOfAppointment')}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, styles.badgeType]}>
                <Text style={styles.badgeText}>
                  {(appointment.bookingType as string) === 'ONLINE'
                    ? t('vetAppointmentDetail.labels.videoCall')
                    : t('vetAppointmentDetail.labels.clinicVisit')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '25' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
            </View>
            <Text style={styles.fees}>{t('vetAppointmentDetail.labels.consultationFee')}</Text>
          </View>

          <View style={styles.detailGrid}>
            <Row label={t('vetAppointmentDetail.details.dateTime')} value={`${dateStr} ${timeStr}`} />
            <Row label={t('vetAppointmentDetail.details.reason')} value={(appointment.reason as string) || t('vetAppointmentDetail.details.defaultReason')} />
            {appointment.petSymptoms ? (
              <Row label={t('vetAppointmentDetail.details.petSymptoms')} value={appointment.petSymptoms as string} />
            ) : null}
            {appointment.notes ? (
              <Row label={t('vetAppointmentDetail.details.notes')} value={appointment.notes as string} />
            ) : null}
          </View>

          <View style={styles.actions}>
            {canAccept && (
              <Button
                title={acceptAppointment.isPending ? t('vetAppointmentDetail.actions.accepting') : t('vetAppointmentDetail.actions.acceptAppointment')}
                onPress={handleAccept}
                disabled={isProcessing}
                style={styles.actionBtn}
              />
            )}
            {canReject && (
              <Button
                title={t('vetAppointmentDetail.actions.reject')}
                onPress={() => setShowRejectModal(true)}
                variant="outline"
                style={[styles.actionBtn, styles.rejectBtn]}
                disabled={isProcessing}
              />
            )}
            {canComplete && (
              <Button
                title={t('vetAppointmentDetail.actions.markCompleted')}
                onPress={openCompleteModal}
                disabled={isProcessing}
                style={styles.actionBtn}
              />
            )}
            {canMarkNoShow && (
              <Button
                title={updateStatus.isPending ? t('vetAppointmentDetail.actions.updating') : t('vetAppointmentDetail.actions.markNoShow')}
                onPress={handleNoShow}
                variant="outline"
                style={styles.actionBtn}
                disabled={isProcessing}
              />
            )}
            {canStartVideo && (
              <Button
                title={t('vetAppointmentDetail.actions.startVideo')}
                onPress={() => navigation.navigate('VetStartAppointment', { appointmentId })}
                style={[styles.actionBtn, { backgroundColor: colors.accent }]}
              />
            )}
            {status === 'CONFIRMED' && (
              <Button
                title={t('vetAppointmentDetail.actions.chatWithPetOwner')}
                variant="outline"
                onPress={openChat}
                style={styles.actionBtn}
                disabled={getOrCreateConversation.isPending}
              />
            )}
            {canPrescription && (
              <Button
                title={t('vetAppointmentDetail.actions.prescription')}
                onPress={() => navigation.navigate('VetPrescription', { appointmentId })}
                variant="outline"
                style={styles.actionBtn}
              />
            )}
          </View>
        </Card>
      </ScrollView>

      <Modal visible={showCompleteModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => !completeAppointment.isPending && setShowCompleteModal(false)}>
          <Pressable style={[styles.modalBox, styles.modalBoxLarge]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{t('vetAppointmentDetail.completeModal.title')}</Text>
              <TouchableOpacity onPress={() => !completeAppointment.isPending && setShowCompleteModal(false)} hitSlop={12}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.completeModalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.completeSectionLabel}>{t('vetAppointmentDetail.completeModal.weightOptional')}</Text>
              <View style={styles.weightRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder={t('vetAppointmentDetail.completeModal.valuePlaceholder')}
                  placeholderTextColor={colors.textLight}
                  value={weightDraft.value}
                  onChangeText={(t) => setWeightDraft((p) => ({ ...p, value: t }))}
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity
                  style={[styles.unitBtn, weightDraft.unit === 'kg' && styles.unitBtnActive]}
                  onPress={() => setWeightDraft((p) => ({ ...p, unit: 'kg' }))}
                >
                  <Text style={styles.unitBtnText}>kg</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitBtn, weightDraft.unit === 'lbs' && styles.unitBtnActive]}
                  onPress={() => setWeightDraft((p) => ({ ...p, unit: 'lbs' }))}
                >
                  <Text style={styles.unitBtnText}>lbs</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, { marginTop: spacing.xs }]}
                placeholder={t('vetAppointmentDetail.completeModal.weightNotesPlaceholder')}
                placeholderTextColor={colors.textLight}
                value={weightDraft.notes}
                onChangeText={(t) => setWeightDraft((p) => ({ ...p, notes: t }))}
              />
              <Text style={[styles.completeSectionLabel, { marginTop: spacing.md }]}>{t('vetAppointmentDetail.completeModal.vaccinationsOptional')}</Text>
              {vaccinationsDraft.map((row, idx) => (
                <View key={idx} style={styles.vaccineRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.vaccineInputRow}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44 }}>
                        <View style={styles.pickerWrap}>
                          {vaccines.map((v) => (
                            <TouchableOpacity
                              key={v._id}
                              style={[styles.pickerChip, row.vaccineId === v._id && styles.pickerChipActive]}
                              onPress={() =>
                                setVaccinationsDraft((prev) =>
                                  prev.map((p, i) => (i === idx ? { ...p, vaccineId: v._id } : p))
                                )}
                            >
                              <Text style={styles.pickerChipText} numberOfLines={1}>{v.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                      {vaccinationsDraft.length > 1 && (
                        <TouchableOpacity
                          onPress={() => setVaccinationsDraft((prev) => prev.filter((_, i) => i !== idx))}
                          disabled={completeAppointment.isPending}
                          style={styles.removeVaccineBtn}
                        >
                          <Text style={styles.removeVaccineText}>{t('common.remove')}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={styles.vaccineDatesRow}>
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder={t('vetAppointmentDetail.completeModal.datePlaceholder')}
                        placeholderTextColor={colors.textLight}
                        value={row.vaccinationDate}
                        onChangeText={(t) =>
                          setVaccinationsDraft((prev) => prev.map((p, i) => (i === idx ? { ...p, vaccinationDate: t } : p)))
                        }
                      />
                      <TextInput
                        style={[styles.input, { flex: 1, marginLeft: spacing.xs }]}
                        placeholder={t('vetAppointmentDetail.completeModal.nextDuePlaceholder')}
                        placeholderTextColor={colors.textLight}
                        value={row.nextDueDate}
                        onChangeText={(t) =>
                          setVaccinationsDraft((prev) => prev.map((p, i) => (i === idx ? { ...p, nextDueDate: t } : p)))
                        }
                      />
                    </View>
                    <TextInput
                      style={[styles.input, { marginTop: 4 }]}
                      placeholder={t('vetAppointmentDetail.completeModal.batchNumberPlaceholder')}
                      placeholderTextColor={colors.textLight}
                      value={row.batchNumber}
                      onChangeText={(t) =>
                        setVaccinationsDraft((prev) => prev.map((p, i) => (i === idx ? { ...p, batchNumber: t } : p)))
                      }
                    />
                    <TextInput
                      style={[styles.input, { marginTop: 4 }]}
                      placeholder={t('vetAppointmentDetail.completeModal.notesPlaceholder')}
                      placeholderTextColor={colors.textLight}
                      value={row.notes}
                      onChangeText={(t) =>
                        setVaccinationsDraft((prev) => prev.map((p, i) => (i === idx ? { ...p, notes: t } : p)))
                      }
                    />
                  </View>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addVaccineBtn}
                onPress={() =>
                  setVaccinationsDraft((prev) => [
                    ...prev,
                    { vaccineId: '', vaccinationDate: todayStr, nextDueDate: '', batchNumber: '', notes: '' },
                  ])
                }
                disabled={completeAppointment.isPending}
              >
                <Text style={styles.addVaccineText}>{t('vetAppointmentDetail.completeModal.addAnotherVaccine')}</Text>
              </TouchableOpacity>
            </ScrollView>
            <View style={styles.modalActions}>
              <Button
                title={t('common.cancel')}
                variant="outline"
                onPress={() => setShowCompleteModal(false)}
                style={styles.modalBtn}
                disabled={completeAppointment.isPending}
              />
              <Button
                title={completeAppointment.isPending ? t('vetAppointmentDetail.completeModal.completing') : t('vetAppointmentDetail.completeModal.completeAppointment')}
                onPress={handleCompleteSubmit}
                style={styles.modalBtn}
                disabled={completeAppointment.isPending}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={showRejectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('vetAppointmentDetail.rejectModal.title')}</Text>
            <Text style={styles.modalText}>
              {t('vetAppointmentDetail.rejectModal.confirmText')}
            </Text>
            <Text style={styles.inputLabel}>{t('vetAppointmentDetail.rejectModal.reasonLabel')}</Text>
            <TextInput
              style={styles.textArea}
              placeholder={t('vetAppointmentDetail.rejectModal.reasonPlaceholder')}
              placeholderTextColor={colors.textLight}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <Button
                title={t('common.cancel')}
                variant="outline"
                onPress={() => setShowRejectModal(false)}
                style={styles.modalBtn}
              />
              <Button
                title={rejectAppointment.isPending ? t('vetAppointmentDetail.rejectModal.rejecting') : t('vetAppointmentDetail.rejectModal.rejectAppointment')}
                onPress={handleReject}
                style={[styles.modalBtn, styles.rejectBtn]}
                disabled={rejectAppointment.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.xxl },
  loading: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  loadingText: { ...typography.bodySmall, color: colors.textSecondary },
  empty: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyTitle: { ...typography.h3, marginBottom: spacing.xs },
  emptySubtitle: { ...typography.bodySmall, color: colors.textSecondary },
  petRow: { flexDirection: 'row', marginBottom: spacing.md },
  petAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  petAvatarText: { ...typography.h2, color: colors.primary },
  petInfo: { flex: 1, minWidth: 0 },
  appointmentNumber: { ...typography.caption, color: colors.textSecondary, marginBottom: 2 },
  petName: { ...typography.h3, marginBottom: 2 },
  newBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  newBadgeText: { fontSize: 11, fontWeight: '600', color: colors.primaryDark },
  ownerLabel: { ...typography.bodySmall },
  contact: { ...typography.caption, color: colors.textSecondary },
  typeRow: { marginBottom: spacing.md },
  typeLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeType: { backgroundColor: colors.primaryLight + '25' },
  badgeText: { ...typography.bodySmall, fontWeight: '600' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusText: { ...typography.label },
  fees: { ...typography.bodySmall, color: colors.textSecondary },
  detailGrid: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  detailRow: { marginBottom: spacing.sm },
  detailLabel: { ...typography.caption, color: colors.textSecondary },
  detailValue: { ...typography.body },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
  actionBtn: { marginBottom: 0 },
  rejectBtn: { borderColor: colors.error },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalScrollContent: { flexGrow: 1, justifyContent: 'center' },
  modalBox: { backgroundColor: colors.background, borderRadius: 16, padding: spacing.lg },
  modalBoxLarge: { maxHeight: '85%', width: '100%' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  modalClose: { fontSize: 20, color: colors.textSecondary },
  completeModalScroll: { maxHeight: 400 },
  completeSectionLabel: { ...typography.label, marginBottom: spacing.xs },
  unitBtnActive: { backgroundColor: colors.primary, borderWidth: 1, borderColor: colors.primary },
  vaccineInputRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
  pickerWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, minHeight: 36 },
  pickerChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.backgroundTertiary },
  pickerChipActive: { backgroundColor: colors.primary },
  pickerChipText: { ...typography.caption },
  vaccineDatesRow: { flexDirection: 'row', marginTop: 4 },
  modalTitle: { ...typography.h3, marginBottom: spacing.sm, flex: 1 },
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    ...typography.body,
  },
  weightRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  unitBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: 10,
  },
  unitBtnText: { ...typography.label },
  vaccineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  removeVaccineBtn: { paddingVertical: spacing.sm },
  removeVaccineText: { ...typography.label, color: colors.error },
  addVaccineBtn: { marginTop: spacing.sm, paddingVertical: spacing.sm },
  addVaccineText: { ...typography.label, color: colors.primary },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  modalBtn: { flex: 1 },
});
