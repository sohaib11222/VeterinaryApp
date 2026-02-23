import React, { createContext, useContext, useState, useCallback } from 'react';

type VetHeaderRightActionContextType = {
  rightAction: React.ReactNode | null;
  setRightAction: (node: React.ReactNode | null) => void;
};

const VetHeaderRightActionContext = createContext<VetHeaderRightActionContextType | null>(null);

export function VetHeaderRightActionProvider({ children }: { children: React.ReactNode }) {
  const [rightAction, setRightAction] = useState<React.ReactNode | null>(null);
  return (
    <VetHeaderRightActionContext.Provider value={{ rightAction, setRightAction }}>
      {children}
    </VetHeaderRightActionContext.Provider>
  );
}

export function useVetHeaderRightAction() {
  return useContext(VetHeaderRightActionContext);
}
