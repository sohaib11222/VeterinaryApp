import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PetOwnerStackParamList } from './types';
import { VetHeader } from '../components/common/VetHeader';
import { PetOwnerTabNavigator } from './PetOwnerTabNavigator';
import { VetHeaderRightActionProvider, useVetHeaderRightAction } from '../contexts/VetHeaderRightActionContext';
import { useTranslation } from 'react-i18next';

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
import { LanguageScreen } from '../screens/shared/LanguageScreen';

const Stack = createNativeStackNavigator<PetOwnerStackParamList>();

function PetOwnerStackHeader({ navigation, route }: { navigation: any; route: { name: string; params?: any } }) {
  const rightActionCtx = useVetHeaderRightAction();
  const { t } = useTranslation();
  const title = route.params?.title ?? t(`petOwnerStack.${route.name}.title`, { defaultValue: route.name });
  const subtitle = route.params?.subtitle ?? t(`petOwnerStack.${route.name}.subtitle`, { defaultValue: '' });
  return (
    <VetHeader
      title={title}
      subtitle={subtitle}
      onBack={() => navigation.goBack()}
      avatarUri={route.params?.peerImageUri ?? undefined}
      rightAction={rightActionCtx?.rightAction ?? undefined}
    />
  );
}

export function PetOwnerStackNavigator() {
  return (
    <VetHeaderRightActionProvider>
      <Stack.Navigator
        screenOptions={({ navigation, route }) => ({
          header: route.name === 'PetOwnerVideoCall' ? undefined : () => <PetOwnerStackHeader navigation={navigation} route={route} />,
          headerShown: route.name === 'PetOwnerVideoCall' ? false : true,
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
        <Stack.Screen name="Language" component={LanguageScreen} />
        <Stack.Screen name="PetOwnerSearch" component={PetOwnerSearchScreen} />
        <Stack.Screen name="PetOwnerVetProfile" component={PetOwnerVetProfileScreenReal} />
        <Stack.Screen name="PetOwnerBooking" component={PetOwnerBookingScreenReal} />
        <Stack.Screen name="PetOwnerBookingCheckout" component={PetOwnerBookingCheckoutScreen} />
        <Stack.Screen name="PetOwnerBookingSuccess" component={PetOwnerBookingSuccessScreen} />
        <Stack.Screen name="PetOwnerCart" component={PetOwnerCartScreen} />
        <Stack.Screen name="PetOwnerCheckout" component={PetOwnerCheckoutScreen} />
        <Stack.Screen name="PetOwnerPaymentSuccess" component={PetOwnerPaymentSuccessScreen} />
      </Stack.Navigator>
    </VetHeaderRightActionProvider>
  );
}
