import React, { useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { AppImage } from '../../components/common/AppImage';
import { Card } from '../../components/common/Card';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { getImageUrl } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { useConversations } from '../../queries/chatQueries';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export function PetSitterMessagesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>(); const stack = navigation.getParent(); const { user } = useAuth();
  const query = useConversations({ limit: 50 }, { refetchInterval: 5_000, refetchIntervalInBackground: true });
  const conversations = useMemo(() => { const raw: any = query.data; const list = raw?.data?.conversations ?? raw?.conversations ?? []; return Array.isArray(list) ? list : []; }, [query.data]);
  if (query.isLoading) return <ScreenContainer padded><View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View></ScreenContainer>;
  return <ScreenContainer padded><FlatList data={conversations} keyExtractor={(item: any) => String(item._id)} contentContainerStyle={styles.list} refreshing={query.isFetching} onRefresh={() => query.refetch()} ListEmptyComponent={<View style={styles.empty}><Ionicons name="chatbubbles-outline" size={36} color={colors.primary} /><Text style={styles.emptyTitle}>{t('petSitter.chats.emptyTitle')}</Text><Text style={styles.emptyText}>{t('petSitter.chats.emptyText')}</Text></View>} renderItem={({ item }: { item: any }) => { const owner = item.petOwnerId ?? {}; const ownerId = typeof owner === 'object' ? owner._id : owner; const name = typeof owner === 'object' ? owner.fullName ?? owner.name ?? t('petSitter.chats.petOwner') : t('petSitter.chats.petOwner'); const image = typeof owner === 'object' ? getImageUrl(owner.profileImage) : null; const unread = Number(item.unreadCount || 0); return <TouchableOpacity activeOpacity={0.8} onPress={() => stack?.navigate('PetSitterChatDetail', { conversationId: String(item._id), petSitterId: user?.id, petOwnerId: ownerId, conversationType: 'PET_SITTER_PET_OWNER', title: name, subtitle: t('petSitter.chats.petOwner'), peerImageUri: image ?? undefined })}><Card style={styles.card}><View style={styles.row}><View style={styles.avatar}>{image ? <AppImage source={{ uri: image }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{String(name).charAt(0)}</Text>}</View><View style={styles.copy}><View style={styles.top}><Text style={styles.name}>{name}</Text>{unread ? <View style={styles.badge}><Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text></View> : null}</View><Text style={styles.preview} numberOfLines={1}>{item.lastMessage?.message || item.lastMessage?.fileName || t('petSitter.chats.start')}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.textLight} /></View></Card></TouchableOpacity>; }} /></ScreenContainer>;
}
const styles = StyleSheet.create({ center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, list: { paddingBottom: spacing.xxl }, card: { marginBottom: spacing.sm }, row: { flexDirection: 'row', alignItems: 'center' }, avatar: { width: 50, height: 50, borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '28', marginRight: spacing.sm }, avatarImage: { width: '100%', height: '100%' }, avatarText: { ...typography.h3, color: colors.primary }, copy: { flex: 1 }, top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, name: { ...typography.label }, preview: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 3 }, badge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, backgroundColor: colors.primary }, badgeText: { ...typography.caption, color: colors.textInverse, fontSize: 10, fontWeight: '800' }, empty: { alignItems: 'center', padding: spacing.xl, marginTop: spacing.xl }, emptyTitle: { ...typography.h3, marginTop: spacing.sm }, emptyText: { ...typography.bodySmall, textAlign: 'center', color: colors.textSecondary, marginTop: 5, lineHeight: 19 }, });
