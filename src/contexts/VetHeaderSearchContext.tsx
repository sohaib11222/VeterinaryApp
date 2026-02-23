import React, { createContext, useContext, useState, useCallback } from 'react';

export interface VetHeaderSearchConfig {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}

type VetHeaderSearchContextType = {
  config: VetHeaderSearchConfig | null;
  setConfig: (config: VetHeaderSearchConfig | null) => void;
};

const VetHeaderSearchContext = createContext<VetHeaderSearchContextType | null>(null);

export function VetHeaderSearchProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<VetHeaderSearchConfig | null>(null);
  return (
    <VetHeaderSearchContext.Provider value={{ config, setConfig }}>
      {children}
    </VetHeaderSearchContext.Provider>
  );
}

export function useVetHeaderSearch() {
  const ctx = useContext(VetHeaderSearchContext);
  return ctx;
}
