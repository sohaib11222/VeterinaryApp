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

type Conversation = {
  _id: string;
  conversationType?: string;
  adminId?: { _id?: string; name?: string; fullName?: string; profileImage?: string } | string;
  veterinarianId?: { _id?: string } | string;
  petOwnerId?: { _id?: string; name?: string; fullName?: string; profileImage?: string } | string;
  appointmentId?: { _id?: string } | string;
  lastMessage?: { message?: string; fileName?: string };
  lastMessageAt?: string;
  updatedAt?: string;
  createdAt?: string;
  unreadCount?: number;
};

function getConversationPeerName(c: Conversation): string {
  const owner = c?.petOwnerId;
  const o = typeof owner === 'object' ? owner : null;
  return (o?.fullName ?? o?.name ?? 'Pet owner') as string;
}

function getConversationPeerImage(c: Conversation): string | null {
  const owner = c?.petOwnerId;
  if (!owner || typeof owner !== 'object') return null;
  return getImageUrl((owner as { profileImage?: string }).profileImage) ?? null;
}

function formatTime(c: Conversation): string {
  const dt = c?.lastMessageAt || c?.updatedAt || c?.createdAt;
  if (!dt) return '';
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: 'short' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function VetMessagesScreen() {
  const navigation = useNavigation<any>();
  const stackNav = navigation.getParent();
  const headerSearch = useVetHeaderSearch();
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
        placeholder: 'Search conversations...',
        value: searchQuery,
        onChangeText: setSearchQuery,
      });
      return () => headerSearch?.setConfig(null);
    }, [searchQuery])
  );

  /** Only show pet-owner conversations in list; admin chat is via "Admin Messages" button */
  const petOwnerConversations = useMemo(
    () => conversations.filter((c) => c?.conversationType !== 'ADMIN_VETERINARIAN'),
    [conversations]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return petOwnerConversations;
    return petOwnerConversations.filter((c) => getConversationPeerName(c).toLowerCase().includes(q));
  }, [petOwnerConversations, searchQuery]);

  const openChat = (c: Conversation) => {
    const id = c?._id;
    if (!id) return;
    const ownerId = c?.petOwnerId && (typeof c.petOwnerId === 'object' ? c.petOwnerId._id : c.petOwnerId);
    const aptId = c?.appointmentId && (typeof c.appointmentId === 'object' ? c.appointmentId._id : c.appointmentId);
    const peerName = getConversationPeerName(c);
    const peerImageUri = getConversationPeerImage(c);
    stackNav?.navigate('VetChatDetail', {
      conversationId: id,
      conversationType: c.conversationType ?? 'VETERINARIAN_PET_OWNER',
      petOwnerId: ownerId ?? undefined,
      appointmentId: aptId ?? undefined,
      title: peerName,
      subtitle: 'Chat',
      peerImageUri: peerImageUri ?? undefined,
    });
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const preview = item?.lastMessage?.message || item?.lastMessage?.fileName || '—';
    const unread = item?.unreadCount ?? 0;
    const avatarUri = getConversationPeerImage(item);
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={() => openChat(item)}>
        <Card>
          <View style={styles.row}>
            <View style={styles.avatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{getConversationPeerName(item).charAt(0)}</Text>
              )}
            </View>
            <View style={styles.content}>
              <View style={styles.topRow}>
                <Text style={styles.name} numberOfLines={1}>{getConversationPeerName(item)}</Text>
                <View style={styles.rightMeta}>
                  {unread > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{unread > 99 ? '99+' : unread}</Text>
                    </View>
                  ) : (
                    <Text style={styles.time}>{formatTime(item)}</Text>
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
      <View style={styles.adminLink}>
        <TouchableOpacity style={styles.adminCard} onPress={() => stackNav?.navigate('VetAdminChat')}>
          <Text style={styles.adminIcon}>🛟</Text>
          <Text style={styles.adminLabel}>Admin Messages</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{(error as { message?: string })?.message ?? 'Failed to load conversations'}</Text>
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
              <Text style={styles.emptyText}>No conversations yet</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  adminLink: { marginBottom: spacing.md },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adminIcon: { fontSize: 24, marginRight: spacing.sm },
  adminLabel: { ...typography.body, fontWeight: '600', flex: 1 },
  chevron: { ...typography.h3, color: colors.textLight },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  errorText: { ...typography.bodySmall, color: colors.error },
  listContent: { paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { ...typography.h3, color: colors.primary },
  content: { flex: 1, minWidth: 0 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
    gap: spacing.sm,
  },
  name: { ...typography.body, fontWeight: '600', flex: 1 },
  rightMeta: { flexDirection: 'row', alignItems: 'center', minWidth: 52 },
  time: { ...typography.caption, color: colors.textSecondary, marginLeft: 'auto' },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: { ...typography.caption, color: colors.textInverse, fontWeight: '700', fontSize: 11 },
  preview: { ...typography.bodySmall, color: colors.textSecondary },
  empty: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: spacing.sm },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
});
