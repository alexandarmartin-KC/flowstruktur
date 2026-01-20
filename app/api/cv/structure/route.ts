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
    level: string;
  }[];
}

/**
 * CRITICAL: This prompt uses a "JSON template filling" approach
 * Instead of asking AI to "extract", we ask it to FILL IN a template
 * by copying text CHARACTER BY CHARACTER from the source.
 */
const SYSTEM_PROMPT = `You are a TEXT COPYING machine. Your job is to FILL IN a JSON template by copying text EXACTLY from the CV.

CRITICAL INSTRUCTION: You must copy text CHARACTER BY CHARACTER. Never shorten, abbreviate, or modify ANY text.

For each field, find the matching text in the CV and COPY IT EXACTLY:
- If CV says "Certificated Security Manager" → copy "Certificated Security Manager" (all 28 characters)
- If CV says "Danish Institute for Fire & Security" → copy "Danish Institute for Fire & Security" (all 36 characters)
- If CV says "Higher Commercial Examination" → copy "Higher Commercial Examination" (all 29 characters)
- If CV says "Roskilde Business College" → copy "Roskilde Business College" (all 25 characters)

NEVER output partial words like:
- "Manage" instead of "Manager" ❌
- "Sec" instead of "Security" ❌
- "Examina" instead of "Examination" ❌

EDUCATION SECTION - CRITICAL:
In the CV, education entries typically appear as:
- Degree/Title name
- Institution name (school, college, organization)
- Year or year range

For EACH education entry, you MUST extract:
1. title = The degree, certification, or course name
2. institution = The school, college, or organization name (NEVER leave empty)
3. year = The year or date range

Example from CV:
"Higher Commercial Examination
Roskilde Business College
1998 - 2001"

Should become:
{
  "title": "Higher Commercial Examination",
  "institution": "Roskilde Business College",
  "year": "1998 - 2001"
}

TEMPLATE TO FILL:

{
  "professionalIntro": "[COPY the profile/summary paragraph EXACTLY]",
  "experience": [
    {
      "title": "[COPY job title EXACTLY]",
      "company": "[COPY company name EXACTLY]",
      "location": "[COPY location if present, null if not]",
      "startDate": "[COPY start date EXACTLY as written]",
      "endDate": "[COPY end date EXACTLY, or null if current/Nu/Present]",
      "keyMilestones": "[COPY any narrative text about the role]",
      "bullets": ["[COPY each bullet point EXACTLY]"]
    }
  ],
  "education": [
    {
      "title": "[COPY degree/certification name EXACTLY]",
      "institution": "[COPY school/college/organization name EXACTLY - REQUIRED]",
      "year": "[COPY year/range EXACTLY]"
    }
  ],
  "skills": ["[COPY each skill EXACTLY]"],
  "languages": [
    {
      "language": "[COPY language name EXACTLY]",
      "level": "[COPY level EXACTLY - e.g. 'Modersmål', 'Flydende']"
    }
  ]
}

VERIFICATION CHECKLIST:
□ Every education entry has a non-empty institution field
□ Every title ends with a COMPLETE word (not cut off mid-word)
□ Every institution name ends with a COMPLETE word
□ Year ranges have 4 digits on both sides
□ No text is shortened or abbreviated

Experience should be sorted with current jobs (endDate = null) first, then by most recent.

Return ONLY the filled JSON. No explanations.`;

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
      preview: cvText.substring(0, 500).replace(/\n/g, ' '),
      lineCount: (cvText.match(/\n/g) || []).length + 1,
    });
    
    if (!openai) {
      return NextResponse.json(getMockStructuredData());
    }
    
    // Use gpt-4o with template-filling approach
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: `Here is the CV text. COPY text from it CHARACTER BY CHARACTER into the JSON template.

---CV TEXT---
${cvText}
---END CV TEXT---

Fill the JSON template by copying text EXACTLY. Every character matters. Check that no words are cut off.`
        },
      ],
      temperature: 0,  // Zero temperature for maximum determinism
      max_tokens: 16000,
      response_format: { type: 'json_object' },
    });
    
    const responseText = completion.choices[0]?.message?.content?.trim() || '{}';
    
    console.log('CV Structure API - Raw response length:', responseText.length);
    
    try {
      const structured = JSON.parse(responseText) as StructuredCVData;
      
      // Log extraction results for debugging - DETAILED
      console.log('CV Structure API - Extracted:', {
        hasIntro: !!structured.professionalIntro,
        experienceCount: structured.experience?.length || 0,
        educationCount: structured.education?.length || 0,
        skillsCount: structured.skills?.length || 0,
        languagesCount: structured.languages?.length || 0,
      });
      
      // Log education details to debug missing institutions
      if (structured.education) {
        console.log('CV Structure API - Education entries:');
        structured.education.forEach((edu, i) => {
          console.log(`  [${i}] title: "${edu.title}", institution: "${edu.institution}", year: "${edu.year}"`);
        });
      }
        educationCount: structured.education?.length || 0,
        skillsCount: structured.skills?.length || 0,
        languagesCount: structured.languages?.length || 0,
      });
      
      // POST-PROCESSING: Verify and fix truncated text by checking against original
      const verified = verifyAgainstOriginal(structured, cvText);
      
      // Validate and clean the response
      const cleaned: StructuredCVData = {
        professionalIntro: verified.professionalIntro?.trim() || undefined,
        experience: Array.isArray(verified.experience) 
          ? verified.experience.map(exp => ({
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
        education: Array.isArray(verified.education)
          ? verified.education.map(edu => ({
              title: edu.title?.trim() || '',
              institution: edu.institution?.trim() || '',
              year: edu.year?.toString().trim() || '',
            })).filter(edu => edu.title || edu.institution)
          : [],
        skills: Array.isArray(verified.skills)
          ? verified.skills.filter(s => s && typeof s === 'string' && s.trim()).map(s => s.trim())
          : [],
        languages: Array.isArray(verified.languages)
          ? verified.languages.map(lang => ({
              language: lang.language?.trim() || '',
              level: lang.level?.trim() || '',
            })).filter(lang => lang.language)
          : [],
      };
      
      console.log('CV Structure API - Final result:', {
        experienceCount: cleaned.experience.length,
        educationCount: cleaned.education.length,
        firstEduTitle: cleaned.education[0]?.title,
        firstEduInst: cleaned.education[0]?.institution,
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

/**
 * POST-PROCESSING: Verify extracted text against original CV text
 * If AI truncated a word, try to find and fix it from the original
 */
function verifyAgainstOriginal(structured: StructuredCVData, originalText: string): StructuredCVData {
  const result = JSON.parse(JSON.stringify(structured)) as StructuredCVData;
  
  // Helper to find complete text in original
  const findCompleteText = (truncated: string, fieldName: string): string => {
    if (!truncated || truncated.length < 3) return truncated;
    
    // Search for this text in the original (case-insensitive)
    const searchTerm = truncated.substring(0, Math.min(20, truncated.length));
    const lowerOriginal = originalText.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();
    
    const startIdx = lowerOriginal.indexOf(lowerSearch);
    if (startIdx === -1) return truncated;
    
    // Extract from original, extending to complete word
    let endIdx = startIdx + truncated.length;
    
    // Extend to complete word (include all alphanumeric characters)
    while (endIdx < originalText.length && /[a-zA-ZæøåÆØÅ0-9\-]/.test(originalText[endIdx])) {
      endIdx++;
    }
    
    const found = originalText.substring(startIdx, endIdx).trim();
    
    // Only use if it's longer than what we have
    if (found.length > truncated.length) {
      console.log(`[${fieldName}] Fixed truncation: "${truncated}" → "${found}"`);
      return found;
    }
    
    return truncated;
  };
  
  // Verify education titles and institutions
  if (result.education) {
    result.education = result.education.map((edu, idx) => ({
      ...edu,
      title: findCompleteText(edu.title, `education[${idx}].title`),
      institution: findCompleteText(edu.institution, `education[${idx}].institution`),
    }));
  }
  
  // Verify experience titles and companies
  if (result.experience) {
    result.experience = result.experience.map((exp, idx) => ({
      ...exp,
      title: findCompleteText(exp.title, `experience[${idx}].title`),
      company: findCompleteText(exp.company, `experience[${idx}].company`),
    }));
  }
  
  return result;
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
        ],
      },
    ],
    education: [
      {
        title: 'Certified Security Manager (CPP)',
        institution: 'ASIS International',
        year: '2019',
      },
    ],
    skills: ['Risk Assessment', 'Security Operations', 'Team Leadership'],
    languages: [
      { language: 'Danish', level: 'Modersmål' },
      { language: 'English', level: 'Flydende' },
    ],
  };
}
