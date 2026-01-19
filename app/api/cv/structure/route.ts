import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Only create OpenAI client if API key exists
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Structured CV data for the editor
 * All text fields preserve EXACT original text from the uploaded CV
 */
export interface StructuredCVData {
  professionalIntro?: string;
  experience: {
    title: string;
    company: string;
    location?: string;
    startDate: string;  // EXACT date text from CV, e.g., "November 2022", "2020"
    endDate?: string;   // EXACT date text from CV, null if current position
    keyMilestones?: string;
    bullets: string[];
  }[];
  education: {
    title: string;
    institution: string;
    year: string;  // EXACT year text from CV, e.g., "2016 - 2019"
  }[];
  skills: string[];
  languages: {
    language: string;
    level: string;  // EXACT level text from CV, e.g., "Modersmål", "Flydende", "Native"
  }[];
}

const SYSTEM_PROMPT = `You are a VERBATIM CV EXTRACTION SYSTEM.

╔═══════════════════════════════════════════════════════════════════════════╗
║  CRITICAL: EVERY CHARACTER MATTERS - NO TRUNCATION ALLOWED               ║
╚═══════════════════════════════════════════════════════════════════════════╝

Your ONLY job is to extract CV data and copy it CHARACTER FOR CHARACTER.
The user MUST see their EXACT original CV text - not a shortened version.

ABSOLUTE RULES:
⛔ NEVER cut off words mid-way (e.g., "Manager" not "Manage")
⛔ NEVER shorten institution names (e.g., "Security" not "Sec")
⛔ NEVER abbreviate titles (e.g., "Examination" not "Examina")
⛔ NEVER modify, reformat, translate, or "improve" anything
⛔ NEVER truncate to save tokens - use ALL characters

✅ Copy COMPLETE words - every letter matters
✅ Copy FULL institution names - include everything
✅ Copy ENTIRE degree titles - no shortening
✅ Copy ALL characters exactly as they appear

═══════════════════════════════════════════════════════════════════════════
TRUNCATION ERRORS TO AVOID (REAL EXAMPLES)
═══════════════════════════════════════════════════════════════════════════

❌ WRONG: "Certificated Security Manage"
✅ CORRECT: "Certificated Security Manager" (include final 'r')

❌ WRONG: "Danish Institute for Fire & Sec"
✅ CORRECT: "Danish Institute for Fire & Security" (include 'urity')

❌ WRONG: "Higher Commercial Examina"
✅ CORRECT: "Higher Commercial Examination" (include 'tion')

❌ WRONG: "Roskilde Busine"
✅ CORRECT: "Roskilde Business College" (include 'ss College')

❌ WRONG: "2016 - 20"
✅ CORRECT: "2016 - 2019" (include all 4 digits)

The CV contains COMPLETE words. Extract COMPLETE words.

═══════════════════════════════════════════════════════════════════════════
TEXT CLEANING (Only remove these artifacts)
═══════════════════════════════════════════════════════════════════════════

Remove ONLY:
- Print timestamps (HH:MM format)
- Page numbers (e.g. "1/3", "Page 2")
- Footer/header noise (URLs, "Powered by...")

Keep EVERYTHING else EXACTLY as written - every character.

═══════════════════════════════════════════════════════════════════════════
OUTPUT SCHEMA
═══════════════════════════════════════════════════════════════════════════

{
  "professionalIntro": string | null,
  "experience": [
    {
      "title": string (COMPLETE - all characters),
      "company": string (COMPLETE - all characters),
      "location": string | null,
      "startDate": string (EXACT as written),
      "endDate": string | null,
      "keyMilestones": string | null,
      "bullets": [string]
    }
  ],
  "education": [
    {
      "title": string (COMPLETE degree name - ALL characters, not truncated),
      "institution": string (COMPLETE name - ALL characters, not truncated),
      "year": string (COMPLETE - e.g., "2016 - 2019" not "2016 - 20")
    }
  ],
  "skills": [string],
  "languages": [
    {
      "language": string,
      "level": string (EXACT as written: "Modersmål", "Flydende", etc.)
    }
  ]
}

═══════════════════════════════════════════════════════════════════════════
EXPERIENCE SORTING
═══════════════════════════════════════════════════════════════════════════

Sort experience by:
1. Current jobs (endDate = null) first
2. Then by most recent end date
3. Jobs without dates last

═══════════════════════════════════════════════════════════════════════════
FINAL CHECK BEFORE OUTPUT
═══════════════════════════════════════════════════════════════════════════

For EACH education and experience entry, verify:
1. Does the title end with a COMPLETE word? (not mid-word)
2. Does the institution name end with a COMPLETE word?
3. Are all 4 digits present in years?

If any text ends mid-word, go back and fix it.

Return ONLY the JSON object. No explanations.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cvText } = body;
    
    if (!cvText || typeof cvText !== 'string') {
      return NextResponse.json(
        { error: 'cvText er påkrævet' },
        { status: 400 }
      );
    }
    
    // Log input for debugging
    console.log('CV Structure API - Input received:', {
      textLength: cvText.length,
      preview: cvText.substring(0, 300).replace(/\n/g, ' '),
      lineCount: (cvText.match(/\n/g) || []).length + 1,
    });
    
    if (!openai) {
      return NextResponse.json(getMockStructuredData());
    }
    
    // Use gpt-4o with increased token limit
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: `---CV TEXT BEGINS---
${cvText}
---CV TEXT ENDS---

Extract and structure this CV following the rules. Return ONLY valid JSON.`
        },
      ],
      temperature: 0.05,
      max_tokens: 16000,
      response_format: { type: 'json_object' },
    });
    
    const responseText = completion.choices[0]?.message?.content?.trim() || '{}';
    
    console.log('CV Structure API - Raw response length:', responseText.length);
    
    try {
      const structured = JSON.parse(responseText) as StructuredCVData;
      
      // Log extraction results for debugging
      console.log('CV Structure API - Extracted:', {
        hasIntro: !!structured.professionalIntro,
        experienceCount: structured.experience?.length || 0,
        educationCount: structured.education?.length || 0,
        skillsCount: structured.skills?.length || 0,
        languagesCount: structured.languages?.length || 0,
      });
      
      // Helper function to detect and warn about truncation
      const detectTruncation = (text: string, field: string): string => {
        if (!text || text.length === 0) return text;
        
        // Check if ends with incomplete word (single letter or truncated word)
        const endsWithIncomplete = text.match(/\s+[A-Z]$/i) || // ends with single capital letter
                                   text.match(/[a-z]{2,}[aeiou]$/i); // ends mid-word with vowel
        
        if (endsWithIncomplete) {
          console.warn(`⚠️  TRUNCATION DETECTED in ${field}: "${text}"`);
        }
        
        // Check for common truncated year patterns
        if (text.includes(' - ') && text.match(/-\s*\d{2}\s*$/)) {
          console.warn(`⚠️  TRUNCATED YEAR in ${field}: "${text}" - missing last 2 digits`);
        }
        
        return text;
      };
      
      // Validate and clean the response
      const cleaned: StructuredCVData = {
        professionalIntro: structured.professionalIntro?.trim() || undefined,
        experience: Array.isArray(structured.experience) 
          ? structured.experience.map(exp => {
              // Clean and validate
              const title = exp.title?.trim() || '';
              const company = exp.company?.trim() || '';
              const startDate = exp.startDate?.replace(/,\s*/g, ' ').trim() || '';
              const endDate = exp.endDate?.replace(/,\s*/g, ' ').trim() || undefined;
              
              // Detect truncation
              detectTruncation(title, 'job title');
              detectTruncation(company, 'company name');
              
              return {
                title,
                company,
                location: exp.location?.trim() || undefined,
                startDate,
                endDate,
                keyMilestones: exp.keyMilestones?.trim() || undefined,
                bullets: Array.isArray(exp.bullets) 
                  ? exp.bullets.filter(b => b && typeof b === 'string' && b.trim()).map(b => b.trim())
                  : [],
              };
            }).filter(exp => exp.title || exp.company)
          : [],
        education: Array.isArray(structured.education)
          ? structured.education.map(edu => {
              const title = edu.title?.trim() || '';
              const institution = edu.institution?.trim() || '';
              const year = edu.year?.toString().trim() || '';
              
              // Detect truncation
              detectTruncation(title, 'education title');
              detectTruncation(institution, 'education institution');
              detectTruncation(year, 'education year');
              
              return {
                title,
                institution,
                year,
              };
            })
            .filter(edu => edu.title || edu.institution)
            .sort((a, b) => {
              // Sort education in reverse chronological order (newest first)
              const getYearValue = (yearStr: string): number => {
                // Extract first year from patterns like "2016 - 2019" or "2016"
                const match = yearStr.match(/(\d{4})/);
                return match ? parseInt(match[1], 10) : 0;
              };
              
              const yearA = getYearValue(a.year);
              const yearB = getYearValue(b.year);
              
              return yearB - yearA; // Descending order (newest first)
            })
          : [],
        skills: Array.isArray(structured.skills)
          ? structured.skills.filter(s => s && typeof s === 'string' && s.trim()).map(s => s.trim())
          : [],
        languages: Array.isArray(structured.languages)
          ? structured.languages.map(lang => ({
              language: lang.language?.trim() || '',
              level: lang.level?.trim() || '',  // Keep EXACT level text from CV
            })).filter(lang => lang.language)
          : [],
      };
      
      console.log('CV Structure API - Cleaned result:', {
        experienceCount: cleaned.experience.length,
        educationCount: cleaned.education.length,
        skillsCount: cleaned.skills.length,
        languagesCount: cleaned.languages.length,
        firstExpTitle: cleaned.experience[0]?.title,
        firstExpCompany: cleaned.experience[0]?.company,
      });
      
      return NextResponse.json(cleaned);
      
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response (first 500 chars):', responseText.substring(0, 500));
      return NextResponse.json(
        { error: 'Kunne ikke parse struktureret CV data' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('CV structure error:', error);
    return NextResponse.json(
      { error: 'CV strukturering fejlede' },
      { status: 500 }
    );
  }
}

function getMockStructuredData(): StructuredCVData {
  return {
    professionalIntro: 'Erfaren professionel med solid baggrund inden for ledelse og sikkerhed.',
    experience: [
      {
        title: 'Security Manager',
        company: 'Global Security Corp',
        location: 'Copenhagen, Denmark',
        startDate: 'January 2020',
        endDate: undefined,
        keyMilestones: 'Ansvarlig for hele sikkerhedsoperationen i Norden.',
        bullets: [
          'Ledet et team på 15 sikkerhedsspecialister',
          'Implementeret nye sikkerhedsprotokoller der reducerede hændelser med 40%',
          'Udviklet træningsprogrammer for alle medarbejdere',
        ],
      },
      {
        title: 'Senior Security Consultant',
        company: 'SecureTech Solutions',
        location: 'Aarhus, Denmark',
        startDate: 'March 2016',
        endDate: 'December 2019',
        bullets: [
          'Rådgivet Fortune 500 virksomheder om sikkerhedsstrategi',
          'Gennemført over 50 sikkerhedsaudits',
        ],
      },
    ],
    education: [
      {
        title: 'Certified Security Manager (CPP)',
        institution: 'ASIS International',
        year: '2019',
      },
      {
        title: 'Bachelor i Kriminologi',
        institution: 'Københavns Universitet',
        year: '2012-2015',
      },
    ],
    skills: [
      'Risk Assessment',
      'Security Operations',
      'Team Leadership',
      'Crisis Management',
      'Physical Security',
      'Access Control Systems',
      'CCTV Systems',
      'Incident Response',
    ],
    languages: [
      { language: 'Danish', level: 'native' },
      { language: 'English', level: 'fluent' },
      { language: 'German', level: 'intermediate' },
    ],
  };
}
