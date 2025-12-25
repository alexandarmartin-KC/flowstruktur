'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Kompetence, PersonlighedsResultat } from '@/lib/mock-data';

interface OnboardingData {
  cvUploaded: boolean;
  kompetencer: Kompetence[];
  personlighedsResultater: PersonlighedsResultat[];
  completed: boolean;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateCVStatus: (uploaded: boolean) => void;
  updateKompetencer: (kompetencer: Kompetence[]) => void;
  updatePersonlighedsResultater: (resultater: PersonlighedsResultat[]) => void;
  markCompleted: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>({
    cvUploaded: false,
    kompetencer: [],
    personlighedsResultater: [],
    completed: false,
  });

  const updateCVStatus = (uploaded: boolean) => {
    setData(prev => ({ ...prev, cvUploaded: uploaded }));
  };

  const updateKompetencer = (kompetencer: Kompetence[]) => {
    setData(prev => ({ ...prev, kompetencer }));
  };

  const updatePersonlighedsResultater = (resultater: PersonlighedsResultat[]) => {
    setData(prev => ({ ...prev, personlighedsResultater: resultater }));
  };

  const markCompleted = () => {
    setData(prev => ({ ...prev, completed: true }));
  };

  return (
    <OnboardingContext.Provider
      value={{
        data,
        updateCVStatus,
        updateKompetencer,
        updatePersonlighedsResultater,
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
