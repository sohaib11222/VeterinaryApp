import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VetStackParamList } from './types';
import { VetTabNavigator } from './VetTabNavigator';
import { VetHeader } from '../components/common/VetHeader';
import { useTranslation } from 'react-i18next';

// Detail screens – we'll add them as we build
import { VetAppointmentDetailScreen } from '../screens/vet/VetAppointmentDetailScreen';
import { VetStartAppointmentScreen } from '../screens/vet/VetStartAppointmentScreen';
import { VetPetRequestsScreen } from '../screens/vet/VetPetRequestsScreen';
import { VetClinicHoursScreen } from '../screens/vet/VetClinicHoursScreen';
import { VetMyPetsScreen } from '../screens/vet/VetMyPetsScreen';
import { VetVaccinationsScreen } from '../screens/vet/VetVaccinationsScreen';
import { VetReviewsScreen } from '../screens/vet/VetReviewsScreen';
import { VetInvoicesScreen } from '../screens/vet/VetInvoicesScreen';
import { VetInvoiceViewScreen } from '../screens/vet/VetInvoiceViewScreen';
import { VetPaymentSettingsScreen } from '../screens/vet/VetPaymentSettingsScreen';
import { VetRescheduleRequestsScreen } from '../screens/vet/VetRescheduleRequestsScreen';
import { VetChatDetailScreen } from '../screens/vet/VetChatDetailScreen';
import { VetAdminChatScreen } from '../screens/vet/VetAdminChatScreen';
import { VetNotificationsScreen } from '../screens/vet/VetNotificationsScreen';
import { VetBlogListScreen } from '../screens/vet/VetBlogListScreen';
import { VetBlogCreateScreen } from '../screens/vet/VetBlogCreateScreen';
import { VetBlogDetailScreen } from '../screens/vet/VetBlogDetailScreen';
import { VetAnnouncementsScreen } from '../screens/vet/VetAnnouncementsScreen';
import { VetSubscriptionScreen } from '../screens/vet/VetSubscriptionScreen';
import { VetProfileSettingsScreen } from '../screens/vet/VetProfileSettingsScreen';
import { VetSpecialitiesScreen } from '../screens/vet/VetSpecialitiesScreen';
import { VetExperienceSettingsScreen } from '../screens/vet/VetExperienceSettingsScreen';
import { VetEducationSettingsScreen } from '../screens/vet/VetEducationSettingsScreen';
import { VetAwardsSettingsScreen } from '../screens/vet/VetAwardsSettingsScreen';
import { VetInsuranceSettingsScreen } from '../screens/vet/VetInsuranceSettingsScreen';
import { VetClinicsSettingsScreen } from '../screens/vet/VetClinicsSettingsScreen';
import { VetBusinessSettingsScreen } from '../screens/vet/VetBusinessSettingsScreen';
import { VetSocialMediaScreen } from '../screens/vet/VetSocialMediaScreen';
import { VetChangePasswordScreen } from '../screens/vet/VetChangePasswordScreen';
import { VetPrescriptionScreen } from '../screens/vet/VetPrescriptionScreen';
import { VetAddWeightRecordScreen } from '../screens/vet/VetAddWeightRecordScreen';
import { VetAddVaccinationsScreen } from '../screens/vet/VetAddVaccinationsScreen';
import { LanguageScreen } from '../screens/shared/LanguageScreen';

const Stack = createNativeStackNavigator<VetStackParamList>();

function VetStackHeader({
  navigation,
  route,
}: {
  navigation: any;
  route: { name: string; params?: any };
}) {
  const { t } = useTranslation();
  const title = route.params?.title ?? t(`vetStack.${route.name}.title`, { defaultValue: route.name });
  const subtitle = route.params?.subtitle ?? t(`vetStack.${route.name}.subtitle`, { defaultValue: '' });
  return (
    <VetHeader
      title={title}
      subtitle={subtitle}
      onBack={() => navigation.goBack()}
      avatarUri={route.params?.peerImageUri ?? undefined}
    />
  );
}

export function VetStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        header: route.name === 'VetStartAppointment' ? undefined : () => <VetStackHeader navigation={navigation} route={route} />,
        headerShown: route.name === 'VetStartAppointment' ? false : true,
        animation: 'slide_from_right',
      })}
    >
      <Stack.Screen
        name="VetTabs"
        component={VetTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="VetAppointmentDetails" component={VetAppointmentDetailScreen} />
      <Stack.Screen name="VetStartAppointment" component={VetStartAppointmentScreen} />
      <Stack.Screen name="VetPetRequests" component={VetPetRequestsScreen} />
      <Stack.Screen name="VetClinicHours" component={VetClinicHoursScreen} />
      <Stack.Screen name="VetMyPets" component={VetMyPetsScreen} />
      <Stack.Screen name="VetVaccinations" component={VetVaccinationsScreen} />
      <Stack.Screen name="VetReviews" component={VetReviewsScreen} />
      <Stack.Screen name="VetInvoices" component={VetInvoicesScreen} />
      <Stack.Screen name="VetInvoiceView" component={VetInvoiceViewScreen} />
      <Stack.Screen name="VetPaymentSettings" component={VetPaymentSettingsScreen} />
      <Stack.Screen name="VetRescheduleRequests" component={VetRescheduleRequestsScreen} />
      <Stack.Screen name="Language" component={LanguageScreen} />
      <Stack.Screen name="VetChatDetail" component={VetChatDetailScreen} />
      <Stack.Screen name="VetAdminChat" component={VetAdminChatScreen} />
      <Stack.Screen name="VetNotifications" component={VetNotificationsScreen} />
      <Stack.Screen name="VetBlogList" component={VetBlogListScreen} />
      <Stack.Screen name="VetBlogCreate" component={VetBlogCreateScreen} />
      <Stack.Screen name="VetBlogDetail" component={VetBlogDetailScreen} />
      <Stack.Screen name="VetAnnouncements" component={VetAnnouncementsScreen} />
      <Stack.Screen name="VetSubscription" component={VetSubscriptionScreen} />
      <Stack.Screen name="VetProfileSettings" component={VetProfileSettingsScreen} />
      <Stack.Screen name="VetSpecialities" component={VetSpecialitiesScreen} />
      <Stack.Screen name="VetExperienceSettings" component={VetExperienceSettingsScreen} />
      <Stack.Screen name="VetEducationSettings" component={VetEducationSettingsScreen} />
      <Stack.Screen name="VetAwardsSettings" component={VetAwardsSettingsScreen} />
      <Stack.Screen name="VetInsuranceSettings" component={VetInsuranceSettingsScreen} />
      <Stack.Screen name="VetClinicsSettings" component={VetClinicsSettingsScreen} />
      <Stack.Screen name="VetBusinessSettings" component={VetBusinessSettingsScreen} />
      <Stack.Screen name="VetSocialMedia" component={VetSocialMediaScreen} />
      <Stack.Screen name="VetChangePassword" component={VetChangePasswordScreen} />
      <Stack.Screen name="VetPrescription" component={VetPrescriptionScreen} />
      <Stack.Screen name="VetAddWeightRecord" component={VetAddWeightRecordScreen} />
      <Stack.Screen name="VetAddVaccinations" component={VetAddVaccinationsScreen} />
    </Stack.Navigator>
  );
}
