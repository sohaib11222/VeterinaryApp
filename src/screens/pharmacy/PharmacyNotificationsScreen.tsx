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
import i18n from '../../i18n/appI18n';

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

function formatTimeAgo(dateString: string | undefined, t: (key: string, opts?: any) => string): string {
  if (!dateString) return t('pharmacyNotifications.time.justNow');
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return t('pharmacyNotifications.time.justNow');
  if (diffInSeconds < 3600) return t('pharmacyNotifications.time.minutesAgo', { count: Math.floor(diffInSeconds / 60) });
  if (diffInSeconds < 86400) return t('pharmacyNotifications.time.hoursAgo', { count: Math.floor(diffInSeconds / 3600) });
  if (diffInSeconds < 604800) return t('pharmacyNotifications.time.daysAgo', { count: Math.floor(diffInSeconds / 86400) });
  const locale = i18n.language?.startsWith('it') ? 'it-IT' : 'en-GB';
  return date.toLocaleDateString(locale);
}

export function PharmacyNotificationsScreen() {
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
      Toast.show({ type: 'success', text1: t('pharmacyNotifications.toasts.allMarkedRead') });
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err, t('pharmacyNotifications.errors.failedToMarkAllRead')) });
    }
  };

  return (
    <ScreenContainer padded>
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{t('pharmacyNotifications.title')}</Text>
            <Text style={styles.subtitle}>{t('pharmacyNotifications.subtitle')}</Text>
          </View>
          {unreadCount > 0 ? (
            <Button
              title={markAll.isPending ? t('pharmacyNotifications.actions.marking') : t('pharmacyNotifications.actions.markAll')}
              variant="outline"
              onPress={onMarkAll}
              disabled={markAll.isPending}
            />
          ) : null}
        </View>

        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tab, filter === 'all' && styles.tabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>{t('common.all')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, filter === 'unread' && styles.tabActive]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[styles.tabText, filter === 'unread' && styles.tabTextActive]}>
              {unreadCount > 0
                ? t('pharmacyNotifications.tabs.unreadWithCount', { count: unreadCount })
                : t('pharmacyNotifications.tabs.unread')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, filter === 'read' && styles.tabActive]}
            onPress={() => setFilter('read')}
          >
            <Text style={[styles.tabText, filter === 'read' && styles.tabTextActive]}>{t('pharmacyNotifications.tabs.read')}</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {listQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{t('pharmacyNotifications.empty')}</Text>
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
                  Toast.show({ type: 'error', text1: getErrorMessage(err, t('pharmacyNotifications.errors.failedToMarkRead')) });
                }
              }}
            >
              <Card
                style={{
                  ...styles.itemCard,
                  ...(!item.isRead ? styles.unread : {}),
                }}
              >
                <Text style={styles.itemTitle}>{item.title || t('pharmacyNotifications.fallbackTitle')}</Text>
                {item.body ? <Text style={styles.itemBody}>{item.body}</Text> : null}
                <Text style={styles.itemTime}>{formatTimeAgo(item.createdAt, t)}</Text>
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
  title: { ...typography.h3 },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  tabsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.backgroundSecondary },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.bodySmall, color: colors.textSecondary },
  tabTextActive: { color: colors.textInverse, fontWeight: '700' },
  center: { paddingVertical: spacing.xxl, alignItems: 'center' },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary },
  list: { paddingBottom: spacing.xxl },
  itemCard: { marginBottom: spacing.sm },
  unread: { backgroundColor: colors.primaryLight + '12' },
  itemTitle: { ...typography.label },
  itemBody: { ...typography.bodySmall, marginTop: 4 },
  itemTime: { ...typography.caption, color: colors.textSecondary, marginTop: 6 },
});
