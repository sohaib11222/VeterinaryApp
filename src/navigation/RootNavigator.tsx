import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { PendingNavigator } from './PendingNavigator';
import { VetStackNavigator } from './VetStackNavigator';
import { PetOwnerStackNavigator } from './PetOwnerStackNavigator';
import { PharmacyTabNavigator } from './PharmacyTabNavigator';
import { RootStackParamList } from './types';
import { colors } from '../theme/colors';

const PENDING_STATUSES = ['PENDING', 'REJECTED', 'BLOCKED'] as const;

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { user, isLoading } = useAuth();
  const status = (user?.status ?? '').toUpperCase();
  const showPending = user && PENDING_STATUSES.includes(status as (typeof PENDING_STATUSES)[number]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : showPending ? (
          <Stack.Screen name="Pending" component={PendingNavigator} />
        ) : user.role === 'VETERINARIAN' ? (
          <Stack.Screen name="Main" component={VetStackNavigator} />
        ) : user.role === 'PET_OWNER' ? (
          <Stack.Screen name="Main" component={PetOwnerStackNavigator} />
        ) : user.role === 'PET_STORE' || user.role === 'PARAPHARMACY' ? (
          <Stack.Screen name="Main" component={PharmacyTabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
});
