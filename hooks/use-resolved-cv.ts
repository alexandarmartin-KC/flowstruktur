'use client';

import { useState, useEffect } from 'react';
import { useSavedJobs } from '@/contexts/saved-jobs-context';

interface CVSection {
  id: string;
  name: string;
  suggestedText: string;
  status: 'approved' | 'pending' | 'editing' | 'rejected';
}

interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  portfolio?: string;
  location?: string;
  city?: string;
  country?: string;
  profileImage?: string;
  title?: string;
  profilePhoto?: {
    dataUrl?: string;
    fileName?: string;
    updatedAt?: string;
  };
  cvPreferences?: {
    showProfilePhoto?: boolean;
  };
}

interface ResolvedCV {
  sections: CVSection[];
  profile: UserProfile;
  jobTitle: string;
}

interface UseResolvedCvResult {
  cv: ResolvedCV | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook that resolves complete CV data for a specific job
 * Waits for context rehydration, loads from localStorage, provides fallbacks
 */
export function useResolvedCv(jobId: string): UseResolvedCvResult {
  const { savedJobs, isLoaded } = useSavedJobs();
  const [cv, setCv] = useState<ResolvedCV | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for context to rehydrate
    if (!isLoaded) {
      setIsLoading(true);
      return;
    }

    // Find the job
    const job = savedJobs.find((j) => j.id === jobId);
    if (!job) {
      setError('Job ikke fundet');
      setIsLoading(false);
      return;
    }

    try {
      // Load CV sections from localStorage
      const storedSections = localStorage.getItem(`cv_sections_${jobId}`);
      let sections: CVSection[] = [];
      
      if (storedSections) {
        sections = JSON.parse(storedSections);
      } else {
        // No CV data found - user needs to create CV first
        setError('Ingen CV-data fundet. Gå til CV-siden og færdiggør dit CV først.');
        setIsLoading(false);
        return;
      }

      // Load user profile from localStorage
      const storedProfile = localStorage.getItem('flowstruktur_user_profile');
      let profile: UserProfile = {};
      
      if (storedProfile) {
        profile = JSON.parse(storedProfile);
      }
      // No fallback to mock profile - use real data only

      setCv({
        sections,
        profile,
        jobTitle: job.title,
      });
      setError(null);
    } catch (err) {
      console.error('Error loading CV data:', err);
      setError('Kunne ikke indlæse CV data');
    } finally {
      setIsLoading(false);
    }
  }, [jobId, savedJobs, isLoaded]);

  return { cv, isLoading, error };
}
