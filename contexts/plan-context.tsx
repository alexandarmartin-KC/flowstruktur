'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type PlanType = 'light' | 'pro';

interface PlanContextType {
  plan: PlanType;
  setPlan: (plan: PlanType) => void;
  isProUser: boolean;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<PlanType>('light');

  return (
    <PlanContext.Provider
      value={{
        plan,
        setPlan,
        isProUser: plan === 'pro',
      }}
    >
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}
