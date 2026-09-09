import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { AppImage } from '../../components/common/AppImage';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { getImageUrl } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { useGetOrCreateConversation } from '../../mutations/chatMutations';
import { usePetSitter } from '../../queries/petSitterQueries';
import type { PetOwnerStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

type Route = RouteProp<PetOwnerStackParamList, 'PetOwnerPetSitterProfile'>;
const unwrap = (response: any) => response?.data?.data ?? response?.data ?? response;
const readable = (value: string) => value.toLowerCase().split('_').map((word) => `${word[0]}${word.slice(1)}`).join(' ');

export function PetOwnerPetSitterProfileScreen() {
  const { t } = useTranslation();
  const route = useRoute<Route>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const query = usePetSitter(route.params.petSitterId);
  const getConversation = useGetOrCreateConversation();
  const sitter = useMemo(() => unwrap(query.data), [query.data]);
  const profile = sitter?.profile ?? sitter?.petSitterProfile ?? {};
  const name = sitter?.name ?? sitter?.fullName ?? t('petSitter.more.role');

  const startChat = async () => {
    if (!user?.id) return;
    try {
      const response: any = await getConversation.mutateAsync({ petSitterId: route.params.petSitterId, petOwnerId: user.id });
      const conversation = response?.data?.data ?? response?.data ?? response;
      const id = String(conversation?._id ?? conversation?.id ?? '');
      if (!id) throw new Error('Conversation could not be opened');
      navigation.navigate('PetOwnerChatDetail', { conversationId: id, petSitterId: route.params.petSitterId, petOwnerId: user.id, conversationType: 'PET_SITTER_PET_OWNER', title: name, subtitle: t('petSitter.more.role'), peerImageUri: getImageUrl(sitter?.profileImage) ?? sitter?.profileImage });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: t('petSitter.details.chatError'), text2: error?.message ?? t('common.retry') });
    }
  };

  if (query.isLoading) return <ScreenContainer padded><View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View></ScreenContainer>;
  if (!sitter) return <ScreenContainer padded><View style={styles.center}><Text style={styles.error}>{t('petSitter.details.notFound')}</Text></View></ScreenContainer>;
  const city = [sitter.address?.city, sitter.address?.state, sitter.address?.country].filter(Boolean).join(', ');
  return <ScreenContainer padded scroll><View style={styles.hero}><View style={styles.avatar}>{sitter.profileImage ? <AppImage source={{ uri: getImageUrl(sitter.profileImage) ?? sitter.profileImage }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{name.charAt(0)}</Text>}</View><View style={styles.heroInfo}><Text style={styles.name}>{name}</Text><Text style={styles.role}>{t('petSitter.details.verified')}</Text>{city ? <Text style={styles.location}><Ionicons name="location-outline" size={14} color="rgba(255,255,255,.8)" /> {city}</Text> : null}</View></View>
    <Card style={styles.summary}><View style={styles.stat}><Text style={styles.statValue}>{Number(profile.experienceYears ?? 0)}</Text><Text style={styles.statLabel}>{t('petSitter.details.experience')}</Text></View><View style={styles.divider} /><View style={styles.stat}><Text style={styles.statValue}>{Array.isArray(profile.servicesOffered) ? profile.servicesOffered.length : 0}</Text><Text style={styles.statLabel}>{t('petSitter.details.services')}</Text></View><View style={styles.divider} /><View style={styles.stat}><Ionicons name={profile.isAvailable === false ? 'pause-circle-outline' : 'checkmark-circle'} size={24} color={profile.isAvailable === false ? colors.warning : colors.success} /><Text style={styles.statLabel}>{profile.isAvailable === false ? t('petSitter.details.unavailable') : t('petSitter.details.available')}</Text></View></Card>
    <Card style={styles.section}><Text style={styles.sectionTitle}>{t('petSitter.details.about')}</Text><Text style={styles.copy}>{profile.bio || profile.petSittingExperience || t('petSitter.details.noBio')}</Text></Card>
    <Card style={styles.section}><Text style={styles.sectionTitle}>{t('petSitter.details.pets')}</Text><View style={styles.chips}>{(profile.petTypes || []).map((item: string) => <View key={item} style={styles.chip}><Text style={styles.chipText}>{readable(item)}</Text></View>)}</View><Text style={[styles.sectionTitle, styles.subHeading]}>{t('petSitter.details.services')}</Text><View style={styles.chips}>{(profile.servicesOffered || []).map((item: string) => <View key={item} style={styles.chip}><Text style={styles.chipText}>{readable(item)}</Text></View>)}</View></Card>
    <Card style={styles.section}><Text style={styles.sectionTitle}>{t('petSitter.details.availability')}</Text><Text style={styles.copy}>{profile.availability?.[0]?.startTime ? t('petSitter.details.generalAvailability', { time: profile.availability[0].startTime }) : t('petSitter.details.availabilityText')}</Text></Card>
    <Button title={t('petSitter.details.startChat')} onPress={startChat} loading={getConversation.isPending} icon={<Ionicons name="chatbubble-ellipses-outline" size={19} color={colors.textInverse} />} style={styles.chatButton} />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, error: { ...typography.body, color: colors.error }, hero: { borderRadius: 22, padding: spacing.lg, backgroundColor: colors.primaryDark, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }, avatar: { width: 78, height: 78, borderRadius: 26, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successLight, marginRight: spacing.md }, avatarImage: { width: '100%', height: '100%' }, avatarText: { ...typography.h1, color: colors.primaryDark }, heroInfo: { flex: 1 }, name: { ...typography.h2, color: colors.textInverse }, role: { ...typography.bodySmall, color: colors.successLight, marginTop: 3 }, location: { ...typography.caption, color: 'rgba(255,255,255,.82)', marginTop: 8 }, summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }, stat: { flex: 1, alignItems: 'center', minWidth: 0 }, statValue: { ...typography.h2, color: colors.primaryDark }, statLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: 3 }, divider: { width: 1, height: 38, backgroundColor: colors.border }, section: { marginBottom: spacing.md }, sectionTitle: { ...typography.label, color: colors.primaryDark, marginBottom: spacing.sm }, subHeading: { marginTop: spacing.md }, copy: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }, chip: { borderRadius: 999, paddingVertical: 7, paddingHorizontal: 10, backgroundColor: colors.primaryLight + '18' }, chipText: { ...typography.caption, color: colors.primary, fontWeight: '700' }, chatButton: { marginTop: spacing.xs, marginBottom: spacing.xxl },
});
