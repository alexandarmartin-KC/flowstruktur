'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OnboardingData {
  cvUploaded: boolean;
  completed: boolean;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateCVStatus: (uploaded: boolean) => void;
  markCompleted: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>({
    cvUploaded: false,
    completed: false,
  });

  const updateCVStatus = (uploaded: boolean) => {
    setData(prev => ({ ...prev, cvUploaded: uploaded }));
  };

  const markCompleted = () => {
    setData(prev => ({ ...prev, completed: true }));
  };

  return (
    <OnboardingContext.Provider
      value={{
        data,
        updateCVStatus,
        markCompleted,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
