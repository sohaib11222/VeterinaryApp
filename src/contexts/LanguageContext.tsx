import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import i18n from '../i18n/appI18n';
import { setApiLanguage, LANGUAGE_KEY } from '../api/client';

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => Promise<void>;
  isReady: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const normalizeLang = (lang: string) => {
  const cleaned = String(lang || '').trim();
  if (!cleaned) return 'it';
  const lower = cleaned.toLowerCase();
  if (lower.startsWith('it')) return 'it';
  return 'en';
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<string>('it');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(LANGUAGE_KEY);
        const initial = normalizeLang(stored || 'it');
        if (!cancelled) setLanguageState(initial);
        setApiLanguage(initial);
        await i18n.changeLanguage(initial);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = async (lang: string) => {
    const normalized = normalizeLang(lang);
    setLanguageState(normalized);
    setApiLanguage(normalized);
    await i18n.changeLanguage(normalized);
    await SecureStore.setItemAsync(LANGUAGE_KEY, normalized);
  };

  const value = useMemo(() => ({ language, setLanguage, isReady }), [language, isReady]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
