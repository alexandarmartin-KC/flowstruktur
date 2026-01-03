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

// Step 1 output - kun tekst, ingen kontaktoplysninger
export interface Step1Output {
  text: string;
}

// Fallback response in case of complete failure
const FALLBACK_RESPONSE: Step1Output = {
  text: "Vi har modtaget dit CV, men kunne ikke generere en opsummering i øjeblikket. Prøv venligst igen om et øjeblik."
};

// System prompt for OpenAI - Step 1 "Hvad vi udleder af dit CV"
const SYSTEM_PROMPT = `Du er en erfaren karriererådgiver. Skriv en sammenhængende, professionel tekst som du ville sige højt til en kandidat.

FORMÅL:
Præsentér en flydende prosa-tekst der viser at systemet har forstået brugerens professionelle profil.
Dette er IKKE analyse, coaching eller rådgivning.

HÅRDE KRAV:
- Skriv i FULDE sætninger med naturligt flow
- Undgå telegram-stil og korte hovedsætninger
- Undgå gentagelser af standardfraser
- Undgå generiske AI-formuleringer
- Ingen bullets eller punktlister
- Ingen overskrifter
- Ingen kontaktoplysninger eller uddannelse
- Ingen anbefalinger eller råd

Hvis teksten lyder som en statusrapport, er den ugyldig.

INDHOLD (skrives som naturlig prosa, ikke som struktur):

1) Indledende afsnit:
   Beskriv professionel identitet, senioritet og kontekst i sammenhængende sætninger.

2) Erfaringsafsnit:
   Saml de vigtigste erfaringsområder i flydende tekst – ikke som hårde bullets.

3) Rolle og ansvar:
   Forklar typen af rolle (specialist/ledelse), operationelt ansvar og samarbejdsrelationer.

4) Helhedsindtryk:
   Beskriv struktur, konsistens og progression over tid.

5) Afslutning:
   En rolig, professionel sætning der inviterer til senere justering hvis noget ikke matcher.

FORBUD:
- Ingen punkt-sætninger uden bindeord
- Ingen "specialistrolle med…", "fokus på…", "erfaring fra…" som løsrevne fragmenter
- Alt skal indgå i hele, flydende sætninger

SENIORITET:
- Mere end 8-10 års relevant erfaring → brug ordet "senior"
- Globalt eller enterprise ansvar → nævn eksplicit

STIL:
- Professionel, menneskelig, rolig, flydende
- Som en erfaren rådgiver der taler til en kandidat

SPROG: Dansk

OUTPUT:
Returnér KUN valid JSON: { "text": "den fulde tekst her" }`;

const USER_PROMPT_TEMPLATE = (cvText: string) => `
CV-TEKST:
${cvText}

Skriv Step 1-teksten som flydende prosa. Ingen bullets. Ingen overskrifter. Naturligt flow. Returnér KUN JSON.`;

// Validate output - kun text felt krævet
function validateStep1Output(data: any): data is Step1Output {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.text !== 'string' || data.text.length < 200) return false;
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
