import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useWeeklySchedule } from '../../queries/scheduleQueries';
import { useAddTimeSlot, useDeleteTimeSlot, useUpdateAppointmentDuration } from '../../mutations/scheduleMutations';
import { getErrorMessage } from '../../utils/errorUtils';
import { useTranslation } from 'react-i18next';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

interface TimeSlot { _id: string; startTime: string; endTime: string; isAvailable?: boolean; }
interface DaySchedule { dayOfWeek: string; timeSlots: TimeSlot[]; }

function getDaySchedule(schedule: { data?: { days?: DaySchedule[] }; days?: DaySchedule[] } | null, dayOfWeek: string): DaySchedule {
  const days = (schedule as { data?: { days?: DaySchedule[] } })?.data?.days ?? (schedule as { days?: DaySchedule[] })?.days ?? [];
  return days.find((day) => day.dayOfWeek === dayOfWeek) ?? { dayOfWeek, timeSlots: [] };
}

function formatTime(value?: string): string {
  const match = String(value ?? '').trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return value || '—';
  let hour = Number(match[1]);
  if (match[3]) return `${hour}:${match[2]} ${match[3].toUpperCase()}`;
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${match[2]} ${period}`;
}

function isValidTimeRange(start: string, end: string): boolean {
  const toMinutes = (value: string) => {
    const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const [hour, minute] = [Number(match[1]), Number(match[2])];
    return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 ? hour * 60 + minute : null;
  };
  const startMinutes = toMinutes(start); const endMinutes = toMinutes(end);
  return startMinutes !== null && endMinutes !== null && endMinutes > startMinutes;
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
  const [slotError, setSlotError] = useState('');

  const schedule = scheduleResponse as { data?: { days?: DaySchedule[]; appointmentDuration?: number }; days?: DaySchedule[]; appointmentDuration?: number } | null;
  const currentDuration = useMemo(() => schedule?.data?.appointmentDuration ?? schedule?.appointmentDuration ?? 30, [schedule]);
  const scheduledDays = useMemo(() => DAYS.filter((day) => getDaySchedule(schedule, day).timeSlots?.length > 0).length, [schedule]);
  useEffect(() => { setDuration(currentDuration); }, [currentDuration]);

  const openAddSlot = (day: string) => { setAddSlotDay(day); setStartTime('09:00'); setEndTime('09:30'); setSlotError(''); setModalVisible(true); };
  const handleAddSlot = async () => {
    if (!isValidTimeRange(startTime, endTime)) { setSlotError(t('vetClinicHours.modal.invalidRange')); return; }
    try {
      await addSlotMutation.mutateAsync({ dayOfWeek: addSlotDay, payload: { startTime: startTime.trim(), endTime: endTime.trim(), isAvailable: true } });
      Toast.show({ type: 'success', text1: t('vetClinicHours.toasts.slotAdded') }); setModalVisible(false);
    } catch (err) { Toast.show({ type: 'error', text1: getErrorMessage(err) }); }
  };
  const handleDeleteSlot = async (dayOfWeek: string, slotId: string) => {
    try { await deleteSlotMutation.mutateAsync({ dayOfWeek, slotId }); Toast.show({ type: 'success', text1: t('vetClinicHours.toasts.slotDeleted') }); }
    catch (err) { Toast.show({ type: 'error', text1: getErrorMessage(err) }); }
  };
  const handleUpdateDuration = async () => {
    try { await updateDurationMutation.mutateAsync(Number(duration)); Toast.show({ type: 'success', text1: t('vetClinicHours.toasts.durationUpdated') }); }
    catch (err) { Toast.show({ type: 'error', text1: getErrorMessage(err) }); }
  };

  if (isLoading) return <ScreenContainer padded><View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>{t('vetClinicHours.loading')}</Text></View></ScreenContainer>;

  return (
    <ScreenContainer scroll padded>
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="calendar-clear-outline" size={24} color={colors.primaryDark} /></View>
        <View style={styles.heroCopy}><Text style={styles.heroTitle}>{t('vetClinicHours.title')}</Text><Text style={styles.heroText}>{t('vetClinicHours.subtitle')}</Text></View>
      </View>

      <Card style={styles.durationCard}>
        <View style={styles.sectionHeader}><View style={styles.sectionIcon}><Ionicons name="timer-outline" size={18} color={colors.primary} /></View><View style={styles.sectionCopy}><Text style={styles.sectionTitle}>{t('vetClinicHours.duration.title')}</Text><Text style={styles.sectionHint}>{t('vetClinicHours.duration.current', { count: currentDuration })}</Text></View></View>
        <View style={styles.durationRow}>{([15, 30, 45, 60] as const).map((minutes) => <TouchableOpacity key={minutes} style={[styles.durationBtn, duration === minutes && styles.durationBtnActive]} onPress={() => setDuration(minutes)}><Text style={[styles.durationText, duration === minutes && styles.durationTextActive]}>{t('vetClinicHours.duration.minutes', { count: minutes })}</Text></TouchableOpacity>)}</View>
        <Button title={updateDurationMutation.isPending ? t('vetClinicHours.duration.updating') : t('vetClinicHours.duration.update')} onPress={handleUpdateDuration} style={styles.updateBtn} disabled={updateDurationMutation.isPending} />
      </Card>

      <View style={styles.scheduleHeading}><View><Text style={styles.scheduleTitle}>{t('vetClinicHours.scheduleTitle')}</Text><Text style={styles.scheduleSub}>{t('vetClinicHours.scheduleSummary', { count: scheduledDays })}</Text></View><View style={styles.countPill}><Text style={styles.countPillText}>{scheduledDays}/7</Text></View></View>

      {DAYS.map((day) => {
        const slots = getDaySchedule(schedule, day).timeSlots || [];
        return <Card key={day} style={styles.dayCard}>
          <View style={styles.dayHeader}><View style={styles.dayHeading}><View style={[styles.dayDot, slots.length > 0 && styles.dayDotActive]} /><Text style={styles.dayTitle}>{t(`days.${day.toLowerCase()}`)}</Text></View><Text style={[styles.dayStatus, slots.length > 0 && styles.dayStatusOpen]}>{slots.length > 0 ? t('vetClinicHours.open') : t('vetClinicHours.closed')}</Text></View>
          {slots.length === 0 ? <View style={styles.emptySlot}><Ionicons name="moon-outline" size={16} color={colors.textLight} /><Text style={styles.noSlots}>{t('vetClinicHours.noSlots')}</Text></View> : <View style={styles.slotList}>{slots.map((slot) => <View key={slot._id} style={styles.slotRow}><View style={styles.slotClock}><Ionicons name="time-outline" size={16} color={colors.primary} /></View><View style={styles.slotCopy}><Text style={styles.slotText}>{formatTime(slot.startTime)} — {formatTime(slot.endTime)}</Text><Text style={[styles.slotState, slot.isAvailable === false && styles.slotUnavailable]}>{slot.isAvailable === false ? t('vetClinicHours.unavailable') : t('vetClinicHours.available')}</Text></View><TouchableOpacity style={styles.removeSlotButton} onPress={() => handleDeleteSlot(day, slot._id)} hitSlop={10} disabled={deleteSlotMutation.isPending} accessibilityLabel={t('vetClinicHours.removeSlot')}>{deleteSlotMutation.isPending ? <ActivityIndicator size="small" color={colors.error} /> : <Ionicons name="trash-outline" size={18} color={colors.error} />}</TouchableOpacity></View>)}</View>}
          <TouchableOpacity style={styles.addSlotButton} onPress={() => openAddSlot(day)} activeOpacity={0.8}><Ionicons name="add-circle-outline" size={18} color={colors.primary} /><Text style={styles.addSlotText}>{t('vetClinicHours.addSlot')}</Text></TouchableOpacity>
        </Card>;
      })}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}><Pressable style={styles.modalContent} onPress={(event) => event.stopPropagation()}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}><View><Text style={styles.modalTitle}>{t('vetClinicHours.modal.title')}</Text><Text style={styles.modalSubtitle}>{t(`days.${addSlotDay.toLowerCase()}`)}</Text></View><TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}><Ionicons name="close" size={20} color={colors.textSecondary} /></TouchableOpacity></View>
          <View style={styles.timeFields}><View style={styles.timeField}><Text style={styles.inputLabel}>{t('vetClinicHours.modal.startLabel')}</Text><TextInput style={styles.input} value={startTime} onChangeText={(value) => { setStartTime(value); setSlotError(''); }} placeholder={t('vetClinicHours.modal.startPlaceholder')} placeholderTextColor={colors.textLight} keyboardType="numbers-and-punctuation" maxLength={5} /><Text style={styles.timePreview}>{formatTime(startTime)}</Text></View><Ionicons name="arrow-forward" size={18} color={colors.textSecondary} style={styles.arrow} /><View style={styles.timeField}><Text style={styles.inputLabel}>{t('vetClinicHours.modal.endLabel')}</Text><TextInput style={styles.input} value={endTime} onChangeText={(value) => { setEndTime(value); setSlotError(''); }} placeholder={t('vetClinicHours.modal.endPlaceholder')} placeholderTextColor={colors.textLight} keyboardType="numbers-and-punctuation" maxLength={5} /><Text style={styles.timePreview}>{formatTime(endTime)}</Text></View></View>
          {slotError ? <Text style={styles.slotError}>{slotError}</Text> : null}
          <View style={styles.modalActions}><Button title={t('common.cancel')} variant="outline" onPress={() => setModalVisible(false)} style={styles.modalBtn} /><Button title={addSlotMutation.isPending ? t('vetClinicHours.modal.saving') : t('vetClinicHours.modal.save')} onPress={handleAddSlot} style={styles.modalBtn} disabled={addSlotMutation.isPending} /></View>
        </Pressable></Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm }, loadingText: { ...typography.bodySmall, color: colors.textSecondary },
  hero: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 18, backgroundColor: colors.successLight, borderWidth: 1, borderColor: colors.primaryLight + '25', marginBottom: spacing.md }, heroIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.secondaryLight, marginRight: spacing.md }, heroCopy: { flex: 1 }, heroTitle: { ...typography.h3, color: colors.primaryDark }, heroText: { ...typography.caption, color: colors.primaryDark, opacity: 0.72, marginTop: 3 },
  durationCard: { borderWidth: 1, borderColor: colors.borderLight }, sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }, sectionIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '17', marginRight: spacing.sm }, sectionCopy: { flex: 1 }, sectionTitle: { ...typography.label }, sectionHint: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  durationRow: { flexDirection: 'row', gap: spacing.sm }, durationBtn: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.borderLight }, durationBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary }, durationText: { ...typography.caption, color: colors.textSecondary, fontWeight: '700' }, durationTextActive: { color: colors.textInverse }, updateBtn: { marginTop: spacing.md },
  scheduleHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }, scheduleTitle: { ...typography.h3 }, scheduleSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 }, countPill: { minWidth: 42, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '1A' }, countPillText: { ...typography.caption, color: colors.primaryDark, fontWeight: '800' },
  dayCard: { padding: 0, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderLight }, dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.md }, dayHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 }, dayDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border }, dayDotActive: { backgroundColor: colors.success }, dayTitle: { ...typography.label }, dayStatus: { ...typography.caption, color: colors.textLight, fontWeight: '700', textTransform: 'uppercase' }, dayStatusOpen: { color: colors.success },
  emptySlot: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.md }, noSlots: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 }, slotList: { paddingHorizontal: spacing.md, paddingTop: spacing.sm }, slotRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight }, slotClock: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '16', marginRight: spacing.sm }, slotCopy: { flex: 1 }, slotText: { ...typography.label }, slotState: { ...typography.caption, color: colors.success, marginTop: 1 }, slotUnavailable: { color: colors.error }, removeSlotButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.errorLight + '8A' }, addSlotButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 46, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight }, addSlotText: { ...typography.label, color: colors.primary },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(22, 32, 28, 0.46)' }, modalContent: { backgroundColor: colors.background, padding: spacing.md, paddingBottom: spacing.lg, borderTopLeftRadius: 24, borderTopRightRadius: 24 }, modalHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md }, modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.md }, modalTitle: { ...typography.h2 }, modalSubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 }, closeButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.backgroundSecondary }, timeFields: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs }, timeField: { flex: 1 }, inputLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '700', marginBottom: 5 }, input: { height: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: spacing.sm, ...typography.body, backgroundColor: colors.backgroundSecondary }, timePreview: { ...typography.caption, color: colors.primary, fontWeight: '700', marginTop: 5 }, arrow: { marginTop: 30 }, slotError: { ...typography.caption, color: colors.error, marginTop: spacing.sm }, modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }, modalBtn: { flex: 1 },
});
