'use client';

import { useState, useEffect } from 'react';
import { useSavedJobs } from '@/contexts/saved-jobs-context';
import { CVDocument } from '@/lib/cv-types';
import { getRawCVData } from '@/lib/cv-normalizer';

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
      
      // Load user profile from localStorage
      const storedProfile = localStorage.getItem('flowstruktur_user_profile');
      let profile: UserProfile = {};
      
      if (storedProfile) {
        profile = JSON.parse(storedProfile);
      }

      let cvText = '';

      if (storedDoc) {
        const cvDocument: CVDocument = JSON.parse(storedDoc);
        
        // Check if CVDocument has actual content
        const hasExperience = cvDocument.rightColumn?.experience?.length > 0 && 
          cvDocument.rightColumn.experience.some(exp => exp.title || exp.company);
        const hasIntro = cvDocument.rightColumn?.professionalIntro?.content;
        
        if (hasExperience || hasIntro) {
          // Use CVDocument data
          cvText = cvDocumentToText(cvDocument, profile);
        }
      }
      
      // If CVDocument is empty or missing, fall back to raw CV data
      if (!cvText || cvText.trim().length < 100) {
        const rawData = getRawCVData();
        
        if (rawData) {
          // Try structured data first (AI-parsed), then raw text
          if (rawData.structured) {
            cvText = formatStructuredData(rawData.structured, profile);
          } else if (rawData.cvText) {
            cvText = rawData.cvText;
          }
        }
      }
      
      if (!cvText || cvText.trim().length < 50) {
        setError('Ingen CV-data fundet. Gå til CV-siden og færdiggør dit CV først.');
        setIsLoading(false);
        return;
      }

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

/**
 * Format structured CV data (from AI parsing) to text
 */
function formatStructuredData(structured: any, profile: UserProfile): string {
  const lines: string[] = [];
  
  // Header
  if (profile.name) lines.push(profile.name.toUpperCase());
  if (profile.title) lines.push(profile.title);
  lines.push('');
  
  // Contact
  const contactParts: string[] = [];
  if (profile.email) contactParts.push(profile.email);
  if (profile.phone) contactParts.push(profile.phone);
  if (contactParts.length > 0) lines.push(contactParts.join(' // '));
  if (profile.city || profile.location) lines.push(profile.city || profile.location || '');
  lines.push('');
  lines.push('═'.repeat(60));
  lines.push('');
  
  // Professional intro/summary
  if (structured.professional_summary || structured.summary || structured.profile) {
    lines.push('PROFESSIONEL PROFIL');
    lines.push('');
    lines.push(structured.professional_summary || structured.summary || structured.profile);
    lines.push('');
    lines.push('─'.repeat(60));
    lines.push('');
  }
  
  // Experience
  const experience = structured.experience || structured.work_experience || structured.jobs || [];
  if (experience.length > 0) {
    lines.push('ERHVERVSERFARING');
    lines.push('');
    
    experience.forEach((exp: any) => {
      const title = exp.title || exp.position || exp.role || '';
      const company = exp.company || exp.employer || exp.organization || '';
      const location = exp.location || '';
      const startDate = exp.start_date || exp.startDate || exp.from || '';
      const endDate = exp.end_date || exp.endDate || exp.to || 'Nutid';
      
      if (title || company) {
        lines.push(`${title}${company ? ` | ${company}` : ''}`);
        if (location) lines.push(location);
        if (startDate) lines.push(`${startDate} - ${endDate}`);
        lines.push('');
      }
      
      // Key achievements/milestones
      const milestones = exp.key_milestones || exp.milestones || exp.achievements || exp.summary || '';
      if (milestones) {
        lines.push(typeof milestones === 'string' ? milestones : milestones.join('\n'));
        lines.push('');
      }
      
      // Bullets/responsibilities
      const bullets = exp.bullets || exp.responsibilities || exp.duties || [];
      if (Array.isArray(bullets) && bullets.length > 0) {
        bullets.forEach((bullet: any) => {
          const text = typeof bullet === 'string' ? bullet : bullet.content || bullet.text || '';
          if (text) lines.push(`• ${text}`);
        });
        lines.push('');
      }
    });
    
    lines.push('─'.repeat(60));
    lines.push('');
  }
  
  // Education
  const education = structured.education || structured.qualifications || [];
  if (education.length > 0) {
    lines.push('UDDANNELSE');
    lines.push('');
    
    education.forEach((edu: any) => {
      const title = edu.title || edu.degree || edu.qualification || '';
      const institution = edu.institution || edu.school || edu.university || '';
      const year = edu.year || edu.date || edu.graduation_year || '';
      
      if (title) lines.push(title);
      if (institution || year) lines.push(`${institution}${year ? ` - ${year}` : ''}`);
      lines.push('');
    });
    
    lines.push('─'.repeat(60));
    lines.push('');
  }
  
  // Skills
  const skills = structured.skills || structured.competencies || structured.technical_skills || [];
  if (skills.length > 0) {
    lines.push('KOMPETENCER');
    lines.push('');
    const skillNames = skills.map((s: any) => typeof s === 'string' ? s : s.name || s.skill || '').filter(Boolean);
    lines.push(skillNames.join(' • '));
    lines.push('');
    lines.push('─'.repeat(60));
    lines.push('');
  }
  
  // Languages
  const languages = structured.languages || [];
  if (languages.length > 0) {
    lines.push('SPROG');
    lines.push('');
    languages.forEach((lang: any) => {
      const name = typeof lang === 'string' ? lang : lang.language || lang.name || '';
      const level = typeof lang === 'string' ? '' : lang.level || lang.proficiency || '';
      if (name) lines.push(level ? `${name}: ${level}` : name);
    });
    lines.push('');
  }
  
  return lines.join('\n');
}
