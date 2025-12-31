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
  profileImage?: string;
  title?: string;
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
        // Fallback: Use mock CV sections for demo/development
        sections = getMockCVSections();
      }

      // Load user profile from localStorage
      const storedProfile = localStorage.getItem('flowstruktur_user_profile');
      let profile: UserProfile = {};
      
      if (storedProfile) {
        profile = JSON.parse(storedProfile);
      } else {
        // Fallback: Use mock profile for demo/development
        profile = getMockProfile();
      }

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

/**
 * Mock CV sections for demo/development purposes
 */
function getMockCVSections(): CVSection[] {
  return [
    {
      id: 'profil',
      name: 'Profil',
      suggestedText: 'Erfaren projektleder med stærk baggrund i agil udvikling og digital transformation. Dokumenteret erfaring med at lede tværfaglige teams og levere komplekse projekter til tiden.',
      status: 'approved',
    },
    {
      id: 'erfaring',
      name: 'Erhvervserfaring',
      suggestedText: `Senior Projektleder | Tech Innovation A/S | 2020-2024
• Ledede 5+ strategiske digitale transformationsprojekter med budgetter op til 15 mio. kr.
• Implementerede agile arbejdsmetoder og øgede team-effektivitet med 40%
• Styrede cross-funktionelle teams på op til 15 personer
• Ansvarlig for stakeholder management på C-niveau

Projektleder | Digital Solutions ApS | 2017-2020
• Koordinerede udvikling af cloud-baserede løsninger for finanssektoren
• Faciliterede sprint planning og retrospektiver for 3 scrum teams
• Reducerede time-to-market med 30% gennem optimerede processer`,
      status: 'approved',
    },
    {
      id: 'uddannelse',
      name: 'Uddannelse',
      suggestedText: `Cand.merc. IT Management, CBS - 2017
HD i Organisation og Ledelse, CBS - 2015
PMP Certificering - 2019
Scrum Master Certificering (CSM) - 2018`,
      status: 'approved',
    },
    {
      id: 'kompetencer',
      name: 'Nøglekompetencer',
      suggestedText: `• Projektledelse (Agile, Scrum, Waterfall)
• Stakeholder management
• Risikostyring og budgetstyring
• Digital transformation
• Change management
• Team leadership
• Product ownership`,
      status: 'approved',
    },
  ];
}

/**
 * Mock profile for demo/development purposes
 */
function getMockProfile(): UserProfile {
  return {
    name: 'Maria Jensen',
    email: 'maria.jensen@email.dk',
    phone: '+45 20 34 56 78',
    linkedin: 'linkedin.com/in/mariajensen',
    location: 'København',
    title: 'Senior Projektleder',
  };
}
