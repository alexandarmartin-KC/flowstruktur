import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Only create OpenAI client if API key exists
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Structured CV data for the editor
 */
export interface StructuredCVData {
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

const SYSTEM_PROMPT = `You are a TWO-STAGE CV EXTRACTION SYSTEM.

═══════════════════════════════════════════════════════════════════════════
STAGE 1: TEXT CLEANING (Internal - not output)
═══════════════════════════════════════════════════════════════════════════

First, mentally clean the input text:
- Remove print timestamps (HH:MM format, date+time patterns)
- Remove page numbers (e.g. "1/3", "Page 2")
- Remove footer/header noise (URLs, product names, "Powered by...")
- Keep ALL CV content exactly as written
- Do NOT rewrite, summarize, or interpret
- Preserve original wording, section boundaries, groupings

═══════════════════════════════════════════════════════════════════════════
STAGE 2: STRUCTURED JSON EXTRACTION (Your Output)
═══════════════════════════════════════════════════════════════════════════

CARDINAL RULES (VIOLATIONS = FAILURE):

1. ⛔ NO HALLUCINATION: Do NOT invent data
2. ⛔ NO TRUNCATION: Extract COMPLETE text - full words, full names, full titles
3. ⛔ NO GUESSING: If unclear or missing → use null
4. ✅ CORRECTNESS > COMPLETENESS
5. ✅ PRESERVE original language (Danish stays Danish)

═══════════════════════════════════════════════════════════════════════════
OUTPUT SCHEMA (STRICT)
═══════════════════════════════════════════════════════════════════════════

{
  "professionalIntro": string | null,
  "experience": [
    {
      "title": string (COMPLETE, not truncated),
      "company": string (COMPLETE, not truncated),
      "location": string | null,
      "startDate": "YYYY-MM" format (e.g. "2015-04"),
      "endDate": "YYYY-MM" | null (null if current),
      "keyMilestones": string | null,
      "bullets": [string] (each bullet complete)
    }
  ],
  "education": [
    {
      "title": string (COMPLETE degree name - not "Communication AP Degree C" but "Communication AP Degree Courses"),
      "institution": string (COMPLETE - not "Roskilde Busine" but "Roskilde Business College"),
      "year": string (COMPLETE - "2016 - 2019" NOT "2016 - 20")
    }
  ],
  "skills": [string],
  "languages": [
    {
      "language": string,
      "level": "native" | "fluent" | "advanced" | "intermediate" | "basic"
    }
  ]
}

═══════════════════════════════════════════════════════════════════════════
DATE NORMALIZATION (CRITICAL)
═══════════════════════════════════════════════════════════════════════════

Input → Output:
- "april 2015" → "2015-04"
- "Apr 2015" → "2015-04"
- "2015" → "2015-01"
- "Present" / "Nu" / "Current" / "Now" → endDate = null
- "November 2022" → "2022-11"
- "November, 2022" → "2022-11" (remove commas)

Ignore timestamps with HH:MM format - those are print artifacts.
Only use dates that clearly indicate job/education periods.

Month mappings:
- jan/januar/january → 01
- feb/februar/february → 02
- mar/marts/march → 03
- apr/april → 04
- maj/may → 05
- jun/juni/june → 06
- jul/juli/july → 07
- aug/august → 08
- sep/september → 09
- okt/oktober/october → 10
- nov/november → 11
- dec/december → 12

═══════════════════════════════════════════════════════════════════════════
EXPERIENCE SORTING (MANDATORY)
═══════════════════════════════════════════════════════════════════════════

After extraction, SORT experience array:
1. Current jobs (endDate = null) first
2. Then by endDate descending (newest first)
3. Then by startDate descending
4. Jobs without dates last

═══════════════════════════════════════════════════════════════════════════
ANTI-TRUNCATION EXAMPLES
═══════════════════════════════════════════════════════════════════════════

❌ WRONG: "Security Specialist, Physical"
✅ CORRECT: "Security Specialist, Physical Security"

❌ WRONG: "Communication AP Degree C"
✅ CORRECT: "Communication AP Degree Courses"

❌ WRONG: "Higher Commercial Examina"
✅ CORRECT: "Higher Commercial Examination"

❌ WRONG: "Roskilde Busine"
✅ CORRECT: "Roskilde Business College"

❌ WRONG: "2016 - 20"
✅ CORRECT: "2016 - 2019"

❌ WRONG: "Danish Institute"
✅ CORRECT: "Danish Institute for Fire & Security"

Extract the COMPLETE text. If you see "Higher Commercial Examination" in the CV, output exactly that - not "Higher Commercial Examina".

═══════════════════════════════════════════════════════════════════════════
LANGUAGE LEVEL MAPPING
═══════════════════════════════════════════════════════════════════════════

- "Modersmål" / "Native" / "Mother tongue" → "native"
- "Flydende" / "Fluent" / "Proficient" → "fluent"
- "Avanceret" / "Advanced" → "advanced"
- "Mellem" / "Intermediate" / "Conversational" → "intermediate"
- "Grundlæggende" / "Basic" / "Beginner" → "basic"

═══════════════════════════════════════════════════════════════════════════
VALIDATION CHECKLIST
═══════════════════════════════════════════════════════════════════════════

Before outputting, verify:
- [ ] All titles are COMPLETE (end with full word, not mid-word)
- [ ] All years have 4 digits in both positions if range (e.g. "2016 - 2019")
- [ ] All dates are "YYYY-MM" format
- [ ] Experience is sorted correctly
- [ ] No invented data
- [ ] Output is valid JSON

Return ONLY the JSON object. No explanations, no markdown.`;

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
              level: validateLevel(lang.level),
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

function validateLevel(level?: string): 'native' | 'fluent' | 'advanced' | 'intermediate' | 'basic' {
  if (!level) return 'intermediate';
  const normalized = level.toLowerCase().trim();
  
  if (['native', 'mother tongue', 'modersmål'].some(l => normalized.includes(l))) return 'native';
  if (['fluent', 'proficient', 'c1', 'c2', 'flydende'].some(l => normalized.includes(l))) return 'fluent';
  if (['advanced', 'b2', 'avanceret'].some(l => normalized.includes(l))) return 'advanced';
  if (['intermediate', 'conversational', 'b1', 'mellem'].some(l => normalized.includes(l))) return 'intermediate';
  if (['basic', 'beginner', 'elementary', 'a1', 'a2', 'grundlæggende'].some(l => normalized.includes(l))) return 'basic';
  
  return 'intermediate';
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
