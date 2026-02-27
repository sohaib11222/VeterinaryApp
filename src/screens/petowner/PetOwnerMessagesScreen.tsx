import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { useVetHeaderSearch } from '../../contexts/VetHeaderSearchContext';
import { getImageUrl } from '../../config/api';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useConversations } from '../../queries/chatQueries';
import { useTranslation } from 'react-i18next';

type Conversation = {
  _id: string;
  conversationType?: string;
  veterinarianId?: { _id?: string; name?: string; fullName?: string; profileImage?: string } | string;
  petOwnerId?: { _id?: string; name?: string; fullName?: string } | string;
  appointmentId?: { _id?: string } | string;
  lastMessage?: { message?: string; fileName?: string };
  lastMessageAt?: string;
  updatedAt?: string;
  createdAt?: string;
  unreadCount?: number;
};

function getConversationName(c: Conversation, veterinarianLabel: string, naLabel: string): string {
  const vet = c?.veterinarianId;
  if (!vet) return naLabel;
  const o = typeof vet === 'object' ? vet : null;
  return (o?.fullName ?? o?.name ?? veterinarianLabel) as string;
}

function getConversationImage(c: Conversation): string | null {
  const vet = c?.veterinarianId;
  if (!vet || typeof vet !== 'object') return null;
  return getImageUrl((vet as { profileImage?: string }).profileImage) ?? null;
}

function formatTime(c: Conversation, yesterdayLabel: string): string {
  const dt = c?.lastMessageAt || c?.updatedAt || c?.createdAt;
  if (!dt) return '';
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return yesterdayLabel;
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: 'short' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function PetOwnerMessagesScreen() {
  const navigation = useNavigation<any>();
  const stackNav = navigation.getParent();
  const headerSearch = useVetHeaderSearch();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: conversationsResponse, isLoading, error } = useConversations({ limit: 50 });

  const conversations = useMemo(() => {
    const payload = conversationsResponse as { data?: { conversations?: Conversation[] }; conversations?: Conversation[] } | undefined;
    const list = payload?.data?.conversations ?? payload?.conversations ?? [];
    return Array.isArray(list) ? list : [];
  }, [conversationsResponse]);

  useFocusEffect(
    React.useCallback(() => {
      headerSearch?.setConfig({
        placeholder: t('messages.searchPlaceholder'),
        value: searchQuery,
        onChangeText: setSearchQuery,
      });
      return () => headerSearch?.setConfig(null);
    }, [headerSearch, searchQuery, t])
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => getConversationName(c, t('common.veterinarian'), t('common.na')).toLowerCase().includes(q));
  }, [conversations, searchQuery, t]);

  const openChat = (c: Conversation) => {
    const id = c?._id;
    if (!id) return;
    const vetId = c?.veterinarianId && (typeof c.veterinarianId === 'object' ? c.veterinarianId._id : c.veterinarianId);
    const ownerId = c?.petOwnerId && (typeof c.petOwnerId === 'object' ? c.petOwnerId._id : c.petOwnerId);
    const aptId = c?.appointmentId && (typeof c.appointmentId === 'object' ? c.appointmentId._id : c.appointmentId);
    const peerName = getConversationName(c, t('common.veterinarian'), t('common.na'));
    const peerImageUri = getConversationImage(c);
    stackNav?.navigate('PetOwnerChatDetail', {
      conversationId: id,
      veterinarianId: vetId ?? '',
      petOwnerId: ownerId ?? '',
      appointmentId: aptId ?? '',
      conversationType: c.conversationType ?? 'VETERINARIAN_PET_OWNER',
      title: peerName,
      subtitle: t('common.chat'),
      peerImageUri: peerImageUri ?? undefined,
    });
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const preview = item?.lastMessage?.message || item?.lastMessage?.fileName || t('common.na');
    const unread = item?.unreadCount ?? 0;
    const avatarUri = getConversationImage(item);
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={() => openChat(item)}>
        <Card>
          <View style={styles.row}>
            <View style={styles.avatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{getConversationName(item, t('common.veterinarian'), t('common.na')).charAt(0)}</Text>
              )}
            </View>
            <View style={styles.content}>
              <View style={styles.topRow}>
                <Text style={styles.name} numberOfLines={1}>{getConversationName(item, t('common.veterinarian'), t('common.na'))}</Text>
                <View style={styles.rightMeta}>
                  {unread > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>
                        {unread > 99 ? t('messages.unreadOverflow') : unread}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.time}>{formatTime(item, t('common.yesterday'))}</Text>
                  )}
                </View>
              </View>
              <Text style={styles.preview} numberOfLines={1}>{String(preview)}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer padded>
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{(error as { message?: string })?.message ?? t('messages.errors.loadFailed')}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>{t('messages.empty')}</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  errorText: { ...typography.bodySmall, color: colors.error },
  listContent: { paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight + '40', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { ...typography.h3, color: colors.primary },
  content: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  name: { ...typography.body, fontWeight: '600' },
  rightMeta: { marginLeft: spacing.xs },
  unreadBadge: { backgroundColor: colors.primary, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  unreadText: { ...typography.caption, color: colors.textInverse, fontWeight: '600', fontSize: 11 },
  time: { ...typography.caption, color: colors.textSecondary },
  preview: { ...typography.bodySmall, color: colors.textSecondary },
  chevron: { ...typography.h3, color: colors.textLight },
  empty: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: spacing.sm },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
});
