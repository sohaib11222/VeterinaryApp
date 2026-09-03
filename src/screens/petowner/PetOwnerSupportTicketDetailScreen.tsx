import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { supportLabel } from '../../constants/supportTickets';
import { useSupportTicket } from '../../queries/supportTicketQueries';
import { useReopenSupportTicket, useReplyToSupportTicket, useUploadSupportTicketAttachments } from '../../mutations/supportTicketMutations';
import { API_ROUTES } from '../../api/apiConfig';
import { downloadAndShareFile } from '../../utils/nativePdf';
import { getErrorMessage } from '../../utils/errorUtils';

type Attachment = { _id: string; name?: string; mimeType?: string; downloadUrl?: string };
type Message = { _id: string; senderRole?: string; body?: string; attachments?: Attachment[]; createdAt?: string };
type Ticket = { _id: string; ticketNumber?: string; subject?: string; description?: string; category?: string; priority?: string; status?: string; createdAt?: string; relatedRecord?: { type?: string; recordId?: string }; messages?: Message[]; activities?: { _id: string; summary?: string; createdAt?: string }[] };
type PickedFile = { uri: string; name: string; type: string; size?: number };

function unwrapTicket(response: unknown): Ticket | null {
  const outer = (response as { data?: unknown })?.data ?? response;
  const data = (outer as { data?: unknown })?.data ?? outer;
  return data && typeof data === 'object' ? data as Ticket : null;
}

function dateTime(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const today = new Date();
  const prefix = date.toDateString() === today.toDateString() ? 'Today' : date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
  return `${prefix} · ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

function statusColor(status?: string) {
  return ({ OPEN: colors.primary, IN_PROGRESS: colors.info, WAITING_FOR_PATIENT: colors.warning, RESOLVED: colors.success, CLOSED: colors.textSecondary } as Record<string, string>)[String(status || '').toUpperCase()] || colors.textSecondary;
}

export function PetOwnerSupportTicketDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const ticketId = String(route.params?.ticketId || '');
  const ticketQuery = useSupportTicket(ticketId);
  const replyTicket = useReplyToSupportTicket();
  const reopen = useReopenSupportTicket();
  const uploadAttachments = useUploadSupportTicketAttachments();
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const listRef = useRef<FlatList<Message>>(null);
  const ticket = useMemo(() => unwrapTicket(ticketQuery.data), [ticketQuery.data]);
  const messages = ticket?.messages || [];
  const replyDisabled = ['RESOLVED', 'CLOSED'].includes(String(ticket?.status || '').toUpperCase());

  useEffect(() => { if (messages.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 80); }, [messages.length]);

  const chooseFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], multiple: true, copyToCacheDirectory: true });
      if (result.canceled) return;
      const selected = (result.assets || []).map((asset) => ({ uri: asset.uri, name: asset.name || 'attachment', type: asset.mimeType || 'application/octet-stream', size: asset.size }));
      const next = [...files, ...selected];
      if (next.length > 5) { Toast.show({ type: 'error', text1: 'You can attach up to 5 files.' }); return; }
      if (next.some((file) => (file.size || 0) > 25 * 1024 * 1024)) { Toast.show({ type: 'error', text1: 'Each attachment must be 25 MB or smaller.' }); return; }
      setFiles(next);
    } catch (error) { Toast.show({ type: 'error', text1: 'Unable to select files', text2: getErrorMessage(error, 'Please try again.') }); }
  };

  const sendReply = async () => {
    if (!body.trim() && !files.length) return;
    try {
      let attachments: string[] = [];
      if (files.length) {
        const formData = new FormData();
        files.forEach((file) => formData.append('supportTicket', { uri: file.uri, name: file.name, type: file.type } as any));
        const response: any = await uploadAttachments.mutateAsync(formData);
        const uploaded = response?.data?.attachments ?? response?.attachments ?? [];
        attachments = Array.isArray(uploaded) ? uploaded.map((item: any) => String(item?._id ?? item?.id ?? '')).filter(Boolean) : [];
      }
      await replyTicket.mutateAsync({ ticketId, data: { body: body.trim() || undefined, attachments } });
      setBody(''); setFiles([]);
      Toast.show({ type: 'success', text1: 'Reply sent to support' });
    } catch (error) { Toast.show({ type: 'error', text1: 'Unable to send reply', text2: getErrorMessage(error, 'Please try again.') }); }
  };

  const openAttachment = async (attachment: Attachment) => {
    try {
      const endpoint = attachment.downloadUrl || API_ROUTES.SUPPORT_TICKETS.DOWNLOAD_ATTACHMENT(attachment._id);
      await downloadAndShareFile(endpoint, attachment.name || 'support-attachment', attachment.mimeType || 'application/octet-stream');
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Unable to open attachment', text2: getErrorMessage(error, 'Please try again.') });
    }
  };

  const handleReopen = async () => {
    try { await reopen.mutateAsync(ticketId); Toast.show({ type: 'success', text1: 'Support ticket reopened' }); }
    catch (error) { Toast.show({ type: 'error', text1: 'Unable to reopen ticket', text2: getErrorMessage(error, 'This ticket can no longer be reopened.') }); }
  };

  if (ticketQuery.isLoading && !ticket) return <ScreenContainer padded><View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View></ScreenContainer>;
  if (!ticket) return <ScreenContainer padded><View style={styles.center}><Text style={styles.errorText}>This support ticket could not be loaded.</Text><Button title="Back to Support" onPress={() => navigation.goBack()} /></View></ScreenContainer>;

  const tone = statusColor(ticket.status);
  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScreenContainer padded={false} style={styles.flex}>
      <View style={styles.summary}>
        <View style={styles.summaryTop}><View style={{ flex: 1, minWidth: 0 }}><Text style={styles.ticketNumber}>{ticket.ticketNumber || 'SUPPORT'}</Text><Text style={styles.subject} numberOfLines={2}>{ticket.subject || 'Support request'}</Text></View><View style={[styles.status, { backgroundColor: tone + '1E' }]}><Text style={[styles.statusText, { color: tone }]}>{supportLabel(ticket.status)}</Text></View></View>
        <View style={styles.summaryMeta}><Text style={styles.meta}>{supportLabel(ticket.category)}</Text><Text style={styles.meta}>•</Text><Text style={styles.meta}>{supportLabel(ticket.priority)} priority</Text><Text style={styles.meta}>•</Text><Text style={styles.meta}>Created {dateTime(ticket.createdAt)}</Text></View>
      </View>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.conversation}
        ListHeaderComponent={<View><Card style={styles.original}><Text style={styles.originalLabel}>ORIGINAL REQUEST</Text><Text style={styles.originalText}>{ticket.description}</Text>{ticket.relatedRecord?.type ? <View style={styles.related}><Ionicons name="link-outline" size={15} color={colors.primary} /><Text style={styles.relatedText}>Related {supportLabel(ticket.relatedRecord.type)}</Text></View> : null}<Text style={styles.sectionLabel}>CONVERSATION</Text></Card></View>}
        renderItem={({ item }) => { const mine = String(item.senderRole).toUpperCase() === 'PET_OWNER'; return <View style={[styles.messageWrap, mine ? styles.mine : styles.theirs]}><View style={[styles.message, mine ? styles.mineBubble : styles.theirBubble]}><Text style={[styles.sender, mine && styles.mineText]}>{mine ? 'You' : 'Support team'} · {dateTime(item.createdAt)}</Text>{item.body ? <Text style={[styles.messageBody, mine && styles.mineText]}>{item.body}</Text> : null}{(item.attachments || []).map((attachment) => <TouchableOpacity key={attachment._id} style={[styles.attachment, mine && styles.mineAttachment]} onPress={() => openAttachment(attachment)}><Ionicons name="attach-outline" size={16} color={mine ? colors.textInverse : colors.primary} /><Text style={[styles.attachmentText, mine && styles.mineText]} numberOfLines={1}>{attachment.name || 'Attachment'}</Text><Ionicons name="download-outline" size={15} color={mine ? colors.textInverse : colors.primary} /></TouchableOpacity>)}</View></View>; }}
        ListFooterComponent={ticket.activities?.length ? <Card style={styles.activity}><Text style={styles.activityTitle}>Ticket activity</Text>{ticket.activities.slice(-4).map((event) => <View style={styles.activityRow} key={event._id}><View style={styles.activityDot} /><View><Text style={styles.activityText}>{event.summary}</Text><Text style={styles.activityDate}>{dateTime(event.createdAt)}</Text></View></View>)}</Card> : null}
      />
      {ticket.status === 'RESOLVED' ? <View style={styles.resolvedRow}><Text style={styles.resolvedText}>Is this still unresolved?</Text><TouchableOpacity onPress={handleReopen} disabled={reopen.isPending}><Text style={styles.reopenText}>{reopen.isPending ? 'Reopening…' : 'Reopen ticket'}</Text></TouchableOpacity></View> : null}
      {replyDisabled ? <View style={styles.closedNotice}><Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} /><Text style={styles.closedText}>{ticket.status === 'CLOSED' ? 'This ticket is closed and cannot receive replies.' : 'Reopen this resolved ticket within 14 days if you still need help.'}</Text></View> : <View style={styles.composer}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fileChips}>{files.map((file, index) => <View style={styles.fileChip} key={`${file.uri}-${index}`}><Ionicons name="document-outline" size={14} color={colors.primary} /><Text style={styles.fileChipText} numberOfLines={1}>{file.name}</Text><TouchableOpacity onPress={() => setFiles((current) => current.filter((_, i) => i !== index))}><Ionicons name="close" size={15} color={colors.textSecondary} /></TouchableOpacity></View>)}</ScrollView><View style={styles.composerRow}><TouchableOpacity style={styles.attachButton} onPress={chooseFiles} disabled={replyTicket.isPending || uploadAttachments.isPending}><Ionicons name="attach-outline" size={22} color={colors.primary} /></TouchableOpacity><TextInput style={styles.replyInput} value={body} onChangeText={setBody} multiline placeholder="Reply to support…" placeholderTextColor={colors.textLight} maxLength={8000} /><TouchableOpacity style={[styles.sendButton, (!body.trim() && !files.length) && styles.sendDisabled]} onPress={sendReply} disabled={(!body.trim() && !files.length) || replyTicket.isPending || uploadAttachments.isPending}>{replyTicket.isPending || uploadAttachments.isPending ? <ActivityIndicator size="small" color={colors.textInverse} /> : <Ionicons name="send" size={18} color={colors.textInverse} />}</TouchableOpacity></View></View>}
    </ScreenContainer>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md }, errorText: { ...typography.body, color: colors.error, textAlign: 'center' }, summary: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight, backgroundColor: colors.background }, summaryTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }, ticketNumber: { ...typography.caption, color: colors.primary, fontWeight: '800', letterSpacing: .5 }, subject: { ...typography.label, marginTop: 4 }, status: { borderRadius: 999, paddingVertical: 5, paddingHorizontal: 8 }, statusText: { ...typography.caption, fontWeight: '800' }, summaryMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 7 }, meta: { ...typography.caption, color: colors.textSecondary }, conversation: { padding: spacing.md, paddingBottom: spacing.lg }, original: { marginBottom: spacing.md, backgroundColor: colors.primaryLight + '0D', borderWidth: 1, borderColor: colors.primaryLight + '25' }, originalLabel: { ...typography.caption, color: colors.primary, fontWeight: '800', letterSpacing: .6 }, originalText: { ...typography.bodySmall, color: colors.text, lineHeight: 20, marginTop: 6 }, related: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.sm }, relatedText: { ...typography.caption, color: colors.primaryDark, fontWeight: '700' }, sectionLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '800', letterSpacing: .6, marginTop: spacing.md }, messageWrap: { marginBottom: spacing.sm }, mine: { alignItems: 'flex-end' }, theirs: { alignItems: 'flex-start' }, message: { maxWidth: '87%', borderRadius: 16, padding: spacing.sm }, mineBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 4 }, theirBubble: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.borderLight, borderBottomLeftRadius: 4 }, sender: { ...typography.caption, color: colors.textSecondary, marginBottom: 4, fontWeight: '700' }, mineText: { color: colors.textInverse }, messageBody: { ...typography.bodySmall, color: colors.text, lineHeight: 20 }, attachment: { maxWidth: 230, marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 8, borderRadius: 8, backgroundColor: colors.primaryLight + '12' }, mineAttachment: { backgroundColor: 'rgba(255,255,255,0.16)' }, attachmentText: { ...typography.caption, color: colors.primaryDark, fontWeight: '700', flex: 1 }, activity: { marginTop: spacing.md }, activityTitle: { ...typography.label, marginBottom: spacing.sm }, activityRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm }, activityDot: { height: 8, width: 8, borderRadius: 4, backgroundColor: colors.primaryLight, marginTop: 5 }, activityText: { ...typography.bodySmall, color: colors.text }, activityDate: { ...typography.caption, marginTop: 2 }, resolvedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.successLight }, resolvedText: { ...typography.bodySmall, color: colors.primaryDark }, reopenText: { ...typography.label, color: colors.primary, fontWeight: '800' }, closedNotice: { flexDirection: 'row', gap: 8, padding: spacing.md, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.backgroundTertiary }, closedText: { ...typography.bodySmall, flex: 1 }, composer: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background, paddingHorizontal: spacing.sm, paddingTop: spacing.xs, paddingBottom: spacing.sm }, fileChips: { gap: 6, paddingVertical: 4 }, fileChip: { maxWidth: 210, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: colors.primaryLight + '17' }, fileChipText: { ...typography.caption, color: colors.primaryDark, maxWidth: 150 }, composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 7 }, attachButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '18' }, replyInput: { flex: 1, minHeight: 43, maxHeight: 98, borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: colors.backgroundSecondary, ...typography.bodySmall }, sendButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }, sendDisabled: { opacity: .45 },
});
