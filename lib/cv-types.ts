// CV Document Types - Universal Professional CV Editor
// Follows fixed template structure with constrained editing

/**
 * Core CV document structure - one document per saved job
 */
export interface CVDocument {
  id: string;
  jobId: string;
  createdAt: string;
  updatedAt: string;
  
  // Language detected from original CV ('en' or 'da')
  language: 'en' | 'da';
  
  // Left column (sidebar) - factual information
  leftColumn: CVLeftColumn;
  
  // Right column (main content) - persuasive content
  rightColumn: CVRightColumn;
  
  // Global settings
  settings: CVSettings;
  
  // Version history
  checkpoints: CVCheckpoint[];
  
  // Undo/redo stacks (not persisted, managed in memory)
}

/**
 * Left column structure - factual sidebar
 */
export interface CVLeftColumn {
  // Optional profile photo (toggle on/off)
  showProfilePhoto: boolean;
  
  // Name & contact (from user profile, read-only display)
  // These come from UserProfile context
  
  // Optional personal data - each field individually toggleable
  personalData: {
    birthYear?: { value: string; enabled: boolean };
    nationality?: { value: string; enabled: boolean };
    driversLicense?: { value: string; enabled: boolean };
    customFields?: Array<{ id: string; label: string; value: string; enabled: boolean }>;
  };
  
  // Education & certifications - list items
  education: CVEducationItem[];
  
  // Skills / competencies - list of items
  skills: CVSkillItem[];
  
  // Languages - each with level
  languages: CVLanguageItem[];
}

/**
 * Right column structure - main persuasive content
 */
export interface CVRightColumn {
  // Professional intro - fixed at top, 4-5 lines paragraph
  professionalIntro: CVProfessionalIntro;
  
  // Experience - job blocks in reverse chronological order
  experience: CVExperienceBlock[];
}

/**
 * Professional intro section
 */
export interface CVProfessionalIntro {
  content: string;
  // AI suggestion state
  aiSuggestion?: CVAISuggestion;
}

/**
 * Experience/job block with fixed internal structure
 */
export interface CVExperienceBlock {
  id: string;
  
  // Role header
  title: string;
  company: string;
  location?: string;
  startDate: string; // Format: "MMM YYYY" or "YYYY"
  endDate?: string; // undefined = "Present"
  
  // Key milestones - narrative paragraph, 2-4 lines
  keyMilestones: string;
  keyMilestonesAiSuggestion?: CVAISuggestion;
  
  // Bullets - 4-5 maximum, reorderable
  bullets: CVBulletItem[];
  bulletsAiSuggestion?: CVAISuggestion;
}

/**
 * Bullet item with inline editing
 */
export interface CVBulletItem {
  id: string;
  content: string;
  aiSuggestion?: CVAISuggestion;
}

/**
 * Education/certification item
 */
export interface CVEducationItem {
  id: string;
  title: string;
  institution: string;
  year: string; // Can be "2020" or "2018-2020"
}

/**
 * Skill item
 */
export interface CVSkillItem {
  id: string;
  name: string;
  // No levels - just a list of skills/tools/methods
}

/**
 * Language item with level
 * Level is stored as the EXACT text from the original CV
 * Examples: "Modersmål", "Flydende", "Native", "Fluent", "Grundlæggende"
 */
export interface CVLanguageItem {
  id: string;
  language: string;
  level: string;  // EXACT level text from CV
}

/**
 * AI suggestion for any section
 */
export interface CVAISuggestion {
  id: string;
  originalContent: string;
  suggestedContent: string;
  rationale?: string;
  status: 'pending' | 'accepted' | 'edited' | 'rejected';
  createdAt: string;
}

/**
 * Global CV settings
 */
export interface CVSettings {
  // Font family - global choice only (2-3 options)
  fontFamily: 'inter' | 'georgia' | 'roboto';
  
  // Text size preset
  textSize: 'small' | 'normal' | 'large';
}

/**
 * Named checkpoint for version history
 */
export interface CVCheckpoint {
  id: string;
  name: string;
  createdAt: string;
  snapshot: string; // JSON stringified CVDocument
}

/**
 * Language level options for dropdown (standardized)
 * The key is the value stored/selected, the label is what's displayed
 */
export const LANGUAGE_LEVEL_OPTIONS = [
  { value: 'Modersmål', label: 'Modersmål' },
  { value: 'Flydende', label: 'Flydende' },
  { value: 'Avanceret', label: 'Avanceret' },
  { value: 'Mellem', label: 'Mellem' },
  { value: 'Grundlæggende', label: 'Grundlæggende' },
] as const;

/**
 * Legacy labels for backward compatibility
 */
export const LANGUAGE_LEVEL_LABELS: Record<string, string> = {
  native: 'Modersmål',
  fluent: 'Flydende',
  advanced: 'Avanceret',
  intermediate: 'Mellem',
  basic: 'Grundlæggende',
  'Modersmål': 'Modersmål',
  'Flydende': 'Flydende',
  'Avanceret': 'Avanceret',
  'Mellem': 'Mellem',
  'Grundlæggende': 'Grundlæggende',
};

/**
 * Font family options
 */
export const FONT_FAMILY_OPTIONS = [
  { value: 'inter', label: 'Inter (Modern)', fontFamily: 'Inter, -apple-system, sans-serif' },
  { value: 'georgia', label: 'Georgia (Classic)', fontFamily: 'Georgia, serif' },
  { value: 'roboto', label: 'Roboto (Clean)', fontFamily: 'Roboto, Arial, sans-serif' },
] as const;

/**
 * Text size presets
 */
export const TEXT_SIZE_OPTIONS = {
  small: { body: '13px', heading: '15px', name: '26px' },
  normal: { body: '14px', heading: '16px', name: '28px' },
  large: { body: '15px', heading: '17px', name: '30px' },
} as const;

/**
 * Text size option type
 */
export type TextSizeOption = {
  body: string;
  heading: string;
  name: string;
};

/**
 * Section content limits (soft warnings)
 */
export const CONTENT_LIMITS = {
  professionalIntroLines: 5,
  keyMilestonesLines: 4,
  bulletsPerJob: 5,
  bulletCharacters: 200,
};

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new empty CV document
 */
export function createEmptyCVDocument(jobId: string, language: 'en' | 'da' = 'da'): CVDocument {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    jobId,
    createdAt: now,
    updatedAt: now,
    language,
    leftColumn: {
      showProfilePhoto: false,
      personalData: {},
      education: [],
      skills: [],
      languages: [],
    },
    rightColumn: {
      professionalIntro: { content: '' },
      experience: [],
    },
    settings: {
      fontFamily: 'inter',
      textSize: 'normal',
    },
    checkpoints: [],
  };
}

/**
 * Create a new experience block
 */
export function createExperienceBlock(
  title: string = '',
  company: string = '',
  startDate: string = '',
  endDate?: string
): CVExperienceBlock {
  return {
    id: generateId(),
    title,
    company,
    startDate,
    endDate,
    keyMilestones: '',
    bullets: [],
  };
}

/**
 * Create a new bullet item
 */
export function createBulletItem(content: string = ''): CVBulletItem {
  return {
    id: generateId(),
    content,
  };
}

/**
 * Create a new education item
 */
export function createEducationItem(
  title: string = '',
  institution: string = '',
  year: string = ''
): CVEducationItem {
  return {
    id: generateId(),
    title,
    institution,
    year,
  };
}

/**
 * Create a new skill item
 */
export function createSkillItem(name: string = ''): CVSkillItem {
  return {
    id: generateId(),
    name,
  };
}

/**
 * Create a new language item
 */
export function createLanguageItem(
  language: string = '',
  level: string = 'intermediate'
): CVLanguageItem {
  return {
    id: generateId(),
    language,
    level,
  };
}

/**
 * Count lines in text (approximation for soft warnings)
 */
export function countLines(text: string, charsPerLine: number = 80): number {
  if (!text) return 0;
  const hardBreaks = text.split('\n').length;
  const softBreaks = Math.ceil(text.length / charsPerLine);
  return Math.max(hardBreaks, softBreaks);
}

/**
 * Check if content exceeds limit (for soft warning)
 */
export function exceedsLimit(text: string, maxLines: number, charsPerLine: number = 80): boolean {
  return countLines(text, charsPerLine) > maxLines;
}

/**
 * Parse a date string into a comparable format
 * Handles formats like: "January 2020", "Jan 2020", "2020", "01/2020"
 * Returns { timestamp: number, isOngoing: boolean }
 */
function parseExperienceDate(dateStr: string | undefined): { timestamp: number; isOngoing: boolean } {
  // Ongoing role = no end date, or marked as present/current
  if (!dateStr || dateStr.trim() === '') {
    return { timestamp: Infinity, isOngoing: true };
  }
  
  const normalized = dateStr.toLowerCase().trim();
  
  // Check for "present", "current", "now", "nu", "nuværende"
  if (['present', 'current', 'now', 'nu', 'nuværende', '-'].includes(normalized)) {
    return { timestamp: Infinity, isOngoing: true };
  }
  
  // Danish month mapping
  const danishMonths: Record<string, number> = {
    'januar': 0, 'februar': 1, 'marts': 2, 'april': 3,
    'maj': 4, 'juni': 5, 'juli': 6, 'august': 7,
    'september': 8, 'oktober': 9, 'november': 10, 'december': 11
  };
  
  // Try Danish month format "Januar 2022"
  const monthYearMatch = normalized.match(/^(\w+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const monthName = monthYearMatch[1];
    const year = parseInt(monthYearMatch[2], 10);
    const monthIndex = danishMonths[monthName];
    if (monthIndex !== undefined) {
      return { timestamp: new Date(year, monthIndex, 1).getTime(), isOngoing: false };
    }
  }
  
  // Try to parse the date
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) {
    return { timestamp: parsed, isOngoing: false };
  }
  
  // Try year-only format
  const yearMatch = dateStr.match(/(\d{4})/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    // January 1st of that year
    return { timestamp: new Date(year, 0, 1).getTime(), isOngoing: false };
  }
  
  // Undated - place at bottom
  return { timestamp: -Infinity, isOngoing: false };
}

/**
 * Sort experience blocks in reverse chronological order.
 * This is a HARD INVARIANT - experience must always be sorted by date.
 * 
 * Rules:
 * 1. Ongoing roles (no end date, or "Present") always come first
 * 2. Finished roles are sorted by end date (descending), then start date (descending)
 * 3. Undated experiences go to the bottom
 * 
 * This function must be called:
 * - After parsing CV data
 * - After mapping to editor
 * - After any date field is edited
 * - Before rendering
 * - Before PDF generation
 */
export function sortExperienceByDate(experiences: CVExperienceBlock[]): CVExperienceBlock[] {
  return [...experiences].sort((a, b) => {
    const aEnd = parseExperienceDate(a.endDate);
    const bEnd = parseExperienceDate(b.endDate);
    const aStart = parseExperienceDate(a.startDate);
    const bStart = parseExperienceDate(b.startDate);
    
    // Both ongoing: sort by start date descending (newer first)
    if (aEnd.isOngoing && bEnd.isOngoing) {
      return bStart.timestamp - aStart.timestamp;
    }
    
    // One ongoing, one not: ongoing comes first
    if (aEnd.isOngoing && !bEnd.isOngoing) return -1;
    if (!aEnd.isOngoing && bEnd.isOngoing) return 1;
    
    // Both finished: sort by end date descending
    if (aEnd.timestamp !== bEnd.timestamp) {
      return bEnd.timestamp - aEnd.timestamp;
    }
    
    // Same end date: sort by start date descending
    return bStart.timestamp - aStart.timestamp;
  });
}
