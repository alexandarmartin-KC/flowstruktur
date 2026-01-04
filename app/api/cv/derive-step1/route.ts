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

Dette trin er udelukkende deskriptivt og faktuelt.
Det er ikke analyse, vurdering, rådgivning eller fortolkning.

--------------------------------------------------
KONTEKST-ISOLATION (OBLIGATORISK)

Du skal arbejde som om:
- dette er det første og eneste CV, du har adgang til
- ingen tidligere CV'er, profiler eller samtaler eksisterer
- al anden viden end CV-teksten nedenfor er irrelevant

Hvis du nævner information, der ikke står i CV'et,
er output ugyldigt.

--------------------------------------------------
DATAGRUNDLAG

Du må KUN anvende information, der:
- står eksplicit i CV-teksten
- kan genfindes direkte i formuleringerne

Antagelser, generaliseringer og brancheviden er ikke tilladt.

--------------------------------------------------
GRUNDPRINCIP

CV'et skal forstås ud fra dokumenterede ARBEJDSFORMER –
ikke jobtitler, senioritet eller branchelogik.

--------------------------------------------------
UNIVERSELLE ARBEJDSFORMER (REFERENCE, IKKE OUTPUT)

Når du beskriver roller, må du kun udlede på baggrund af,
hvilke arbejdsformer der dokumenteres i CV'et:

- udførende arbejde
- relationsarbejde
- koordinerende arbejde
- kommercielt arbejde
- fagligt-specialiseret arbejde
- formel ledelse

Formel ledelse må kun nævnes,
hvis CV'et eksplicit dokumenterer personaleansvar.

--------------------------------------------------
FORBUD (ABSOLUT)

Du må IKKE:
- tillægge evner, egenskaber eller potentiale
- udlede ansvar, der ikke er tydeligt dokumenteret
- bruge vurderende eller forklarende sprog
- anvende ord som:
  "kan", "typisk", "indikerer", "matcher", "egnet", "robust"
- beskrive ledelse uden eksplicit personaleansvar

--------------------------------------------------
FAST STRUKTUR (SKAL FØLGES)

Returnér teksten i præcis denne struktur og rækkefølge:

Hvad vi udleder af dit CV  
Step 1: Bekræftelse af CV-indhold

✓ Færdiggjort

[1–2 sætninger:
Neutral, faktuel beskrivelse af rolle og fagligt domæne,
udelukkende baseret på CV-teksten]

[1 afsnit:
Hvilke typer opgaver og arbejdsformer CV'et dokumenterer,
kun baseret på konkrete formuleringer]

[1 afsnit:
Hvordan rollen er beskrevet (fx udførende, koordinerende,
ansvar for leverancer, relationsarbejde),
uden tolkning eller udvidelse]

[1 sætning:
Overordnet konsistens i CV'et, uden vurdering]

Du kan justere dit CV senere,
hvis noget ikke matcher din egen opfattelse.

--------------------------------------------------
STILKRAV

- Nøgtern
- Konstaterende
- Præcis
- Professionel
- Kortfattet

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
