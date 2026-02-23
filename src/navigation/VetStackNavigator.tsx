import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VetStackParamList } from './types';
import { VetTabNavigator } from './VetTabNavigator';
import { VetHeader } from '../components/common/VetHeader';

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

const Stack = createNativeStackNavigator<VetStackParamList>();

const SCREEN_TITLES: Record<string, { title: string; subtitle?: string }> = {
  VetAppointmentDetails: { title: 'Appointment Details', subtitle: 'Pet appointment' },
  VetStartAppointment: { title: 'Video Session', subtitle: 'Start consultation' },
  VetPetRequests: { title: 'Pet Requests', subtitle: 'Manage appointment requests' },
  VetClinicHours: { title: 'Clinic Hours', subtitle: 'Available timings' },
  VetMyPets: { title: 'My Pets', subtitle: 'Patients & owners' },
  VetVaccinations: { title: 'Vaccinations', subtitle: 'Vaccination records' },
  VetReviews: { title: 'Pet Owner Reviews', subtitle: 'Reviews & ratings' },
  VetInvoices: { title: 'Invoices', subtitle: 'Transaction history' },
  VetInvoiceView: { title: 'Invoice', subtitle: 'Transaction details' },
  VetPaymentSettings: { title: 'Payment Settings', subtitle: 'Payout & bank info' },
  VetRescheduleRequests: { title: 'Reschedule Requests', subtitle: 'Manage requests' },
  VetChatDetail: { title: 'Chat', subtitle: 'Conversation' },
  VetAdminChat: { title: 'Admin Messages', subtitle: 'Support' },
  VetNotifications: { title: 'Notifications', subtitle: 'Alerts & updates' },
  VetBlogList: { title: 'Blog Posts', subtitle: 'Your articles' },
  VetBlogCreate: { title: 'New Blog Post', subtitle: 'Create article' },
  VetBlogDetail: { title: 'Blog Post', subtitle: 'Article details' },
  VetAnnouncements: { title: 'Announcements', subtitle: 'Clinic announcements' },
  VetSubscription: { title: 'Subscription', subtitle: 'Your plan' },
  VetProfileSettings: { title: 'Profile Settings', subtitle: 'Edit your profile' },
  VetSpecialities: { title: 'Specialties & Services', subtitle: 'Services you offer' },
  VetExperienceSettings: { title: 'Experience', subtitle: 'Work history' },
  VetEducationSettings: { title: 'Education', subtitle: 'Qualifications' },
  VetAwardsSettings: { title: 'Awards', subtitle: 'Recognition' },
  VetInsuranceSettings: { title: 'Insurances', subtitle: 'Accepted insurances' },
  VetClinicsSettings: { title: 'Clinics', subtitle: 'Your clinic locations' },
  VetBusinessSettings: { title: 'Business Hours', subtitle: 'Availability' },
  VetSocialMedia: { title: 'Social Media', subtitle: 'Your social links' },
  VetChangePassword: { title: 'Change Password', subtitle: 'Update password' },
  VetPrescription: { title: 'Prescription', subtitle: 'Create or view' },
  VetAddWeightRecord: { title: 'Add weight record', subtitle: 'Record weight & complete' },
  VetAddVaccinations: { title: 'Add vaccinations', subtitle: 'Record vaccinations & complete' },
};

function VetStackHeader({
  navigation,
  route,
}: {
  navigation: any;
  route: { name: string; params?: any };
}) {
  const config = SCREEN_TITLES[route.name] || { title: route.name, subtitle: '' };
  return (
    <VetHeader
      title={route.params?.title ?? config.title}
      subtitle={route.params?.subtitle ?? config.subtitle}
      onBack={() => navigation.goBack()}
      avatarUri={route.params?.peerImageUri ?? undefined}
    />
  );
}

export function VetStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        header: () => <VetStackHeader navigation={navigation} route={route} />,
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
