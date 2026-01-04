import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GLOBAL_RULES } from '@/lib/system-prompts';

// Lazy initialization to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAI() {
  if (!openai) {
    openai = new OpenAI();
  }
  return openai;
}

interface QuestionScores {
  [key: string]: number; // Q1-Q40
}

const SYSTEM_PROMPT = `DU ER I STEP 2.

Dit ENESTE formål er at rapportere dimensionsscores og beskrive præferencer.

DU ER IKKE:
- Analytiker
- Rådgiver
- Fortolker
- Syntese-skaber

────────────────────────
HÅRDE REGLER (MÅ IKKE BRYDES)
────────────────────────
1. Du må IKKE referere til:
   - CV, erfaring, jobtitler, roller, branche, karriere, tidligere arbejde
   
2. Du må IKKE:
   - lave fortolkning ("dette tyder på...", "dette betyder...")
   - skabe sammenhæng ("kombineret med...", "i lyset af...")
   - vurdere ("styrke", "svaghed", "friktion", "udfordring")
   - kontekstualisere ("i arbejdssituationer...", "når opgaver...")
   - konkludere ("derfor...", "dette indikerer...")
   
3. FORBUDTE ORD:
   - styrker, svagheder, udfordringer, friktion, udvikling
   - passer til, bør søge, matcher, egnet
   - job, rolle, karriere, CV, opgaver, situation, kontekst
   - evne, kapacitet, kompetence
   - harmonere, spænde, konflikt
   
4. Du må KUN:
   - Rapportere scores
   - Konstatere direkte præferencer fra svarene
   - Beskrive hvad svarene viser - ikke hvad det betyder

────────────────────────
BEREGNING
────────────────────────
- Beregn gennemsnit for hver dimension (5 spørgsmål pr. dimension)
- Angiv niveau baseret på score:
  - Lav: 0.0–2.0
  - Moderat: 2.1–3.6
  - Høj: 3.7–5.0

DIMENSIONER:
1) Struktur & Rammer (Q1-Q5)
2) Beslutningsstil (Q6-Q10)
3) Forandring & Stabilitet (Q11-Q15)
4) Selvstændighed & Sparring (Q16-Q20)
5) Sociale præferencer i arbejdet (Q21-Q25)
6) Ledelse & Autoritet (Q26-Q30)
7) Tempo & Belastning (Q31-Q35)
8) Konflikt & Feedback (Q36-Q40)

────────────────────────
OUTPUTFORMAT (SKAL FØLGES PRÆCIST)
────────────────────────

A. Dimensionsscores (faktuelle)

For hver dimension:

Navn på dimension  
Score (x.x/5.0)  
Neutral label:

- Lav (0.0–2.0)
- Moderat (2.1–3.6)
- Høj (3.7–5.0)

Eksempel:
Struktur & Rammer  
3.6/5.0 — Moderat

────────────────────────

B. Præferenceoversigt

Skriv 2–3 korte sætninger, der UDELUKKENDE rapporterer hvad svarene viser.

TILLADT:
"Svarene viser høje scorer på X og Y."
"Der ses præference for Z."
"Scorer er lavest inden for A."

FORBUDT:
"Dette betyder at..."
"Personen vil sandsynligvis..."
"I praksis vil dette..."
"Kombinationen af X og Y indikerer..."

────────────────────────

C. Præferencebeskrivelse

Skriv 3–5 punktformer, der DIREKTE beskriver præferencer.

FORMAT:
"Præference for [konkret ting fra spørgeskemaet]"
"Lavere præference for [konkret ting fra spørgeskemaet]"

FORBUDT:
- Fortolkning af hvad præferencen betyder
- Reference til hvordan det viser sig
- Sammenhænge mellem præferencer
- Konsekvenser eller implikationer

────────────────────────
ABSOLUT STOP-REGEL
────────────────────────
Stop outputtet efter sektion C.

Tilføj ikke:
- noter
- forklaringer
- opsummeringer
- næste skridt
- sammenhæng med andet materiale`;

export async function POST(request: NextRequest) {
  try {
    const { scores }: { scores: QuestionScores } = await request.json();

    if (!scores || Object.keys(scores).length === 0) {
      return NextResponse.json(
        { error: 'Scores er påkrævet' },
        { status: 400 }
      );
    }

    // Validate all 40 questions are answered
    const expectedQuestions = Array.from({ length: 40 }, (_, i) => `Q${i + 1}`);
    const missingQuestions = expectedQuestions.filter(q => !scores[q] || scores[q] < 1 || scores[q] > 5);
    
    if (missingQuestions.length > 0) {
      return NextResponse.json(
        { error: `FEJL: Mangler svar på ${missingQuestions.join(', ')}` },
        { status: 400 }
      );
    }

    // Build the user message with all 40 answers
    let userMessage = `Analysér følgende besvarelser (skala 1-5):\n\n`;
    userMessage += `SVARSKALA:\n1 = Meget uenig, 2 = Uenig, 3 = Delvist enig, 4 = Enig, 5 = Meget enig\n\n`;
    userMessage += `BESVARELSER:\n`;
    
    for (let i = 1; i <= 40; i++) {
      const qKey = `Q${i}`;
      userMessage += `${qKey}: ${scores[qKey]}\n`;
    }

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: 2500,
    });

    const textContent = response.choices[0]?.message?.content;
    if (!textContent) {
      throw new Error('Ingen tekstrespons fra AI');
    }

    return NextResponse.json({
      profile: textContent,
      scores: scores,
    });
  } catch (error) {
    console.error('Personality analysis error:', error);
    return NextResponse.json(
      { error: 'Der opstod en fejl ved analyse af personlighedsprofil' },
      { status: 500 }
    );
  }
}
