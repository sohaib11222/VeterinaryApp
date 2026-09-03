import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import Toast from 'react-native-toast-message';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { useNotifications } from '../../queries/notificationQueries';
import { useMarkAllNotificationsRead, useMarkNotificationRead } from '../../mutations/notificationMutations';
import { getErrorMessage } from '../../utils/errorUtils';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { formatNotificationDateTime } from '../../utils/dateTime';

type Filter = 'all' | 'unread' | 'read';

type NotificationItem = {
  _id: string;
  title?: string;
  body?: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
};

function normalizeNotifications(response: unknown): NotificationItem[] {
  const outer = (response as { data?: unknown })?.data ?? response;
  const payload = (outer as { data?: unknown })?.data ?? outer;
  const list = (payload as { notifications?: unknown[] })?.notifications;
  return Array.isArray(list)
    ? list
        .map((n) => n as Record<string, unknown>)
        .filter(Boolean)
        .map((n) => ({
          _id: String(n._id ?? ''),
          title: (n.title as string) ?? '',
          body: (n.body as string) ?? '',
          type: (n.type as string) ?? 'SYSTEM',
          isRead: Boolean(n.isRead),
          createdAt: (n.createdAt as string) ?? undefined,
        }))
        .filter((n) => !!n._id)
    : [];
}

function notificationIcon(type?: string): keyof typeof Ionicons.glyphMap {
  const normalized = String(type ?? '').toUpperCase();
  if (normalized.includes('PAYMENT')) return 'card-outline';
  if (normalized.includes('PRESCRIPTION')) return 'document-text-outline';
  if (normalized.includes('MESSAGE') || normalized.includes('CHAT')) return 'chatbubble-ellipses-outline';
  if (normalized.includes('APPOINTMENT') || normalized.includes('RESCHEDULE')) return 'calendar-outline';
  return 'notifications-outline';
}

export function VetNotificationsScreen() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>('all');
  const params = useMemo(() => {
    const p: { page: number; limit: number; unreadOnly?: boolean } = { page: 1, limit: 50 };
    if (filter === 'unread') p.unreadOnly = true;
    return p;
  }, [filter]);

  const listQuery = useNotifications(params);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const allItems = useMemo(() => normalizeNotifications(listQuery.data), [listQuery.data]);
  const items = useMemo(() => {
    if (filter === 'read') return allItems.filter((n) => n.isRead);
    return allItems;
  }, [allItems, filter]);

  const unreadCount = useMemo(() => allItems.filter((n) => !n.isRead).length, [allItems]);

  const onMarkAll = async () => {
    try {
      await markAll.mutateAsync();
      Toast.show({ type: 'success', text1: t('vetNotifications.toasts.markAllSuccess') });
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err, t('vetNotifications.errors.markAllFailed')) });
    }
  };

  return (
    <ScreenContainer padded>
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{t('vetNotifications.title')}</Text>
            <Text style={styles.subtitle}>{t('vetNotifications.subtitle')}</Text>
          </View>
          {unreadCount > 0 ? (
            <Button
              title={markAll.isPending ? t('vetNotifications.actions.marking') : t('vetNotifications.actions.markAll')}
              variant="outline"
              onPress={onMarkAll}
              disabled={markAll.isPending}
            />
          ) : null}
        </View>

        <View style={styles.tabsRow}>
          <TouchableOpacity style={[styles.tab, filter === 'all' && styles.tabActive]} onPress={() => setFilter('all')}>
            <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>{t('vetNotifications.tabs.all')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, filter === 'unread' && styles.tabActive]} onPress={() => setFilter('unread')}>
            <Text style={[styles.tabText, filter === 'unread' && styles.tabTextActive]}>
              {t('vetNotifications.tabs.unread')} {unreadCount > 0 ? `(${unreadCount})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, filter === 'read' && styles.tabActive]} onPress={() => setFilter('read')}>
            <Text style={[styles.tabText, filter === 'read' && styles.tabTextActive]}>{t('vetNotifications.tabs.read')}</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {listQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{t('vetNotifications.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={listQuery.isFetching} onRefresh={() => listQuery.refetch()} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={async () => {
                if (item.isRead) return;
                try {
                  await markRead.mutateAsync(item._id);
                } catch (err) {
                  Toast.show({ type: 'error', text1: getErrorMessage(err, t('vetNotifications.errors.markReadFailed')) });
                }
              }}
            >
              <Card style={[styles.itemCard, !item.isRead && styles.unread]}>
                <View style={styles.itemRow}>
                  <View style={[styles.typeIcon, !item.isRead && styles.typeIconUnread]}><Ionicons name={notificationIcon(item.type)} size={19} color={colors.primary} /></View>
                  <View style={styles.itemCopy}>
                    <View style={styles.titleRow}><Text style={[styles.title, !item.isRead && styles.titleUnread]}>{item.title || t('vetNotifications.fallbackTitle')}</Text>{!item.isRead ? <View style={styles.unreadDot} /> : null}</View>
                    {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
                    <Text style={styles.time}>{formatNotificationDateTime(item.createdAt)}</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerCard: { marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { ...typography.h3 },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  tabsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.backgroundSecondary },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.bodySmall, color: colors.textSecondary },
  tabTextActive: { color: colors.textInverse, fontWeight: '700' },
  center: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
  list: { paddingBottom: spacing.xxl },
  itemCard: { marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.borderLight },
  unread: { backgroundColor: colors.primaryLight + '10', borderColor: colors.primaryLight + '38' },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start' },
  typeIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.backgroundSecondary, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  typeIconUnread: { backgroundColor: colors.primaryLight + '22' }, itemCopy: { flex: 1 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  title: { ...typography.label },
  titleUnread: { color: colors.primaryDark, fontWeight: '800' },
  body: { ...typography.bodySmall, marginTop: 4 },
  time: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
});
