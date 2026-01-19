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

═══════════════════════════════════════════════════════════════════════════
CRITICAL RULE: COPY TEXT EXACTLY - NO MODIFICATIONS
═══════════════════════════════════════════════════════════════════════════

Your ONLY job is to extract CV data and copy it EXACTLY as written.
The user MUST see their original CV text - not your interpretation of it.

⛔ DO NOT modify any text
⛔ DO NOT reformat dates
⛔ DO NOT translate anything
⛔ DO NOT summarize or shorten
⛔ DO NOT "improve" or "correct" anything
⛔ DO NOT truncate - copy COMPLETE text

✅ Copy job titles EXACTLY as written
✅ Copy company names EXACTLY as written
✅ Copy education titles EXACTLY as written
✅ Copy institution names EXACTLY as written
✅ Copy dates EXACTLY as written (e.g., "November 2022" stays "November 2022")
✅ Copy bullet points EXACTLY as written
✅ Copy skills EXACTLY as written
✅ Copy language levels EXACTLY as written

═══════════════════════════════════════════════════════════════════════════
TEXT CLEANING (Only remove these artifacts)
═══════════════════════════════════════════════════════════════════════════

Remove ONLY:
- Print timestamps (HH:MM format)
- Page numbers (e.g. "1/3", "Page 2")
- Footer/header noise (URLs, "Powered by...")

Keep EVERYTHING else EXACTLY as written.

═══════════════════════════════════════════════════════════════════════════
OUTPUT SCHEMA
═══════════════════════════════════════════════════════════════════════════

{
  "professionalIntro": string | null (EXACT text from CV),
  "experience": [
    {
      "title": string (EXACT title from CV - not truncated, not modified),
      "company": string (EXACT company name from CV),
      "location": string | null (EXACT location if present),
      "startDate": string (EXACT date text, e.g., "November 2022", "2020", "Jan 2019"),
      "endDate": string | null (EXACT date text or null if "Nu"/"Present"/"Current"),
      "keyMilestones": string | null,
      "bullets": [string] (EXACT bullet text from CV)
    }
  ],
  "education": [
    {
      "title": string (EXACT degree/course name - COMPLETE, not truncated),
      "institution": string (EXACT institution name - COMPLETE, not truncated),
      "year": string (EXACT year text, e.g., "2016 - 2019", "2020")
    }
  ],
  "skills": [string] (EXACT skill names from CV),
  "languages": [
    {
      "language": string (EXACT language name),
      "level": string (EXACT level text: "Modersmål", "Flydende", "Native", etc.)
    }
  ]
}

═══════════════════════════════════════════════════════════════════════════
EXAMPLES OF CORRECT EXTRACTION (VERBATIM COPY)
═══════════════════════════════════════════════════════════════════════════

If CV says: "Security Specialist, Physical Security"
Output: "Security Specialist, Physical Security"
NOT: "Security Specialist, Physical" ❌

If CV says: "November 2022"
Output: "November 2022"
NOT: "2022-11" ❌

If CV says: "Dansk - Modersmål"
Output: { "language": "Dansk", "level": "Modersmål" }
NOT: { "language": "Danish", "level": "native" } ❌

If CV says: "Higher Commercial Examination"
Output: "Higher Commercial Examination"
NOT: "Higher Commercial Examina" ❌

If CV says: "2016 - 2019"
Output: "2016 - 2019"
NOT: "2016 - 20" ❌

If CV says: "Roskilde Business College"
Output: "Roskilde Business College"
NOT: "Roskilde Busine" ❌

═══════════════════════════════════════════════════════════════════════════
EXPERIENCE SORTING
═══════════════════════════════════════════════════════════════════════════

Sort experience by:
1. Current jobs (endDate contains "Nu"/"Present"/"Current" → null) first
2. Then by most recent end date
3. Jobs without dates last

═══════════════════════════════════════════════════════════════════════════
VALIDATION BEFORE OUTPUT
═══════════════════════════════════════════════════════════════════════════

Check each field:
- [ ] Is this EXACTLY what was in the original CV?
- [ ] Did I truncate anything? (NO truncation allowed)
- [ ] Did I reformat anything? (NO reformatting allowed)
- [ ] Did I translate anything? (NO translation allowed)
- [ ] Is the complete word/phrase preserved?

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
