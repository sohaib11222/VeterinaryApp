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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
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
import { useCreateRescheduleRequest, usePayRescheduleFee } from '../../mutations/scheduleMutations';
import { getErrorMessage } from '../../utils/errorUtils';

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
  if (!date) return '—';
  const d = new Date(date);
  const dateStr = Number.isNaN(d.getTime()) ? String(date) : d.toLocaleDateString();
  return `${dateStr} ${time || ''}`.trim();
}

function statusBadgeConfig(status?: string) {
  const s = String(status || '').toUpperCase();
  if (s === 'APPROVED') return { bg: colors.success + '25', fg: colors.success, label: 'APPROVED' };
  if (s === 'PENDING') return { bg: colors.warning + '25', fg: colors.warning, label: 'PENDING' };
  if (s === 'REJECTED') return { bg: colors.error + '25', fg: colors.error, label: 'REJECTED' };
  if (s === 'CANCELLED') return { bg: colors.textLight + '25', fg: colors.textSecondary, label: s || '—' };
  return { bg: colors.textLight + '25', fg: colors.textSecondary, label: s || '—' };
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
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w) => (
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

          <Button title="Done" variant="outline" onPress={onClose} style={styles.pickerDoneBtn} />
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
          <Text style={styles.timeModalTitle}>Select time</Text>

          <View style={styles.timePickerRow}>
            <View style={styles.timePickerCol}>
              <Text style={styles.timePickerLabel}>Hour</Text>
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
              <Text style={styles.timePickerLabel}>Minute</Text>
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
              <Text style={styles.timePickerLabel}>AM/PM</Text>
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

          <Text style={styles.timePickerSelected}>Selected: {selected24}</Text>

          <View style={styles.modalActionsRow}>
            <Button title="Cancel" variant="outline" onPress={onClose} style={styles.modalActionBtn} />
            <Button
              title="Select"
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
      Toast.show({ type: 'error', text1: 'Please select an appointment' });
      return;
    }
    if (String(reason || '').trim().length < 10) {
      Toast.show({ type: 'error', text1: 'Reason must be at least 10 characters' });
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
      Toast.show({ type: 'success', text1: 'Reschedule request submitted successfully' });
      navigation.navigate('PetOwnerRescheduleRequests');
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err, 'Failed to submit reschedule request') });
    }
  };

  return (
    <ScreenContainer scroll padded>
      <Card>
        <Text style={styles.title}>Request Reschedule</Text>
        <Text style={styles.subtitle}>Select a missed online appointment and submit your request.</Text>

        {eligibleQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.centerText}>Loading eligible appointments...</Text>
          </View>
        ) : eligibleQuery.isError ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{getErrorMessage(eligibleQuery.error, 'Failed to load eligible appointments')}</Text>
          </View>
        ) : eligibleAppointments.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.centerText}>No appointments are eligible for reschedule.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Select missed appointment *</Text>
            <View style={styles.list}>
              {eligibleAppointments.map((item) => {
                const vet = item.veterinarianId as { name?: string; fullName?: string; email?: string } | string | undefined;
                const vetName =
                  typeof vet === 'string'
                    ? 'Veterinarian'
                    : vet?.name || vet?.fullName || vet?.email || 'Veterinarian';
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
                        <Text style={styles.pickRowMeta}>Appointment: {item.appointmentNumber}</Text>
                      ) : null}
                    </View>
                    <Text style={[styles.pickRowCheck, selected && styles.pickRowCheckSelected]}>
                      {selected ? '✓' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Preferred new date (optional)</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.pickerField}
              onPress={() => setShowDateModal(true)}
            >
              <Text style={[styles.pickerFieldText, !preferredDate && styles.pickerFieldPlaceholder]}>
                {preferredDate || 'Select date'}
              </Text>
              <Text style={styles.pickerIcon}>📅</Text>
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>Preferred new time (optional)</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.pickerField}
              onPress={() => setShowTimeModal(true)}
            >
              <Text style={[styles.pickerFieldText, !preferredTime && styles.pickerFieldPlaceholder]}>
                {preferredTime || 'Select time'}
              </Text>
              <Text style={styles.pickerIcon}>🕒</Text>
            </TouchableOpacity>

            <Text style={styles.sectionLabel}>Reason *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Explain why you missed the appointment (min 10 characters)"
              placeholderTextColor={colors.textLight}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
            />
            <Text style={styles.counter}>{String(reason || '').length}/500</Text>

            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                After approval, you may need to pay a reschedule fee to confirm the new appointment.
              </Text>
            </View>

            <Button
              title={createRequest.isPending ? 'Submitting...' : 'Submit Request'}
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
      Toast.show({ type: 'success', text1: 'Reschedule fee paid successfully. Appointment confirmed.' });
      setShowPayModal(false);
      setSelected(null);
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err, 'Payment failed') });
    }
  };

  const openNewAppointment = (r: RescheduleRequest) => {
    const newApt = r.newAppointmentId as { _id?: string } | string | null | undefined;
    const id = typeof newApt === 'string' ? newApt : newApt?._id;
    if (!id) return;
    try {
      navigation.navigate('PetOwnerAppointmentDetails', { appointmentId: String(id) });
    } catch {
      const stackNav = navigation.getParent();
      stackNav?.navigate('PetOwnerAppointmentDetails', { appointmentId: String(id) });
    }
  };

  return (
    <ScreenContainer padded>
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Reschedule Requests</Text>
            <Text style={styles.subtitle}>Track your requests and pay fees after approval.</Text>
          </View>
          <Button
            title="Request"
            variant="outline"
            onPress={() => navigation.navigate('PetOwnerRequestReschedule')}
            style={styles.headerBtn}
          />
        </View>
      </Card>

      {requestsQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centerText}>Loading requests...</Text>
        </View>
      ) : requestsQuery.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{getErrorMessage(requestsQuery.error, 'Failed to load requests')}</Text>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.centerText}>No reschedule requests found.</Text>
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

            const canPay =
              s === 'APPROVED' &&
              !!newObj &&
              String(newObj?.paymentStatus || '').toUpperCase() !== 'PAID';

            return (
              <Card style={styles.requestCard}>
                <View style={styles.requestTopRow}>
                  <Text style={styles.requestTitle}>Original</Text>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusText, { color: badge.fg }]}>{badge.label}</Text>
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
                    <Text style={styles.requestTitle}>Fee</Text>
                    <Text style={styles.requestValue}>
                      {item.rescheduleFee !== null && item.rescheduleFee !== undefined
                        ? `€${Number(item.rescheduleFee).toFixed(2)}`
                        : '—'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.requestTitle}>New appointment</Text>
                    <Text style={styles.requestValue}>
                      {newObj
                        ? formatDateTime(newObj?.appointmentDate, newObj?.appointmentTime)
                        : '—'}
                    </Text>
                  </View>
                </View>

                {item.rejectionReason && s === 'REJECTED' ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => Toast.show({ type: 'info', text1: String(item.rejectionReason) })}
                    style={styles.inlineLink}
                  >
                    <Text style={styles.inlineLinkText}>View rejection reason</Text>
                  </TouchableOpacity>
                ) : null}

                <View style={styles.actionsRow}>
                  {newObj ? (
                    <Button
                      title="View"
                      variant="outline"
                      onPress={() => openNewAppointment(item)}
                      style={styles.actionBtn}
                    />
                  ) : null}
                  {canPay ? (
                    <Button
                      title={payFee.isPending ? 'Processing...' : 'Pay Fee'}
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
            <Text style={styles.modalTitle}>Pay Reschedule Fee</Text>
            <Text style={styles.modalText}>
              Fee:{' '}
              {selected?.rescheduleFee !== null && selected?.rescheduleFee !== undefined
                ? `€${Number(selected.rescheduleFee).toFixed(2)}`
                : '—'}
            </Text>
            <Text style={styles.modalSubText}>Click confirm to proceed.</Text>
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setShowPayModal(false);
                  setSelected(null);
                }}
                style={styles.modalBtn}
              />
              <Button
                title={payFee.isPending ? 'Processing...' : 'Confirm Payment'}
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
  return <PlaceholderScreen title="Prescription" subtitle="View prescription from veterinarian" />;
}
export function PetOwnerVideoCallScreen() {
  return <PlaceholderScreen title="Video Call" subtitle="Join consultation" />;
}
export function PetOwnerSearchScreen() {
  return <PlaceholderScreen title="Find Veterinarian" subtitle="Search by location, specialty" />;
}
export function PetOwnerVetProfileScreen() {
  return <PlaceholderScreen title="Veterinarian Profile" subtitle="View profile and book" />;
}
export function PetOwnerBookingScreen() {
  return <PlaceholderScreen title="Book Appointment" subtitle="Select date, time, pet" />;
}
export function PetOwnerCartScreen() {
  return <PlaceholderScreen title="Cart" subtitle="Pet supply cart" />;
}
export function PetOwnerCheckoutScreen() {
  return <PlaceholderScreen title="Checkout" subtitle="Review and pay" />;
}
export function PetOwnerPaymentSuccessScreen() {
  return <PlaceholderScreen title="Payment Success" subtitle="Order confirmed" />;
}
export function PetOwnerClinicNavigationScreen() {
  return <PlaceholderScreen title="Clinic Navigation" subtitle="Directions to clinic" />;
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
