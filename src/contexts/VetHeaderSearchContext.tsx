import React, { createContext, useContext, useMemo, useState } from 'react';

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

  const value = useMemo(() => ({ config, setConfig }), [config]);
  return (
    <VetHeaderSearchContext.Provider value={value}>
      {children}
    </VetHeaderSearchContext.Provider>
  );
}

export function useVetHeaderSearch() {
  const ctx = useContext(VetHeaderSearchContext);
  return ctx;
}
