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

Dette trin er rent deskriptivt.
Det må ikke indeholde vurderinger, anbefalinger, potentialeanalyse eller tolkning af egnethed.

--------------------------------------------------
KONTEKST-ISOLATION (KRITISK)

Antag at:
- dette er det eneste CV, du har adgang til
- ingen tidligere CV'er, analyser eller samtaler eksisterer
- al anden viden end CV-teksten nedenfor skal ignoreres

Hvis information ikke kan spores direkte til CV-teksten,
må den ikke anvendes.

--------------------------------------------------
DATAGRUNDLAG

Du må udelukkende anvende:
- roller, opgaver og formuleringer, der eksplicit fremgår af CV'et
- nøgterne parafraser af disse formuleringer

Du må ikke:
- udvide domæner eller brancher
- tilføje senioritet, kvalitet eller niveau
- anvende brancheviden eller antagelser

--------------------------------------------------
ABSTRAKTIONSREGEL (MEGET VIGTIG)

Du må kun beskrive:
- hvilke roller der er dokumenteret
- hvilke typer opgaver der er udført
- hvilke arbejdsformer der kan konstateres

Du må IKKE:
- omsætte handlinger til implicitte rolletyper
- tolke verber som "lead", "own", "drive" som ledelsesansvar
- beskrive evner, styrker eller professionalisme

Handlinger må kun gengives som handlinger.

--------------------------------------------------
ROLLE- OG ANSVARSHÅNDTERING

- Formelt personaleansvar eller ledelsesansvar må kun nævnes,
  hvis det eksplicit fremgår af CV-teksten.
- Hvis roller spænder over meget forskellige ansvarsniveauer,
  skal dette konstateres neutralt (se konsistensregel).

--------------------------------------------------
KONSISTENSLOGIK (KRITISK)

Efter beskrivelse af roller og opgaver skal du vurdere intern konsistens.

Definitioner:
- Konsistens betyder, at rolletyper, arbejdsformer og ansvarsniveauer
  ikke modsiger hinanden.
- Variation er tilladt.
- Direkte modsætninger uden forklaring er ikke konsistente.

Hvis CV'et indeholder:
- både strategiske/ledende roller og ufaglærte/udførende roller
- markant forskellige ansvarsniveauer
- gentagne skift mellem disse
OG
- der ikke eksplicit dokumenteres karriereskift, pauser eller forklaring

SÅ må du IKKE afslutte med, at CV'et er samlet konsistent.

I stedet skal du neutralt konstatere, at:
- der er variationer i rolletyper og arbejdsformer
- som ikke følger en entydig sammenhæng

Du må ikke vurdere, forklare eller foreslå noget.

--------------------------------------------------
SPROGLIGE FORBUD

Du må ikke bruge:
- vurderende adjektiver (fx stærk, professionel)
- modalverber (fx kan, typisk)
- forklarende eller rådgivende sprog
- anbefalinger eller fremtidsperspektiv

--------------------------------------------------
FAST STRUKTUR (SKAL FØLGES PRÆCIST)

Returnér teksten i præcis denne struktur:

Step 1: Bekræftelse af CV-indhold

✓ Færdiggjort

[1–2 sætninger:
Neutral beskrivelse af dokumenterede roller og overordnet kontekst]

[1 afsnit:
Neutral gengivelse af opgaver og arbejdsformer
udelukkende baseret på CV-teksten]

[1 afsnit:
Neutral beskrivelse af arbejdsformer
(fx udførende, koordinerende, strategiske)
uden vurdering]

[1 afsluttende sætning:
- enten konstatering af samlet konsistens
- eller neutral konstatering af variation uden entydig sammenhæng]

--------------------------------------------------
STILKRAV

- Nøgtern
- Konstaterende
- Lav abstraktion
- Ingen værdiladede ord

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
