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

const SYSTEM_PROMPT = `You are an expert CV/Resume parser. Your task is to extract ALL structured data from a CV text and return it as JSON.

CRITICAL RULES:
1. Extract EVERY piece of information present in the CV - do not skip anything
2. NEVER invent or fabricate data - only extract what is explicitly stated
3. Preserve the original language and phrasing exactly as written
4. If dates are unclear, use whatever format is in the CV
5. Extract ALL job positions, ALL education entries, ALL skills, ALL languages

EXTRACTION GUIDELINES:

## Professional Intro / Profile
- Look for sections titled: "Profile", "Summary", "About", "Profil", "Om mig", "Professional Summary", "Career Objective"
- This is usually 2-5 sentences at the top of the CV describing the person
- If no explicit profile section exists, leave professionalIntro as null

## Experience / Work History
- Look for sections titled: "Experience", "Work Experience", "Employment", "Career History", "Erhvervserfaring", "Arbejdserfaring", "Ansættelser"
- For EACH position extract:
  - title: The job title (e.g., "Security Manager", "Software Developer", "Sales Director")
  - company: Company name exactly as written
  - location: City/country if mentioned
  - startDate: When they started (e.g., "January 2020", "2020", "Jan 2020")
  - endDate: When they ended, or null if current/present
  - keyMilestones: Any narrative paragraph describing the role (not bullet points)
  - bullets: Array of ALL bullet points / achievements / responsibilities for this role

## Education
- Look for sections titled: "Education", "Uddannelse", "Academic Background", "Qualifications", "Certifications"
- For EACH entry extract:
  - title: Degree name, certification, or course title
  - institution: School, university, or organization name
  - year: Year or year range (e.g., "2018", "2016-2020")

## Skills / Competencies
- Look for sections titled: "Skills", "Kompetencer", "Technical Skills", "Core Competencies", "Tools & Technologies", "Expertise"
- Extract ALL skills mentioned, including:
  - Technical skills (programming languages, tools, software)
  - Soft skills if listed
  - Industry-specific skills
  - Certifications mentioned in skills sections

## Languages
- Look for sections titled: "Languages", "Sprog", "Language Skills"
- For EACH language extract:
  - language: Name of the language
  - level: Proficiency level, mapped to: native, fluent, advanced, intermediate, basic
    - "Native", "Mother tongue", "Modersmål" → "native"
    - "Fluent", "Proficient", "C1-C2", "Flydende" → "fluent"  
    - "Advanced", "B2", "Avanceret" → "advanced"
    - "Intermediate", "Conversational", "B1", "Mellem" → "intermediate"
    - "Basic", "Beginner", "A1-A2", "Grundlæggende" → "basic"

OUTPUT FORMAT:
Return ONLY valid JSON with this exact structure:
{
  "professionalIntro": "string or null",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, Country",
      "startDate": "Month Year or Year",
      "endDate": "Month Year or Year or null if current",
      "keyMilestones": "Narrative description if present, otherwise null",
      "bullets": ["Achievement 1", "Achievement 2", ...]
    }
  ],
  "education": [
    {
      "title": "Degree/Certification",
      "institution": "School/Organization",
      "year": "Year or Year Range"
    }
  ],
  "skills": ["Skill 1", "Skill 2", ...],
  "languages": [
    {"language": "Language Name", "level": "native|fluent|advanced|intermediate|basic"}
  ]
}

IMPORTANT: 
- Return ONLY the JSON object, no markdown code blocks, no explanations
- Ensure all arrays are populated with ALL items found in the CV
- Do not summarize or truncate - include everything`;

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
          content: `Parse this CV and extract ALL structured data. Do not skip any information.\n\n---CV START---\n${cvText}\n---CV END---` 
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
