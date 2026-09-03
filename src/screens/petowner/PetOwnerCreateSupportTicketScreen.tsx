import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { SUPPORT_CATEGORIES, SUPPORT_PRIORITIES } from '../../constants/supportTickets';
import { useAppointments } from '../../queries/appointmentQueries';
import { useOrders } from '../../queries/orderQueries';
import { usePetOwnerPayments } from '../../queries/petOwnerQueries';
import { useCreateSupportTicket, useUploadSupportTicketAttachments } from '../../mutations/supportTicketMutations';
import { getErrorMessage } from '../../utils/errorUtils';

type PickedFile = { uri: string; name: string; type: string; size?: number };
type RelatedType = '' | 'APPOINTMENT' | 'ORDER' | 'TRANSACTION';

function unwrapList(response: unknown, keys: string[]) {
  const outer = (response as { data?: unknown })?.data ?? response;
  const data = (outer as { data?: unknown })?.data ?? outer as Record<string, unknown>;
  for (const key of keys) {
    const candidate = (data as Record<string, unknown>)?.[key];
    if (Array.isArray(candidate)) return candidate as Record<string, unknown>[];
  }
  return [] as Record<string, unknown>[];
}

function recordLabel(record: Record<string, unknown>) {
  const id = String(record.appointmentNumber ?? record.orderNumber ?? record.transactionNumber ?? record._id ?? record.id ?? 'Record');
  const status = String(record.status ?? record.paymentStatus ?? '').replace(/_/g, ' ');
  return status ? `${id} · ${status}` : id;
}

export function PetOwnerCreateSupportTicketScreen() {
  const navigation = useNavigation<any>();
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<string>('APPOINTMENT');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [relatedType, setRelatedType] = useState<RelatedType>('');
  const [relatedRecordId, setRelatedRecordId] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const appointments = useAppointments({ page: 1, limit: 100 });
  const orders = useOrders({ page: 1, limit: 100 });
  const payments = usePetOwnerPayments({ page: 1, limit: 100 });
  const createTicket = useCreateSupportTicket();
  const uploadAttachments = useUploadSupportTicketAttachments();
  const records = useMemo(() => relatedType === 'APPOINTMENT'
    ? unwrapList(appointments.data, ['appointments', 'items'])
    : relatedType === 'ORDER'
      ? unwrapList(orders.data, ['orders', 'items'])
      : relatedType === 'TRANSACTION'
        ? unwrapList(payments.data, ['transactions', 'payments', 'items'])
        : [], [appointments.data, orders.data, payments.data, relatedType]);

  const chooseFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const selected = (result.assets || []).map((file) => ({ uri: file.uri, name: file.name || 'attachment', type: file.mimeType || 'application/octet-stream', size: file.size }));
      const next = [...files, ...selected];
      if (next.length > 5) { Toast.show({ type: 'error', text1: 'You can attach up to 5 files.' }); return; }
      if (next.some((file) => (file.size || 0) > 25 * 1024 * 1024)) { Toast.show({ type: 'error', text1: 'Each attachment must be 25 MB or smaller.' }); return; }
      setFiles(next);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Unable to select files', text2: getErrorMessage(error, 'Please try again.') });
    }
  };

  const submit = async () => {
    if (subject.trim().length < 4) { Toast.show({ type: 'error', text1: 'Add a subject of at least 4 characters.' }); return; }
    if (description.trim().length < 10) { Toast.show({ type: 'error', text1: 'Please describe the issue in at least 10 characters.' }); return; }
    if (relatedType && !relatedRecordId) { Toast.show({ type: 'error', text1: 'Select the related record or choose no related record.' }); return; }
    try {
      let attachments: string[] = [];
      if (files.length) {
        const formData = new FormData();
        files.forEach((file) => formData.append('supportTicket', { uri: file.uri, name: file.name, type: file.type } as any));
        const upload: any = await uploadAttachments.mutateAsync(formData);
        const payload = upload?.data?.attachments ?? upload?.attachments ?? [];
        attachments = Array.isArray(payload) ? payload.map((item: any) => String(item?._id ?? item?.id ?? '')).filter(Boolean) : [];
      }
      const response: any = await createTicket.mutateAsync({ subject: subject.trim(), category, priority, description: description.trim(), relatedRecord: relatedType ? { type: relatedType, recordId: relatedRecordId } : null, attachments });
      const ticket = response?.data?.data ?? response?.data ?? response;
      Toast.show({ type: 'success', text1: `Ticket ${ticket?.ticketNumber || ''} created`, text2: 'Support will notify you when they reply.' });
      if (ticket?._id) navigation.replace('PetOwnerSupportTicketDetail', { ticketId: String(ticket._id) });
      else navigation.goBack();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Unable to create support ticket', text2: getErrorMessage(error, 'Please try again.') });
    }
  };

  const submitting = createTicket.isPending || uploadAttachments.isPending;
  return <ScreenContainer scroll padded>
    <View style={styles.intro}><View style={styles.introIcon}><Ionicons name="chatbubbles-outline" size={23} color={colors.primaryDark} /></View><View style={styles.introCopy}><Text style={styles.introTitle}>Create support ticket</Text><Text style={styles.introText}>We’ll keep all updates and evidence in one secure conversation.</Text></View></View>
    <Card style={styles.card}>
      <Input label="Subject *" value={subject} onChangeText={setSubject} placeholder="Briefly describe the issue" maxLength={180} />
      <Text style={styles.label}>Issue category *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{SUPPORT_CATEGORIES.map(([value, label]) => <TouchableOpacity key={value} style={[styles.chip, category === value && styles.chipSelected]} onPress={() => setCategory(value)}><Text style={[styles.chipText, category === value && styles.chipTextSelected]}>{label}</Text></TouchableOpacity>)}</ScrollView>
      <Text style={styles.label}>Priority</Text>
      <View style={styles.priorityRow}>{SUPPORT_PRIORITIES.map((value) => <TouchableOpacity key={value} style={[styles.priority, priority === value && styles.prioritySelected, value === 'URGENT' && priority === value && styles.urgent]} onPress={() => setPriority(value)}><Text style={[styles.priorityText, priority === value && styles.priorityTextSelected]}>{value[0] + value.slice(1).toLowerCase()}</Text></TouchableOpacity>)}</View>
      <Text style={styles.label}>Related record (optional)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{([{ value: '', label: 'None' }, { value: 'APPOINTMENT', label: 'Appointment' }, { value: 'ORDER', label: 'Order' }, { value: 'TRANSACTION', label: 'Payment' }] as { value: RelatedType; label: string }[]).map((item) => <TouchableOpacity key={item.value || 'none'} style={[styles.chip, relatedType === item.value && styles.chipSelected]} onPress={() => { setRelatedType(item.value); setRelatedRecordId(''); }}><Text style={[styles.chipText, relatedType === item.value && styles.chipTextSelected]}>{item.label}</Text></TouchableOpacity>)}</ScrollView>
      {relatedType ? <View style={styles.recordPicker}><Text style={styles.recordPickerTitle}>Choose your {relatedType.toLowerCase().replace('_', ' ')}</Text>{records.length === 0 ? <Text style={styles.emptyRecords}>No eligible records are available.</Text> : records.map((record) => { const id = String(record._id ?? record.id ?? ''); const selected = id === relatedRecordId; return <TouchableOpacity key={id} style={[styles.recordOption, selected && styles.recordOptionSelected]} onPress={() => setRelatedRecordId(id)}><Ionicons name={selected ? 'radio-button-on-outline' : 'radio-button-off-outline'} size={18} color={selected ? colors.primary : colors.textLight} /><Text style={styles.recordText} numberOfLines={1}>{recordLabel(record)}</Text></TouchableOpacity>; })}</View> : null}
      <Text style={styles.label}>Describe the problem *</Text>
      <TextInput value={description} onChangeText={setDescription} placeholder="Tell us what happened, when it happened, and anything that may help us investigate." placeholderTextColor={colors.textLight} multiline textAlignVertical="top" maxLength={8000} style={styles.description} />
      <Text style={styles.label}>Attachments (optional)</Text>
      <TouchableOpacity style={styles.attachButton} onPress={chooseFiles}><Ionicons name="attach-outline" size={20} color={colors.primary} /><View style={{ flex: 1 }}><Text style={styles.attachTitle}>Add screenshots or documents</Text><Text style={styles.attachCopy}>Up to 5 files · 25 MB each</Text></View></TouchableOpacity>
      {files.map((file, index) => <View key={`${file.uri}-${index}`} style={styles.fileRow}><Ionicons name="document-text-outline" size={18} color={colors.primary} /><Text style={styles.fileName} numberOfLines={1}>{file.name}</Text><TouchableOpacity onPress={() => setFiles((current) => current.filter((_, currentIndex) => currentIndex !== index))}><Ionicons name="close-circle" size={20} color={colors.textLight} /></TouchableOpacity></View>)}
    </Card>
    <View style={styles.tip}><Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} /><Text style={styles.tipText}>Only you and authorized support staff can view this ticket and its attachments.</Text></View>
    <Button title={submitting ? 'Submitting ticket…' : 'Submit support ticket'} onPress={submit} disabled={submitting} loading={submitting} style={styles.submit} icon={<Ionicons name="paper-plane-outline" size={18} color={colors.textInverse} />} />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  intro: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: 18, backgroundColor: colors.primaryLight + '16', marginBottom: spacing.md }, introIcon: { width: 45, height: 45, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successLight, marginRight: spacing.sm }, introCopy: { flex: 1 }, introTitle: { ...typography.h3, color: colors.primaryDark }, introText: { ...typography.caption, color: colors.textSecondary, marginTop: 3 }, card: { marginBottom: spacing.md }, label: { ...typography.label, color: colors.primaryDark, marginBottom: 7, marginTop: spacing.sm }, chips: { gap: 8, paddingRight: spacing.md, paddingBottom: spacing.sm }, chip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.backgroundTertiary }, chipSelected: { backgroundColor: colors.primary }, chipText: { ...typography.caption, fontWeight: '700', color: colors.textSecondary }, chipTextSelected: { color: colors.textInverse }, priorityRow: { flexDirection: 'row', gap: 7, flexWrap: 'wrap', paddingBottom: spacing.sm }, priority: { borderRadius: 9, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: colors.background }, prioritySelected: { borderColor: colors.primary, backgroundColor: colors.primary }, urgent: { backgroundColor: colors.error, borderColor: colors.error }, priorityText: { ...typography.caption, color: colors.textSecondary, fontWeight: '800' }, priorityTextSelected: { color: colors.textInverse }, recordPicker: { backgroundColor: colors.backgroundSecondary, borderRadius: 12, padding: spacing.sm, marginBottom: spacing.sm }, recordPickerTitle: { ...typography.caption, color: colors.textSecondary, fontWeight: '800', marginBottom: 6 }, emptyRecords: { ...typography.bodySmall, color: colors.textSecondary, paddingVertical: spacing.sm }, recordOption: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 9 }, recordOptionSelected: { backgroundColor: colors.primaryLight + '16' }, recordText: { ...typography.bodySmall, color: colors.text, flex: 1 }, description: { minHeight: 130, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.sm, backgroundColor: colors.backgroundSecondary, ...typography.body }, attachButton: { minHeight: 62, borderRadius: 12, borderWidth: 1, borderColor: colors.primaryLight + '55', borderStyle: 'dashed', padding: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primaryLight + '0A' }, attachTitle: { ...typography.label, color: colors.primaryDark }, attachCopy: { ...typography.caption, marginTop: 2 }, fileRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.borderLight }, fileName: { ...typography.bodySmall, color: colors.text, flex: 1 }, tip: { flexDirection: 'row', gap: 8, padding: spacing.md, borderRadius: 14, backgroundColor: colors.successLight + '75', marginBottom: spacing.md }, tipText: { ...typography.caption, color: colors.primaryDark, flex: 1, lineHeight: 17 }, submit: { marginBottom: spacing.xxl },
});
