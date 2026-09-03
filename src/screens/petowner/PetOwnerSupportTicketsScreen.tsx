import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Card } from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { SUPPORT_CATEGORIES, SUPPORT_STATUSES, supportLabel } from '../../constants/supportTickets';
import { useSupportTickets } from '../../queries/supportTicketQueries';
import { ResponsiveFilterChips } from '../../components/common/ResponsiveFilterChips';

type Ticket = { _id: string; ticketNumber?: string; subject?: string; category?: string; status?: string; priority?: string; lastMessageAt?: string; updatedAt?: string; unreadForPatient?: boolean };

function unwrapTickets(response: unknown): Ticket[] {
  const outer = (response as { data?: unknown })?.data ?? response;
  const data = (outer as { data?: unknown })?.data ?? outer;
  const tickets = (data as { tickets?: unknown[] })?.tickets;
  return Array.isArray(tickets) ? tickets as Ticket[] : [];
}

function statusColor(status?: string) {
  return ({ OPEN: colors.primary, IN_PROGRESS: colors.info, WAITING_FOR_PATIENT: colors.warning, RESOLVED: colors.success, CLOSED: colors.textSecondary } as Record<string, string>)[String(status || '').toUpperCase()] || colors.textSecondary;
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  return isToday
    ? `Today · ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
    : date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function PetOwnerSupportTicketsScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const query = useSupportTickets({ search: search.trim() || undefined, status: status || undefined, category: category || undefined, page: 1, limit: 50 });
  const tickets = useMemo(() => unwrapTickets(query.data), [query.data]);

  const renderTicket = ({ item }: { item: Ticket }) => {
    const tone = statusColor(item.status);
    return <TouchableOpacity activeOpacity={0.78} onPress={() => navigation.navigate('PetOwnerSupportTicketDetail', { ticketId: item._id })}>
      <Card style={[styles.ticketCard, item.unreadForPatient && styles.unreadCard]}>
        <View style={styles.ticketTop}>
          <View style={styles.ticketHeading}>
            <Text style={styles.ticketNumber}>{item.ticketNumber || 'SUPPORT'}</Text>
            {item.unreadForPatient ? <View style={styles.newDot} /> : null}
          </View>
          <View style={[styles.status, { backgroundColor: tone + '1E' }]}><Text style={[styles.statusText, { color: tone }]}>{supportLabel(item.status)}</Text></View>
        </View>
        <Text style={styles.subject} numberOfLines={2}>{item.subject || 'Support request'}</Text>
        <View style={styles.ticketMeta}>
          <Text style={styles.metaText}>{supportLabel(item.category)}</Text>
          <Text style={styles.metaDivider}>•</Text>
          <Text style={[styles.priority, { color: item.priority === 'URGENT' ? colors.error : colors.textSecondary }]}>{supportLabel(item.priority)} priority</Text>
        </View>
        <View style={styles.ticketFooter}>
          <Text style={styles.updated}>Updated {formatDate(item.lastMessageAt || item.updatedAt)}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
        </View>
      </Card>
    </TouchableOpacity>;
  };

  return <ScreenContainer padded>
    <View style={styles.hero}>
      <View style={styles.heroIcon}><Ionicons name="headset-outline" size={24} color={colors.primaryDark} /></View>
      <View style={styles.heroCopy}><Text style={styles.heroTitle}>Support Center</Text><Text style={styles.heroSubtitle}>Keep every request, reply, and document together.</Text></View>
      <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate('PetOwnerCreateSupportTicket')}><Ionicons name="add" size={19} color={colors.textInverse} /><Text style={styles.createText}>New</Text></TouchableOpacity>
    </View>
    <View style={styles.search}><Ionicons name="search-outline" size={19} color={colors.textSecondary} /><TextInput value={search} onChangeText={setSearch} placeholder="Search ticket or subject" placeholderTextColor={colors.textLight} style={styles.searchInput} /></View>
    <Text style={styles.filterLabel}>STATUS</Text>
    <ResponsiveFilterChips width={144} value={status} onChange={setStatus} accessibilityLabel="Filter support tickets by status" options={['', ...SUPPORT_STATUSES].map((value) => ({ value, label: value ? supportLabel(value) : 'All statuses' }))} />
    <ResponsiveFilterChips width={164} value={category} onChange={setCategory} accessibilityLabel="Filter support tickets by category" options={[{ value: '', label: 'All categories' }, ...SUPPORT_CATEGORIES.map(([value, label]) => ({ value, label }))]} />
    {query.isLoading ? <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View> : <FlatList
      data={tickets}
      keyExtractor={(item) => item._id}
      renderItem={renderTicket}
      refreshControl={<RefreshControl refreshing={query.isFetching} onRefresh={() => query.refetch()} />}
      contentContainerStyle={tickets.length ? styles.list : styles.emptyList}
      ListEmptyComponent={<View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="help-buoy-outline" size={34} color={colors.primary} /></View><Text style={styles.emptyTitle}>No support tickets yet</Text><Text style={styles.emptyCopy}>Need help with an appointment, payment, or order? Create a secure support request.</Text><TouchableOpacity style={styles.emptyAction} onPress={() => navigation.navigate('PetOwnerCreateSupportTicket')}><Text style={styles.emptyActionText}>Contact support</Text></TouchableOpacity></View>}
    />}
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryDark, padding: spacing.md, borderRadius: 18, marginBottom: spacing.md }, heroIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successLight, marginRight: spacing.sm }, heroCopy: { flex: 1, minWidth: 0 }, heroTitle: { ...typography.h3, color: colors.textInverse }, heroSubtitle: { ...typography.caption, color: 'rgba(255,255,255,0.75)', marginTop: 3 }, createButton: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 11, backgroundColor: colors.primaryLight }, createText: { ...typography.label, color: colors.textInverse }, search: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: spacing.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md }, searchInput: { flex: 1, ...typography.body, paddingVertical: 0 }, filterLabel: { ...typography.caption, color: colors.textSecondary, letterSpacing: .5, fontWeight: '800', marginBottom: 6 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' }, list: { paddingBottom: spacing.xxl }, emptyList: { flexGrow: 1, justifyContent: 'center', paddingBottom: spacing.xxl }, ticketCard: { marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.borderLight }, unreadCard: { borderColor: colors.primaryLight + '55', backgroundColor: colors.primaryLight + '0B' }, ticketTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }, ticketHeading: { flexDirection: 'row', alignItems: 'center', gap: 7, flex: 1 }, ticketNumber: { ...typography.caption, color: colors.primary, fontWeight: '800', letterSpacing: .5 }, newDot: { height: 7, width: 7, borderRadius: 4, backgroundColor: colors.secondaryDark }, status: { paddingVertical: 5, paddingHorizontal: 8, borderRadius: 999 }, statusText: { ...typography.caption, fontWeight: '800' }, subject: { ...typography.label, marginTop: 8 }, ticketMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 7, gap: 6 }, metaText: { ...typography.caption, color: colors.textSecondary }, metaDivider: { color: colors.textLight }, priority: { ...typography.caption, fontWeight: '700' }, ticketFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.sm, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight }, updated: { ...typography.caption, color: colors.textLight }, empty: { alignItems: 'center', paddingHorizontal: spacing.lg }, emptyIcon: { height: 72, width: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '18', marginBottom: spacing.md }, emptyTitle: { ...typography.h3 }, emptyCopy: { ...typography.bodySmall, textAlign: 'center', marginTop: 6, lineHeight: 20 }, emptyAction: { marginTop: spacing.md, borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: 10, backgroundColor: colors.primary }, emptyActionText: { ...typography.label, color: colors.textInverse },
});
