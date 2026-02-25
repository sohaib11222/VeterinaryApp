import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useRescheduleRequests } from '../../queries/scheduleQueries';
import { useApproveRescheduleRequest, useRejectRescheduleRequest } from '../../mutations/scheduleMutations';
import { getErrorMessage } from '../../utils/errorUtils';

type RescheduleRequest = {
  _id: string;
  status?: string;
  reason?: string;
  preferredDate?: string | null;
  preferredTime?: string | null;
  rescheduleFeePercentage?: number | null;
  petOwnerId?: { name?: string; fullName?: string; email?: string } | string;
  appointmentId?: {
    appointmentDate?: string;
    appointmentTime?: string;
    appointmentNumber?: string;
  } | string;
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
      rescheduleFeePercentage: (r.rescheduleFeePercentage as number) ?? null,
      petOwnerId: (r.petOwnerId as RescheduleRequest['petOwnerId']) || undefined,
      appointmentId: (r.appointmentId as RescheduleRequest['appointmentId']) || undefined,
    }))
    .filter((r) => !!r._id);
}

function formatDateTime(date?: string, time?: string) {
  if (!date) return '—';
  const d = new Date(date);
  const dateStr = Number.isNaN(d.getTime()) ? String(date) : d.toLocaleDateString();
  return `${dateStr} ${time || ''}`.trim();
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

  React.useEffect(() => {
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

  React.useEffect(() => {
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

export function VetRescheduleRequestsScreen() {
  const requestsQuery = useRescheduleRequests({ status: 'PENDING' });
  const approve = useApproveRescheduleRequest();
  const reject = useRejectRescheduleRequest();

  const requests = useMemo(
    () => normalizeRescheduleRequests(requestsQuery.data),
    [requestsQuery.data]
  );

  const [selected, setSelected] = useState<RescheduleRequest | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [feePercentage, setFeePercentage] = useState('50');
  const [feeFixed, setFeeFixed] = useState('');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  const openApprove = (r: RescheduleRequest) => {
    setSelected(r);
    const pd = r?.preferredDate ? new Date(r.preferredDate) : null;
    setNewDate(pd && !Number.isNaN(pd.getTime()) ? pd.toISOString().slice(0, 10) : '');
    setNewTime(r?.preferredTime || '');
    setFeePercentage(
      r?.rescheduleFeePercentage !== null && r?.rescheduleFeePercentage !== undefined
        ? String(r.rescheduleFeePercentage)
        : '50'
    );
    setFeeFixed('');
    setNotes('');
    setShowApproveModal(true);
  };

  const doApprove = async () => {
    if (!selected?._id) return;
    if (!newDate || !newTime) {
      Toast.show({ type: 'error', text1: 'Please select new date and time' });
      return;
    }
    const payload: Record<string, unknown> = {
      requestedDate: newDate,
      requestedTime: newTime,
      rescheduleFeePercentage: Number(feePercentage) || 0,
      ...(feeFixed ? { rescheduleFee: Number(feeFixed) } : {}),
      ...(notes.trim() ? { veterinarianNotes: notes.trim() } : {}),
    };

    try {
      await approve.mutateAsync({ id: selected._id, data: payload });
      Toast.show({ type: 'success', text1: 'Reschedule request approved' });
      setShowApproveModal(false);
      setSelected(null);
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err, 'Failed to approve request') });
    }
  };

  const doReject = async () => {
    if (!selected?._id) return;
    if (String(rejectionReason || '').trim().length < 10) {
      Toast.show({ type: 'error', text1: 'Rejection reason must be at least 10 characters' });
      return;
    }
    try {
      await reject.mutateAsync({ id: selected._id, reason: String(rejectionReason).trim() });
      Toast.show({ type: 'success', text1: 'Reschedule request rejected' });
      setShowRejectModal(false);
      setSelected(null);
      setRejectionReason('');
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err, 'Failed to reject request') });
    }
  };

  return (
    <ScreenContainer padded>
      {requestsQuery.isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : requestsQuery.isError ? (
        <Card>
          <Text style={styles.errorText}>{getErrorMessage(requestsQuery.error, 'Failed to load requests')}</Text>
        </Card>
      ) : requests.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>No pending reschedule requests.</Text>
        </Card>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const owner = item?.petOwnerId as { name?: string; fullName?: string; email?: string } | string | undefined;
            const ownerName =
              typeof owner === 'string'
                ? 'Pet Owner'
                : owner?.name || owner?.fullName || owner?.email || 'Pet Owner';
            const original = item?.appointmentId as { appointmentDate?: string; appointmentTime?: string; appointmentNumber?: string } | string | undefined;
            const origObj = typeof original === 'string' ? null : original;
            const originalLabel = origObj
              ? formatDateTime(origObj.appointmentDate, origObj.appointmentTime)
              : '—';

            return (
              <Card style={styles.card}>
                <Text style={styles.heading}>Request from {ownerName}</Text>
                <Text style={styles.date}>Original: {originalLabel}</Text>
                {origObj?.appointmentNumber ? (
                  <Text style={styles.metaText}>{origObj.appointmentNumber}</Text>
                ) : null}
                <Text style={styles.reason}>{item?.reason || '—'}</Text>

                {item?.preferredDate ? (
                  <Text style={styles.date}>Preferred date: {formatDateTime(item.preferredDate, '')}</Text>
                ) : null}
                {item?.preferredTime ? (
                  <Text style={styles.date}>Preferred time: {item.preferredTime}</Text>
                ) : null}

                <View style={styles.actions}>
                  <Button
                    title="Approve"
                    onPress={() => openApprove(item)}
                    style={styles.btn}
                    disabled={approve.isPending}
                  />
                  <Button
                    title="Reject"
                    variant="outline"
                    onPress={() => {
                      setSelected(item);
                      setRejectionReason('');
                      setShowRejectModal(true);
                    }}
                    style={styles.btn}
                    disabled={reject.isPending}
                  />
                </View>
              </Card>
            );
          }}
        />
      )}

      <Modal visible={showApproveModal && !!selected} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Approve Reschedule Request</Text>

            <Text style={styles.pickerLabelText}>New Date *</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.pickerField}
              onPress={() => setShowDateModal(true)}
            >
              <Text style={[styles.pickerFieldText, !newDate && styles.pickerFieldPlaceholder]}>
                {newDate || 'Select date'}
              </Text>
              <Text style={styles.pickerIcon}>📅</Text>
            </TouchableOpacity>

            <Text style={styles.pickerLabelText}>New Time *</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.pickerField}
              onPress={() => setShowTimeModal(true)}
            >
              <Text style={[styles.pickerFieldText, !newTime && styles.pickerFieldPlaceholder]}>
                {newTime || 'Select time'}
              </Text>
              <Text style={styles.pickerIcon}>🕒</Text>
            </TouchableOpacity>
            <Input
              label="Fee Percentage"
              placeholder="50"
              value={feePercentage}
              onChangeText={(t) => {
                setFeePercentage(t);
                setFeeFixed('');
              }}
              keyboardType="numeric"
              autoCapitalize="none"
            />
            <Input
              label="Or Fixed Fee (optional)"
              placeholder=""
              value={feeFixed}
              onChangeText={setFeeFixed}
              keyboardType="numeric"
              autoCapitalize="none"
            />
            <Text style={styles.inputLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Enter notes..."
              placeholderTextColor={colors.textLight}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setShowApproveModal(false);
                  setSelected(null);
                }}
                style={styles.modalBtn}
                disabled={approve.isPending}
              />
              <Button
                title={approve.isPending ? 'Approving...' : 'Approve'}
                onPress={doApprove}
                style={styles.modalBtn}
                disabled={approve.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>

      <CalendarModal
        visible={showDateModal}
        value={newDate}
        minDate={toISODate(new Date())}
        onSelect={(iso) => setNewDate(iso)}
        onClose={() => setShowDateModal(false)}
      />

      <TimePickerModal
        visible={showTimeModal}
        value={newTime}
        onSelect={(t) => setNewTime(t)}
        onClose={() => setShowTimeModal(false)}
      />

      <Modal visible={showRejectModal && !!selected} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Reject Reschedule Request</Text>
            <Text style={styles.inputLabel}>Reason *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Enter rejection reason (min 10 characters)"
              placeholderTextColor={colors.textLight}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setShowRejectModal(false);
                  setSelected(null);
                }}
                style={styles.modalBtn}
                disabled={reject.isPending}
              />
              <Button
                title={reject.isPending ? 'Rejecting...' : 'Reject'}
                onPress={doReject}
                style={styles.modalBtn}
                disabled={reject.isPending}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xxl },
  loading: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  loadingText: { ...typography.bodySmall, color: colors.textSecondary },
  errorText: { ...typography.bodySmall, color: colors.error },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
  card: { marginBottom: spacing.sm },
  heading: { ...typography.body, fontWeight: '700' },
  date: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  metaText: { ...typography.caption, color: colors.textLight, marginTop: 2 },
  reason: { ...typography.bodySmall, marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  btn: { flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalBox: { backgroundColor: colors.background, borderRadius: 16, padding: spacing.lg },
  modalTitle: { ...typography.h3, marginBottom: spacing.sm },
  inputLabel: { ...typography.label, marginBottom: spacing.xs },
  pickerLabelText: { ...typography.label, marginBottom: spacing.xs, marginTop: spacing.sm },
  pickerField: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    marginBottom: spacing.xs,
  },
  pickerFieldText: { ...typography.body },
  pickerFieldPlaceholder: { color: colors.textLight },
  pickerIcon: { fontSize: 18 },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    ...typography.body,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: colors.background,
  },
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
