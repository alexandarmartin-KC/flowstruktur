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

const SYSTEM_PROMPT = `You are an EXPERT CV/Resume parser specialized in reconstructing CVs from messy text extraction.

═══════════════════════════════════════════════════════════════════════════
CRITICAL CONTEXT: PDF TEXT EXTRACTION PROBLEMS
═══════════════════════════════════════════════════════════════════════════

The CV text you receive comes from PDF extraction which often DESTROYS the original structure:
- Two-column layouts get merged incorrectly (left column text mixed with right column)
- Text from sidebars (contact info, skills, languages) appears scattered throughout
- Section headers may appear far from their content
- Bullet points may lose their bullets and appear as regular text
- Dates may appear separated from their job entries
- The reading order may be completely wrong

YOUR JOB: Intelligently RECONSTRUCT the original CV structure by:
1. Identifying patterns (dates + titles + companies = job entries)
2. Grouping related information that was scattered
3. Using context clues to associate bullets/text with the correct job
4. Recognizing that information appearing "out of order" belongs together

═══════════════════════════════════════════════════════════════════════════
PARSING STRATEGY - READ CAREFULLY
═══════════════════════════════════════════════════════════════════════════

STEP 1: FIRST PASS - Identify all key elements:
- All job titles (look for: Manager, Director, Officer, Specialist, Developer, etc.)
- All company names
- All date ranges (YYYY, Month YYYY, or ranges like "2020 - 2023", "2020 - Present")
- All educational qualifications and institutions
- All skills/competencies mentioned anywhere
- All languages with levels

STEP 2: ASSOCIATION - Connect related elements:
- Match job titles with their companies (they usually appear near each other)
- Match date ranges with job entries (dates often appear on same line or adjacent)
- Collect ALL bullet points and descriptive text that appears AFTER a job entry until the next job entry
- If bullets appear scattered, use context to determine which job they belong to

STEP 3: HANDLE COMMON PDF EXTRACTION ISSUES:
- If you see "Contact" / "Kontakt" followed by scattered email/phone/location, these are contact details (ignore for structure)
- If "Education" / "Uddannelse" section is mixed in with experience, separate them
- If skills appear in a sidebar list, extract ALL of them even if formatting is broken
- Dates like "april 2015" and "February 2019" appearing near jobs indicate the period

═══════════════════════════════════════════════════════════════════════════
EXTRACTION RULES
═══════════════════════════════════════════════════════════════════════════

1. EXTRACT EVERYTHING - Never skip information even if formatting is broken
2. NEVER INVENT DATA - Only extract what is explicitly stated
3. PRESERVE ORIGINAL LANGUAGE - Keep Danish text in Danish, English in English
4. HANDLE AMBIGUITY - If date association is unclear, use the most logical pairing
5. COMPLETE BULLETS - Include ALL achievements/responsibilities for each role

═══════════════════════════════════════════════════════════════════════════
SECTION DETECTION (may appear in various languages)
═══════════════════════════════════════════════════════════════════════════

PROFILE SECTION keywords:
"Profile", "PROFILE", "Profil", "PROFIL", "Summary", "About", "Om mig", "Professional Summary", "Career Objective", "Karrieremål"
→ Look for 2-5 sentence paragraph describing the person's expertise and value proposition

EXPERIENCE SECTION keywords:  
"Experience", "EXPERIENCE", "Work Experience", "Employment", "Career", "Erhvervserfaring", "ERHVERVSERFARING", "Arbejdserfaring", "ARBEJDSERFARING", "Ansættelser", "Professional Experience"
→ Extract EVERY job with: title, company, location (if present), startDate, endDate, narrative description (keyMilestones), ALL bullet points

EDUCATION SECTION keywords:
"Education", "EDUCATION", "Uddannelse", "UDDANNELSE", "Academic", "Qualifications", "Certifications", "Certificeringer"
→ Include degrees, certifications, courses, diplomas

SKILLS/COMPETENCIES keywords:
"Skills", "SKILLS", "Kompetencer", "KOMPETENCER", "Core Competencies", "Technical Skills", "Expertise", "Kernekompetencer", "Faglige kompetencer"
→ Extract ALL skills, tools, technologies, methodologies mentioned

LANGUAGES keywords:
"Languages", "LANGUAGES", "Sprog", "SPROG", "Language Skills"
→ Extract with proficiency levels

═══════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT - STRICT JSON
═══════════════════════════════════════════════════════════════════════════

{
  "professionalIntro": "The complete profile/summary text exactly as written, or null if not present",
  "experience": [
    {
      "title": "Exact job title from CV",
      "company": "Company name exactly as written",
      "location": "City/Country if mentioned, otherwise null",
      "startDate": "Start date in original format (e.g., 'april 2015', 'January 2020', '2020')",
      "endDate": "End date or null if current/present/nu/ongoing",
      "keyMilestones": "Any narrative paragraph about the role (not bullets), null if none",
      "bullets": ["Complete bullet point 1", "Complete bullet point 2", "...all bullets..."]
    }
  ],
  "education": [
    {
      "title": "Degree/Certificate name exactly as written",
      "institution": "Institution name exactly as written", 
      "year": "Year or range as written"
    }
  ],
  "skills": ["All", "Skills", "Mentioned", "In", "CV", "Including", "Technical", "And", "Soft", "Skills"],
  "languages": [
    {"language": "Language name", "level": "native|fluent|advanced|intermediate|basic"}
  ]
}

LANGUAGE LEVEL MAPPING:
- native: "Native", "Mother tongue", "Modersmål", "First language"
- fluent: "Fluent", "Proficient", "C1", "C2", "Flydende", "Near-native"
- advanced: "Advanced", "B2", "Avanceret", "Good working knowledge"
- intermediate: "Intermediate", "B1", "Conversational", "Mellem", "Working knowledge"
- basic: "Basic", "Beginner", "A1", "A2", "Grundlæggende", "Elementary"

═══════════════════════════════════════════════════════════════════════════
FINAL INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════

- Return ONLY the JSON object - no markdown, no explanations, no code blocks
- Include ALL job positions found in the CV (do not merge or skip any)
- Include ALL bullet points for each role (there may be 5-10+ per job)
- If text appears broken/scattered, use your intelligence to reconstruct it
- Preserve the original language of the CV content
- Sort experience by date (most recent first) if possible to determine`;

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
    
    // Log input for debugging - first 500 chars and total length
    console.log('CV Structure API - Input received:', {
      textLength: cvText.length,
      preview: cvText.substring(0, 500).replace(/\n/g, ' '),
      lineCount: (cvText.match(/\n/g) || []).length + 1,
    });
    
    if (!openai) {
      return NextResponse.json(getMockStructuredData());
    }
    
    // Use gpt-4o for better extraction quality
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: `TASK: Parse and structure this CV text. The text was extracted from a PDF and may have formatting issues (columns merged, text scattered, etc.). Use your intelligence to reconstruct the proper structure.

IMPORTANT: Extract EVERY job position, EVERY education entry, EVERY skill, and EVERY language. Do not skip or summarize anything.

If text appears fragmented or out of order, look for patterns:
- Job titles near company names and dates = one job entry
- Bullet-style text after a job = achievements for that job
- Scattered skills = collect them all
- Languages with levels mentioned anywhere = include them

---CV TEXT START---
${cvText}
---CV TEXT END---

Return the structured JSON now.` 
        },
      ],
      temperature: 0.1,
      max_tokens: 8000,
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
      
      // Validate and clean the response
      const cleaned: StructuredCVData = {
        professionalIntro: structured.professionalIntro?.trim() || undefined,
        experience: Array.isArray(structured.experience) 
          ? structured.experience.map(exp => ({
              title: exp.title?.trim() || '',
              company: exp.company?.trim() || '',
              location: exp.location?.trim() || undefined,
              startDate: exp.startDate?.trim() || '',
              endDate: exp.endDate?.trim() || undefined,
              keyMilestones: exp.keyMilestones?.trim() || undefined,
              bullets: Array.isArray(exp.bullets) 
                ? exp.bullets.filter(b => b && typeof b === 'string' && b.trim()).map(b => b.trim())
                : [],
            })).filter(exp => exp.title || exp.company)
          : [],
        education: Array.isArray(structured.education)
          ? structured.education.map(edu => ({
              title: edu.title?.trim() || '',
              institution: edu.institution?.trim() || '',
              year: edu.year?.toString().trim() || '',
            })).filter(edu => edu.title || edu.institution)
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
