import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { EmailVerifiedChangePasswordScreen } from '../../components/auth/EmailVerifiedChangePasswordScreen';

export function PharmacyChangePasswordScreen() {
  const { user } = useAuth();
  return <EmailVerifiedChangePasswordScreen accountLabel={user?.role === 'PARAPHARMACY' ? 'parapharmacy' : 'pharmacy'} />;
}
