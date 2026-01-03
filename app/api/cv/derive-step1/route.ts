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

// Step 1 output - nu som sammenhængende tekst
export interface Step1Output {
  text: string;
  dataExtracted: {
    name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
  };
}

// Fallback response in case of complete failure
const FALLBACK_RESPONSE: Step1Output = {
  text: "Vi har modtaget dit CV, men kunne ikke generere en opsummering i øjeblikket. Prøv venligst igen om et øjeblik.",
  dataExtracted: {
    name: null,
    email: null,
    phone: null,
    location: null
  }
};

// System prompt for OpenAI - Step 1 "Hvad vi udleder af dit CV"
const SYSTEM_PROMPT = `Du er en erfaren karriererådgiver. Din opgave er at skrive en præcis, professionel spejling af et CV.

FORMÅL:
Vis brugeren at systemet har forstået deres professionelle profil korrekt. Dette er IKKE analyse, coaching, feedback, vurdering eller interview-forberedelse. Det er en neutral, professionel spejling.

TONALITET (MEGET VIGTIGT):
- Rolig
- Præcis  
- Professionel
- Menneskelig

UNDGÅ ALTID:
- Marketing-sprog
- Generiske CV-floskler
- AI-agtige formuleringer
- For mange bullet points
- Ord som: "vi anbefaler", "du bør", "forbered dig", "svaghed", "mangler"
- Interview- eller jobreferencer
- Fremadrettede råd
- Spørgsmål
- Buzzwords

STRUKTUR (SKAL FØLGES PRÆCIST):

1) ÅBNENDE OVERBLIK (2-3 linjer)
   Samlet vurdering af profilen. Rolle, senioritet og kontekst. Ingen forbehold, ingen analyse.

2) "Dit CV viser særlig erfaring med:" (kort liste)
   3-5 konkrete erfaringsområder. Kun high-confidence indhold fra CV'et. Ingen generaliseringer.

3) ROLLE- OG ANSVARSAFKLARING (1 afsnit)
   Hvilken type rolle CV'et peger på. Specialist vs. ledelse. Samarbejde, ansvar, kontekst.

4) SAMLET HELHEDSINDTRYK (1 afsnit)
   Struktur, konsistens og progression. Overordnet erfaringstype. Ingen vurdering af "svagheder".

5) AFSLUTTENDE VALIDERING (1 sætning)
   Giv brugeren mulighed for at korrigere senere. Neutral og ikke-undskyldende formulering.

EKSEMPEL PÅ KVALITETSNIVEAU (retning, ikke kopiér):
"På baggrund af dit CV ser vi en klar og konsistent profil som senior specialist inden for fysisk sikkerhed og security operations i større, regulerede organisationer…"

SPROG: Dansk

OUTPUT-FORMAT:
Returnér KUN valid JSON med denne struktur:
{
  "text": "den fulde tekst her",
  "dataExtracted": {
    "name": "navn eller null",
    "email": "email eller null", 
    "phone": "telefon eller null",
    "location": "lokation eller null"
  }
}`;

const USER_PROMPT_TEMPLATE = (cvText: string) => `
CV-TEKST:
${cvText}

Skriv nu Step 1-teksten "Hvad vi udleder af dit CV" baseret på ovenstående CV.
Følg strukturen præcist. Returnér KUN JSON.`;

// Validate output
function validateStep1Output(data: any): data is Step1Output {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.text !== 'string' || data.text.length < 200) return false;
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
    const { cvText } = body;

    if (!cvText || typeof cvText !== 'string') {
      return NextResponse.json(
        { error: 'cvText er påkrævet og skal være en string' },
        { status: 400 }
      );
    }

    const client = getOpenAI();
    
    // First attempt
    let result = await attemptDerivation(client, cvText);
    
    // If first attempt failed, try one more time
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
  cvText: string
): Promise<{ success: boolean; data?: Step1Output; rawResponse?: string }> {
  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      max_tokens: 1500,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: USER_PROMPT_TEMPLATE(cvText) }
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

Ret JSON så den matcher dette schema:
{
  "text": "den fulde Step 1 tekst (mindst 200 tegn)",
  "dataExtracted": {
    "name": "navn eller null",
    "email": "email eller null",
    "phone": "telefon eller null", 
    "location": "lokation eller null"
  }
}

Returnér KUN rettet JSON. Ingen markdown.`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.1,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      max_tokens: 1500,
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
