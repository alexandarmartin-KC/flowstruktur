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
const SYSTEM_PROMPT = `Generér Step 1-tekst der bekræfter brugerens professionelle identitet.

PRÆCIS STRUKTUR (5 afsnit, følg denne rækkefølge og disse formuleringer):

AFSNIT 1 - Start ALTID med:
"På baggrund af dit CV ser vi en klar og konsistent profil som [senior] [rolle] inden for [domæne] i [kontekst]. Din erfaring er opbygget omkring [kernekompetence]."

AFSNIT 2 - Start ALTID med:
"Dit CV viser særlig erfaring med [overordnet område], herunder [2-3 centrale domæner], samt [ansvarsniveau]."

AFSNIT 3 - Start ALTID med:
"Din rolle har været [rolletype] med [ansvarstype], hvor du har arbejdet tæt sammen med både [interne] og [eksterne] i forbindelse med [opgavetype]."

AFSNIT 4 - Start ALTID med:
"Overordnet fremstår dit CV struktureret og konsistent, med tydelig progression inden for [område] og [erfaring fra organisation(er)]."

AFSNIT 5 - Brug PRÆCIS denne sætning:
"Du kan justere dit CV senere, hvis noget ikke matcher din egen opfattelse."

REGLER:
- Brug "senior" hvis >8-10 års erfaring
- Ingen detaljer om hvordan noget er udført
- Ingen rosende formuleringer
- Ingen tekniske systemnævn ud over overordnede kategorier
- Ingen navne eller kontaktoplysninger
- Ca. 100-130 ord total

SPROG: Dansk

OUTPUT: Returnér KUN valid JSON: { "text": "den fulde tekst her" }`;

const USER_PROMPT_TEMPLATE = (cvText: string) => `
CV-TEKST:
${cvText}

Skriv Step 1 med PRÆCIS de 5 afsnit og startformuleringer fra prompten. Returnér KUN JSON.`;

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
