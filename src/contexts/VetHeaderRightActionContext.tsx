import React, { createContext, useContext, useMemo, useState } from 'react';

type VetHeaderRightActionContextType = {
  rightAction: React.ReactNode | null;
  setRightAction: (node: React.ReactNode | null) => void;
};

const VetHeaderRightActionContext = createContext<VetHeaderRightActionContextType | null>(null);

export function VetHeaderRightActionProvider({ children }: { children: React.ReactNode }) {
  const [rightAction, setRightAction] = useState<React.ReactNode | null>(null);

  const value = useMemo(() => ({ rightAction, setRightAction }), [rightAction]);
  return (
    <VetHeaderRightActionContext.Provider value={value}>
      {children}
    </VetHeaderRightActionContext.Provider>
  );
}

export function useVetHeaderRightAction() {
  return useContext(VetHeaderRightActionContext);
}
