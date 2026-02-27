import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { PlaceholderScreen } from '../../components/common/PlaceholderScreen';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { PetOwnerStackParamList } from '../../navigation/types';
import { useEligibleRescheduleAppointments, useRescheduleRequests } from '../../queries/scheduleQueries';
import { useRouteInfo } from '../../queries/mappingQueries';
import { useCreateRescheduleRequest, usePayRescheduleFee } from '../../mutations/scheduleMutations';
import { getErrorMessage } from '../../utils/errorUtils';
import { useTranslation } from 'react-i18next';
import { VideoCallScreen } from '../shared/VideoCallScreen';
import i18n from '../../i18n/appI18n';

type RequestRoute = RouteProp<PetOwnerStackParamList, 'PetOwnerRequestReschedule'>;

type EligibleAppointment = {
  _id: string;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentNumber?: string;
  veterinarianId?: { name?: string; fullName?: string; email?: string } | string;
};

function normalizeEligibleAppointments(response: unknown): EligibleAppointment[] {
  const outer = response as { data?: unknown };
  const maybeBody = outer?.data ?? response;
  const payload = (maybeBody as { data?: unknown })?.data ?? maybeBody;
  const list = Array.isArray(payload) ? payload : Array.isArray((payload as { appointments?: unknown[] })?.appointments) ? (payload as { appointments: unknown[] }).appointments : [];
  return list
    .map((a) => a as Record<string, unknown>)
    .filter(Boolean)
    .map((a) => ({
      _id: String(a._id ?? ''),
      appointmentDate: (a.appointmentDate as string) || undefined,
      appointmentTime: (a.appointmentTime as string) || undefined,
      appointmentNumber: (a.appointmentNumber as string) || undefined,
      veterinarianId: (a.veterinarianId as EligibleAppointment['veterinarianId']) || undefined,
    }))
    .filter((a) => !!a._id);
}

type RescheduleRequest = {
  _id: string;
  status?: string;
  reason?: string;
  preferredDate?: string | null;
  preferredTime?: string | null;
  rescheduleFee?: number | null;
  rejectionReason?: string | null;
  appointmentId?: {
    _id?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    appointmentNumber?: string;
    paymentStatus?: string;
  } | string;
  newAppointmentId?: {
    _id?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    appointmentNumber?: string;
    paymentStatus?: string;
  } | string | null;
};

function normalizeRescheduleRequests(response: unknown): RescheduleRequest[] {
  const outer = response as { data?: unknown };
  const maybeBody = outer?.data ?? response;
  const payload = (maybeBody as { data?: unknown })?.data ?? maybeBody;
  const list = Array.isArray(payload) ? payload : Array.isArray((payload as { requests?: unknown[] })?.requests) ? (payload as { requests: unknown[] }).requests : [];
  return list
    .map((r) => r as Record<string, unknown>)
    .filter(Boolean)
    .map((r) => ({
      _id: String(r._id ?? ''),
      status: (r.status as string) || undefined,
      reason: (r.reason as string) || undefined,
      preferredDate: (r.preferredDate as string) ?? null,
      preferredTime: (r.preferredTime as string) ?? null,
      rescheduleFee: (r.rescheduleFee as number) ?? null,
      rejectionReason: (r.rejectionReason as string) ?? null,
      appointmentId: (r.appointmentId as RescheduleRequest['appointmentId']) || undefined,
      newAppointmentId: (r.newAppointmentId as RescheduleRequest['newAppointmentId']) ?? null,
    }))
    .filter((r) => !!r._id);
}

function formatDateTime(date?: string, time?: string) {
  if (!date) return i18n.t('common.na');
  const d = new Date(date);
  const dateStr = Number.isNaN(d.getTime()) ? String(date) : d.toLocaleDateString();
  return `${dateStr} ${time || ''}`.trim();
}

function statusBadgeConfig(status?: string) {
  const s = String(status || '').toUpperCase();
  if (s === 'APPROVED') return { bg: colors.success + '25', fg: colors.success, labelKey: 'petOwnerPlaceholders.rescheduleRequests.status.approved' };
  if (s === 'PENDING') return { bg: colors.warning + '25', fg: colors.warning, labelKey: 'petOwnerPlaceholders.rescheduleRequests.status.pending' };
  if (s === 'REJECTED') return { bg: colors.error + '25', fg: colors.error, labelKey: 'petOwnerPlaceholders.rescheduleRequests.status.rejected' };
  if (s === 'CANCELLED') return { bg: colors.textLight + '25', fg: colors.textSecondary, labelKey: 'petOwnerPlaceholders.rescheduleRequests.status.cancelled' };
  return { bg: colors.textLight + '25', fg: colors.textSecondary, labelKey: 'petOwnerPlaceholders.rescheduleRequests.status.unknown' };
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseISODate(value: string) {
  const m = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
  if (!m) return null;
  const [y, mo, da] = value.split('-').map((x) => Number(x));
  const dt = new Date(y, (mo || 1) - 1, da || 1);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function to12Hour(time24: string): { hour: string; minute: string; period: 'AM' | 'PM' } {
  const [hStr, mStr] = String(time24 || '').split(':');
  const h = Number(hStr);
  const minute = (mStr ?? '00').padStart(2, '0');
  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  const hourNum = ((h % 12) || 12) as number;
  return { hour: String(hourNum), minute, period };
}

function to24Hour(hour: string, minute: string, period: 'AM' | 'PM') {
  let h = Number(hour);
  if (!Number.isFinite(h) || h <= 0) h = 12;
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${pad2(h)}:${String(minute || '00').padStart(2, '0')}`;
}

function CalendarModal({
  visible,
  value,
  minDate,
  onSelect,
  onClose,
}: {
  visible: boolean;
  value: string;
  minDate?: string;
  onSelect: (iso: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const min = minDate ? parseISODate(minDate) : null;
  const selected = value ? parseISODate(value) : null;
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const base = selected ?? min ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  useEffect(() => {
    if (!visible) return;
    const base = selected ?? min ?? new Date();
    setViewMonth(new Date(base.getFullYear(), base.getMonth(), 1));
  }, [visible, value, minDate]);

  const monthLabel = useMemo(
    () =>
      viewMonth.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      }),
    [viewMonth]
  );

  const days = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const last = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    const startWeekday = first.getDay();
    const total = startWeekday + last.getDate();
    const rows = Math.ceil(total / 7);

    const out: Array<{ iso: string; day: number; disabled: boolean } | null> = [];
    for (let i = 0; i < rows * 7; i++) {
      const dayNum = i - startWeekday + 1;
      if (dayNum < 1 || dayNum > last.getDate()) {
        out.push(null);
        continue;
      }
      const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), dayNum);
      const iso = toISODate(d);
      const disabled = !!min && startOfDay(d).getTime() < startOfDay(min).getTime();
      out.push({ iso, day: dayNum, disabled });
    }
    return out;
  }, [viewMonth, minDate]);

  const selectedIso = selected ? toISODate(selected) : '';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.pickerOverlay} onPress={onClose}>
        <Pressable style={styles.pickerModal} onPress={(e) => e.stopPropagation()}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity
              onPress={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
              hitSlop={10}
            >
              <Text style={styles.pickerHeaderBtn}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.pickerHeaderTitle}>{monthLabel}</Text>
            <TouchableOpacity
              onPress={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
              hitSlop={10}
            >
              <Text style={styles.pickerHeaderBtn}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calendarWeekRow}>
            {[
              t('petOwnerPlaceholders.calendar.weekdays.sundayShort'),
              t('petOwnerPlaceholders.calendar.weekdays.mondayShort'),
              t('petOwnerPlaceholders.calendar.weekdays.tuesdayShort'),
              t('petOwnerPlaceholders.calendar.weekdays.wednesdayShort'),
              t('petOwnerPlaceholders.calendar.weekdays.thursdayShort'),
              t('petOwnerPlaceholders.calendar.weekdays.fridayShort'),
              t('petOwnerPlaceholders.calendar.weekdays.saturdayShort'),
            ].map((w) => (
              <Text key={w} style={styles.calendarWeekLabel}>
                {w}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {days.map((cell, idx) => {
              if (!cell) return <View key={`e-${idx}`} style={styles.calendarCell} />;
              const isSelected = cell.iso === selectedIso;
              return (
                <TouchableOpacity
                  key={cell.iso}
                  style={[
                    styles.calendarCell,
                    isSelected && styles.calendarCellSelected,
                    cell.disabled && styles.calendarCellDisabled,
                  ]}
                  disabled={cell.disabled}
                  onPress={() => onSelect(cell.iso)}
                >
                  <Text
                    style={[
                      styles.calendarCellText,
                      isSelected && styles.calendarCellTextSelected,
                      cell.disabled && styles.calendarCellTextDisabled,
                    ]}
                  >
                    {cell.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Button title={t('common.done')} variant="outline" onPress={onClose} style={styles.pickerDoneBtn} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function TimePickerModal({
  visible,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  value: string;
  onSelect: (time24: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const initial = value ? to12Hour(value) : { hour: '9', minute: '00', period: 'AM' as const };
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initial.period);

  useEffect(() => {
    if (!visible) return;
    const next = value ? to12Hour(value) : { hour: '9', minute: '00', period: 'AM' as const };
    setHour(next.hour);
    setMinute(next.minute);
    setPeriod(next.period);
  }, [visible, value]);

  const minutes = useMemo(
    () => Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')),
    []
  );
  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => String(i + 1)), []);
  const selected24 = useMemo(() => to24Hour(hour, minute, period), [hour, minute, period]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.pickerOverlay} onPress={onClose}>
        <Pressable style={styles.timeModal} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.timeModalTitle}>{t('petOwnerPlaceholders.timePicker.title')}</Text>

          <View style={styles.timePickerRow}>
            <View style={styles.timePickerCol}>
              <Text style={styles.timePickerLabel}>{t('petOwnerPlaceholders.timePicker.hour')}</Text>
              <ScrollView style={styles.timePickerScroll} nestedScrollEnabled>
                {hours.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.timePickerOption, hour === h && styles.timePickerOptionActive]}
                    onPress={() => setHour(h)}
                  >
                    <Text
                      style={[styles.timePickerOptionText, hour === h && styles.timePickerOptionTextActive]}
                    >
                      {h}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.timeSeparator}>:</Text>

            <View style={styles.timePickerCol}>
              <Text style={styles.timePickerLabel}>{t('petOwnerPlaceholders.timePicker.minute')}</Text>
              <ScrollView style={styles.timePickerScroll} nestedScrollEnabled>
                {minutes.map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.timePickerOption, minute === m && styles.timePickerOptionActive]}
                    onPress={() => setMinute(m)}
                  >
                    <Text
                      style={[styles.timePickerOptionText, minute === m && styles.timePickerOptionTextActive]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.timePickerCol}>
              <Text style={styles.timePickerLabel}>{t('petOwnerPlaceholders.timePicker.amPm')}</Text>
              <ScrollView style={styles.timePickerScroll} nestedScrollEnabled>
                {(['AM', 'PM'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.timePickerOption, period === p && styles.timePickerOptionActive]}
                    onPress={() => setPeriod(p)}
                  >
                    <Text
                      style={[styles.timePickerOptionText, period === p && styles.timePickerOptionTextActive]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <Text style={styles.timePickerSelected}>{t('petOwnerPlaceholders.timePicker.selected', { value: selected24 })}</Text>

          <View style={styles.modalActionsRow}>
            <Button title={t('common.cancel')} variant="outline" onPress={onClose} style={styles.modalActionBtn} />
            <Button
              title={t('petOwnerPlaceholders.timePicker.select')}
              onPress={() => {
                onSelect(selected24);
                onClose();
              }}
              style={styles.modalActionBtn}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function PetOwnerRequestRescheduleScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RequestRoute>();
  const appointmentIdFromParams = route.params?.appointmentId;
  const { t } = useTranslation();

  const eligibleQuery = useEligibleRescheduleAppointments();
  const createRequest = useCreateRescheduleRequest();

  const eligibleAppointments = useMemo(
    () => normalizeEligibleAppointments(eligibleQuery.data),
    [eligibleQuery.data]
  );

  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [reason, setReason] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  useEffect(() => {
    if (appointmentIdFromParams) setSelectedAppointmentId(String(appointmentIdFromParams));
  }, [appointmentIdFromParams]);

  const submit = async () => {
    if (!selectedAppointmentId) {
      Toast.show({ type: 'error', text1: t('petOwnerPlaceholders.requestReschedule.toasts.selectAppointment') });
      return;
    }
    if (String(reason || '').trim().length < 10) {
      Toast.show({ type: 'error', text1: t('petOwnerPlaceholders.requestReschedule.toasts.reasonMinChars', { count: 10 }) });
      return;
    }

    const payload = {
      appointmentId: selectedAppointmentId,
      reason: String(reason).trim(),
      ...(preferredDate ? { preferredDate: preferredDate.trim() } : {}),
      ...(preferredTime ? { preferredTime: preferredTime.trim() } : {}),
    };

    try {
      await createRequest.mutateAsync(payload);
      Toast.show({ type: 'success', text1: t('petOwnerPlaceholders.requestReschedule.toasts.submitted') });
      navigation.navigate('PetOwnerRescheduleRequests');
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err, t('petOwnerPlaceholders.requestReschedule.errors.submitFailed')) });
    }
  };

  return (
    <ScreenContainer scroll padded>
      <Card>
        <Text style={styles.title}>{t('petOwnerPlaceholders.requestReschedule.title')}</Text>
        <Text style={styles.subtitle}>{t('petOwnerPlaceholders.requestReschedule.subtitle')}</Text>

        {eligibleQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.centerText}>{t('petOwnerPlaceholders.requestReschedule.loadingEligible')}</Text>
          </View>
        ) : eligibleQuery.isError ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{getErrorMessage(eligibleQuery.error, t('petOwnerPlaceholders.requestReschedule.errors.loadEligibleFailed'))}</Text>
          </View>
        ) : eligibleAppointments.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.centerText}>{t('petOwnerPlaceholders.requestReschedule.empty')}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>{t('petOwnerPlaceholders.requestReschedule.fields.selectAppointment')}</Text>
            <View style={styles.list}>
              {eligibleAppointments.map((item) => {
                const vet = item.veterinarianId as { name?: string; fullName?: string; email?: string } | string | undefined;
                const vetName =
                  typeof vet === 'string'
                    ? t('common.veterinarian')
                    : vet?.name || vet?.fullName || vet?.email || t('common.veterinarian');
                const label = `${vetName} - ${formatDateTime(item.appointmentDate, item.appointmentTime)}`;
                const selected = String(selectedAppointmentId) === String(item._id);
                return (
                  <TouchableOpacity
                    key={item._id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedAppointmentId(String(item._id))}
                    style={[styles.pickRow, selected && styles.pickRowSelected]}
                  >
                    <View style={styles.pickRowTextWrap}>
                      <Text style={styles.pickRowTitle}>{label}</Text>
                      {item.appointmentNumber ? (
                        <Text style={styles.pickRowMeta}>
                          {t('petOwnerPlaceholders.requestReschedule.labels.appointmentNumber', { value: item.appointmentNumber })}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[styles.pickRowCheck, selected && styles.pickRowCheckSelected]}>
                      {selected ? '✓' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>{t('petOwnerPlaceholders.requestReschedule.fields.preferredDateOptional')}</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.pickerField}
              onPress={() => setShowDateModal(true)}
            >
              <Text style={[styles.pickerFieldText, !preferredDate && styles.pickerFieldPlaceholder]}>
                {preferredDate || t('petOwnerPlaceholders.requestReschedule.placeholders.selectDate')}
              </Text>
              <Text style={styles.pickerIcon}>📅</Text>
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>{t('petOwnerPlaceholders.requestReschedule.fields.preferredTimeOptional')}</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.pickerField}
              onPress={() => setShowTimeModal(true)}
            >
              <Text style={[styles.pickerFieldText, !preferredTime && styles.pickerFieldPlaceholder]}>
                {preferredTime || t('petOwnerPlaceholders.requestReschedule.placeholders.selectTime')}
              </Text>
              <Text style={styles.pickerIcon}>🕒</Text>
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>{t('petOwnerPlaceholders.requestReschedule.fields.reason')}</Text>
            <TextInput
              style={styles.textArea}
              placeholder={t('petOwnerPlaceholders.requestReschedule.placeholders.reason')}
              placeholderTextColor={colors.textLight}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
            />
            <Text style={styles.counter}>{String(reason || '').length}/500</Text>

            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                {t('petOwnerPlaceholders.requestReschedule.hint.feeAfterApproval')}
              </Text>
            </View>

            <Button
              title={createRequest.isPending ? t('petOwnerPlaceholders.requestReschedule.actions.submitting') : t('petOwnerPlaceholders.requestReschedule.actions.submit')}
              onPress={submit}
              disabled={createRequest.isPending}
            />
          </>
        )}
      </Card>

      <CalendarModal
        visible={showDateModal}
        value={preferredDate}
        minDate={toISODate(new Date())}
        onSelect={(iso) => {
          setPreferredDate(iso);
        }}
        onClose={() => setShowDateModal(false)}
      />

      <TimePickerModal
        visible={showTimeModal}
        value={preferredTime}
        onSelect={(time24) => setPreferredTime(time24)}
        onClose={() => setShowTimeModal(false)}
      />
    </ScreenContainer>
  );
}

export function PetOwnerRescheduleRequestsScreen() {
  const navigation = useNavigation<any>();
  const requestsQuery = useRescheduleRequests();
  const payFee = usePayRescheduleFee();
  const { t } = useTranslation();

  const [selected, setSelected] = useState<RescheduleRequest | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);

  const requests = useMemo(
    () => normalizeRescheduleRequests(requestsQuery.data),
    [requestsQuery.data]
  );

  const openPay = (r: RescheduleRequest) => {
    setSelected(r);
    setShowPayModal(true);
  };

  const confirmPay = async () => {
    if (!selected?._id) return;
    try {
      await payFee.mutateAsync({ id: selected._id, paymentMethod: 'DUMMY' });
      Toast.show({ type: 'success', text1: t('petOwnerPlaceholders.rescheduleRequests.toasts.paid') });
      setShowPayModal(false);
      setSelected(null);
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err, t('petOwnerPlaceholders.rescheduleRequests.errors.paymentFailed')) });
    }
  };

  const openNewAppointment = (r: RescheduleRequest) => {
    const newApt = r.newAppointmentId as { _id?: string } | string | null | undefined;
    const id = typeof newApt === 'string' ? newApt : newApt?._id;
    if (!id) return;
    navigation.navigate('PetOwnerAppointmentDetails', { appointmentId: String(id) });
  };

  return (
    <ScreenContainer padded>
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t('petOwnerPlaceholders.rescheduleRequests.title')}</Text>
            <Text style={styles.subtitle}>{t('petOwnerPlaceholders.rescheduleRequests.subtitle')}</Text>
          </View>
          <Button
            title={t('petOwnerPlaceholders.rescheduleRequests.actions.request')}
            variant="outline"
            onPress={() => navigation.navigate('PetOwnerRequestReschedule')}
            style={styles.headerBtn}
          />
        </View>
      </Card>

      {requestsQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centerText}>{t('petOwnerPlaceholders.rescheduleRequests.loading')}</Text>
        </View>
      ) : requestsQuery.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{getErrorMessage(requestsQuery.error, t('petOwnerPlaceholders.rescheduleRequests.errors.loadFailed'))}</Text>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.centerText}>{t('petOwnerPlaceholders.rescheduleRequests.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const s = String(item.status || '').toUpperCase();
            const badge = statusBadgeConfig(s);
            const original = item.appointmentId as RescheduleRequest['appointmentId'] | undefined;
            const origObj = typeof original === 'string' ? null : original;
            const newApt = item.newAppointmentId as RescheduleRequest['newAppointmentId'];
            const newObj = typeof newApt === 'string' ? null : newApt;
            const newId = typeof newApt === 'string' ? newApt : newObj?._id;

            const canPay =
              s === 'APPROVED' &&
              !!newObj &&
              String(newObj?.paymentStatus || '').toUpperCase() !== 'PAID';

            return (
              <Card style={styles.requestCard}>
                <View style={styles.requestTopRow}>
                  <Text style={styles.requestTitle}>{t('petOwnerPlaceholders.rescheduleRequests.labels.original')}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusText, { color: badge.fg }]}>{t(badge.labelKey)}</Text>
                  </View>
                </View>
                <Text style={styles.requestValue}>
                  {formatDateTime(origObj?.appointmentDate, origObj?.appointmentTime)}
                </Text>
                {origObj?.appointmentNumber ? (
                  <Text style={styles.metaText}>{origObj.appointmentNumber}</Text>
                ) : null}

                <View style={styles.rowSplit}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.requestTitle}>{t('petOwnerPlaceholders.rescheduleRequests.labels.fee')}</Text>
                    <Text style={styles.requestValue}>
                      {item.rescheduleFee !== null && item.rescheduleFee !== undefined
                        ? `€${Number(item.rescheduleFee).toFixed(2)}`
                        : t('common.na')}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.requestTitle}>{t('petOwnerPlaceholders.rescheduleRequests.labels.newAppointment')}</Text>
                    <Text style={styles.requestValue}>
                      {newObj
                        ? formatDateTime(newObj?.appointmentDate, newObj?.appointmentTime)
                        : t('common.na')}
                    </Text>
                  </View>
                </View>

                {item.rejectionReason && s === 'REJECTED' ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => Toast.show({ type: 'info', text1: String(item.rejectionReason) })}
                    style={styles.inlineLink}
                  >
                    <Text style={styles.inlineLinkText}>{t('petOwnerPlaceholders.rescheduleRequests.actions.viewRejectionReason')}</Text>
                  </TouchableOpacity>
                ) : null}

                <View style={styles.actionsRow}>
                  {newId ? (
                    <Button
                      title={t('common.view')}
                      variant="outline"
                      onPress={() => openNewAppointment(item)}
                      style={styles.actionBtn}
                    />
                  ) : null}
                  {canPay ? (
                    <Button
                      title={payFee.isPending ? t('petOwnerPlaceholders.rescheduleRequests.actions.processing') : t('petOwnerPlaceholders.rescheduleRequests.actions.payFee')}
                      onPress={() => openPay(item)}
                      disabled={payFee.isPending}
                      style={styles.actionBtn}
                    />
                  ) : null}
                </View>
              </Card>
            );
          }}
        />
      )}

      <Modal visible={showPayModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('petOwnerPlaceholders.rescheduleRequests.payModal.title')}</Text>
            <Text style={styles.modalText}>
              {t('petOwnerPlaceholders.rescheduleRequests.payModal.feeLabel')}{' '}
              {selected?.rescheduleFee !== null && selected?.rescheduleFee !== undefined
                ? `€${Number(selected.rescheduleFee).toFixed(2)}`
                : t('common.na')}
            </Text>
            <Text style={styles.modalSubText}>{t('petOwnerPlaceholders.rescheduleRequests.payModal.hint')}</Text>
            <View style={styles.modalActions}>
              <Button
                title={t('common.cancel')}
                variant="outline"
                onPress={() => {
                  setShowPayModal(false);
                  setSelected(null);
                }}
                style={styles.modalBtn}
              />
              <Button
                title={payFee.isPending ? t('petOwnerPlaceholders.rescheduleRequests.actions.processing') : t('petOwnerPlaceholders.rescheduleRequests.payModal.confirm')}
                onPress={confirmPay}
                style={styles.modalBtn}
                disabled={payFee.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
export function PetOwnerPrescriptionScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('petOwnerPlaceholders.simpleScreens.prescription.title')} subtitle={t('petOwnerPlaceholders.simpleScreens.prescription.subtitle')} />;
}
export function PetOwnerVideoCallScreen() {
  return <VideoCallScreen />;
}
export function PetOwnerSearchScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('petOwnerPlaceholders.simpleScreens.search.title')} subtitle={t('petOwnerPlaceholders.simpleScreens.search.subtitle')} />;
}
export function PetOwnerVetProfileScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('petOwnerPlaceholders.simpleScreens.vetProfile.title')} subtitle={t('petOwnerPlaceholders.simpleScreens.vetProfile.subtitle')} />;
}
export function PetOwnerBookingScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('petOwnerPlaceholders.simpleScreens.booking.title')} subtitle={t('petOwnerPlaceholders.simpleScreens.booking.subtitle')} />;
}
export function PetOwnerCartScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('petOwnerPlaceholders.simpleScreens.cart.title')} subtitle={t('petOwnerPlaceholders.simpleScreens.cart.subtitle')} />;
}
export function PetOwnerCheckoutScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('petOwnerPlaceholders.simpleScreens.checkout.title')} subtitle={t('petOwnerPlaceholders.simpleScreens.checkout.subtitle')} />;
}
export function PetOwnerPaymentSuccessScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('petOwnerPlaceholders.simpleScreens.paymentSuccess.title')} subtitle={t('petOwnerPlaceholders.simpleScreens.paymentSuccess.subtitle')} />;
}
export function PetOwnerClinicNavigationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<PetOwnerStackParamList, 'PetOwnerClinicNavigation'>>();
  const clinic = route.params?.clinic ?? null;
  const { t } = useTranslation();

  const clinicLat = clinic?.lat != null ? Number(clinic.lat) : NaN;
  const clinicLng = clinic?.lng != null ? Number(clinic.lng) : NaN;

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationPermission(false);
          return;
        }
        setLocationPermission(true);
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      } catch {
        setLocationPermission(false);
      }
    })();
  }, []);

  const routeQuery = useRouteInfo(
    {
      fromLat: userLocation?.lat,
      fromLng: userLocation?.lng,
      toLat: Number.isFinite(clinicLat) ? clinicLat : null,
      toLng: Number.isFinite(clinicLng) ? clinicLng : null,
    },
    { enabled: !!userLocation && Number.isFinite(clinicLat) && Number.isFinite(clinicLng) }
  );

  const routeInfo = useMemo(() => {
    const outer = (routeQuery.data as { data?: unknown })?.data ?? routeQuery.data;
    const payload = (outer as { data?: unknown })?.data ?? outer;
    return (payload as Record<string, unknown> | null) ?? null;
  }, [routeQuery.data]);

  const distance = routeInfo?.distance as number | undefined;
  const estimatedTime = routeInfo?.estimatedTime as number | undefined;
  const steps = (routeInfo?.routeSteps as { instruction?: string; distance?: number }[] | undefined) ?? [];

  const mapHTML = useMemo(() => {
    const clinicName = String(clinic?.name ?? t('petOwnerPlaceholders.clinicNavigation.defaults.clinic')).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const dest = Number.isFinite(clinicLat) && Number.isFinite(clinicLng) ? { lat: clinicLat, lng: clinicLng } : null;
    const u = userLocation;
    const yourLocationLabel = String(t('petOwnerPlaceholders.clinicNavigation.map.yourLocation')).replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const userLocation = ${u ? JSON.stringify(u) : 'null'};
    const clinic = ${dest ? JSON.stringify(dest) : 'null'};

    const center = clinic || userLocation || { lat: 40.7128, lng: -74.006 };
    const map = L.map('map').setView([center.lat, center.lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    const markers = [];

    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: '<div style="background-color:#4285F4;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });
      const m = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map).bindPopup('${yourLocationLabel}');
      markers.push(m);
    }

    if (clinic) {
      const clinicIcon = L.divIcon({
        className: 'custom-clinic-marker',
        html: '<div style="background-color:#0d6efd;width:38px;height:38px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:20px;">🏥</div>',
        iconSize: [38, 38],
        iconAnchor: [19, 38]
      });
      const m = L.marker([clinic.lat, clinic.lng], { icon: clinicIcon }).addTo(map).bindPopup('${clinicName}');
      markers.push(m);
    }

    if (userLocation && clinic) {
      L.polyline([
        [userLocation.lat, userLocation.lng],
        [clinic.lat, clinic.lng]
      ], { color: '#2D6A4F', weight: 4, opacity: 0.8 }).addTo(map);
    }

    if (markers.length > 0) {
      try {
        if (markers.length === 1) {
          const pos = markers[0].getLatLng();
          map.setView([pos.lat, pos.lng], 14);
        } else {
          const group = new L.FeatureGroup(markers);
          map.fitBounds(group.getBounds().pad(0.2));
        }
      } catch {
        // ignore
      }
    }
  </script>
</body>
</html>
    `;
  }, [clinic?.name, clinicLat, clinicLng, t, userLocation]);

  if (!clinic || !Number.isFinite(clinicLat) || !Number.isFinite(clinicLng)) {
    return (
      <ScreenContainer padded>
        <Card>
          <Text style={styles.modalTitle}>{t('petOwnerPlaceholders.clinicNavigation.missing.title')}</Text>
          <Text style={styles.modalText}>{t('petOwnerPlaceholders.clinicNavigation.missing.message')}</Text>
          <Button title={t('common.back')} onPress={() => navigation.goBack()} style={{ marginTop: spacing.md }} />
        </Card>
      </ScreenContainer>
    );
  }

  const openGoogleMaps = async () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${clinicLat},${clinicLng}`;
    try {
      await Linking.openURL(url);
    } catch {
      Toast.show({ type: 'error', text1: t('petOwnerPlaceholders.clinicNavigation.errors.couldNotOpenMaps') });
    }
  };

  const callClinic = async () => {
    if (!clinic.phone) return;
    try {
      await Linking.openURL(`tel:${clinic.phone}`);
    } catch {
      Toast.show({ type: 'error', text1: t('petOwnerPlaceholders.clinicNavigation.errors.couldNotStartCall') });
    }
  };

  return (
    <ScreenContainer padded scroll>
      <Card style={{ marginBottom: spacing.md }}>
        <Text style={styles.modalTitle}>{clinic.name || t('petOwnerPlaceholders.clinicNavigation.defaults.clinic')}</Text>
        <Text style={styles.metaText}>{clinic.address || t('common.na')}</Text>
        {clinic.phone ? <Text style={styles.metaText}>{clinic.phone}</Text> : null}
        {!locationPermission ? (
          <Text style={[styles.metaText, { color: colors.warning }]}>{t('petOwnerPlaceholders.clinicNavigation.locationDisabled')}</Text>
        ) : null}
      </Card>

      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: spacing.md }}>
        <View style={{ height: 260 }}>
          <WebView source={{ html: mapHTML }} style={{ flex: 1 }} />
        </View>
      </Card>

      <Card style={{ marginBottom: spacing.md }}>
        <Text style={styles.modalTitle}>{t('petOwnerPlaceholders.clinicNavigation.directions.title')}</Text>
        {routeQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.centerText}>{t('petOwnerPlaceholders.clinicNavigation.directions.calculating')}</Text>
          </View>
        ) : routeQuery.error ? (
          <Text style={styles.errorText}>{t('petOwnerPlaceholders.clinicNavigation.errors.routeInfoFailed')}</Text>
        ) : (
          <>
            <View style={styles.rowSplit}>
              <View style={{ flex: 1 }}>
                <Text style={styles.requestTitle}>{t('petOwnerPlaceholders.clinicNavigation.directions.distance')}</Text>
                <Text style={styles.requestValue}>{distance != null ? `${Number(distance).toFixed(1)} km` : t('common.na')}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.requestTitle}>{t('petOwnerPlaceholders.clinicNavigation.directions.eta')}</Text>
                <Text style={styles.requestValue}>{estimatedTime != null ? `${estimatedTime} min` : t('common.na')}</Text>
              </View>
            </View>
            {Array.isArray(steps) && steps.length > 0 ? (
              <View style={{ marginTop: spacing.md }}>
                {steps.map((s, idx) => (
                  <View key={idx} style={{ marginBottom: spacing.sm }}>
                    <Text style={styles.pickRowTitle}>
                      {idx + 1}. {s.instruction || t('petOwnerPlaceholders.clinicNavigation.directions.continue')}
                    </Text>
                    {s.distance != null ? (
                      <Text style={styles.metaText}>{Number(s.distance).toFixed(1)} km</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.metaText}>{t('petOwnerPlaceholders.clinicNavigation.directions.openInGoogleMaps')}</Text>
            )}
          </>
        )}

        <View style={styles.actionsRow}>
          <Button title={t('petOwnerPlaceholders.clinicNavigation.actions.getDirections')} onPress={openGoogleMaps} style={styles.actionBtn} />
          {clinic.phone ? (
            <Button title={t('petOwnerPlaceholders.clinicNavigation.actions.call')} variant="outline" onPress={callClinic} style={styles.actionBtn} />
          ) : null}
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2 },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  sectionLabel: { ...typography.label, marginTop: spacing.md, marginBottom: spacing.xs },
  center: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  centerText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
  errorText: { ...typography.bodySmall, color: colors.error, textAlign: 'center' },
  pickerField: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  pickerFieldText: { ...typography.body },
  pickerFieldPlaceholder: { color: colors.textLight },
  pickerIcon: { fontSize: 18 },
  list: { paddingTop: spacing.sm, paddingBottom: spacing.md },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  },
  pickRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '20',
  },
  pickRowTextWrap: { flex: 1 },
  pickRowTitle: { ...typography.body, fontWeight: '600' },
  pickRowMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  pickRowCheck: { width: 24, textAlign: 'right', ...typography.h3, color: colors.textSecondary },
  pickRowCheckSelected: { color: colors.primary },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.background,
    minHeight: 96,
    ...typography.body,
    textAlignVertical: 'top',
  },
  counter: { ...typography.caption, color: colors.textLight, marginTop: spacing.xs },
  warningBox: { marginTop: spacing.md, padding: spacing.md, borderRadius: 12, backgroundColor: colors.warning + '15' },
  warningText: { ...typography.bodySmall, color: colors.textSecondary },
  headerCard: { marginBottom: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerBtn: { paddingHorizontal: spacing.md, minHeight: 40 },
  requestCard: { marginBottom: spacing.sm },
  requestTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  requestTitle: { ...typography.caption, color: colors.textSecondary },
  requestValue: { ...typography.body, fontWeight: '600', marginTop: 2 },
  metaText: { ...typography.caption, color: colors.textLight, marginTop: 2 },
  rowSplit: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  statusText: { ...typography.label },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  actionBtn: { flex: 1, minWidth: 120 },
  inlineLink: { marginTop: spacing.sm },
  inlineLinkText: { ...typography.label, color: colors.primary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  modalBox: { backgroundColor: colors.background, borderRadius: 16, padding: spacing.lg },
  modalTitle: { ...typography.h3, marginBottom: spacing.sm },
  modalText: { ...typography.bodySmall },
  modalSubText: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  modalBtn: { flex: 1 },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  pickerModal: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.lg,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  pickerHeaderTitle: { ...typography.h3 },
  pickerHeaderBtn: { ...typography.h2, color: colors.primary, paddingHorizontal: 8 },
  pickerDoneBtn: { marginTop: spacing.md },
  calendarWeekRow: { flexDirection: 'row', marginBottom: spacing.xs },
  calendarWeekLabel: {
    width: '14.2857%',
    textAlign: 'center',
    ...typography.caption,
    color: colors.textSecondary,
  },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  calendarCellSelected: { backgroundColor: colors.primaryLight + '55' },
  calendarCellDisabled: { opacity: 0.4 },
  calendarCellText: { ...typography.bodySmall },
  calendarCellTextSelected: { color: colors.primary, fontWeight: '700' },
  calendarCellTextDisabled: { color: colors.textSecondary },
  timeModal: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing.lg,
  },
  timeModalTitle: { ...typography.h3, marginBottom: spacing.sm },
  timePickerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timePickerCol: { flex: 1 },
  timePickerLabel: { ...typography.caption, color: colors.textSecondary, marginBottom: 4, textAlign: 'center' },
  timePickerScroll: { maxHeight: 220, borderWidth: 1, borderColor: colors.border, borderRadius: 12 },
  timePickerOption: { paddingVertical: spacing.sm, alignItems: 'center' },
  timePickerOptionActive: { backgroundColor: colors.primaryLight + '35' },
  timePickerOptionText: { ...typography.body },
  timePickerOptionTextActive: { color: colors.primary, fontWeight: '700' },
  timeSeparator: { ...typography.h3, marginTop: 22 },
  timePickerSelected: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' },
  modalActionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  modalActionBtn: { flex: 1 },
});
