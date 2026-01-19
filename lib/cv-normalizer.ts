/**
 * CV Normalizer - Maps uploaded CV data to the fixed template structure
 * 
 * This module handles the critical task of parsing CV data in various formats
 * and normalizing it into the CVDocument structure for the refinement editor.
 * 
 * Key principles:
 * - NEVER invent or fabricate data
 * - Map existing content exactly
 * - Leave missing fields empty (not placeholder text)
 * - Preserve all factual information
 */

import {
  CVDocument,
  CVExperienceBlock,
  CVEducationItem,
  CVSkillItem,
  CVLanguageItem,
  CVBulletItem,
  generateId,
  createEmptyCVDocument,
  createExperienceBlock,
  createBulletItem,
  createEducationItem,
  createSkillItem,
  createLanguageItem,
  sortExperienceByDate,
} from './cv-types';

/**
 * Raw CV data as it comes from upload/extraction
 */
export interface RawCVData {
  cvText: string;           // Original CV text
  summary?: string;         // AI-generated summary (from extraction)
  extracted?: ParsedCVData; // Structured extraction if available
  structured?: StructuredCVFromAPI; // AI-structured CV data from /api/cv/structure
}

/**
 * Structured CV data from the AI structure API
 */
export interface StructuredCVFromAPI {
  professionalIntro?: string;
  experience: {
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    keyMilestones?: string;
    bullets: string[];
  }[];
  education: {
    title: string;
    institution: string;
    year: string;
  }[];
  skills: string[];
  languages: {
    language: string;
    level: 'native' | 'fluent' | 'advanced' | 'intermediate' | 'basic';
  }[];
}

/**
 * Structured CV data parsed from various formats
 */
export interface ParsedCVData {
  // Personal info
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  
  // Professional summary/intro
  summary?: string;
  profile?: string;
  
  // Experience entries
  experience?: ParsedExperience[];
  
  // Education
  education?: ParsedEducation[];
  
  // Skills/competencies
  skills?: string[];
  
  // Languages
  languages?: ParsedLanguage[];
  
  // Certifications (maps to education)
  certifications?: string[];
}

export interface ParsedExperience {
  title?: string;
  company?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;       // Narrative text if present
  bullets?: string[];     // Achievement bullets
  description?: string;   // Mixed content
}

export interface ParsedEducation {
  degree?: string;
  institution?: string;
  year?: string;
  field?: string;
}

export interface ParsedLanguage {
  language: string;
  level?: 'native' | 'fluent' | 'advanced' | 'intermediate' | 'basic';
}

/**
 * Date patterns for parsing experience dates
 * Handles various formats with or without commas, different dash types, etc.
 */
const DATE_PATTERNS = [
  // "Jan 2020 - Present", "January 2020 - Dec 2023", "Jan, 2020 - Dec, 2023"
  /^(\w+,?\s*\d{4})\s*[-–—]\s*((?:\w+,?\s*\d{4})|(?:nu|present|current|now|i dag))$/i,
  // "2020 - 2023", "2020 - Present"
  /^(\d{4})\s*[-–—]\s*((?:\d{4})|(?:nu|present|current|now|i dag))$/i,
  // "Jan 2020 -", "2020 -" (ongoing)
  /^(\w*,?\s*\d{4})\s*[-–—]\s*$/,
];

/**
 * Language level keywords for detection
 */
const LANGUAGE_LEVEL_KEYWORDS: Record<string, CVLanguageItem['level']> = {
  // English
  'native': 'native',
  'mother tongue': 'native',
  'fluent': 'fluent',
  'proficient': 'fluent',
  'advanced': 'advanced',
  'intermediate': 'intermediate',
  'conversational': 'intermediate',
  'basic': 'basic',
  'beginner': 'basic',
  'elementary': 'basic',
  // Danish
  'modersmål': 'native',
  'flydende': 'fluent',
  'avanceret': 'advanced',
  'mellem': 'intermediate',
  'grundlæggende': 'basic',
};

/**
 * Main function to normalize raw CV data into a CVDocument
 */
export function normalizeCVData(
  jobId: string,
  rawData: RawCVData,
  existingDocument?: CVDocument | null
): CVDocument {
  // Create base document
  const doc = createEmptyCVDocument(jobId);
  
  // Priority 1: Use AI-structured data if available (most reliable)
  // This takes precedence over existing document to ensure CV data is properly loaded
  if (rawData.structured && hasStructuredContent(rawData.structured)) {
    const structuredDoc = mapStructuredDataToDocument(doc, rawData.structured);
    
    // If we have an existing document with user edits, we should preserve those
    // But only for the same job - otherwise use fresh structured data
    if (existingDocument && existingDocument.jobId === jobId && hasUserEdits(existingDocument)) {
      // User has made edits - keep existing document
      return existingDocument;
    }
    
    return structuredDoc;
  }
  
  // If no structured data but we have existing document with content, use it
  if (existingDocument && hasExistingContent(existingDocument)) {
    return existingDocument;
  }
  
  // Priority 2: Use previously extracted structured data
  if (rawData.extracted) {
    return mapParsedDataToDocument(doc, rawData.extracted, rawData);
  }
  
  // Priority 3: Try to parse raw CV text (least reliable)
  const parsed = parseRawCVText(rawData.cvText);
  return mapParsedDataToDocument(doc, parsed, rawData);
}

/**
 * Check if AI-structured data has meaningful content
 */
function hasStructuredContent(structured: StructuredCVFromAPI): boolean {
  return (
    (structured.experience && structured.experience.length > 0) ||
    (structured.education && structured.education.length > 0) ||
    (structured.skills && structured.skills.length > 0) ||
    !!structured.professionalIntro
  );
}

/**
 * Check if user has made edits to the document
 * We detect this by checking if checkpoints exist or if updatedAt differs significantly from createdAt
 */
function hasUserEdits(doc: CVDocument): boolean {
  // If there are checkpoints, user has explicitly saved versions
  if (doc.checkpoints && doc.checkpoints.length > 0) {
    return true;
  }
  
  // Check if document has been updated after creation (more than 1 minute difference)
  const created = new Date(doc.createdAt).getTime();
  const updated = new Date(doc.updatedAt).getTime();
  const oneMinute = 60 * 1000;
  
  return (updated - created) > oneMinute;
}

/**
 * Check if document has meaningful content already
 */
function hasExistingContent(doc: CVDocument): boolean {
  const hasIntro = doc.rightColumn.professionalIntro.content.trim().length > 0;
  const hasExperience = doc.rightColumn.experience.length > 0;
  const hasEducation = doc.leftColumn.education.length > 0;
  const hasSkills = doc.leftColumn.skills.length > 0;
  
  return hasIntro || hasExperience || hasEducation || hasSkills;
}

/**
 * Parse raw CV text to extract structured data
 */
export function parseRawCVText(cvText: string): ParsedCVData {
  const lines = cvText.split('\n').map(l => l.trim()).filter(Boolean);
  const parsed: ParsedCVData = {};
  
  // Extract experience blocks
  parsed.experience = extractExperienceBlocks(cvText);
  
  // Extract education
  parsed.education = extractEducation(cvText);
  
  // Extract skills
  parsed.skills = extractSkills(cvText);
  
  // Extract languages
  parsed.languages = extractLanguages(cvText);
  
  // Extract professional summary/profile
  parsed.summary = extractSummary(cvText);
  
  return parsed;
}

/**
 * Extract experience blocks from CV text
 */
function extractExperienceBlocks(cvText: string): ParsedExperience[] {
  const experiences: ParsedExperience[] = [];
  
  // Common section headers for experience
  const experienceHeaders = [
    /^(?:work\s*)?experience$/im,
    /^(?:professional\s*)?experience$/im,
    /^employment(?:\s*history)?$/im,
    /^work\s*history$/im,
    /^career(?:\s*history)?$/im,
    /^erhvervserfaring$/im,       // Danish
    /^arbejdserfaring$/im,        // Danish
    /^ansættelser$/im,            // Danish
  ];
  
  // Find experience section
  const lines = cvText.split('\n');
  let inExperienceSection = false;
  let currentExp: ParsedExperience | null = null;
  let currentBullets: string[] = [];
  let descriptionLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this is an experience section header
    if (experienceHeaders.some(h => h.test(line))) {
      inExperienceSection = true;
      continue;
    }
    
    // Check if we've hit another section
    if (inExperienceSection && isNewSection(line)) {
      // Save current experience
      if (currentExp) {
        currentExp.bullets = currentBullets.length > 0 ? [...currentBullets] : undefined;
        if (descriptionLines.length > 0) {
          currentExp.description = descriptionLines.join(' ').trim();
        }
        experiences.push(currentExp);
      }
      inExperienceSection = false;
      currentExp = null;
      currentBullets = [];
      descriptionLines = [];
      continue;
    }
    
    if (!inExperienceSection) continue;
    
    // Try to detect a new job entry
    const jobInfo = detectJobEntry(line, lines[i + 1], lines[i + 2]);
    
    if (jobInfo) {
      // Save previous experience
      if (currentExp) {
        currentExp.bullets = currentBullets.length > 0 ? [...currentBullets] : undefined;
        if (descriptionLines.length > 0) {
          currentExp.description = descriptionLines.join(' ').trim();
        }
        experiences.push(currentExp);
      }
      
      currentExp = jobInfo;
      currentBullets = [];
      descriptionLines = [];
      continue;
    }
    
    // Collect content for current job
    if (currentExp && line) {
      // Check if it's a bullet point
      if (isBulletLine(line)) {
        currentBullets.push(cleanBulletText(line));
      } else if (line.length > 10) {
        descriptionLines.push(line);
      }
    }
  }
  
  // Save last experience
  if (currentExp) {
    currentExp.bullets = currentBullets.length > 0 ? [...currentBullets] : undefined;
    if (descriptionLines.length > 0) {
      currentExp.description = descriptionLines.join(' ').trim();
    }
    experiences.push(currentExp);
  }
  
  return experiences;
}

/**
 * Detect if a line starts a new section
 */
function isNewSection(line: string): boolean {
  const sectionHeaders = [
    /^education$/i,
    /^uddannelse$/i,
    /^skills$/i,
    /^kompetencer$/i,
    /^languages$/i,
    /^sprog$/i,
    /^certifi(cations?|kater)$/i,
    /^projects?$/i,
    /^publikationer$/i,
    /^publications$/i,
    /^references?$/i,
    /^referencer$/i,
    /^summary$/i,
    /^profile$/i,
    /^profil$/i,
    /^about\s*me$/i,
    /^om\s*mig$/i,
  ];
  
  return sectionHeaders.some(h => h.test(line));
}

/**
 * Try to detect a job entry from lines
 */
function detectJobEntry(
  line: string, 
  nextLine?: string, 
  thirdLine?: string
): ParsedExperience | null {
  // Pattern: Title at Company, Location | Date Range
  // Pattern: Company Name | Date Range
  // Pattern: Title - Company (Date Range)
  
  // Look for date patterns
  const dateMatch = findDateRange(line) || 
                   (nextLine && findDateRange(nextLine)) ||
                   (thirdLine && findDateRange(thirdLine));
  
  if (!dateMatch && !looksLikeJobTitle(line)) {
    return null;
  }
  
  const exp: ParsedExperience = {};
  
  // Parse the line for title and company
  const titleCompanyMatch = line.match(/^([^|,@\-–—]+)(?:[|,@\-–—]\s*(.+))?$/);
  
  if (titleCompanyMatch) {
    const first = titleCompanyMatch[1].trim();
    const second = titleCompanyMatch[2]?.trim();
    
    // Heuristic: if second part contains dates, first is title+company
    if (second && findDateRange(second)) {
      const parts = first.split(/\s+(?:at|hos|@|ved)\s+/i);
      if (parts.length > 1) {
        exp.title = parts[0].trim();
        exp.company = parts[1].trim();
      } else {
        exp.title = first;
      }
      const dates = parseDateRange(second);
      exp.startDate = dates.start;
      exp.endDate = dates.end;
    } else if (second) {
      exp.title = first;
      exp.company = second;
    } else {
      exp.title = first;
    }
  }
  
  // Try to extract dates from next lines if not found
  if (!exp.startDate && nextLine) {
    const dates = parseDateRange(nextLine);
    if (dates.start) {
      exp.startDate = dates.start;
      exp.endDate = dates.end;
    }
  }
  
  // Only return if we have at least a title
  if (exp.title && exp.title.length > 2) {
    return exp;
  }
  
  return null;
}

/**
 * Check if line looks like a job title
 */
function looksLikeJobTitle(line: string): boolean {
  const titleKeywords = [
    /\b(?:manager|director|lead|senior|junior|head|chief|engineer|developer|analyst|consultant|specialist|coordinator|administrator|assistant|executive|officer|architect)\b/i,
    /\b(?:leder|chef|konsulent|specialist|medarbejder|koordinator|rådgiver|udvikler|ingeniør|direktør|partner|ejer|stifter)\b/i,
  ];
  
  return titleKeywords.some(k => k.test(line)) && line.length < 100;
}

/**
 * Find date range in text
 */
function findDateRange(text: string): boolean {
  return DATE_PATTERNS.some(p => p.test(text));
}

/**
 * Parse date range from text
 */
function parseDateRange(text: string): { start?: string; end?: string } {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return {
        start: match[1].replace(/,\s*/g, ' ').trim(), // Clean start date: remove commas
        end: normalizeEndDate(match[2]),
      };
    }
  }
  return {};
}

/**
 * Convert YYYY-MM format to human-readable "Month YYYY" format
 */
function formatDateForDisplay(dateStr?: string): string {
  if (!dateStr) return '';
  
  // Already in readable format (has letters)
  if (/[a-zA-Z]/.test(dateStr)) {
    return dateStr.replace(/,\s*/g, ' ').trim();
  }
  
  // YYYY-MM format
  const match = dateStr.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const year = match[1];
    const monthNum = parseInt(match[2], 10);
    
    const months: Record<number, string> = {
      1: 'Januar', 2: 'Februar', 3: 'Marts', 4: 'April',
      5: 'Maj', 6: 'Juni', 7: 'Juli', 8: 'August',
      9: 'September', 10: 'Oktober', 11: 'November', 12: 'December'
    };
    
    return `${months[monthNum] || ''} ${year}`.trim();
  }
  
  // Just year
  if (/^\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Return as-is if unknown format
  return dateStr.replace(/,\s*/g, ' ').trim();
}

/**
 * Normalize end date text
 * Converts various "present" terms to undefined and cleans formatting
 */
function normalizeEndDate(text?: string): string | undefined {
  if (!text) return undefined;
  
  const presentTerms = ['present', 'current', 'now', 'nu', 'i dag', 'nutid'];
  if (presentTerms.some(t => text.toLowerCase().includes(t))) {
    return undefined; // undefined means "present"
  }
  
  // Convert to display format
  return formatDateForDisplay(text);
}

/**
 * Check if line is a bullet point
 */
function isBulletLine(line: string): boolean {
  return /^[\-•●○◦▪▸►→*]\s+/.test(line) || /^\d+[.)]\s+/.test(line);
}

/**
 * Clean bullet text
 */
function cleanBulletText(line: string): string {
  return line.replace(/^[\-•●○◦▪▸►→*]\s+/, '').replace(/^\d+[.)]\s+/, '').trim();
}

/**
 * Extract education from CV text
 */
function extractEducation(cvText: string): ParsedEducation[] {
  const education: ParsedEducation[] = [];
  
  const educationHeaders = [
    /^education$/im,
    /^uddannelse$/im,
    /^academic(?:\s*background)?$/im,
    /^qualifications$/im,
  ];
  
  const lines = cvText.split('\n');
  let inEducationSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (educationHeaders.some(h => h.test(line))) {
      inEducationSection = true;
      continue;
    }
    
    if (inEducationSection && isNewSection(line)) {
      break;
    }
    
    if (!inEducationSection || !line) continue;
    
    // Try to parse education entry
    const edu = parseEducationLine(line, lines[i + 1]);
    if (edu) {
      education.push(edu);
    }
  }
  
  return education;
}

/**
 * Parse an education line
 */
function parseEducationLine(line: string, nextLine?: string): ParsedEducation | null {
  // Common patterns:
  // "BSc Computer Science, University of X, 2020"
  // "Master's Degree in Business | Copenhagen Business School | 2018-2020"
  
  const yearMatch = line.match(/\b((?:19|20)\d{2}(?:\s*[-–—]\s*(?:19|20)\d{2})?)\b/);
  const year = yearMatch ? yearMatch[1] : undefined;
  
  // Remove year from line for parsing
  const withoutYear = line.replace(/\b((?:19|20)\d{2}(?:\s*[-–—]\s*(?:19|20)\d{2})?)\b/, '').trim();
  
  // Split by common delimiters
  const parts = withoutYear.split(/[|,;]/).map(p => p.trim()).filter(Boolean);
  
  if (parts.length === 0 && !year) return null;
  
  const edu: ParsedEducation = {};
  
  if (parts.length >= 2) {
    edu.degree = parts[0];
    edu.institution = parts[1];
  } else if (parts.length === 1) {
    edu.degree = parts[0];
  }
  
  if (year) {
    edu.year = year;
  }
  
  // Only return if we have meaningful content
  if (edu.degree && edu.degree.length > 2) {
    return edu;
  }
  
  return null;
}

/**
 * Extract skills from CV text
 */
function extractSkills(cvText: string): string[] {
  const skills: string[] = [];
  
  const skillHeaders = [
    /^skills$/im,
    /^kompetencer$/im,
    /^technical\s*skills$/im,
    /^core\s*competencies$/im,
    /^tools?\s*(?:&|and)?\s*technologies$/im,
    /^(?:key\s*)?qualifications$/im,
    /^faglige\s*kompetencer$/im,
  ];
  
  const lines = cvText.split('\n');
  let inSkillsSection = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (skillHeaders.some(h => h.test(trimmed))) {
      inSkillsSection = true;
      continue;
    }
    
    if (inSkillsSection && isNewSection(trimmed)) {
      break;
    }
    
    if (!inSkillsSection || !trimmed) continue;
    
    // Parse skill items (comma-separated or bulleted)
    if (isBulletLine(trimmed)) {
      skills.push(cleanBulletText(trimmed));
    } else if (trimmed.includes(',')) {
      skills.push(...trimmed.split(',').map(s => s.trim()).filter(s => s.length > 1));
    } else if (trimmed.length > 1 && trimmed.length < 50) {
      skills.push(trimmed);
    }
  }
  
  return skills;
}

/**
 * Extract languages from CV text
 */
function extractLanguages(cvText: string): ParsedLanguage[] {
  const languages: ParsedLanguage[] = [];
  
  const languageHeaders = [
    /^languages?$/im,
    /^sprog$/im,
    /^sprogkundskaber$/im,
  ];
  
  const lines = cvText.split('\n');
  let inLanguageSection = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (languageHeaders.some(h => h.test(trimmed))) {
      inLanguageSection = true;
      continue;
    }
    
    if (inLanguageSection && isNewSection(trimmed)) {
      break;
    }
    
    if (!inLanguageSection || !trimmed) continue;
    
    // Parse language entry: "English - Fluent", "Danish (Native)"
    const langEntry = parseLanguageLine(trimmed);
    if (langEntry) {
      languages.push(langEntry);
    }
  }
  
  return languages;
}

/**
 * Parse a language line
 */
function parseLanguageLine(line: string): ParsedLanguage | null {
  const cleanLine = cleanBulletText(line);
  
  // Try to find level indicator
  let level: CVLanguageItem['level'] = 'intermediate';
  let language = cleanLine;
  
  for (const [keyword, lvl] of Object.entries(LANGUAGE_LEVEL_KEYWORDS)) {
    if (cleanLine.toLowerCase().includes(keyword)) {
      level = lvl;
      // Remove the level keyword from language name
      language = cleanLine.replace(new RegExp(keyword, 'i'), '').trim();
      break;
    }
  }
  
  // Clean up delimiters
  language = language.replace(/[-–—:()|\[\]]/g, ' ').trim().replace(/\s+/g, ' ');
  
  if (language.length > 1 && language.length < 30) {
    return { language, level };
  }
  
  return null;
}

/**
 * Extract professional summary from CV text
 */
function extractSummary(cvText: string): string | undefined {
  const summaryHeaders = [
    /^(?:professional\s*)?summary$/im,
    /^(?:professional\s*)?profile$/im,
    /^profil$/im,
    /^about\s*me$/im,
    /^om\s*mig$/im,
    /^objective$/im,
    /^career\s*objective$/im,
  ];
  
  const lines = cvText.split('\n');
  let inSummarySection = false;
  const summaryLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (summaryHeaders.some(h => h.test(trimmed))) {
      inSummarySection = true;
      continue;
    }
    
    if (inSummarySection && isNewSection(trimmed)) {
      break;
    }
    
    if (!inSummarySection || !trimmed) continue;
    
    // Collect summary text (skip bullets in summary)
    if (!isBulletLine(trimmed) && trimmed.length > 10) {
      summaryLines.push(trimmed);
    }
  }
  
  const summary = summaryLines.join(' ').trim();
  return summary.length > 20 ? summary : undefined;
}

/**
 * Map parsed CV data to CVDocument structure
 */
function mapParsedDataToDocument(
  doc: CVDocument,
  parsed: ParsedCVData,
  rawData: RawCVData
): CVDocument {
  const now = new Date().toISOString();
  
  // Map professional intro
  if (parsed.summary || parsed.profile) {
    doc.rightColumn.professionalIntro.content = parsed.summary || parsed.profile || '';
  }
  
  // Map experience
  if (parsed.experience && parsed.experience.length > 0) {
    doc.rightColumn.experience = parsed.experience.map(exp => {
      const block: CVExperienceBlock = {
        id: generateId(),
        title: exp.title || '',
        company: exp.company || '',
        location: exp.location,
        startDate: exp.startDate || '',
        endDate: exp.endDate,
        keyMilestones: exp.summary || '',
        bullets: [],
      };
      
      // Map bullets
      if (exp.bullets && exp.bullets.length > 0) {
        block.bullets = exp.bullets.map(b => createBulletItem(b));
      }
      
      // If there's description but no summary, we have mixed content
      // Keep it in description and let user refine
      if (!exp.summary && exp.description) {
        // Check if description looks like narrative (longer sentences)
        if (exp.description.length > 100 && !isBulletLine(exp.description)) {
          block.keyMilestones = exp.description;
        }
      }
      
      return block;
    });
    
    // Sort by date (reverse chronological) - HARD INVARIANT
    doc.rightColumn.experience = sortExperienceByDate(doc.rightColumn.experience);
  }
  
  // Map education
  if (parsed.education && parsed.education.length > 0) {
    doc.leftColumn.education = parsed.education.map(edu => 
      createEducationItem(
        edu.degree || '',
        edu.institution || '',
        edu.year || ''
      )
    );
  }
  
  // Map skills
  if (parsed.skills && parsed.skills.length > 0) {
    doc.leftColumn.skills = parsed.skills.map(skill => createSkillItem(skill));
  }
  
  // Map languages
  if (parsed.languages && parsed.languages.length > 0) {
    doc.leftColumn.languages = parsed.languages.map(lang => 
      createLanguageItem(lang.language, lang.level || 'intermediate')
    );
  }
  
  doc.updatedAt = now;
  
  return doc;
}

/**
 * Map AI-structured CV data to CVDocument structure
 * This is the most reliable mapping as data is already clean
 */
function mapStructuredDataToDocument(
  doc: CVDocument,
  structured: StructuredCVFromAPI
): CVDocument {
  const now = new Date().toISOString();
  
  // Map professional intro
  if (structured.professionalIntro) {
    doc.rightColumn.professionalIntro.content = structured.professionalIntro;
  }
  
  // Map experience
  if (structured.experience && structured.experience.length > 0) {
    doc.rightColumn.experience = structured.experience.map(exp => ({
      id: generateId(),
      title: exp.title || '',
      company: exp.company || '',
      location: exp.location,
      startDate: formatDateForDisplay(exp.startDate),
      endDate: normalizeEndDate(exp.endDate),
      keyMilestones: exp.keyMilestones || '',
      bullets: exp.bullets?.map(b => createBulletItem(b)) || [],
    }));
    
    // Sort by date (reverse chronological) - HARD INVARIANT
    doc.rightColumn.experience = sortExperienceByDate(doc.rightColumn.experience);
  }
  
  // Map education
  if (structured.education && structured.education.length > 0) {
    doc.leftColumn.education = structured.education.map(edu => 
      createEducationItem(edu.title || '', edu.institution || '', edu.year || '')
    );
  }
  
  // Map skills
  if (structured.skills && structured.skills.length > 0) {
    doc.leftColumn.skills = structured.skills.map(skill => createSkillItem(skill));
  }
  
  // Map languages
  if (structured.languages && structured.languages.length > 0) {
    doc.leftColumn.languages = structured.languages.map(lang => 
      createLanguageItem(lang.language, lang.level || 'intermediate')
    );
  }
  
  doc.updatedAt = now;
  
  return doc;
}

/**
 * Check if CV data exists (validation for editor access)
 */
export function hasCVData(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const cvExtraction = localStorage.getItem('flowstruktur_cv_extraction');
    const cvAnalysis = localStorage.getItem('flowstruktur_cv_analysis');
    
    return !!(cvExtraction || cvAnalysis);
  } catch {
    return false;
  }
}

/**
 * Get raw CV data from storage
 */
export function getRawCVData(): RawCVData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const extractionStr = localStorage.getItem('flowstruktur_cv_extraction');
    
    if (!extractionStr) return null;
    
    const extraction = JSON.parse(extractionStr);
    
    return {
      cvText: extraction.cvText || '',
      summary: extraction.summary,
      extracted: extraction.extracted,
      structured: extraction.structured, // AI-structured data from /api/cv/structure
    };
  } catch {
    return null;
  }
}
