import React, { useState, useEffect, useRef } from 'react';
import { AppImage } from '../../components/common/AppImage';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { VetStackParamList } from '../../navigation/types';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useAuth } from '../../contexts/AuthContext';
import { getImageUrl } from '../../config/api';
import { API_BASE_URL } from '../../config/api';
import { useConversations, useMessages } from '../../queries/chatQueries';
import { useMarkConversationComplete, useSendMessage, useMarkConversationRead } from '../../mutations/chatMutations';
import { useUploadChatFile } from '../../mutations/uploadMutations';
import { copyToCacheUri, deleteCacheFiles, getExtensionFromMime } from '../../utils/fileUpload';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { useChatKeyboardInset } from '../../hooks/useChatKeyboardInset';
import { useChatAutoScroll } from '../../hooks/useChatAutoScroll';

type Route = RouteProp<VetStackParamList, 'VetChatDetail'>;

type Message = {
  _id: string;
  message?: string;
  senderId?: { _id?: string } | string;
  createdAt?: string;
  fileName?: string;
  fileUrl?: string;
  attachments?: { url?: string; name?: string; type?: string; mimeType?: string }[];
};

function formatMessageTime(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function getMessageAttachments(m: Message): { url: string; name: string; type?: string; mimeType?: string }[] {
  if (Array.isArray(m?.attachments) && m.attachments.length > 0) {
    const base = API_BASE_URL.replace(/\/api\/?$/, '');
    return m.attachments.map((a) => ({
      url: a?.url?.startsWith('http') ? a.url : `${base}${a?.url?.startsWith('/') ? '' : '/'}${a?.url ?? ''}`,
      name: a?.name ?? '',
      type: a?.type,
      mimeType: a?.mimeType,
    }));
  }
  if (m?.fileUrl) {
    const url = getImageUrl(m.fileUrl) ?? `${API_BASE_URL.replace(/\/api\/?$/, '')}${m.fileUrl.startsWith('/') ? '' : '/'}${m.fileUrl}`;
    return [{ url, name: m?.fileName ?? '', type: 'file', mimeType: undefined }];
  }
  return [];
}

function isImageAttachment(att: { type?: string; mimeType?: string; url?: string }): boolean {
  const t = String(att?.type ?? '').toLowerCase();
  if (t === 'image') return true;
  const mime = String(att?.mimeType ?? '').toLowerCase();
  if (mime.startsWith('image/')) return true;
  const path = String(att?.url ?? '');
  const ext = path.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext ?? '');
}

export function VetChatDetailScreen() {
  const route = useRoute<Route>();
  const { conversationId, conversationType, petOwnerId, appointmentId, adminId } = route.params ?? {};
  const { t } = useTranslation();
  const { user } = useAuth();
  const currentUserId = (user as { id?: string })?.id ?? (user as { _id?: string })?._id ?? '';

  const [message, setMessage] = useState('');
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);
  const { composerRef, keyboardOffset, onComposerFocus } = useChatKeyboardInset();
  const lastMarkedReadRef = useRef<string | null>(null);

  const { data: messagesResponse, isLoading: messagesLoading } = useMessages(
    conversationId,
    {},
    { refetchInterval: 2_500, refetchIntervalInBackground: true }
  );
  const { data: conversationsResponse } = useConversations(
    { limit: 100 },
    { refetchInterval: 5_000, refetchIntervalInBackground: true }
  );
  const sendMessage = useSendMessage();
  const markRead = useMarkConversationRead();
  const markConversationComplete = useMarkConversationComplete();
  const uploadChatFile = useUploadChatFile();

  const messages = (() => {
    const payload = messagesResponse as { data?: { messages?: Message[] }; messages?: Message[] } | undefined;
    const list = payload?.data?.messages ?? payload?.messages ?? [];
    return Array.isArray(list) ? list : [];
  })();
  const { scrollToLatest, onContentSizeChange, onListLayout } = useChatAutoScroll(
    listRef,
    conversationId,
    messages,
    messagesLoading,
    keyboardOffset
  );

  const selectedConversation = (() => {
    const payload = conversationsResponse as { data?: { conversations?: Array<{ _id?: string; status?: string; conversationType?: string }> }; conversations?: Array<{ _id?: string; status?: string; conversationType?: string }> } | undefined;
    const list = payload?.data?.conversations ?? payload?.conversations ?? [];
    return Array.isArray(list) ? list.find((item) => String(item?._id ?? '') === String(conversationId ?? '')) ?? null : null;
  })();
  const isAppointmentChat = (selectedConversation?.conversationType ?? conversationType) === 'VETERINARIAN_PET_OWNER';
  const isConversationCompleted = isAppointmentChat && String(selectedConversation?.status ?? '').toUpperCase() === 'COMPLETED';

  useEffect(() => {
    const lastMessageId = String(messages[messages.length - 1]?._id ?? '');
    const readKey = `${conversationId}:${lastMessageId}`;
    if (!conversationId || !lastMessageId || lastMarkedReadRef.current === readKey) return;
    lastMarkedReadRef.current = readKey;
    markRead.mutate(conversationId);
  }, [conversationId, markRead, messages]);

  const handleSend = async () => {
    if (isConversationCompleted) {
      Toast.show({ type: 'info', text1: t('chatExperience.completedTitle'), text2: t('chatExperience.completedDescription') });
      return;
    }
    const text = (message ?? '').trim();
    if (!text) return;
    if (!conversationId || !currentUserId) {
      Toast.show({ type: 'error', text1: t('vetChatDetail.errors.invalidConversation') });
      return;
    }
    try {
      if (conversationType === 'ADMIN_VETERINARIAN') {
        if (!adminId) {
          Toast.show({ type: 'error', text1: t('vetChatDetail.errors.invalidAdminConversation') });
          return;
        }
        await sendMessage.mutateAsync({
          conversationId,
          veterinarianId: currentUserId,
          adminId,
          message: text,
          type: 'TEXT',
        });
      } else {
        if (!petOwnerId || !appointmentId) {
          Toast.show({ type: 'error', text1: t('vetChatDetail.errors.invalidConversationDetails') });
          return;
        }
        await sendMessage.mutateAsync({
          conversationId,
          veterinarianId: currentUserId,
          petOwnerId,
          appointmentId,
          message: text,
          type: 'TEXT',
        });
      }
      setMessage('');
    } catch (err) {
      Toast.show({ type: 'error', text1: (err as { message?: string })?.message ?? t('vetChatDetail.errors.failedToSend') });
    }
  };

  const handleAttach = async () => {
    try {
      if (isConversationCompleted) {
        Toast.show({ type: 'info', text1: t('chatExperience.completedTitle'), text2: t('chatExperience.completedDescription') });
        return;
      }
      if (!conversationId || !currentUserId) {
        Toast.show({ type: 'error', text1: t('vetChatDetail.errors.invalidConversation') });
        return;
      }
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets[0];
      const tempUris: string[] = [];
      const mime = file.mimeType ?? 'application/octet-stream';
      const name = file.name ?? 'file';
      try {
        const ext = getExtensionFromMime(mime);
        const uri = await copyToCacheUri(file.uri, 0, ext);
        tempUris.push(uri);

        const res = await uploadChatFile.mutateAsync({ uri, name, type: mime } as any);
        const data = res as { data?: { url?: string } };
        const url = data?.data?.url;
        if (!url) {
          Toast.show({ type: 'error', text1: t('vetChatDetail.errors.uploadFailed') });
          return;
        }

        if (conversationType === 'ADMIN_VETERINARIAN') {
          if (!adminId) {
            Toast.show({ type: 'error', text1: t('vetChatDetail.errors.invalidAdminConversation') });
            return;
          }
          await sendMessage.mutateAsync({
            conversationId,
            veterinarianId: currentUserId,
            adminId,
            fileUrl: url,
            fileName: name,
            type: 'FILE',
            message: (message ?? '').trim() || undefined,
          });
        } else {
          if (!petOwnerId || !appointmentId) {
            Toast.show({ type: 'error', text1: t('vetChatDetail.errors.invalidConversationDetails') });
            return;
          }
          await sendMessage.mutateAsync({
            conversationId,
            veterinarianId: currentUserId,
            petOwnerId,
            appointmentId,
            fileUrl: url,
            fileName: name,
            type: 'FILE',
            message: (message ?? '').trim() || undefined,
          });
        }

        setMessage('');
      } finally {
        if (tempUris.length > 0) {
          await deleteCacheFiles(tempUris).catch(() => {});
        }
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: (err as { message?: string })?.message ?? t('vetChatDetail.errors.failedToSendFile') });
    }
  };

  const openFileUrl = (url: string) => {
    Linking.openURL(url).catch(() => Toast.show({ type: 'error', text1: t('vetChatDetail.errors.couldNotOpenFile') }));
  };

  const isMe = (m: Message) => {
    const senderId = m?.senderId;
    const id = typeof senderId === 'object' ? senderId?._id : senderId;
    return id ? String(id) === String(currentUserId) : false;
  };

  const handleMarkConversationComplete = () => {
    if (!conversationId || !isAppointmentChat || isConversationCompleted) return;
    Alert.alert(t('chatExperience.confirmTitle'), t('chatExperience.confirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('chatExperience.confirmAction'),
        style: 'destructive',
        onPress: async () => {
          try {
            await markConversationComplete.mutateAsync(conversationId);
            Toast.show({ type: 'success', text1: t('chatExperience.completedSuccess') });
          } catch (completeError: unknown) {
            Toast.show({ type: 'error', text1: (completeError as { message?: string })?.message ?? t('chatExperience.completeFailed') });
          }
        },
      },
    ]);
  };

  if (!conversationId) {
    return (
      <ScreenContainer padded>
        <Text style={styles.errorText}>{t('vetChatDetail.errors.missingConversation')}</Text>
      </ScreenContainer>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenContainer style={styles.screenWrap} padded={false} keyboardAvoidance="none">
          {isConversationCompleted ? (
            <View style={styles.completedBanner}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.warning} />
              <View style={styles.completedBannerCopy}>
                <Text style={styles.completedBannerTitle}>{t('chatExperience.completedTitle')}</Text>
                <Text style={styles.completedBannerText}>{t('chatExperience.completedDescription')}</Text>
              </View>
            </View>
          ) : isAppointmentChat ? (
            <TouchableOpacity
              style={styles.completeChatAction}
              onPress={handleMarkConversationComplete}
              disabled={markConversationComplete.isPending}
            >
              {markConversationComplete.isPending ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="checkmark-done-outline" size={18} color={colors.primary} />}
              <Text style={styles.completeChatActionText}>{t('chatExperience.completeButton')}</Text>
            </TouchableOpacity>
          ) : null}
          {messagesLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => String(item._id)}
              contentContainerStyle={[styles.messagesList, { paddingBottom: spacing.lg + keyboardOffset }]}
              onContentSizeChange={onContentSizeChange}
              onLayout={onListLayout}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>{t('vetChatDetail.empty')}</Text>
                </View>
              }
              renderItem={({ item }) => {
                const me = isMe(item);
                const attachments = getMessageAttachments(item);
                const body = item?.message;
                return (
                  <View style={[styles.bubbleWrap, me ? styles.bubbleMe : styles.bubbleThem]}>
                    <View style={[styles.bubble, me ? styles.bubbleBgMe : styles.bubbleBgThem]}>
                      {body ? (
                        <Text style={[styles.bubbleText, me && { color: colors.textInverse }]}>{body}</Text>
                      ) : null}
                      {attachments.length > 0 ? (
                        <View style={styles.attachmentsWrap}>
                          {attachments.map((att, idx) => {
                            const isImg = isImageAttachment(att);
                            if (isImg) {
                              return (
                                <TouchableOpacity
                                  key={`${item._id}-${idx}`}
                                  onPress={() => setPreviewImageUri(att.url)}
                                  style={styles.attachmentImageWrap}
                                >
                                  <AppImage source={{ uri: att.url }} style={styles.attachmentImage} resizeMode="cover" />
                                </TouchableOpacity>
                              );
                            }
                            return (
                              <TouchableOpacity
                                key={`${item._id}-${idx}`}
                                style={styles.fileAttachment}
                                onPress={() => openFileUrl(att.url)}
                              >
                                <Text style={[styles.fileAttachmentName, me && { color: colors.textInverse }]} numberOfLines={1}>
                                  {att.name || t('common.file')}
                                </Text>
                                <Text style={styles.fileAttachmentIcon}>📥</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ) : null}
                      {!body && attachments.length === 0 ? (
                        <Text style={[styles.bubbleText, me && { color: colors.textInverse }]}>—</Text>
                      ) : null}
                      <Text style={styles.bubbleTime}>{formatMessageTime(item?.createdAt)}</Text>
                    </View>
                  </View>
                );
              }}
            />
          )}
          <View ref={composerRef} collapsable={false}>
            <View style={[styles.inputRow, { transform: [{ translateY: -keyboardOffset }], zIndex: 5 }]}>
            <TouchableOpacity
              style={[styles.attachBtn, isConversationCompleted && styles.attachBtnDisabled]}
              onPress={handleAttach}
              disabled={isConversationCompleted || uploadChatFile.isPending || sendMessage.isPending}
            >
              <Ionicons name="attach-outline" size={22} color={isConversationCompleted ? colors.textLight : colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={[styles.input, isConversationCompleted && styles.inputDisabled]}
              placeholder={isConversationCompleted ? t('chatExperience.readOnlyPlaceholder') : t('vetChatDetail.placeholders.message')}
              placeholderTextColor={colors.textLight}
              value={message}
              onChangeText={setMessage}
              onFocus={() => {
                onComposerFocus();
                scrollToLatest(true);
              }}
              multiline
              submitBehavior="submit"
              onSubmitEditing={() => { void handleSend(); }}
              maxLength={2000}
              editable={!isConversationCompleted && !sendMessage.isPending}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (sendMessage.isPending || isConversationCompleted) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={isConversationCompleted || sendMessage.isPending || !(message ?? '').trim()}
            >
              <Ionicons name="send" size={18} color={colors.textInverse} />
            </TouchableOpacity>
            </View>
          </View>
      </ScreenContainer>

      <Modal visible={!!previewImageUri} transparent animationType="fade">
        <Pressable style={styles.imagePreviewOverlay} onPress={() => setPreviewImageUri(null)}>
          <View style={styles.imagePreviewContent}>
            {previewImageUri ? (
              <AppImage source={{ uri: previewImageUri }} style={styles.imagePreviewImg} resizeMode="contain" />
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  screenWrap: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  completedBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, margin: spacing.md, padding: spacing.md, borderRadius: 14, backgroundColor: colors.warningLight, borderWidth: 1, borderColor: colors.warning + '66' },
  completedBannerCopy: { flex: 1 },
  completedBannerTitle: { ...typography.label, color: colors.primaryDark, marginBottom: 3 },
  completedBannerText: { ...typography.caption, color: colors.textSecondary, lineHeight: 17 },
  completeChatAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.xs, minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: colors.primaryLight + '80', backgroundColor: colors.primaryLight + '12' },
  completeChatActionText: { ...typography.bodySmall, color: colors.primary, fontWeight: '800' },
  errorText: { ...typography.body, color: colors.error },
  messagesList: { paddingVertical: spacing.md, paddingHorizontal: spacing.md, paddingBottom: spacing.lg, flexGrow: 1 },
  empty: { paddingVertical: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
  bubbleWrap: { marginBottom: spacing.sm },
  bubbleMe: { alignItems: 'flex-end' },
  bubbleThem: { alignItems: 'flex-start' },
  bubble: { maxWidth: '85%', padding: spacing.md, borderRadius: 16 },
  bubbleBgMe: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleBgThem: { backgroundColor: colors.backgroundTertiary, borderBottomLeftRadius: 4 },
  bubbleText: { ...typography.body },
  bubbleTime: { ...typography.caption, color: colors.textLight, marginTop: 4 },
  attachmentsWrap: { marginTop: 4, gap: 6 },
  attachmentImageWrap: { borderRadius: 8, overflow: 'hidden', maxWidth: 220, maxHeight: 180 },
  attachmentImage: { width: 220, height: 180 },
  fileAttachment: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 8, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 8, marginTop: 4 },
  fileAttachmentName: { flex: 1, ...typography.bodySmall },
  fileAttachmentIcon: { fontSize: 18, marginLeft: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  attachBtn: { padding: spacing.sm, justifyContent: 'center' },
  attachBtnDisabled: { opacity: 0.55 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    ...typography.body,
  },
  inputDisabled: { backgroundColor: colors.backgroundTertiary, color: colors.textSecondary },
  sendBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 24, justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.6 },
  sendText: { ...typography.label, color: colors.textInverse },
  imagePreviewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  imagePreviewContent: { width: '100%', height: '80%' },
  imagePreviewImg: { width: '100%', height: '100%' },
});
