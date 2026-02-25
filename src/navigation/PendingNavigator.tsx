import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { DoctorVerificationUploadScreen } from '../screens/auth/DoctorVerificationUploadScreen';
import { PharmacyPhoneVerificationScreen } from '../screens/auth/PharmacyPhoneVerificationScreen';
import { PetStoreVerificationUploadScreen } from '../screens/auth/PetStoreVerificationUploadScreen';
import { PendingApprovalScreen } from '../screens/auth/PendingApprovalScreen';

export type PendingStackParamList = {
  DoctorVerificationUpload: undefined;
  PharmacyPhoneVerification: undefined;
  PetStoreVerificationUpload: undefined;
  PendingApproval: undefined;
};

const Stack = createNativeStackNavigator<PendingStackParamList>();

export function PendingNavigator() {
  const { user } = useAuth();
  const role = (user?.role ?? '').toUpperCase();
  const isPharmacy = role === 'PET_STORE' || role === 'PARAPHARMACY';
  const needsPhoneVerification = isPharmacy && !user?.isPhoneVerified;

  const initialRouteName: keyof PendingStackParamList =
    role === 'VETERINARIAN'
      ? 'DoctorVerificationUpload'
      : isPharmacy
        ? needsPhoneVerification
          ? 'PharmacyPhoneVerification'
          : 'PetStoreVerificationUpload'
        : 'PendingApproval';

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="DoctorVerificationUpload" component={DoctorVerificationUploadScreen} />
      <Stack.Screen name="PharmacyPhoneVerification" component={PharmacyPhoneVerificationScreen} />
      <Stack.Screen name="PetStoreVerificationUpload" component={PetStoreVerificationUploadScreen} />
      <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
    </Stack.Navigator>
  );
}
