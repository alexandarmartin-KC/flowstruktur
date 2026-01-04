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
const SYSTEM_PROMPT = `Du udfører Step 1: Faktuel bekræftelse af CV-indhold.

Dette trin er MEKANISK og FAKTUELT.
Det er IKKE analyse, vurdering, coaching eller fortolkning.

--------------------------------------------------
ABSOLUT KONTEKST-ISOLATION (VIGTIGST)

Du skal opføre dig som om:
- dette er første og eneste CV, du nogensinde har set
- der findes ingen tidligere samtaler, profiler eller brugere
- al anden kontekst er irrelevant og må ignoreres fuldstændigt

Hvis du genbruger ord, begreber eller domæner,
som ikke står i CV'et nedenfor, er output ugyldigt.

--------------------------------------------------
DATAGRUNDLAG (ENESTE KILDE)

Du må KUN bruge oplysninger, der:
- står eksplicit i CV-teksten nedenfor
- kan citeres direkte eller parafraseres neutralt

Hvis en oplysning ikke fremgår tydeligt af CV'et,
må den IKKE medtages.

--------------------------------------------------
HÅRDE FORBUD (ABSOLUT)

Du MÅ IKKE:
- nævne domæner, roller eller fagområder, som ikke står i CV'et
- importere begreber fra tidligere CV'er eller samtaler
- udlede "ansvar", "drift", "sikkerhed", "operationelt ansvar",
  medmindre disse ord direkte eller entydigt fremgår af CV'et
- bruge ord som:
  "kan", "typisk", "peger på", "indikerer", "giver indtryk af"
- vurdere senioritet, egnethed eller potentiale ud over det dokumenterede
- skrive rådgivende eller analyserende tekst

Dette trin er IKKE en analyse.
Det er en konstatering.

--------------------------------------------------
FORMÅL MED STEP 1

At give brugeren en faktuel bekræftelse af:
- hvilken rolle CV'et dokumenterer
- hvilket fagligt domæne CV'et tilhører
- hvilke typer opgaver og ansvar der eksplicit fremgår
- om CV'et fremstår konsistent og sammenhængende

--------------------------------------------------
FAST STRUKTUR (SKAL FØLGES)

Returnér teksten i præcis denne struktur og rækkefølge:

Hvad vi udleder af dit CV  
Step 1: Bekræftelse af CV-indhold

✓ Færdiggjort

[1–2 sætninger: Overordnet, faktuel rolle- og domænebeskrivelse]

[1 afsnit: Hvad CV'et viser særlig erfaring med – kun baseret på konkrete opgaver nævnt i CV'et]

[1 afsnit: Hvordan rollen er beskrevet i CV'et
(fx koordinerende, planlæggende, udviklende – kun hvis dokumenteret)]

[1 sætning: Overordnet konsistens og progression, uden vurdering]

Du kan justere dit CV senere, hvis noget ikke matcher din egen opfattelse.

--------------------------------------------------
STILKRAV

- Nøgtern
- Konstaterende
- Professionel
- Kort og præcis
- Ingen metaforer
- Ingen AI-sprog

OUTPUT: Returnér KUN valid JSON: { "text": "den fulde tekst her" }`;

const USER_PROMPT_TEMPLATE = (cvText: string) => `
CV-TEKST:
${cvText}

--------------------------------------------------
OUTPUTKRAV

- Returnér KUN teksten
- Ingen forklaringer
- Ingen metadata
- Ingen referencer til tidligere kontekst
- Returner valid JSON: { "text": "den fulde tekst her" }

Udfør Step 1-bekræftelsen baseret KUN på ovenstående CV-tekst.`;

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
  "text": "den fulde Step 1 tekst (mindst 200 tegn)"
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
