import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GLOBAL_RULES } from '@/lib/system-prompts';

const openai = new OpenAI();

interface QuestionScores {
  [key: string]: number; // Q1-Q40
}

const SYSTEM_PROMPT = `DU ER EN PROFESSIONEL KARRIERE- OG ARBEJDSANALYTISK ASSISTENT.
DU SKAL ANALYSERE BRUGERENS BESVARELSER FRA ET 40-SPØRGSMÅLS ARBEJDSPRÆFERENCE SPØRGESKEMA.

${GLOBAL_RULES}

BEREGNING:
- Beregn gennemsnit for hver dimension (5 spørgsmål pr. dimension).
- Angiv hver dimension som Lav (1.0–2.4), Moderat (2.5–3.6) eller Høj (3.7–5.0).

DIMENSIONER:
1) Struktur & Rammer (Q1-Q5)
2) Beslutningsstil (Q6-Q10)
3) Forandring & Stabilitet (Q11-Q15)
4) Selvstændighed & Sparring (Q16-Q20)
5) Sociale præferencer i arbejdet (Q21-Q25)
6) Ledelse & Autoritet (Q26-Q30)
7) Tempo & Belastning (Q31-Q35)
8) Konflikt & Feedback (Q36-Q40)

OUTPUTFORMAT:
DIMENSIONSCORES
- Struktur & Rammer: <gennemsnit> (<Lav/Moderat/Høj>)
- Beslutningsstil: <gennemsnit> (<Lav/Moderat/Høj>)
- Forandring & Stabilitet: <gennemsnit> (<Lav/Moderat/Høj>)
- Selvstændighed & Sparring: <gennemsnit> (<Lav/Moderat/Høj>)
- Sociale præferencer i arbejdet: <gennemsnit> (<Lav/Moderat/Høj>)
- Ledelse & Autoritet: <gennemsnit> (<Lav/Moderat/Høj>)
- Tempo & Belastning: <gennemsnit> (<Lav/Moderat/Høj>)
- Konflikt & Feedback: <gennemsnit> (<Lav/Moderat/Høj>)

OVERORDNET ARBEJDSPROFIL
<1 kort afsnit>

ARBEJDSMØNSTRE
- <punkt>
- <punkt>
- <punkt>
- <punkt>

POTENTIELLE STYRKER I ARBEJDSKONTEKST
- <punkt>
- <punkt>
- <punkt>

POTENTIELLE FRIKTIONSPUNKTER
- <punkt>
- <punkt>
- <punkt>

FORVENTNINGS-CHECK (JOBMATCH)
- Beskriv kort hvilke jobmiljøer der typisk matcher profilen (struktur/tempo/samarbejde).
- Beskriv kort hvilke jobmiljøer der typisk kan udfordre profilen.

AFSLUTTENDE NOTE
<1–2 linjer om at dette er indikatorer og bør ses sammen med CV og kontekst>`;

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

    const response = await openai.chat.completions.create({
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
