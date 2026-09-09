import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { PetSitterStackParamList } from './types';
import { VetHeader } from '../components/common/VetHeader';
import { PetSitterTabNavigator } from './PetSitterTabNavigator';
import { PetSitterChatDetailScreen } from '../screens/petsitter/PetSitterChatDetailScreen';
import { PetSitterProfileScreen } from '../screens/petsitter/PetSitterProfileScreen';
import { PetSitterSupportTicketsScreen, PetSitterCreateSupportTicketScreen } from '../screens/petsitter/PetSitterSupportScreens';
import { PetOwnerSupportTicketDetailScreen } from '../screens/petowner/PetOwnerSupportTicketDetailScreen';
import { PetSitterChangePasswordScreen } from '../screens/petsitter/PetSitterChangePasswordScreen';
import { PetOwnerNotificationsScreen } from '../screens/petowner/PetOwnerNotificationsScreen';
import { PetSitterOnboardingScreen } from '../screens/petsitter/PetSitterOnboardingScreen';
import { LanguageScreen } from '../screens/shared/LanguageScreen';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { useMyPetSitterProfile } from '../queries/petSitterQueries';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator<PetSitterStackParamList>();
const unwrap = (response: any) => response?.data?.data ?? response?.data ?? response;

export function PetSitterStackNavigator() {
  const { t } = useTranslation();
  const profileQuery = useMyPetSitterProfile();
  const sitter = useMemo(() => unwrap(profileQuery.data), [profileQuery.data]);
  const profile = sitter?.profile ?? sitter?.petSitterProfile ?? {};
  const onboardingRequired = !profile.profileCompleted || !Array.isArray(profile.petTypes) || !profile.petTypes.length || !Array.isArray(profile.servicesOffered) || !profile.servicesOffered.length;

  if (profileQuery.isLoading) return <ScreenContainer padded><View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></View></ScreenContainer>;
  if (onboardingRequired) return <Stack.Navigator screenOptions={{ headerShown: false }}><Stack.Screen name="PetSitterOnboarding">{() => <PetSitterOnboardingScreen onComplete={() => profileQuery.refetch()} />}</Stack.Screen></Stack.Navigator>;

  const headers: Record<string, { title: string; subtitle?: string }> = {
    PetSitterProfile: { title: t('petSitter.headers.profile'), subtitle: t('petSitter.headers.profileSubtitle') },
    PetSitterSupportTickets: { title: t('petSitter.headers.supportTickets'), subtitle: t('petSitter.headers.supportTicketsSubtitle') },
    PetSitterCreateSupportTicket: { title: t('petSitter.headers.newTicket'), subtitle: t('petSitter.headers.newTicketSubtitle') },
    PetSitterSupportTicketDetail: { title: t('petSitter.headers.ticket'), subtitle: t('petSitter.headers.ticketSubtitle') },
    PetSitterNotifications: { title: t('petSitter.headers.notifications'), subtitle: t('petSitter.headers.notificationsSubtitle') },
    PetSitterChangePassword: { title: t('petSitter.headers.changePassword'), subtitle: t('petSitter.headers.changePasswordSubtitle') },
    Language: { title: t('common.language') },
  };

  return <Stack.Navigator screenOptions={({ navigation, route }) => { const params = (route.params ?? {}) as any; const header = headers[route.name]; return { animation: 'slide_from_right', header: route.name === 'PetSitterTabs' ? undefined : () => <VetHeader title={params.title ?? header?.title ?? route.name} subtitle={params.subtitle ?? header?.subtitle} avatarUri={params.peerImageUri ?? undefined} onBack={() => navigation.goBack()} /> }; }}><Stack.Screen name="PetSitterTabs" component={PetSitterTabNavigator} options={{ headerShown: false }} /><Stack.Screen name="PetSitterChatDetail" component={PetSitterChatDetailScreen} /><Stack.Screen name="PetSitterProfile" component={PetSitterProfileScreen} /><Stack.Screen name="PetSitterSupportTickets" component={PetSitterSupportTicketsScreen} /><Stack.Screen name="PetSitterCreateSupportTicket" component={PetSitterCreateSupportTicketScreen} /><Stack.Screen name="PetSitterSupportTicketDetail" component={PetOwnerSupportTicketDetailScreen} /><Stack.Screen name="PetSitterChangePassword" component={PetSitterChangePasswordScreen} /><Stack.Screen name="PetSitterNotifications" component={PetOwnerNotificationsScreen} /><Stack.Screen name="Language" component={LanguageScreen} /></Stack.Navigator>;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
