import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
} from 'react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useVeterinarianAnnouncements, useUnreadAnnouncementCount } from '../../queries/announcementQueries';
import { useMarkAnnouncementAsRead } from '../../mutations/announcementMutations';
import { getImageUrl } from '../../config/api';
import Toast from 'react-native-toast-message';

type AnnouncementItem = {
  _id: string;
  title?: string;
  message?: string;
  priority?: string;
  announcementType?: string;
  image?: string | null;
  file?: string | null;
  link?: string | null;
  isPinned?: boolean;
  isRead?: boolean;
  createdAt?: string;
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function VetAnnouncementsScreen() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'pinned'>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  const params = useMemo(() => {
    const p: { page: number; limit: number; isRead?: boolean } = { page, limit };
    if (filter === 'unread') p.isRead = false;
    return p;
  }, [filter, page]);

  const { data: announcementsRes, isLoading } = useVeterinarianAnnouncements(params, { enabled: true });
  const { data: unreadRes } = useUnreadAnnouncementCount({ enabled: true });
  const markRead = useMarkAnnouncementAsRead();

  const payload = useMemo(() => (announcementsRes as { data?: { announcements?: AnnouncementItem[]; pagination?: { page: number; pages: number; total: number } } })?.data ?? announcementsRes, [announcementsRes]);
  const announcements = useMemo(() => (payload as { announcements?: AnnouncementItem[] })?.announcements ?? [], [payload]);
  const pagination = useMemo(() => (payload as { pagination?: { page: number; pages: number; total: number } })?.pagination ?? null, [payload]);
  const unreadCount = useMemo(() => (unreadRes as { data?: { unreadCount?: number } })?.data?.unreadCount ?? 0, [unreadRes]);
  const pinnedCount = useMemo(() => announcements.filter((a) => a.isPinned).length, [announcements]);

  const filteredList = useMemo(() => {
    let list = [...announcements];
    if (filter === 'pinned') list = list.filter((a) => a.isPinned);
    const priorityOrder: Record<string, number> = { URGENT: 3, IMPORTANT: 2, NORMAL: 1 };
    return list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const ap = priorityOrder[a.priority ?? ''] ?? 1;
      const bp = priorityOrder[b.priority ?? ''] ?? 1;
      if (ap !== bp) return bp - ap;
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
  }, [announcements, filter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markRead.mutateAsync(id);
      Toast.show({ type: 'success', text1: 'Announcement marked as read' });
    } catch (err) {
      Toast.show({ type: 'error', text1: (err as { message?: string })?.message ?? 'Failed to mark as read' });
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => Toast.show({ type: 'error', text1: 'Could not open link' }));
  };

  const openFile = (path: string) => {
    const url = getImageUrl(path) ?? path;
    Linking.openURL(url.startsWith('http') ? url : (url.startsWith('/') ? `${url}` : `/${url}`)).catch(() => Toast.show({ type: 'error', text1: 'Could not open file' }));
  };

  if (isLoading && announcements.length === 0) {
    return (
      <ScreenContainer padded>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded>
      <View style={styles.statsRow}>
        <View style={styles.badgeDanger}>
          <Text style={styles.badgeText}>{unreadCount} Unread</Text>
        </View>
        <View style={styles.badgePrimary}>
          <Text style={styles.badgeText}>{pinnedCount} Pinned</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
          onPress={() => { setFilter('all'); setPage(1); }}
        >
          <Text style={[styles.filterBtnText, filter === 'all' && styles.filterBtnTextActive]}>All ({announcements.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'unread' && styles.filterBtnActive]}
          onPress={() => { setFilter('unread'); setPage(1); }}
        >
          <Text style={[styles.filterBtnText, filter === 'unread' && styles.filterBtnTextActive]}>Unread ({unreadCount})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === 'pinned' && styles.filterBtnActive]}
          onPress={() => { setFilter('pinned'); setPage(1); }}
        >
          <Text style={[styles.filterBtnText, filter === 'pinned' && styles.filterBtnTextActive]}>Pinned ({pinnedCount})</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredList}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No announcements found</Text>
            <Text style={styles.emptySub}>You're all caught up!</Text>
          </View>
        }
        renderItem={({ item }) => {
          const priorityStyle = item.priority === 'URGENT' ? styles.priorityUrgent : item.priority === 'IMPORTANT' ? styles.priorityImportant : styles.priorityNormal;
          const imageUri = item.image ? getImageUrl(item.image) : null;
          return (
            <Card style={[styles.card, item.isPinned && styles.cardPinned, !item.isRead && styles.cardUnread]}>
              <View style={styles.cardHeader}>
                <Text style={styles.title}>
                  {item.isPinned ? '📌 ' : ''}
                  {item.priority === 'URGENT' ? '⚠️ ' : ''}
                  {item.title ?? '—'}
                  {!item.isRead ? <Text style={styles.newBadge}> New</Text> : null}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <View style={[styles.priorityBadge, priorityStyle]}>
                  <Text style={styles.priorityText}>{item.priority ?? 'NORMAL'}</Text>
                </View>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{item.announcementType ?? '—'}</Text>
                </View>
                <Text style={styles.dateText}>
                  {formatDate(item.createdAt)} at {formatTime(item.createdAt)}
                </Text>
              </View>
              <Text style={styles.message}>{item.message ?? ''}</Text>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
              ) : null}
              {item.file ? (
                <TouchableOpacity style={styles.attachBtn} onPress={() => openFile(item.file!)}>
                  <Text style={styles.attachBtnText}>📎 View Attachment</Text>
                </TouchableOpacity>
              ) : null}
              {item.link ? (
                <TouchableOpacity style={styles.linkBtn} onPress={() => openLink(item.link!)}>
                  <Text style={styles.linkBtnText}>🔗 View Link</Text>
                </TouchableOpacity>
              ) : null}
              {!item.isRead && (
                <Button
                  title="Mark as Read"
                  onPress={() => handleMarkAsRead(item._id)}
                  disabled={markRead.isPending}
                  style={styles.markReadBtn}
                />
              )}
            </Card>
          );
        }}
      />

      {pagination && pagination.pages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            <Text style={styles.pageBtnText}>‹ Previous</Text>
          </TouchableOpacity>
          <Text style={styles.pageText}>Page {page} of {pagination.pages}</Text>
          <TouchableOpacity
            style={[styles.pageBtn, page >= pagination.pages && styles.pageBtnDisabled]}
            onPress={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page >= pagination.pages}
          >
            <Text style={styles.pageBtnText}>Next ›</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>About Announcements</Text>
        <Text style={styles.infoText}>
          Important announcements from the platform appear here. Pinned announcements stay at the top. Read all to stay updated.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  badgeDanger: { backgroundColor: colors.error, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgePrimary: { backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { ...typography.caption, color: colors.textInverse, fontWeight: '600' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  filterBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 20, backgroundColor: colors.backgroundTertiary },
  filterBtnActive: { backgroundColor: colors.primary },
  filterBtnText: { ...typography.label, color: colors.textSecondary },
  filterBtnTextActive: { color: colors.textInverse },
  list: { paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.sm },
  cardPinned: { borderLeftWidth: 4, borderLeftColor: colors.primary },
  cardUnread: { backgroundColor: colors.primaryLight + '12' },
  cardHeader: { marginBottom: 4 },
  title: { ...typography.h3 },
  newBadge: { ...typography.caption, color: colors.error, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs },
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  priorityUrgent: { backgroundColor: colors.errorLight },
  priorityImportant: { backgroundColor: colors.warningLight },
  priorityNormal: { backgroundColor: colors.successLight },
  priorityText: { fontSize: 11, fontWeight: '600' },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: colors.backgroundTertiary },
  typeText: { fontSize: 11 },
  dateText: { ...typography.caption, color: colors.textSecondary },
  message: { ...typography.body, marginTop: 4 },
  image: { marginTop: spacing.sm, width: '100%', maxHeight: 200, borderRadius: 8 },
  attachBtn: { marginTop: spacing.sm, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.backgroundTertiary, borderRadius: 8 },
  attachBtnText: { ...typography.label },
  linkBtn: { marginTop: spacing.xs, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.primaryLight + '40', borderRadius: 8 },
  linkBtnText: { ...typography.label, color: colors.primary },
  markReadBtn: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  empty: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyTitle: { ...typography.h3 },
  emptySub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, gap: spacing.sm },
  pageBtn: { padding: spacing.sm },
  pageBtnDisabled: { opacity: 0.5 },
  pageBtnText: { ...typography.label, color: colors.primary },
  pageText: { ...typography.bodySmall, color: colors.textSecondary },
  infoBox: { marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.primaryLight + '20', borderRadius: 12 },
  infoTitle: { ...typography.label, marginBottom: 4 },
  infoText: { ...typography.bodySmall, color: colors.textSecondary },
});
