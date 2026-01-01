'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserProfile {
  // Personal info
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  title?: string;
  
  // Links
  linkedin?: string;
  portfolio?: string;
  
  // Optional
  profileImage?: string;
  bio?: string;
}

export interface ProfileCompleteness {
  percentage: number;
  missingFields: string[];
  isComplete: boolean;
}

export interface ExportRequirements {
  canExport: boolean;
  missingRequiredFields: string[];
}

interface UserProfileContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  clearProfile: () => void;
  
  // Helper functions
  getCompleteness: () => ProfileCompleteness;
  canExport: () => ExportRequirements;
  
  isLoaded: boolean;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

const STORAGE_KEY = 'flowstruktur_user_profile';

// All possible fields for completeness calculation
const ALL_FIELDS = ['name', 'email', 'phone', 'location', 'title', 'linkedin', 'portfolio'];

// Required fields for export (hard gate)
const REQUIRED_FOR_EXPORT = ['name', 'email', 'phone'];

// Field name translations for user-friendly messages
const FIELD_LABELS: Record<string, string> = {
  name: 'Fulde navn',
  email: 'Email',
  phone: 'Telefon',
  location: 'Adresse',
  title: 'Jobtitel',
  linkedin: 'LinkedIn',
  portfolio: 'Portfolio/hjemmeside',
  bio: 'Bio',
};

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load profile from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setProfile(parsed);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      } catch (error) {
        console.error('Error saving user profile:', error);
      }
    }
  }, [profile, isLoaded]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const clearProfile = () => {
    setProfile({});
    localStorage.removeItem(STORAGE_KEY);
  };

  const getCompleteness = (): ProfileCompleteness => {
    const filledFields = ALL_FIELDS.filter(field => {
      const value = profile[field as keyof UserProfile];
      return value && value.trim().length > 0;
    });

    const missingFields = ALL_FIELDS.filter(field => {
      const value = profile[field as keyof UserProfile];
      return !value || value.trim().length === 0;
    }).map(field => FIELD_LABELS[field] || field);

    const percentage = Math.round((filledFields.length / ALL_FIELDS.length) * 100);
    const isComplete = percentage === 100;

    return {
      percentage,
      missingFields,
      isComplete,
    };
  };

  const canExport = (): ExportRequirements => {
    const missingRequiredFields = REQUIRED_FOR_EXPORT.filter(field => {
      const value = profile[field as keyof UserProfile];
      return !value || value.trim().length === 0;
    }).map(field => FIELD_LABELS[field] || field);

    return {
      canExport: missingRequiredFields.length === 0,
      missingRequiredFields,
    };
  };

  const value: UserProfileContextType = {
    profile,
    updateProfile,
    clearProfile,
    getCompleteness,
    canExport,
    isLoaded,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}

// Export field labels for use in components
export { FIELD_LABELS, REQUIRED_FOR_EXPORT };
