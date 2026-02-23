import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PetOwnerStackParamList } from './types';
import { VetHeader } from '../components/common/VetHeader';
import { PetOwnerTabNavigator } from './PetOwnerTabNavigator';

import { PetOwnerAppointmentDetailScreen } from '../screens/petowner/PetOwnerAppointmentDetailScreen';
import { PetOwnerFavouritesScreen } from '../screens/petowner/PetOwnerFavouritesScreen';
import { PetOwnerMyPetsScreen } from '../screens/petowner/PetOwnerMyPetsScreen';
import { PetOwnerAddPetScreen } from '../screens/petowner/PetOwnerAddPetScreen';
import { PetOwnerEditPetScreen } from '../screens/petowner/PetOwnerEditPetScreen';
import { PetOwnerMedicalRecordsScreen } from '../screens/petowner/PetOwnerMedicalRecordsScreen';
import { PetOwnerMedicalDetailsScreen } from '../screens/petowner/PetOwnerMedicalDetailsScreen';
import { PetOwnerWeightRecordsScreen } from '../screens/petowner/PetOwnerWeightRecordsScreen';
import { PetOwnerWalletScreen } from '../screens/petowner/PetOwnerWalletScreen';
import { PetOwnerInvoicesScreen } from '../screens/petowner/PetOwnerInvoicesScreen';
import { PetOwnerInvoiceViewScreen } from '../screens/petowner/PetOwnerInvoiceViewScreen';
import { PetOwnerOrderHistoryScreen } from '../screens/petowner/PetOwnerOrderHistoryScreen';
import { PetOwnerOrderDetailsScreen } from '../screens/petowner/PetOwnerOrderDetailsScreen';
import { PetOwnerDocumentsScreen } from '../screens/petowner/PetOwnerDocumentsScreen';
import { PetOwnerNotificationsScreen } from '../screens/petowner/PetOwnerNotificationsScreen';
import { PetOwnerChatDetailScreen } from '../screens/petowner/PetOwnerChatDetailScreen';
import { PetOwnerClinicMapScreen } from '../screens/petowner/PetOwnerClinicMapScreen';
import { PetOwnerProfileSettingsScreen } from '../screens/petowner/PetOwnerProfileSettingsScreen';
import { PetOwnerChangePasswordScreen } from '../screens/petowner/PetOwnerChangePasswordScreen';

import { PetOwnerPrescriptionScreen } from '../screens/petowner/PetOwnerPrescriptionScreen';
import {
  PetOwnerRequestRescheduleScreen,
  PetOwnerRescheduleRequestsScreen,
  PetOwnerVideoCallScreen,
  PetOwnerCartScreen,
  PetOwnerCheckoutScreen,
  PetOwnerPaymentSuccessScreen,
  PetOwnerClinicNavigationScreen,
} from '../screens/petowner/PetOwnerPlaceholderScreens';
import { PetOwnerSearchScreen } from '../screens/petowner/PetOwnerSearchScreen';
import { PetOwnerVetProfileScreen as PetOwnerVetProfileScreenReal } from '../screens/petowner/PetOwnerVetProfileScreen';
import { PetOwnerBookingScreen as PetOwnerBookingScreenReal } from '../screens/petowner/PetOwnerBookingScreen';
import { PetOwnerBookingCheckoutScreen } from '../screens/petowner/PetOwnerBookingCheckoutScreen';
import { PetOwnerBookingSuccessScreen } from '../screens/petowner/PetOwnerBookingSuccessScreen';

const Stack = createNativeStackNavigator<PetOwnerStackParamList>();

const SCREEN_TITLES: Record<string, { title: string; subtitle?: string }> = {
  PetOwnerAppointmentDetails: { title: 'Appointment Details', subtitle: 'Pet appointment' },
  PetOwnerRequestReschedule: { title: 'Request Reschedule', subtitle: 'Choose new date/time' },
  PetOwnerRescheduleRequests: { title: 'Reschedule Requests', subtitle: 'Track requests' },
  PetOwnerPrescription: { title: 'Prescription', subtitle: 'View prescription' },
  PetOwnerVideoCall: { title: 'Video Call', subtitle: 'Join consultation' },
  PetOwnerFavourites: { title: 'Favorite Veterinarians', subtitle: 'Your saved vets' },
  PetOwnerMyPets: { title: 'My Pets', subtitle: 'Manage your pets' },
  PetOwnerAddPet: { title: 'Add Pet', subtitle: 'Register a new pet' },
  PetOwnerEditPet: { title: 'Edit Pet', subtitle: 'Update pet details' },
  PetOwnerMedicalRecords: { title: 'Pet Medical Records', subtitle: 'Health history' },
  PetOwnerMedicalDetails: { title: 'Pet Vitals', subtitle: 'Vitals & weight' },
  PetOwnerWeightRecords: { title: 'Weight Records', subtitle: 'Weight history' },
  PetOwnerWallet: { title: 'Wallet', subtitle: 'Balance & top-up' },
  PetOwnerInvoices: { title: 'Veterinary Invoices', subtitle: 'Transaction history' },
  PetOwnerInvoiceView: { title: 'Invoice', subtitle: 'Transaction details' },
  PetOwnerOrderHistory: { title: 'Pet Supply Orders', subtitle: 'Order history' },
  PetOwnerOrderDetails: { title: 'Order Details', subtitle: 'Order info' },
  PetOwnerDocuments: { title: 'Pet Documents', subtitle: 'Downloads & receipts' },
  PetOwnerNotifications: { title: 'Notifications', subtitle: 'Alerts & updates' },
  PetOwnerChatDetail: { title: 'Chat', subtitle: 'Conversation' },
  PetOwnerClinicMap: { title: 'Nearby Clinics', subtitle: 'Find clinics' },
  PetOwnerClinicNavigation: { title: 'Clinic Navigation', subtitle: 'Directions' },
  PetOwnerProfileSettings: { title: 'Account Settings', subtitle: 'Edit profile' },
  PetOwnerChangePassword: { title: 'Change Password', subtitle: 'Update password' },
  PetOwnerSearch: { title: 'Find Veterinarian', subtitle: 'Search' },
  PetOwnerVetProfile: { title: 'Veterinarian', subtitle: 'Profile & book' },
  PetOwnerBooking: { title: 'Book Appointment', subtitle: 'Select date & time' },
  PetOwnerBookingCheckout: { title: 'Confirm Booking', subtitle: 'Review & pay' },
  PetOwnerBookingSuccess: { title: 'Booked', subtitle: 'Appointment confirmed' },
  PetOwnerCart: { title: 'Cart', subtitle: 'Pet supplies' },
  PetOwnerCheckout: { title: 'Checkout', subtitle: 'Review & pay' },
  PetOwnerPaymentSuccess: { title: 'Payment Success', subtitle: 'Order confirmed' },
};

function PetOwnerStackHeader({ navigation, route }: { navigation: any; route: { name: string; params?: any } }) {
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

export function PetOwnerStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => ({
        header: () => <PetOwnerStackHeader navigation={navigation} route={route} />,
        animation: 'slide_from_right',
      })}
    >
      <Stack.Screen name="PetOwnerTabs" component={PetOwnerTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="PetOwnerAppointmentDetails" component={PetOwnerAppointmentDetailScreen} />
      <Stack.Screen name="PetOwnerRequestReschedule" component={PetOwnerRequestRescheduleScreen} />
      <Stack.Screen name="PetOwnerRescheduleRequests" component={PetOwnerRescheduleRequestsScreen} />
      <Stack.Screen name="PetOwnerPrescription" component={PetOwnerPrescriptionScreen} />
      <Stack.Screen name="PetOwnerVideoCall" component={PetOwnerVideoCallScreen} />
      <Stack.Screen name="PetOwnerFavourites" component={PetOwnerFavouritesScreen} />
      <Stack.Screen name="PetOwnerMyPets" component={PetOwnerMyPetsScreen} />
      <Stack.Screen name="PetOwnerAddPet" component={PetOwnerAddPetScreen} />
      <Stack.Screen name="PetOwnerEditPet" component={PetOwnerEditPetScreen} />
      <Stack.Screen name="PetOwnerMedicalRecords" component={PetOwnerMedicalRecordsScreen} />
      <Stack.Screen name="PetOwnerMedicalDetails" component={PetOwnerMedicalDetailsScreen} />
      <Stack.Screen name="PetOwnerWeightRecords" component={PetOwnerWeightRecordsScreen} />
      <Stack.Screen name="PetOwnerWallet" component={PetOwnerWalletScreen} />
      <Stack.Screen name="PetOwnerInvoices" component={PetOwnerInvoicesScreen} />
      <Stack.Screen name="PetOwnerInvoiceView" component={PetOwnerInvoiceViewScreen} />
      <Stack.Screen name="PetOwnerOrderHistory" component={PetOwnerOrderHistoryScreen} />
      <Stack.Screen name="PetOwnerOrderDetails" component={PetOwnerOrderDetailsScreen} />
      <Stack.Screen name="PetOwnerDocuments" component={PetOwnerDocumentsScreen} />
      <Stack.Screen name="PetOwnerNotifications" component={PetOwnerNotificationsScreen} />
      <Stack.Screen name="PetOwnerChatDetail" component={PetOwnerChatDetailScreen} />
      <Stack.Screen name="PetOwnerClinicMap" component={PetOwnerClinicMapScreen} />
      <Stack.Screen name="PetOwnerClinicNavigation" component={PetOwnerClinicNavigationScreen} />
      <Stack.Screen name="PetOwnerProfileSettings" component={PetOwnerProfileSettingsScreen} />
      <Stack.Screen name="PetOwnerChangePassword" component={PetOwnerChangePasswordScreen} />
      <Stack.Screen name="PetOwnerSearch" component={PetOwnerSearchScreen} />
      <Stack.Screen name="PetOwnerVetProfile" component={PetOwnerVetProfileScreenReal} />
      <Stack.Screen name="PetOwnerBooking" component={PetOwnerBookingScreenReal} />
      <Stack.Screen name="PetOwnerBookingCheckout" component={PetOwnerBookingCheckoutScreen} />
      <Stack.Screen name="PetOwnerBookingSuccess" component={PetOwnerBookingSuccessScreen} />
      <Stack.Screen name="PetOwnerCart" component={PetOwnerCartScreen} />
      <Stack.Screen name="PetOwnerCheckout" component={PetOwnerCheckoutScreen} />
      <Stack.Screen name="PetOwnerPaymentSuccess" component={PetOwnerPaymentSuccessScreen} />
    </Stack.Navigator>
  );
}
