import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import './src/i18n/appI18n';
import { LanguageProvider } from './src/contexts/LanguageContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <RootNavigator />
            </CartProvider>
            <StatusBar style="dark" />
            <Toast />
          </AuthProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
