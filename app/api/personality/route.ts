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

Skriv PRÆCIS 2 sætninger i dette format:

"Høje scorer: [dimension 1], [dimension 2]."
"Moderate/lave scorer: [dimension 3], [dimension 4]."

EKSEMPEL:
"Høje scorer: Forandring & Stabilitet (3.8), Ledelse & Autoritet (3.8)."
"Moderate scorer: Struktur & Rammer (3.0), Beslutningsstil (2.8), Selvstændighed & Sparring (3.2), Sociale præferencer (3.4), Tempo & Belastning (3.6), Konflikt & Feedback (3.2)."

ABSOLUT FORBUDT:
- Ordet "person/personen"
- Ordet "indikerer/tyder/peger"
- Ordet "arbejde/arbejdsplads/opgaver"
- Fortolkende sprog
- Beskrivende adjektiver

────────────────────────

C. Præferencebeskrivelse

Skriv PRÆCIS 3–5 punkter i dette format:

"Præference for [dimensionsnavn]: [hvad høje/lave svar betyder rent teknisk]"

EKSEMPEL FOR HØJ SCORE (3.7-5.0):
"Præference for Struktur & Rammer: Klare deadlines, planlagt arbejdsdag, etablerede procedurer."

EKSEMPEL FOR MODERAT SCORE (2.1-3.6):
"Præference for Beslutningsstil: Balance mellem hurtige beslutninger og grundig analyse."

EKSEMPEL FOR LAV SCORE (0-2.0):
"Præference for Struktur & Rammer: Fleksibilitet og løse rammer fremfor faste strukturer."

ABSOLUT FORBUDT:
- "personen/han/hun"
- "vant til", "kan håndtere", "er i stand til"
- "tilpasningsdygtig", "robust", "stærk"
- "arbejdsplads", "job", "rolle"
- Fortolkninger eller sammenhænge

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
