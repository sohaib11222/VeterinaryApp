import React from 'react';
import { useTranslation } from 'react-i18next';
import { EmailVerifiedChangePasswordScreen } from '../../components/auth/EmailVerifiedChangePasswordScreen';

export function PetSitterChangePasswordScreen() {
  const { t } = useTranslation();
  return <EmailVerifiedChangePasswordScreen accountLabel={t('petSitter.more.role')} />;
}
