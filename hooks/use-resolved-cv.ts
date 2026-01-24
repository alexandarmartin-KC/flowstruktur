'use client';

import { useState, useEffect } from 'react';
import { useSavedJobs } from '@/contexts/saved-jobs-context';
import { CVDocument } from '@/lib/cv-types';

interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  portfolio?: string;
  location?: string;
  city?: string;
  country?: string;
  title?: string;
}

interface ResolvedCV {
  text: string;
  profile: UserProfile;
  jobTitle: string;
}

interface UseResolvedCvResult {
  cv: ResolvedCV | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Convert CVDocument to formatted text for AI consumption
 */
function cvDocumentToText(doc: CVDocument, profile: UserProfile): string {
  const lines: string[] = [];
  
  // Header with name and contact
  if (profile.name) lines.push(profile.name.toUpperCase());
  if (profile.title) lines.push(profile.title);
  lines.push('');
  
  const contactParts: string[] = [];
  if (profile.email) contactParts.push(profile.email);
  if (profile.phone) contactParts.push(profile.phone);
  if (contactParts.length > 0) lines.push(contactParts.join(' // '));
  
  if (profile.city || profile.location) {
    lines.push(profile.city || profile.location || '');
  }
  lines.push('');
  lines.push('═'.repeat(60));
  lines.push('');
  
  // Professional intro
  if (doc.rightColumn.professionalIntro.content) {
    lines.push('PROFESSIONEL PROFIL');
    lines.push('');
    lines.push(doc.rightColumn.professionalIntro.content);
    lines.push('');
    lines.push('─'.repeat(60));
    lines.push('');
  }
  
  // Experience
  if (doc.rightColumn.experience.length > 0) {
    lines.push('ERHVERVSERFARING');
    lines.push('');
    
    doc.rightColumn.experience.forEach(exp => {
      // Title and company
      lines.push(`${exp.title} | ${exp.company}`);
      if (exp.location) lines.push(exp.location);
      
      // Date range
      const dateRange = exp.endDate 
        ? `${exp.startDate} - ${exp.endDate}` 
        : `${exp.startDate} - Nutid`;
      lines.push(dateRange);
      lines.push('');
      
      // Key milestones
      if (exp.keyMilestones) {
        lines.push(exp.keyMilestones);
        lines.push('');
      }
      
      // Bullets
      if (exp.bullets.length > 0) {
        exp.bullets.forEach(bullet => {
          lines.push(`• ${bullet.content}`);
        });
        lines.push('');
      }
    });
    
    lines.push('─'.repeat(60));
    lines.push('');
  }
  
  // Education
  if (doc.leftColumn.education.length > 0) {
    lines.push('UDDANNELSE');
    lines.push('');
    
    doc.leftColumn.education.forEach(edu => {
      lines.push(`${edu.title}`);
      lines.push(`${edu.institution} - ${edu.year}`);
      lines.push('');
    });
    
    lines.push('─'.repeat(60));
    lines.push('');
  }
  
  // Skills
  if (doc.leftColumn.skills.length > 0) {
    lines.push('KOMPETENCER');
    lines.push('');
    const skillNames = doc.leftColumn.skills.map(s => s.name).join(' • ');
    lines.push(skillNames);
    lines.push('');
    lines.push('─'.repeat(60));
    lines.push('');
  }
  
  // Languages
  if (doc.leftColumn.languages.length > 0) {
    lines.push('SPROG');
    lines.push('');
    doc.leftColumn.languages.forEach(lang => {
      lines.push(`${lang.language}: ${lang.level}`);
    });
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Hook that resolves complete CV data for a specific job
 * Reads from new CVDocument format and converts to text
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
      // Load CVDocument from localStorage
      const cvDocKey = `flowstruktur_cv_doc_${jobId}`;
      const storedDoc = localStorage.getItem(cvDocKey);
      
      if (!storedDoc) {
        setError('Ingen CV-data fundet. Gå til CV-siden og færdiggør dit CV først.');
        setIsLoading(false);
        return;
      }

      const cvDocument: CVDocument = JSON.parse(storedDoc);

      // Load user profile from localStorage
      const storedProfile = localStorage.getItem('flowstruktur_user_profile');
      let profile: UserProfile = {};
      
      if (storedProfile) {
        profile = JSON.parse(storedProfile);
      }

      // Convert CVDocument to text format
      const cvText = cvDocumentToText(cvDocument, profile);

      setCv({
        text: cvText,
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
