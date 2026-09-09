import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { AppImage } from '../../components/common/AppImage';
import { Card } from '../../components/common/Card';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { getImageUrl } from '../../config/api';
import { useConversations } from '../../queries/chatQueries';
import { useMyPetSitterProfile } from '../../queries/petSitterQueries';
import { useSupportTicketUnreadCount } from '../../queries/supportTicketQueries';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const unwrap = (response: any) => response?.data?.data ?? response?.data ?? response;
const count = (response: any) => Number(response?.data?.data?.unreadCount ?? response?.data?.unreadCount ?? response?.unreadCount ?? 0) || 0;

export function PetSitterDashboardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const stack = navigation.getParent();
  const profileQuery = useMyPetSitterProfile();
  const chats = useConversations({ limit: 50 }, { refetchInterval: 15_000 });
  const supportUnread = useSupportTicketUnreadCount({ refetchInterval: 15_000 });
  const sitter = useMemo(() => unwrap(profileQuery.data), [profileQuery.data]);
  const profile = sitter?.profile ?? sitter?.petSitterProfile ?? {};
  const conversations = chats.data?.data?.conversations ?? chats.data?.conversations ?? [];
  const unreadChats = Array.isArray(conversations) ? conversations.reduce((total: number, item: any) => total + (Number(item?.unreadCount) || 0), 0) : 0;
  const types = Array.isArray(profile.petTypes) ? profile.petTypes : [];

  if (profileQuery.isLoading) return <ScreenContainer padded><View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View></ScreenContainer>;
  const name = sitter?.name ?? sitter?.fullName ?? t('petSitter.more.role');
  return <ScreenContainer padded scroll>
    <View style={styles.welcome}><View style={styles.avatar}>{sitter?.profileImage ? <AppImage source={{ uri: getImageUrl(sitter.profileImage) ?? sitter.profileImage }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{name.charAt(0)}</Text>}</View><View style={styles.welcomeCopy}><Text style={styles.eyebrow}>{t('petSitter.dashboard.eyebrow')}</Text><Text style={styles.name}>{t('petSitter.dashboard.hello', { name: name.split(' ')[0] })}</Text><Text style={styles.sub}>{t('petSitter.dashboard.subtitle')}</Text></View></View>
    <View style={styles.stats}><Card style={styles.statCard}><Ionicons name="paw-outline" size={20} color={colors.primary} /><Text style={styles.statValue}>{types.length}</Text><Text style={styles.statLabel}>{t('petSitter.dashboard.petTypes')}</Text></Card><Card style={styles.statCard}><Ionicons name="briefcase-outline" size={20} color={colors.accent} /><Text style={styles.statValue}>{Array.isArray(profile.servicesOffered) ? profile.servicesOffered.length : 0}</Text><Text style={styles.statLabel}>{t('petSitter.dashboard.services')}</Text></Card><Card style={styles.statCard}><Ionicons name="chatbubbles-outline" size={20} color={colors.info} /><Text style={styles.statValue}>{unreadChats}</Text><Text style={styles.statLabel}>{t('petSitter.dashboard.unreadChats')}</Text></Card><Card style={styles.statCard}><Ionicons name="headset-outline" size={20} color={colors.secondaryDark} /><Text style={styles.statValue}>{count(supportUnread.data)}</Text><Text style={styles.statLabel}>{t('petSitter.dashboard.supportReplies')}</Text></Card></View>
    <Text style={styles.sectionTitle}>{t('petSitter.dashboard.quickActions')}</Text><View style={styles.actions}><Action icon="person-outline" label={t('petSitter.dashboard.editProfile')} copy={t('petSitter.dashboard.editProfileText')} onPress={() => stack?.navigate('PetSitterProfile')} /><Action icon="chatbubble-ellipses-outline" label={t('petSitter.dashboard.chats')} copy={t('petSitter.dashboard.chatsText')} onPress={() => navigation.navigate('PetSitterChats')} /><Action icon="headset-outline" label={t('petSitter.dashboard.support')} copy={t('petSitter.dashboard.supportText')} onPress={() => stack?.navigate('PetSitterSupportTickets')} /></View>
  </ScreenContainer>;
}

function Action({ icon, label, copy, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; copy: string; onPress: () => void }) { return <TouchableOpacity onPress={onPress} activeOpacity={0.8}><Card style={styles.action}><View style={styles.actionIcon}><Ionicons name={icon} size={21} color={colors.primary} /></View><View style={styles.actionCopy}><Text style={styles.actionLabel}>{label}</Text><Text style={styles.actionText}>{copy}</Text></View><Ionicons name="chevron-forward" size={19} color={colors.textLight} /></Card></TouchableOpacity>; }
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, welcome: { backgroundColor: colors.primaryDark, borderRadius: 22, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }, avatar: { width: 64, height: 64, borderRadius: 21, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successLight, marginRight: spacing.md }, avatarImage: { width: '100%', height: '100%' }, avatarText: { ...typography.h1, color: colors.primaryDark }, welcomeCopy: { flex: 1 }, eyebrow: { ...typography.caption, color: colors.secondaryLight, fontWeight: '800', letterSpacing: .7 }, name: { ...typography.h2, color: colors.textInverse, marginTop: 3 }, sub: { ...typography.caption, color: 'rgba(255,255,255,.78)', marginTop: 5, lineHeight: 17 }, setup: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, backgroundColor: colors.successLight, padding: spacing.md, marginTop: spacing.md, gap: spacing.sm }, setupCopy: { flex: 1 }, setupTitle: { ...typography.label, color: colors.primaryDark }, setupText: { ...typography.caption, color: colors.textSecondary, marginTop: 2, lineHeight: 16 }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }, statCard: { width: '48%', minHeight: 112, justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: colors.borderLight }, statValue: { ...typography.h2, color: colors.primaryDark, marginTop: 2 }, statLabel: { ...typography.caption, color: colors.textSecondary }, sectionTitle: { ...typography.h3, color: colors.primaryDark, marginTop: spacing.lg, marginBottom: spacing.sm }, actions: { gap: spacing.sm, paddingBottom: spacing.xxl }, action: { flexDirection: 'row', alignItems: 'center' }, actionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '1A', marginRight: spacing.sm }, actionCopy: { flex: 1 }, actionLabel: { ...typography.label, color: colors.text }, actionText: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
