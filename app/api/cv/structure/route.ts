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

const SYSTEM_PROMPT = `You are a HIGHLY INTELLIGENT CV reconstruction expert. You will receive MESSY, BROKEN text from PDF extraction where a two-column CV layout was destroyed.

═══════════════════════════════════════════════════════════════════════════
YOUR CHALLENGE
═══════════════════════════════════════════════════════════════════════════

The CV you're parsing had this structure:
- LEFT SIDEBAR (blue/colored): Contact info, Education, Profile/Social, Languages, Skills
- RIGHT MAIN COLUMN (white): Job title header, profile paragraph, detailed work experience

But pdf-parse has COMPLETELY SCRAMBLED IT. You will see:
- Contact details mixed with job descriptions
- Section headers far from their content
- Bullet points scattered everywhere
- Dates appearing randomly
- Skills listed in weird places
- Everything out of order

YOUR JOB: Be a DETECTIVE. Reconstruct the original professional CV.

═══════════════════════════════════════════════════════════════════════════
CRITICAL RECONSTRUCTION STRATEGIES
═══════════════════════════════════════════════════════════════════════════

1. **FIND ALL JOB POSITIONS FIRST**
   Look for these patterns (case-insensitive):
   - Titles: "Security Manager", "Certified Security Manager", "Security Consultant", "Officer", "Specialist", "Director", "Developer", etc.
   - Companies: Proper nouns after titles, or standalone company names
   - Dates: "april 2015", "2015 - 2019", "January 2020", "2020 - nu", patterns like YYYY or Month YYYY
   
   When you find: [Some Title] + [Some Company Name] + [Date Range] = ONE JOB ENTRY

2. **COLLECT ALL BULLETS/DESCRIPTIONS**
   After finding a job entry, scan forward until you hit the NEXT job entry
   Collect ALL descriptive text, bullet points, achievements
   They might NOT have bullet symbols - look for achievement-style sentences

3. **IDENTIFY SIDEBAR CONTENT** (usually scattered at top or mixed in)
   - "UDDANNELSE" / "EDUCATION" = education section
   - "PROFIL & SOCIAL" / "PROFILE" = ignore or use as intro
   - "SPROG" / "LANGUAGES" = languages
   - "KOMPETENCER" / "SKILLS" = skills list
   - "KONTAKT" / "CONTACT" = contact (ignore for structure)

4. **LANGUAGE DETECTION**
   If you see "Dansk - Modersmål", "Engelsk - Flydende" = Danish CV
   Preserve the language exactly

5. **ASSOCIATION LOGIC**
   If you see random text like "Ledet sikkerhedsafdelingen med 15 medarbejdere"
   → This is a bullet/description for the nearest job above it
   
   If you see "SAP MM, SAP SD, Microsoft Office"
   → These are skills

═══════════════════════════════════════════════════════════════════════════
SPECIFIC PATTERNS TO LOOK FOR
═══════════════════════════════════════════════════════════════════════════

**Job Entry Patterns:**
- "Certified Security Manager (CPP)" at "SIKKERHEDSAFDELINGEN" or similar
- Any line with both a professional title AND a date
- Company names are often capitalized or standalone

**Date Patterns:**
- "april 2015 - oktober 2016"
- "2015 - 2019"
- "January 2020 - Present"
- "2020 - nu"
- Month can be lowercase: "april", "februar", "oktober"

**Bullet Patterns:**
- Lines starting with action verbs: "Ledet", "Implementeret", "Udviklede", "Ansvarlig for"
- Achievement descriptions: "Reducerede", "Øgede", "Opnåede"
- Responsibility descriptions: "Ansvar for", "Varetog"

**Education Patterns:**
- Degree names followed by institution names
- Often has years like "2012 - 2015"
- Look for "Universitet", "University", "College", "Academy"

**Skills Patterns:**
- Comma-separated lists
- Often ALL CAPS or Title Case
- Tech terms: "SAP", "Microsoft Office", "CRM", etc.
- Soft skills: "Communication", "Leadership", "Team Management"

**Language Patterns:**
- "Dansk - Modersmål" = Danish, native
- "Engelsk - Flydende" = English, fluent
- "Tysk - Mellem" = German, intermediate

═══════════════════════════════════════════════════════════════════════════
EXTRACTION RULES - ABSOLUTE
═══════════════════════════════════════════════════════════════════════════

1. Extract EVERYTHING - if you see 10 bullet points, include all 10
2. NEVER invent data - only extract visible information
3. PRESERVE original language (Danish stays Danish)
4. If uncertain about date association, use closest logical match
5. Include ALL jobs, even if formatting is broken
6. Collect ALL skills mentioned anywhere
7. Extract ALL languages with levels

═══════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT - STRICT JSON
═══════════════════════════════════════════════════════════════════════════

{
  "professionalIntro": "Profile paragraph text (2-5 sentences about the person)",
  "experience": [
    {
      "title": "Exact job title",
      "company": "Exact company name",
      "location": "City/Country or null",
      "startDate": "april 2015 (preserve exact format)",
      "endDate": "oktober 2016 or null if current",
      "keyMilestones": "Narrative paragraph if any (not bullets)",
      "bullets": [
        "Every single bullet point or achievement description",
        "Include ALL of them"
      ]
    }
  ],
  "education": [
    {
      "title": "Degree/Certificate name",
      "institution": "School name",
      "year": "Year or range"
    }
  ],
  "skills": ["Every", "Single", "Skill", "Mentioned"],
  "languages": [
    {"language": "Dansk", "level": "native"},
    {"language": "Engelsk", "level": "fluent"}
  ]
}

**Level Mapping:**
- "Modersmål", "Native", "Mother tongue" → "native"
- "Flydende", "Fluent", "Proficient" → "fluent"
- "Avanceret", "Advanced" → "advanced"  
- "Mellem", "Intermediate", "Conversational" → "intermediate"
- "Grundlæggende", "Basic", "Beginner" → "basic"

═══════════════════════════════════════════════════════════════════════════
FINAL REMINDER
═══════════════════════════════════════════════════════════════════════════

Think like a detective piecing together a shredded document.
The CV is complete and professional - it just needs reconstruction.
Use pattern recognition, context clues, and logical association.
Extract EVERYTHING you can identify.

Return ONLY the JSON object - no markdown, no explanations.`;

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
    
    // Use gpt-4o for better extraction quality with higher token limit
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: `RECONSTRUCTION TASK:

The following is BROKEN, SCRAMBLED text from a PDF extraction. It was originally a professional two-column CV, but the columns got merged chaotically.

YOUR MISSION: Reconstruct the complete, professional CV structure from this mess.

WHAT TO LOOK FOR:
- Job titles like "Certified Security Manager", "Security Officer", "Sales Development Representative"
- Company names (proper nouns)
- Date patterns like "april 2015", "2015 - 2019", "2020 - nu"
- Bullet-style achievements (may not have bullet symbols)
- Skills lists (may be scattered)
- Language proficiency statements
- Education/certifications

IMPORTANT: Extract EVERYTHING. If you see 8 jobs, extract all 8. If you see 20 skills, extract all 20.

---SCRAMBLED CV TEXT BEGINS---
${cvText}
---SCRAMBLED CV TEXT ENDS---

Now reconstruct and return the structured JSON.` 
        },
      ],
      temperature: 0.05,
      max_tokens: 12000,
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
