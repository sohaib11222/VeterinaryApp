import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Linking,
  Keyboard,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useAuth } from '../../contexts/AuthContext';
import { getImageUrl } from '../../config/api';
import { API_BASE_URL } from '../../config/api';
import { useMessages } from '../../queries/chatQueries';
import { useGetOrCreateConversation, useSendMessage, useMarkConversationRead } from '../../mutations/chatMutations';
import { useUploadChatFile } from '../../mutations/uploadMutations';
import { copyToCacheUri, deleteCacheFiles, getExtensionFromMime } from '../../utils/fileUpload';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

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

export function VetAdminChatScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const currentUserId = (user as { id?: string })?.id ?? (user as { _id?: string })?._id ?? '';

  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [pendingAttachment, setPendingAttachment] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [pendingTempUri, setPendingTempUri] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const listRef = useRef<FlatList>(null);
  const lastMarkedReadRef = useRef<string | null>(null);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const getOrCreate = useGetOrCreateConversation();
  const { data: messagesResponse, isLoading: messagesLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const markRead = useMarkConversationRead();
  const uploadChatFile = useUploadChatFile();

  useEffect(() => {
    if (!currentUserId) return;
    getOrCreate.mutate(
      { veterinarianId: currentUserId },
      {
        onSuccess: (res) => {
          const payload = res as { _id?: string; data?: { _id?: string; adminId?: { _id?: string } | string } };
          const conv = payload?.data ?? payload;
          const id = conv?._id;
          if (id) setConversationId(String(id));
          const a = (conv as { adminId?: { _id?: string } | string })?.adminId;
          if (a) setAdminId(String(typeof a === 'object' ? a._id : a));
        },
        onError: (err) => {
          Toast.show({ type: 'error', text1: (err as { message?: string })?.message ?? t('vetAdminChat.errors.failedToOpen') });
        },
      }
    );
  }, [currentUserId]);

  useEffect(() => {
    if (!conversationId || lastMarkedReadRef.current === conversationId) return;
    lastMarkedReadRef.current = conversationId;
    markRead.mutate(conversationId);
  }, [conversationId, markRead]);

  const messages = (() => {
    const payload = messagesResponse as { data?: { messages?: Message[] }; messages?: Message[] } | undefined;
    const list = payload?.data?.messages ?? payload?.messages ?? [];
    return Array.isArray(list) ? list : [];
  })();

  useEffect(() => {
    if (messages.length > 0) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  const handleSend = async () => {
    const text = (message ?? '').trim();
    if ((!text && !pendingAttachment) || !conversationId || !currentUserId || !adminId) return;
    try {
      if (pendingAttachment) {
        const tempUris: string[] = [];
        try {
          if (pendingTempUri) tempUris.push(pendingTempUri);
          const res = await uploadChatFile.mutateAsync(pendingAttachment);
          const data = res as { data?: { url?: string } };
          const url = data?.data?.url;
          if (!url) {
            Toast.show({ type: 'error', text1: t('vetAdminChat.errors.uploadFailed') });
            return;
          }
          await sendMessage.mutateAsync({
            conversationId,
            veterinarianId: currentUserId,
            adminId,
            fileUrl: url,
            fileName: pendingAttachment.name ?? 'File',
            type: 'FILE',
            message: text || undefined,
          });
          setMessage('');
          setPendingAttachment(null);
          setPendingTempUri(null);
        } finally {
          if (tempUris.length > 0) {
            await deleteCacheFiles(tempUris).catch(() => {});
          }
        }
        return;
      }

      await sendMessage.mutateAsync({
        conversationId,
        veterinarianId: currentUserId,
        adminId,
        message: text,
        type: 'TEXT',
      });
      setMessage('');
    } catch (err) {
      Toast.show({ type: 'error', text1: (err as { message?: string })?.message ?? t('vetAdminChat.errors.failedToSend') });
    }
  };

  const handleAttach = async () => {
    if (!conversationId || !adminId) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const file = result.assets[0];

      if (pendingTempUri) {
        await deleteCacheFiles([pendingTempUri]).catch(() => {});
      }

      const mime = file.mimeType ?? 'application/octet-stream';
      const name = file.name ?? 'file';
      const ext = getExtensionFromMime(mime);
      const uri = await copyToCacheUri(file.uri, 0, ext);

      setPendingAttachment({ uri, name, type: mime });
      setPendingTempUri(uri);
    } catch (err) {
      Toast.show({ type: 'error', text1: (err as { message?: string })?.message ?? t('vetAdminChat.errors.failedToSendFile') });
    }
  };

  const openFileUrl = (url: string) => {
    Linking.openURL(url).catch(() => Toast.show({ type: 'error', text1: t('vetAdminChat.errors.couldNotOpenFile') }));
  };

  const isMe = (m: Message) => {
    const senderId = m?.senderId;
    const id = typeof senderId === 'object' ? senderId?._id : senderId;
    return id ? String(id) === String(currentUserId) : false;
  };

  if (!currentUserId) {
    return (
      <ScreenContainer padded>
        <Text style={styles.errorText}>{t('vetAdminChat.errors.signInRequired')}</Text>
      </ScreenContainer>
    );
  }

  const loading = getOrCreate.isPending || (conversationId && messagesLoading);

  return (
    <View style={styles.container}>
      <ScreenContainer
        style={{
          ...styles.screenWrap,
          ...(keyboardHeight > 0 ? { paddingBottom: keyboardHeight } : {}),
        }}
        padded={false}
      >
          {!conversationId && getOrCreate.isPending ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>{t('vetAdminChat.loading')}</Text>
            </View>
          ) : loading && messages.length === 0 ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => String(item._id)}
              contentContainerStyle={styles.messagesList}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>{t('vetAdminChat.empty')}</Text>
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
                                  <Image source={{ uri: att.url }} style={styles.attachmentImage} resizeMode="cover" />
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
          {pendingAttachment ? (
            <View style={styles.pendingAttachmentRow}>
              <Text style={styles.pendingAttachmentText} numberOfLines={1}>
                {pendingAttachment.name}
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  if (pendingTempUri) {
                    await deleteCacheFiles([pendingTempUri]).catch(() => {});
                  }
                  setPendingAttachment(null);
                  setPendingTempUri(null);
                }}
              >
                <Text style={styles.pendingAttachmentRemove}>×</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={handleAttach}
              disabled={!adminId || uploadChatFile.isPending || sendMessage.isPending}
            >
              <Text style={styles.attachIcon}>📎</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder={t('vetAdminChat.placeholders.message')}
              placeholderTextColor={colors.textLight}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={2000}
              editable={!!adminId && !sendMessage.isPending}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (sendMessage.isPending || !adminId) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={sendMessage.isPending || !adminId || (!(message ?? '').trim() && !pendingAttachment)}
            >
              <Text style={styles.sendText}>{t('common.send')}</Text>
            </TouchableOpacity>
          </View>
      </ScreenContainer>

      <Modal visible={!!previewImageUri} transparent animationType="fade">
        <Pressable style={styles.imagePreviewOverlay} onPress={() => setPreviewImageUri(null)}>
          <View style={styles.imagePreviewContent}>
            {previewImageUri ? (
              <Image source={{ uri: previewImageUri }} style={styles.imagePreviewImg} resizeMode="contain" />
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
  loadingText: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
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
  bubbleTime: { ...typography.caption, color: colors.textLight, marginTop: 6, textAlign: 'right' },
  attachmentsWrap: { marginTop: 4, gap: 6 },
  attachmentImageWrap: { borderRadius: 8, overflow: 'hidden', maxWidth: 220, maxHeight: 180 },
  attachmentImage: { width: 220, height: 180 },
  fileAttachment: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 8, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 8, marginTop: 4 },
  fileAttachmentName: { flex: 1, ...typography.bodySmall },
  fileAttachmentIcon: { fontSize: 18, marginLeft: 8 },
  pendingAttachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  pendingAttachmentText: { ...typography.bodySmall, flex: 1, color: colors.textSecondary },
  pendingAttachmentRemove: { ...typography.h3, color: colors.error, paddingHorizontal: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight, backgroundColor: colors.background },
  attachBtn: { padding: 10, marginRight: spacing.sm },
  attachIcon: { fontSize: 18 },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 24, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, maxHeight: 100, ...typography.body },
  sendBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 24, justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.6 },
  sendText: { ...typography.label, color: colors.textInverse },
  imagePreviewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  imagePreviewContent: { width: '100%', height: '80%' },
  imagePreviewImg: { width: '100%', height: '100%' },
});
