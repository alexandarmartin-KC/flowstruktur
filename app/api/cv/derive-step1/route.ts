import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Lazy initialization to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAI() {
  if (!openai) {
    openai = new OpenAI();
  }
  return openai;
}

// Type definitions matching the strict JSON schema
export interface Step1Output {
  headline: string;
  summary: string;
  roleIdentity: {
    title: string;
    seniority: 'junior' | 'mid' | 'senior' | 'unknown';
    domain: string;
  };
  highConfidenceHighlights: string[];
  toolsAndSystems: string[];
  industriesAndContexts: string[];
  languages: string[];
  workHistoryOverview: {
    yearsExperienceApprox: string;
    careerProgressionNote: string;
  };
  dataExtracted: {
    name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
  };
  limitationsNote: string;
}

// Fallback response in case of complete failure
const FALLBACK_RESPONSE: Step1Output = {
  headline: "CV modtaget",
  summary: "Vi har modtaget dit CV og arbejder på at behandle indholdet. Prøv venligst igen om et øjeblik.",
  roleIdentity: {
    title: "Ikke identificeret",
    seniority: "unknown",
    domain: "Ikke identificeret"
  },
  highConfidenceHighlights: [],
  toolsAndSystems: [],
  industriesAndContexts: [],
  languages: [],
  workHistoryOverview: {
    yearsExperienceApprox: "Ikke identificeret",
    careerProgressionNote: "Information er ved at blive behandlet"
  },
  dataExtracted: {
    name: null,
    email: null,
    phone: null,
    location: null
  },
  limitationsNote: "Vi oplever tekniske udfordringer med at behandle dit CV. Prøv venligst igen."
};

// System prompt for OpenAI - STRAM OG KONTROLLERET
const SYSTEM_PROMPT = `Du er en præcis CV-udtræker. Din ENESTE opgave er at strukturere information fra et CV i JSON-format.

ABSOLUTTE FORBUD:
- Anbefalinger eller råd
- Analyse eller vurdering
- Interview-forberedelse
- "Du bør" eller "Vi anbefaler"
- Svagheder eller gaps
- Spekulationer

KUN TILLADT:
- Beskrive hvad der faktisk står i CV'et
- Neutral til let positiv tone
- Udelade usikre oplysninger

OUTPUT:
Returnér KUN valid JSON. Ingen markdown. Ingen forklaringer. KUN JSON.

SPROG: Dansk`;

const USER_PROMPT_TEMPLATE = (cvText: string, extracted?: Partial<Step1Output['dataExtracted']>) => `
CV-TEKST:
${cvText}

${extracted ? `
KONTAKTINFO ALLEREDE FUNDET:
${extracted.name ? `Navn: ${extracted.name}` : ''}
${extracted.email ? `Email: ${extracted.email}` : ''}
${extracted.phone ? `Telefon: ${extracted.phone}` : ''}
${extracted.location ? `Lokation: ${extracted.location}` : ''}
` : ''}

REGLER:
1. Beskriv KUN hvad der står i CV'et
2. Ingen anbefalinger, analyse eller vurderinger
3. Udelad usikker information
4. Skriv på dansk
5. Neutral til let positiv tone

STRICT JSON SCHEMA (SKAL FØLGES 100%):
{
  "headline": string (max 100 tegn, neutral overskrift),
  "summary": string (max 500 tegn, hvad CV'et viser),
  "roleIdentity": {
    "title": string (primær rolle),
    "seniority": "junior" | "mid" | "senior" | "unknown",
    "domain": string (fagområde)
  },
  "highConfidenceHighlights": string[] (præcis 4-6 bullets, max 120 tegn hver, KUN dokumenterede ting),
  "toolsAndSystems": string[] (0-8 værktøjer/systemer EKSPLICIT nævnt i CV),
  "industriesAndContexts": string[] (0-6 brancher/kontekster),
  "languages": string[] (0-6 sprog med niveau hvis muligt),
  "workHistoryOverview": {
    "yearsExperienceApprox": string ("Ca. X år"),
    "careerProgressionNote": string (max 150 tegn, neutral beskrivelse)
  },
  "dataExtracted": {
    "name": string | null,
    "email": string | null,
    "phone": string | null,
    "location": string | null
  },
  "limitationsNote": string (max 250 tegn, hvad der IKKE fremgår klart)
}

VIGTIGT: Output skal være KUN ren JSON. Ingen markdown-tags. Ingen tekst før eller efter JSON.
Alt udenfor JSON er ugyldigt output.

Returnér nu JSON:`;

// Validate output against schema
function validateStep1Output(data: any): data is Step1Output {
  if (!data || typeof data !== 'object') return false;
  
  // Check required string fields
  if (typeof data.headline !== 'string' || data.headline.length > 100) return false;
  if (typeof data.summary !== 'string' || data.summary.length > 500) return false;
  if (typeof data.limitationsNote !== 'string' || data.limitationsNote.length > 250) return false;
  
  // Check roleIdentity
  if (!data.roleIdentity || typeof data.roleIdentity !== 'object') return false;
  if (typeof data.roleIdentity.title !== 'string') return false;
  if (!['junior', 'mid', 'senior', 'unknown'].includes(data.roleIdentity.seniority)) return false;
  if (typeof data.roleIdentity.domain !== 'string') return false;
  
  // Check arrays
  if (!Array.isArray(data.highConfidenceHighlights) || 
      data.highConfidenceHighlights.length < 4 || 
      data.highConfidenceHighlights.length > 6) return false;
  if (!data.highConfidenceHighlights.every((h: any) => typeof h === 'string' && h.length <= 120)) return false;
  
  if (!Array.isArray(data.toolsAndSystems) || data.toolsAndSystems.length > 8) return false;
  if (!Array.isArray(data.industriesAndContexts) || data.industriesAndContexts.length > 6) return false;
  if (!Array.isArray(data.languages) || data.languages.length > 6) return false;
  
  // Check workHistoryOverview
  if (!data.workHistoryOverview || typeof data.workHistoryOverview !== 'object') return false;
  if (typeof data.workHistoryOverview.yearsExperienceApprox !== 'string') return false;
  if (typeof data.workHistoryOverview.careerProgressionNote !== 'string' || 
      data.workHistoryOverview.careerProgressionNote.length > 150) return false;
  
  // Check dataExtracted
  if (!data.dataExtracted || typeof data.dataExtracted !== 'object') return false;
  const { name, email, phone, location } = data.dataExtracted;
  if (name !== null && typeof name !== 'string') return false;
  if (email !== null && typeof email !== 'string') return false;
  if (phone !== null && typeof phone !== 'string') return false;
  if (location !== null && typeof location !== 'string') return false;
  
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cvText, extracted } = body;

    if (!cvText || typeof cvText !== 'string') {
      return NextResponse.json(
        { error: 'cvText er påkrævet og skal være en string' },
        { status: 400 }
      );
    }

    const client = getOpenAI();
    
    // First attempt
    let result = await attemptDerivation(client, cvText, extracted);
    
    // If first attempt failed, try one more time with a fix prompt
    if (!result.success && result.rawResponse) {
      console.log('First attempt failed, trying to fix JSON...');
      result = await attemptJsonFix(client, result.rawResponse);
    }
    
    // Return result or fallback
    if (result.success && result.data) {
      return NextResponse.json(result.data);
    } else {
      console.error('Both attempts failed, returning fallback');
      return NextResponse.json(FALLBACK_RESPONSE);
    }

  } catch (error) {
    console.error('Error in derive-step1:', error);
    return NextResponse.json(
      { error: 'Internal server error', fallback: FALLBACK_RESPONSE },
      { status: 500 }
    );
  }
}

async function attemptDerivation(
  client: OpenAI, 
  cvText: string, 
  extracted?: Partial<Step1Output['dataExtracted']>
): Promise<{ success: boolean; data?: Step1Output; rawResponse?: string }> {
  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      max_tokens: 800,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: USER_PROMPT_TEMPLATE(cvText, extracted) }
      ],
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { success: false };
    }

    // Try to parse JSON
    const parsed = JSON.parse(content);
    
    // Validate against schema
    if (validateStep1Output(parsed)) {
      return { success: true, data: parsed };
    } else {
      console.log('Validation failed for parsed JSON');
      return { success: false, rawResponse: content };
    }
  } catch (error) {
    console.error('Error in attemptDerivation:', error);
    return { success: false };
  }
}

async function attemptJsonFix(
  client: OpenAI,
  rawJson: string
): Promise<{ success: boolean; data?: Step1Output }> {
  try {
    const fixPrompt = `Følgende JSON validerede ikke korrekt:

${rawJson}

Ret JSON så den matcher schema:
- headline: string (max 100 tegn)
- summary: string (max 500 tegn)
- roleIdentity: { title, seniority ("junior"|"mid"|"senior"|"unknown"), domain }
- highConfidenceHighlights: 4-6 strings (max 120 tegn hver)
- toolsAndSystems: 0-8 strings
- industriesAndContexts: 0-6 strings
- languages: 0-6 strings
- workHistoryOverview: { yearsExperienceApprox, careerProgressionNote (max 150 tegn) }
- dataExtracted: { name, email, phone, location (alle nullable) }
- limitationsNote: string (max 250 tegn)

Returnér KUN rettet JSON. Ingen markdown.`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.1,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      max_tokens: 800,
      messages: [
        { role: 'system', content: 'Du retter JSON. Returnér KUN valid JSON.' },
        { role: 'user', content: fixPrompt }
      ],
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { success: false };
    }

    const parsed = JSON.parse(content);
    
    if (validateStep1Output(parsed)) {
      return { success: true, data: parsed };
    } else {
      return { success: false };
    }
  } catch (error) {
    console.error('Error in attemptJsonFix:', error);
    return { success: false };
  }
}
