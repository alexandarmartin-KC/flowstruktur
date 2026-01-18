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
  // Professional summary/intro
  professionalIntro?: string;
  
  // Experience entries
  experience: {
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string; // undefined = present
    keyMilestones?: string; // narrative summary
    bullets: string[];
  }[];
  
  // Education
  education: {
    title: string;
    institution: string;
    year: string;
  }[];
  
  // Skills
  skills: string[];
  
  // Languages
  languages: {
    language: string;
    level: 'native' | 'fluent' | 'advanced' | 'intermediate' | 'basic';
  }[];
}

const SYSTEM_PROMPT = `Du er en CV-parser. Din opgave er at udtrække struktureret data fra CV-tekst.

KRITISKE REGLER:
1. Udtræk KUN information der faktisk står i CV'et
2. OPFIND ALDRIG data, tal, firmanavne, titler eller datoer
3. Hvis noget ikke fremgår tydeligt, udelad det
4. Bevar originalformuleringer så vidt muligt
5. Oversæt ikke - behold sproget som det er i CV'et

OUTPUT FORMAT (JSON):
{
  "professionalIntro": "Profilbeskrivelse eller summary fra CV'et, hvis den findes",
  "experience": [
    {
      "title": "Jobtitel",
      "company": "Virksomhedsnavn",
      "location": "By/Land (valgfri)",
      "startDate": "Jan 2020 eller 2020",
      "endDate": "Dec 2023 eller null hvis nuværende",
      "keyMilestones": "Evt. narrativ beskrivelse af rollen",
      "bullets": ["Punkt 1", "Punkt 2", "..."]
    }
  ],
  "education": [
    {
      "title": "Uddannelsestitel/Grad",
      "institution": "Uddannelsesinstitution",
      "year": "År eller periode"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "..."],
  "languages": [
    {
      "language": "Dansk",
      "level": "native|fluent|advanced|intermediate|basic"
    }
  ]
}

Returnér UDELUKKENDE valid JSON. Ingen forklaringer, ingen markdown.`;

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
      // Return mock structured data for development
      return NextResponse.json(getMockStructuredData());
    }
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Udtræk struktureret data fra dette CV:\n\n${cvText}` },
      ],
      temperature: 0.1, // Very low for consistent, factual extraction
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });
    
    const responseText = completion.choices[0]?.message?.content?.trim() || '{}';
    
    try {
      const structured = JSON.parse(responseText) as StructuredCVData;
      
      // Validate and clean the response
      const cleaned: StructuredCVData = {
        professionalIntro: structured.professionalIntro || undefined,
        experience: Array.isArray(structured.experience) 
          ? structured.experience.map(exp => ({
              title: exp.title || '',
              company: exp.company || '',
              location: exp.location || undefined,
              startDate: exp.startDate || '',
              endDate: exp.endDate || undefined,
              keyMilestones: exp.keyMilestones || undefined,
              bullets: Array.isArray(exp.bullets) ? exp.bullets.filter(b => b && b.trim()) : [],
            })).filter(exp => exp.title || exp.company)
          : [],
        education: Array.isArray(structured.education)
          ? structured.education.map(edu => ({
              title: edu.title || '',
              institution: edu.institution || '',
              year: edu.year || '',
            })).filter(edu => edu.title || edu.institution)
          : [],
        skills: Array.isArray(structured.skills)
          ? structured.skills.filter(s => s && s.trim())
          : [],
        languages: Array.isArray(structured.languages)
          ? structured.languages.map(lang => ({
              language: lang.language || '',
              level: validateLevel(lang.level),
            })).filter(lang => lang.language)
          : [],
      };
      
      return NextResponse.json(cleaned);
      
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', responseText);
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
  const validLevels = ['native', 'fluent', 'advanced', 'intermediate', 'basic'];
  if (level && validLevels.includes(level.toLowerCase())) {
    return level.toLowerCase() as 'native' | 'fluent' | 'advanced' | 'intermediate' | 'basic';
  }
  return 'intermediate';
}

function getMockStructuredData(): StructuredCVData {
  return {
    professionalIntro: undefined,
    experience: [
      {
        title: 'Senior Developer',
        company: 'Tech Company',
        startDate: '2020',
        endDate: undefined,
        bullets: [
          'Udviklet og vedligeholdt komplekse webapplikationer',
          'Samarbejdet med designere og produktejere',
        ],
      },
    ],
    education: [
      {
        title: 'Kandidat i Datalogi',
        institution: 'Københavns Universitet',
        year: '2018',
      },
    ],
    skills: ['TypeScript', 'React', 'Node.js'],
    languages: [
      { language: 'Dansk', level: 'native' },
      { language: 'Engelsk', level: 'fluent' },
    ],
  };
}
