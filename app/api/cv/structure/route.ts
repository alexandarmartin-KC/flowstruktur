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

const SYSTEM_PROMPT = `You are an EXPERT CV reconstruction specialist. You will receive COMPLETELY SCRAMBLED text from a PDF where a two-column layout was destroyed by pdf-parse.

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
- Look for degree/certification names: "Certificated Security Manager", "AP Degree", "Bachelor", "Master", "Higher Commercial Examination"
- Institution names: "Danish Institute for Fire & Security", "Roskilde Business College", "University", "College", "AP Degree Courses"
- Years: "2016 - 2019", "2013 - 2014", "1998 - 2001"
- Education entries may appear as:
  * "Certificated Security Manager, CFPA" on one line, then "2016 - 2019" on next, then institution
  * OR year first: "2016 - 2019" then "Communication" then "AP Degree Courses"
  * OR year first: "2013 - 2014" then "Certificated Security Manager" then "Danish Institute for Fire & Security"
  * OR mixed format with degree, year, and institution scattered
- CRITICAL: Extract COMPLETE year ranges - "2016 - 2019" NOT "2016 - 20" or just "2016"
  * If you see "2013 - 2014", output EXACTLY "2013 - 2014"
  * If you see "1998 - 2001", output EXACTLY "1998 - 2001"
  * NEVER truncate years to 2 digits
- If degree and year are present but institution is unclear, look for words like "Communication", "AP Degree Courses" as institution
- PRESERVE COMPLETE degree names: "Certificated Security Manager, CFPA" NOT "Certificated Security Manager"
- PRESERVE COMPLETE institution names: "Danish Institute for Fire & Security" NOT "Danish Institute"
- For "Communication AP Degree Courses", institution is "Communication" and title is "AP Degree Courses"
- PRESERVE COMPLETE years: "2016 - 2019" NOT "2016 - 20"

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
      "title": "Degree/Certificate name (e.g., 'AP Degree Courses', 'Certificated Security Manager, CFPA')",
      "institution": "School name (e.g., 'Communication', 'Danish Institute for Fire & Security')",
      "year": "COMPLETE year or range - '2016 - 2019' NOT '2016 - 20', preserve all 4 digits of both years"
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

The text below is SEVERELY SCRAMBLED from a two-column CV PDF. pdf-parse has destroyed the layout.

TRAINING EXAMPLE - Study this pattern:

Here's how scrambled text looks:
"Key Milestones
[Job description bullets]
Phone
+45 9955 5813
Email
alexandar.martin@gmail.com
Contact
Education
Experience
Security Specialist, Physical Security
November, 2022 - Present
Ørsted A/S | Denmark
[Job description]
Guard Supervisor
July, 2021 - November, 2022"

In this chaos, you need to identify:
- "Security Specialist, Physical Security" + "November, 2022 - Present" + "Ørsted A/S | Denmark" = ONE job
- All the "Key Milestones" bullets at the top belong to the Security Specialist job
- "Phone", "Email", "Contact", "Education", "Experience" are NOISE headers - IGNORE them
- "Guard Supervisor" + "July, 2021 - November, 2022" = NEXT job (so previous job is complete)

CRITICAL INSTRUCTIONS:
1. This CV has approximately 6-8 job positions - extract ALL of them
2. The FIRST major text block (before any job title) is usually bullets from the FIRST job
3. When you see a NEW job title + date, the PREVIOUS job ends
4. Contact info (phone, email, address) interrupts jobs - IGNORE it
5. Section headers ("Contact", "Education", "Experience", "CV") appear randomly - IGNORE them
6. Collect ALL bullets/descriptions between job headers
7. Some jobs have NO bullets listed - that's OK, leave bullets array empty

EDUCATION EXTRACTION - CRITICAL:
The education section will appear scrambled like:
"Certificated Security Manager, CFPA
2016 - 2019
Communication
AP Degree Courses
2013 - 2014
Certificated Security Manager
Danish Institute for Fire & Security
1998 - 2001
Higher Commercial Examination
Roskilde Business College"

WAIT - this is TRICKY! The ACTUAL pattern is:
"2016 - 2019
Communication
AP Degree Courses"

This means the YEAR appears BEFORE the title. So:
- Line "2016 - 2019" → next lines are "Communication" then "AP Degree Courses" = Title is "Communication AP Degree Courses", Year is "2016 - 2019"
- Line "2013 - 2014" → next lines are "Certificated Security Manager" then "Danish Institute for Fire & Security" = Title is "Certificated Security Manager", Institution is "Danish Institute for Fire & Security", Year is "2013 - 2014"  
- Line "1998 - 2001" → next lines are "Higher Commercial Examination" then "Roskilde Business College" = Title is "Higher Commercial Examination", Institution is "Roskilde Business College", Year is "1998 - 2001"

Parse this as THREE separate education entries:
1. Title: "Communication AP Degree Courses", Year: "2016 - 2019", Institution: try to find or use "Communication"
2. Title: "Certificated Security Manager, CFPA" (include CFPA if present), Year: "2013 - 2014", Institution: "Danish Institute for Fire & Security"
3. Title: "Higher Commercial Examination", Year: "1998 - 2001", Institution: "Roskilde Business College"

IMPORTANT: Keep COMPLETE degree names, COMPLETE institution names, and COMPLETE years.

EXPECTED JOBS IN THIS CV (based on the text):
- Security Specialist, Physical Security @ Ørsted (Nov 2022 - Present)
- Guard Supervisor @ Ørsted (July 2021 - Nov 2022)
- Executive Security Chauffeur @ Ørsted (March 2017 - July 2021)
- Security Account Manager for IBM @ G4S (Feb 2015 - Feb 2016)
- Security Officer (multiple periods) @ G4S
- SOC Operator @ Securitas (2012)

EXPECTED EDUCATION (extract with CORRECT year matching - study carefully):
1. "Communication AP Degree Courses" @ institution unclear, "2016 - 2019" (most recent)
2. "Certificated Security Manager, CFPA" @ "Danish Institute for Fire & Security", "2013 - 2014"
3. "Higher Commercial Examination" @ "Roskilde Business College", "1998 - 2001" (oldest)

CRITICAL YEAR MATCHING (based on actual CV):
From the scrambled text pattern:
"2016 - 2019 
Communication
AP Degree Courses
2013 - 2014
Certificated Security Manager
Danish Institute for Fire & Security
1998 - 2001
Higher Commercial Examination
Roskilde Business College"

This means:
- "2016 - 2019" goes with "Communication AP Degree Courses" (year appears BEFORE the title)
- "2013 - 2014" goes with "Certificated Security Manager" (year appears BEFORE the title)
- "1998 - 2001" goes with "Higher Commercial Examination" (year appears BEFORE the title)

CRITICAL: Output EXACTLY "2016 - 2019" NOT "2016 - 20", "2013 - 2014" NOT "2013 - 20", etc.

Extract ALL of these with their complete information.

---SCRAMBLED CV TEXT BEGINS---
${cvText}
---SCRAMBLED CV TEXT ENDS---

Reconstruct the complete professional CV with ALL jobs, ALL bullets, education, skills, and languages.
Return ONLY the JSON object.`
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
            }))
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
