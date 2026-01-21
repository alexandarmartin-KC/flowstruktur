/**
 * CV Editor Translations
 * 
 * These are used for section headings and UI labels in the CV editor.
 * The language is detected from the uploaded CV and stored in CVDocument.language
 */

export type CVLanguage = 'en' | 'da';

export interface CVTranslations {
  // Section headings
  experience: string;
  education: string;
  skills: string;
  languages: string;
  profile: string;
  
  // Labels
  keyMilestones: string;
  addJob: string;
  addEducation: string;
  addSkill: string;
  addLanguage: string;
  addLocation: string;
  
  // Date placeholders
  startDate: string;
  endDate: string;
  present: string;
  
  // Sorting note
  experienceSortNote: string;
  
  // Content limits
  recommendedMaxLines: string;
  recommendedMaxBullets: string;
}

const translations: Record<CVLanguage, CVTranslations> = {
  en: {
    // Section headings
    experience: 'EXPERIENCE',
    education: 'Education',
    skills: 'Skills',
    languages: 'Languages',
    profile: 'Profile',
    
    // Labels
    keyMilestones: 'KEY RESPONSIBILITIES',
    addJob: 'Add position',
    addEducation: 'Add education',
    addSkill: 'Add skill',
    addLanguage: 'Add language',
    addLocation: '+ Location',
    
    // Date placeholders
    startDate: 'Start',
    endDate: 'End',
    present: 'Present',
    
    // Sorting note
    experienceSortNote: 'Experience is sorted automatically by date (newest first)',
    
    // Content limits
    recommendedMaxLines: 'We recommend max {n} lines.',
    recommendedMaxBullets: 'We recommend max {n} bullets.',
  },
  da: {
    // Section headings
    experience: 'ERFARING',
    education: 'Uddannelse',
    skills: 'Kompetencer',
    languages: 'Sprog',
    profile: 'Profil',
    
    // Labels
    keyMilestones: 'NØGLEOPGAVER',
    addJob: 'Tilføj stilling',
    addEducation: 'Tilføj uddannelse',
    addSkill: 'Tilføj kompetence',
    addLanguage: 'Tilføj sprog',
    addLocation: '+ Lokation',
    
    // Date placeholders
    startDate: 'Start',
    endDate: 'Slut',
    present: 'Nu',
    
    // Sorting note
    experienceSortNote: 'Erfaring sorteres automatisk efter dato (nyeste først)',
    
    // Content limits
    recommendedMaxLines: 'Vi anbefaler maks {n} linjer.',
    recommendedMaxBullets: 'Vi anbefaler maks {n} punkter.',
  },
};

export function getTranslations(language: CVLanguage): CVTranslations {
  return translations[language] || translations.da;
}

export function t(language: CVLanguage, key: keyof CVTranslations, replacements?: Record<string, string | number>): string {
  const text = translations[language]?.[key] || translations.da[key];
  if (!replacements) return text;
  
  return Object.entries(replacements).reduce(
    (acc, [k, v]) => acc.replace(`{${k}}`, String(v)),
    text
  );
}
