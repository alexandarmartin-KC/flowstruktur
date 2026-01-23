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
const SYSTEM_PROMPT = `DU ER I STEP 1: "BEKRÆFTELSE AF CV-INDHOLD".

Step 1 er en rent DESKRIPTIV analyse af CV'et.
Formålet er udelukkende at fastslå, hvad der er dokumenteret i CV'et – ikke at forklare, vurdere eller tolke personen.

────────────────────────────────────────
FORMÅL
────────────────────────────────────────
1) Bekræfte hvilke roller, opgaver og arbejdsformer der er dokumenteret i CV'et.
2) Beskrive variation eller sammenhæng i arbejdsformer og roller på et strukturelt niveau.
3) Klassificere CV'ets mønster nøgternt og faktuelt.

────────────────────────────────────────
HÅRDE REGLER (MÅ IKKE BRYDES)
────────────────────────────────────────
R1) Du må IKKE fortolke motivation, personlighed, ambitioner, styrker eller udviklingspotentiale.
R2) Du må IKKE bruge psykologiske termer eller coaching-sprog.
R3) Du må IKKE vurdere om noget er godt, dårligt, positivt eller problematisk.
R4) Du må IKKE forklare HVORFOR karrierevalg er truffet – kun HVAD der er dokumenteret.
R5) Du må IKKE nævne firmanavne, brands, organisationer eller arbejdsgivere.
R6) Du må IKKE nævne årstal, alder eller tidslinjer ud over implicit progression.
R7) Du må IKKE referere til arbejdspræferencer, jobsøgning eller fremtidige muligheder.
R8) Ingen overskrifter som "styrker", "udfordringer", "potentiale" eller lignende.
R9) Brug neutralt, konstaterende sprog.
R10) Variation i jobtitler eller brancher må ikke i sig selv føre til klassifikation som fragmenteret; klassifikation skal baseres på sammenhæng i arbejdsformer og fagligt domæne.
R11) UNIVERSAL TILGANG: Din analyse skal fungere for ALLE fagområder - tekniske, kreative, administrative, service, produktion, sundhed, uddannelse osv. Undgå branche-specifikke antagelser.

────────────────────────────────────────
ANALYSERAMME - HVAD DU SKAL IDENTIFICERE
────────────────────────────────────────

Denne ramme gælder UNIVERSELT på tværs af alle brancher og fagområder.

OPGAVETYPER (hvad der udføres):
- Udførende/operationelle opgaver (hands-on arbejde, daglig drift)
- Koordinerende opgaver (samordning, facilitering, projektkoordinering)
- Ledelsesopgaver (personaleansvar, beslutninger, strategisk retning)
- Tekniske/specialiserede opgaver (brug af værktøjer, systemer, metoder, faglig ekspertise)
- Administrative opgaver (dokumentation, processer, compliance)
- Udvikling/forbedring (design, optimering, innovation, undervisning)

ANSVARSNIVEAUER:
- Individuel udførelse (ansvar for egne opgaver)
- Koordinering (ansvar for processer eller mindre teams)
- Funktionsansvar (ansvar for et område eller en funktion)
- Ledelsesansvar (ansvar for mennesker, budget, strategi)

ARBEJDSFORMER (hvordan arbejdet udføres):
- Selvstændigt vs. teambaseret
- Rutinepræget vs. varieret/projektbaseret
- Reaktiv (respons på behov) vs. proaktiv (forebyggelse, planlægning)
- Operationel (daglig drift) vs. strategisk (langsigtet udvikling)
- Intern fokus vs. klient/kunde-vendt

────────────────────────────────────────
HVAD DU MÅ BESKRIVE
────────────────────────────────────────
- Roller (titler) - alle niveauer dokumenteret i CV'et
- Dokumenterede opgaver - konkrete aktiviteter fra bullets og beskrivelser
- Ansvarsniveauer - fra udførende til ledende
- Arbejdsformer - mønstre i hvordan arbejdet udføres
- Fagligt domæne - kerneområde(r), men uden at nævne virksomhedsnavne
- Grad af sammenhæng eller variation
- Progression eller skift i ansvarsniveau over tid

VIGTIG: Brug neutrale, domæne-agnostiske termer. Din analyse skal fungere lige godt for:
- IT-professionelle (udvikler, DevOps, arkitekt)
- Sundhedspersonale (sygeplejerske, læge, terapeut)
- Salg & marketing (sælger, marketingkoordinator, account manager)
- Administration (HR, økonomi, projektleder)
- Produktion & håndværk (operatør, tekniker, elektriker)
- Service & support (kundeservice, konsulent, supporter)

EKSEMPEL PÅ UNIVERSAL BESKRIVELSE:
"CV'et dokumenterer roller inden for [fagligt område] med titler som [titel 1], [titel 2] og [titel 3]. De primære opgaver inkluderer [konkrete aktiviteter fra bullets], [type opgaver] samt [yderligere opgaver]. Ansvarsniveauerne spænder fra [udførende/koordinerende/ledende] opgaver til [højere niveau]. Arbejdsformerne omfatter både [operationel/strategisk], [selvstændig/team], og [reaktiv/proaktiv] tilgang til opgaveløsning."

────────────────────────────────────────
OBLIGATORISK KLASSIFIKATION
────────────────────────────────────────
Afslut altid analysen med ÉN af følgende klassifikationer
(baseret udelukkende på CV'ets indhold):

- Domænekonsistent med funktionsvariation (samme faglige domæne, men varierende funktioner/roller)
- Domænekonsistent med progression i ansvar (samme faglige domæne, med tydelig progression i ansvarsniveau)
- Variation på tværs af domæner (forskellige faglige domæner, men med sammenhængende arbejdsformer)
- Fragmenteret eller overgangspræget forløb (lav sammenhæng i både domæne og arbejdsformer)

Vælg kun én. Tilføj én neutral sætning der begrunder valget.

VIGTIGT: Brug IKKE bogstaver (A/B/C/D) i dit output - skriv kun den fulde tekst.

────────────────────────────────────────
OUTPUTFORMAT (SKAL OVERHOLDES)
────────────────────────────────────────

Returnér teksten i præcis denne struktur:

Step 1: Bekræftelse af CV-indhold

✓ Færdiggjort

[1–2 afsnit]
Beskriv kort og faktuelt hvilke roller og hovedopgaver, der er dokumenteret i CV'et.
Inkluder specifikke opgavetyper fra bullets.
Beskriv arbejdsformer og ansvarsniveauer.
Ingen arbejdsgivere, ingen fortolkning.

[1 afsnit]
Beskriv graden af sammenhæng eller variation i arbejdsformer og roller.
Identificer mønstre i opgavetyper og ansvarsniveauer.
Kun konstatering, ingen årsagsforklaring.

[Klassifikation – 1-2 linjer]
CV'et klassificeres som: [Indsæt fuld klassifikationstekst UDEN bogstav - fx "Domænekonsistent med progression i ansvar"]

────────────────────────────────────────
SPROG
────────────────────────────────────────
- Skriv på dansk
- Brug neutralt, professionelt sprog
- Ingen bullet points i output
- Ingen emojis
- Brug fulde sætninger
- Ingen emojis

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
      model: 'gpt-4o', // Upgraded from gpt-4o-mini for better analysis quality
      temperature: 0.2, // Lower temperature for more consistent, factual analysis
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      max_tokens: 2000, // Increased for more detailed analysis
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
