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

Dit eneste formål er at generere en neutral, deskriptiv arbejdsprofil
udelukkende baseret på svar fra et spørgeskema om arbejdspræferencer.

────────────────────────
HÅRDE REGLER (MÅ IKKE BRYDES)
────────────────────────
1. Du må IKKE referere til:
   - CV, erfaring, jobtitler, roller, branche, uddannelse
   - tidligere arbejde eller karriere
2. Du må IKKE give råd, anbefalinger eller vurderinger.
3. Du må IKKE beskrive:
   - styrker
   - svagheder
   - friktioner
   - udviklingsområder
   - jobmatch, roller eller hvad brugeren "passer til"
4. Du må IKKE bruge ordene (eller synonymer):
   - styrker, svagheder, udfordringer, friktion
   - passer til, bør søge, matcher
   - CV, erfaring, job, karriere
5. Du må KUN beskrive arbejdspræferencer,
   som de fremgår af spørgeskemasvarene.
6. Hvis du er i tvivl om noget er fortolkning → lad det være usagt.

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

A. DIMENSIONSCORES

For hver dimension:
[Dimensionsnavn]
[Score]/5.0 — [Lav/Moderat/Høj]

Eksempel:
Struktur & Rammer
3.6/5.0 — Moderat

B. OVERORDNET ARBEJDSPROFIL

2–4 sætninger, der opsummerer mønstre på tværs af dimensionerne.

KRAV:
- Kun beskrivende sprog
- Brug formuleringer som:
  "Svarene indikerer…"
  "Der ses en præference for…"
  "Profilen peger på…"
- Ingen vurdering, ingen kontekst, ingen anbefaling

C. ARBEJDSMØNSTRE

3–6 punktformer, som beskriver typiske måder at arbejde på,
udelukkende baseret på præferencer.

KRAV:
- Ingen kontekst (ingen jobs, teams, roller)
- Ingen normativt sprog ("bedst", "optimalt", "udfordrende")
- Kun konstaterende beskrivelser

────────────────────────
VIGTIG AFSLUTTENDE REGEL
────────────────────────
Stop outputtet efter sektion C.
Tilføj ikke noter, forklaringer eller overgang til andre trin.`;

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
