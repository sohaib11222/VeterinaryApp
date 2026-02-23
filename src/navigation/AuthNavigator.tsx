import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { DoctorVerificationUploadScreen } from '../screens/auth/DoctorVerificationUploadScreen';
import { PetStoreVerificationUploadScreen } from '../screens/auth/PetStoreVerificationUploadScreen';
import { PendingApprovalScreen } from '../screens/auth/PendingApprovalScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="DoctorVerificationUpload" component={DoctorVerificationUploadScreen} />
      <Stack.Screen name="PetStoreVerificationUpload" component={PetStoreVerificationUploadScreen} />
      <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
    </Stack.Navigator>
  );
}
