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
 * This is AGGRESSIVE - it finds truncated text and extends to complete words/phrases
 */
function verifyAgainstOriginal(structured: StructuredCVData, originalText: string): StructuredCVData {
  const result = JSON.parse(JSON.stringify(structured)) as StructuredCVData;
  
  // Normalize for searching
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const originalLower = normalize(originalText);
  
  /**
   * Find and fix truncated text by searching in original
   * If AI wrote "Security Mana", find "Security Manager" in original
   */
  const fixTruncatedText = (aiText: string, fieldName: string): string => {
    if (!aiText || aiText.length < 3) return aiText;
    
    const normalizedAi = normalize(aiText);
    
    // Find where this text appears in the original
    const startIdx = originalLower.indexOf(normalizedAi);
    
    if (startIdx === -1) {
      // Try with just the first few words (in case AI changed ending)
      const words = normalizedAi.split(' ');
      const searchPrefix = words.slice(0, Math.min(3, words.length)).join(' ');
      const prefixIdx = originalLower.indexOf(searchPrefix);
      
      if (prefixIdx === -1) {
        return aiText; // Can't find it
      }
      
      // Found by prefix - extract until end of phrase
      return extractCompletePhrase(prefixIdx, searchPrefix.length, fieldName);
    }
    
    // Found exact match - but check if it's truncated (ends mid-word)
    const endIdx = startIdx + normalizedAi.length;
    
    // Check if there's more text after (word continues)
    if (endIdx < originalLower.length && /[a-zA-ZæøåÆØÅ]/.test(originalLower[endIdx])) {
      // Text was truncated - extend to complete word/phrase
      return extractCompletePhrase(startIdx, normalizedAi.length, fieldName);
    }
    
    return aiText; // Not truncated
  };
  
  /**
   * Extract a complete phrase from originalText starting at startIdx
   * Extends to include complete words and common suffixes
   */
  const extractCompletePhrase = (startIdx: number, minLength: number, fieldName: string): string => {
    let endIdx = startIdx + minLength;
    
    // Extend to complete current word
    while (endIdx < originalLower.length && /[a-zA-ZæøåÆØÅ0-9\-\/\(\)]/.test(originalLower[endIdx])) {
      endIdx++;
    }
    
    // Include trailing parentheses like "(native)" or "(fluent)"
    const remaining = originalLower.substring(endIdx, endIdx + 20);
    const parenMatch = remaining.match(/^\s*\([^)]+\)/);
    if (parenMatch) {
      endIdx += parenMatch[0].length;
    }
    
    // Now find this in the ORIGINAL (preserving case)
    const extractedLower = originalLower.substring(startIdx, endIdx).trim();
    
    // Search in original text to get proper casing
    const lines = originalText.split(/\n/);
    for (const line of lines) {
      const lineLower = normalize(line);
      const lineStartIdx = lineLower.indexOf(extractedLower);
      if (lineStartIdx !== -1) {
        // Extract from original line with proper casing
        const result = line.substring(lineStartIdx, lineStartIdx + extractedLower.length + 5).trim();
        // Clean up - remove trailing partial words
        const cleaned = result.replace(/\s+\S{1,3}$/, '').trim();
        if (cleaned.length > minLength) {
          console.log(`[${fieldName}] Fixed: "${originalLower.substring(startIdx, startIdx + minLength)}" → "${cleaned}"`);
          return cleaned;
        }
        return result;
      }
    }
    
    return originalText.substring(startIdx, endIdx).trim();
  };
  
  /**
   * Fix language entries - specifically handle "(native)", "(fluent)" etc.
   */
  const fixLanguageLevel = (lang: string, level: string | undefined): string => {
    if (level && level.length > 2) return level;
    
    // Search for language in original with level in parentheses
    const patterns = [
      new RegExp(`${lang}\\s*\\(([^)]+)\\)`, 'i'),
      new RegExp(`${lang}\\s*-\\s*(\\w+)`, 'i'),
      new RegExp(`${lang}\\s+(native|fluent|modersmål|flydende|god|basic)`, 'i'),
    ];
    
    for (const pattern of patterns) {
      const match = originalText.match(pattern);
      if (match && match[1]) {
        console.log(`[language.${lang}] Fixed level: "${level}" → "${match[1]}"`);
        return match[1];
      }
    }
    
    return level || '';
  };
  
  // Fix education entries
  if (result.education) {
    result.education = result.education.map((edu, idx) => {
      const fixedTitle = fixTruncatedText(edu.title, `education[${idx}].title`);
      let fixedInstitution = fixTruncatedText(edu.institution, `education[${idx}].institution`);
      
      // If institution is still generic/empty, try to find it
      if (!fixedInstitution || fixedInstitution === 'Institution' || fixedInstitution.length < 5) {
        // Look for institution near the education title in original
        const titleIdx = originalText.toLowerCase().indexOf(edu.title.toLowerCase().substring(0, 20));
        if (titleIdx !== -1) {
          // Get the next few lines after title
          const afterTitle = originalText.substring(titleIdx, titleIdx + 200);
          const lines = afterTitle.split(/\n/).map(l => l.trim()).filter(l => l.length > 3);
          // Second line is often the institution
          if (lines.length >= 2 && !lines[1].match(/^\d{4}/)) {
            fixedInstitution = lines[1];
            console.log(`[education[${idx}].institution] Found near title: "${fixedInstitution}"`);
          }
        }
      }
      
      return {
        ...edu,
        title: fixedTitle,
        institution: fixedInstitution,
      };
    });
  }
  
  // Fix experience entries
  if (result.experience) {
    result.experience = result.experience.map((exp, idx) => ({
      ...exp,
      title: fixTruncatedText(exp.title, `experience[${idx}].title`),
      company: fixTruncatedText(exp.company, `experience[${idx}].company`),
      keyMilestones: exp.keyMilestones ? fixTruncatedText(exp.keyMilestones, `experience[${idx}].keyMilestones`) : undefined,
      bullets: exp.bullets?.map((b, bIdx) => 
        fixTruncatedText(b, `experience[${idx}].bullets[${bIdx}]`)
      ),
    }));
  }
  
  // Fix skills
  if (result.skills) {
    result.skills = result.skills.map((skill, idx) => 
      fixTruncatedText(skill, `skills[${idx}]`)
    );
  }
  
  // Fix languages - especially levels
  if (result.languages) {
    result.languages = result.languages.map((lang, idx) => ({
      ...lang,
      language: fixTruncatedText(lang.language, `languages[${idx}].language`),
      level: fixLanguageLevel(lang.language, lang.level),
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
