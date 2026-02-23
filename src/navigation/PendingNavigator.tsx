import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { DoctorVerificationUploadScreen } from '../screens/auth/DoctorVerificationUploadScreen';
import { PetStoreVerificationUploadScreen } from '../screens/auth/PetStoreVerificationUploadScreen';
import { PendingApprovalScreen } from '../screens/auth/PendingApprovalScreen';

export type PendingStackParamList = {
  DoctorVerificationUpload: undefined;
  PetStoreVerificationUpload: undefined;
  PendingApproval: undefined;
};

const Stack = createNativeStackNavigator<PendingStackParamList>();

export function PendingNavigator() {
  const { user } = useAuth();
  const role = (user?.role ?? '').toUpperCase();

  const initialRouteName: keyof PendingStackParamList =
    role === 'VETERINARIAN'
      ? 'DoctorVerificationUpload'
      : role === 'PET_STORE' || role === 'PARAPHARMACY'
        ? 'PetStoreVerificationUpload'
        : 'PendingApproval';

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="DoctorVerificationUpload" component={DoctorVerificationUploadScreen} />
      <Stack.Screen name="PetStoreVerificationUpload" component={PetStoreVerificationUploadScreen} />
      <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
    </Stack.Navigator>
  );
}
