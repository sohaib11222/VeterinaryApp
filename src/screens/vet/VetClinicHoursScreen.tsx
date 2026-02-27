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
import Toast from 'react-native-toast-message';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useWeeklySchedule } from '../../queries/scheduleQueries';
import {
  useAddTimeSlot,
  useDeleteTimeSlot,
  useUpdateAppointmentDuration,
} from '../../mutations/scheduleMutations';
import { getErrorMessage } from '../../utils/errorUtils';
import { useTranslation } from 'react-i18next';

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

interface TimeSlot {
  _id: string;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
}

interface DaySchedule {
  dayOfWeek: string;
  timeSlots: TimeSlot[];
}

function getDaySchedule(
  schedule: { data?: { days?: DaySchedule[] }; days?: DaySchedule[] } | null,
  dayOfWeek: string
): DaySchedule {
  const days =
    (schedule as { data?: { days?: DaySchedule[] } })?.data?.days ??
    (schedule as { days?: DaySchedule[] })?.days ??
    [];
  return days.find((d) => d.dayOfWeek === dayOfWeek) ?? { dayOfWeek, timeSlots: [] };
}

export function VetClinicHoursScreen() {
  const { t } = useTranslation();
  const { data: scheduleResponse, isLoading } = useWeeklySchedule();
  const addSlotMutation = useAddTimeSlot();
  const deleteSlotMutation = useDeleteTimeSlot();
  const updateDurationMutation = useUpdateAppointmentDuration();

  const [modalVisible, setModalVisible] = useState(false);
  const [addSlotDay, setAddSlotDay] = useState<string>(DAYS[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [duration, setDuration] = useState(30);

  const schedule = scheduleResponse as { data?: { days?: DaySchedule[]; appointmentDuration?: number }; days?: DaySchedule[]; appointmentDuration?: number } | null;
  const currentDuration = useMemo(
    () =>
      schedule?.data?.appointmentDuration ??
      schedule?.appointmentDuration ??
      30,
    [schedule]
  );

  const openAddSlot = (day: string) => {
    setAddSlotDay(day);
    setStartTime('09:00');
    setEndTime('09:30');
    setModalVisible(true);
  };

  const handleAddSlot = async () => {
    if (!startTime.trim() || !endTime.trim()) return;
    try {
      await addSlotMutation.mutateAsync({
        dayOfWeek: addSlotDay,
        payload: { startTime: startTime.trim(), endTime: endTime.trim(), isAvailable: true },
      });
      Toast.show({ type: 'success', text1: t('vetClinicHours.toasts.slotAdded') });
      setModalVisible(false);
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) });
    }
  };

  const handleDeleteSlot = async (dayOfWeek: string, slotId: string) => {
    try {
      await deleteSlotMutation.mutateAsync({ dayOfWeek, slotId });
      Toast.show({ type: 'success', text1: t('vetClinicHours.toasts.slotDeleted') });
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) });
    }
  };

  const handleUpdateDuration = async () => {
    try {
      await updateDurationMutation.mutateAsync(Number(duration));
      Toast.show({ type: 'success', text1: t('vetClinicHours.toasts.durationUpdated') });
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) });
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer padded>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('vetClinicHours.loading')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll padded>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.durationCard}>
          <Text style={styles.sectionTitle}>{t('vetClinicHours.duration.title')}</Text>
          <View style={styles.durationRow}>
            {([15, 30, 45, 60] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.durationBtn, duration === m && styles.durationBtnActive]}
                onPress={() => setDuration(m)}
              >
                <Text style={[styles.durationText, duration === m && styles.durationTextActive]}>
                  {t('vetClinicHours.duration.minutes', { count: m })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.currentDuration}>
            {t('vetClinicHours.duration.current', { count: currentDuration })}
          </Text>
          <Button
            title={updateDurationMutation.isPending ? t('vetClinicHours.duration.updating') : t('vetClinicHours.duration.update')}
            onPress={handleUpdateDuration}
            style={styles.updateBtn}
            disabled={updateDurationMutation.isPending}
          />
        </Card>

        {DAYS.map((day) => {
          const daySchedule = getDaySchedule(schedule, day);
          const slots = daySchedule.timeSlots || [];
          return (
            <Card key={day} style={styles.dayCard}>
              <Text style={styles.dayTitle}>{t(`days.${day.toLowerCase()}`)}</Text>
              {slots.length === 0 ? (
                <Text style={styles.noSlots}>{t('vetClinicHours.noSlots')}</Text>
              ) : (
                slots.map((slot) => (
                  <View key={slot._id} style={styles.slotRow}>
                    <Text style={styles.slotText}>
                      🕐 {slot.startTime} – {slot.endTime}
                      {slot.isAvailable === false && (
                        <Text style={styles.slotUnavailable}> {t('vetClinicHours.unavailable')}</Text>
                      )}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteSlot(day, slot._id)}
                      hitSlop={8}
                      disabled={deleteSlotMutation.isPending}
                    >
                      <Text style={styles.removeSlot}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
              <Button
                title={t('vetClinicHours.addSlot')}
                variant="outline"
                onPress={() => openAddSlot(day)}
                style={styles.addBtn}
              />
            </Card>
          );
        })}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('vetClinicHours.modal.title')}</Text>
            <Text style={styles.modalSubtitle}>{t(`days.${addSlotDay.toLowerCase()}`)}</Text>
            <Text style={styles.inputLabel}>{t('vetClinicHours.modal.startLabel')}</Text>
            <TextInput
              style={styles.input}
              value={startTime}
              onChangeText={setStartTime}
              placeholder={t('vetClinicHours.modal.startPlaceholder')}
              placeholderTextColor={colors.textLight}
            />
            <Text style={styles.inputLabel}>{t('vetClinicHours.modal.endLabel')}</Text>
            <TextInput
              style={styles.input}
              value={endTime}
              onChangeText={setEndTime}
              placeholder={t('vetClinicHours.modal.endPlaceholder')}
              placeholderTextColor={colors.textLight}
            />
            <View style={styles.modalActions}>
              <Button
                title={t('common.cancel')}
                variant="outline"
                onPress={() => setModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                title={addSlotMutation.isPending ? t('vetClinicHours.modal.saving') : t('vetClinicHours.modal.save')}
                onPress={handleAddSlot}
                style={styles.modalBtn}
                disabled={addSlotMutation.isPending}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.xxl },
  loading: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  loadingText: { ...typography.bodySmall, color: colors.textSecondary },
  durationCard: { marginBottom: spacing.sm },
  sectionTitle: { ...typography.h3, marginBottom: spacing.sm },
  durationRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  durationBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.backgroundTertiary,
  },
  durationBtnActive: { backgroundColor: colors.primary },
  durationText: { ...typography.label },
  durationTextActive: { color: colors.textInverse },
  currentDuration: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  updateBtn: { marginTop: spacing.sm },
  dayCard: { marginBottom: spacing.sm },
  dayTitle: { ...typography.h3, marginBottom: spacing.sm },
  noSlots: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  slotText: { ...typography.body },
  slotUnavailable: { color: colors.error, fontSize: 12 },
  removeSlot: { fontSize: 16, color: colors.error, paddingHorizontal: 8 },
  addBtn: { marginTop: spacing.sm },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: { ...typography.h3, marginBottom: 4 },
  modalSubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.md },
  inputLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    marginBottom: spacing.sm,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalBtn: { flex: 1 },
});
