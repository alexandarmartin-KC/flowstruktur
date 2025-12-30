import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI();

interface DimensionScores {
  [dimension: string]: number;
}

const SYSTEM_PROMPT = `DU ER EN ANALYTIKER MED FOKUS PÅ ARBEJDSPROFILERING.

DIN OPGAVE:
Generér en samlet analyse baseret på CV-analyse og personprofil.
Analysen er til REFLEKSION, ikke vurdering.

PRINCIPPER:
- Ingen karriereråd
- Ingen egnethedsvurdering
- Ingen gentagelse af allerede viste analyser
- Ingen rosende eller vurderende adjektiver
- Brug sandsynlighedssprog (fx "indikerer", "peger på", "kan opleves som")
- Identificér samspil og spændinger mellem erfaring og præferencer
- Beskriv situationer, ikke problemer

OUTPUTSTRUKTUR (SKAL FØLGES PRÆCIST):

SAMLET PROFILFORSTÅELSE
[1 kort afsnit, der samler CV og arbejdsstil i én helhed]

HVOR CV OG ARBEJDSSTIL UNDERSTØTTER HINANDEN
- [Punkt 1: sammenhæng mellem erfaring og præference]
- [Punkt 2: sammenhæng mellem erfaring og præference]
- [Punkt 3: sammenhæng mellem erfaring og præference]

POTENTIELLE SPÆNDINGER MELLEM ERFARING OG ARBEJDSSTIL
- [Punkt 1: beskrivelse af situation]
- [Punkt 2: beskrivelse af situation]

ARBEJDSKONTEKSTER DER TYPISK VIL UNDERSTØTTE PROFILEN
[1 kort afsnit]

KONTEKSTER DER KAN KRÆVE BEVIDST TILPASNING
[1 kort afsnit]

AFSLUTTENDE NOTE
Den samlede analyse er vejledende og bygger på mønstre i erfaring og arbejdspræferencer.
Den bør ses i sammenhæng med konkret rolleindhold og organisatorisk kontekst.

SPROG:
- Dansk
- Nøgternt, professionelt
- Ingen psykologiske labels
- Ingen HR-floskler`;

export async function POST(request: NextRequest) {
  try {
    const { cvAnalysis, dimensionScores }: { 
      cvAnalysis: string; 
      dimensionScores: DimensionScores;
    } = await request.json();

    if (!cvAnalysis || !dimensionScores) {
      return NextResponse.json(
        { error: 'CV-analyse og dimensionsscorer er påkrævet' },
        { status: 400 }
      );
    }

    // Build dimension scores text with levels
    const getLevel = (score: number): string => {
      if (score >= 3.7) return "Høj";
      if (score >= 2.5) return "Moderat";
      return "Lav";
    };

    let dimensionsText = "DIMENSIONSSCORER (1-5 skala):\n";
    for (const [dimension, score] of Object.entries(dimensionScores)) {
      const level = getLevel(score);
      dimensionsText += `- ${dimension}: ${score.toFixed(1)} (${level})\n`;
    }

    const userMessage = `Analysér sammenhængen mellem CV og personprofil:

CV-ANALYSE:
${cvAnalysis}

${dimensionsText}

Generér en samlet analyse der følger outputstrukturen præcist.`;

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
      max_tokens: 2000,
      temperature: 0.7,
    });

    const textContent = response.choices[0]?.message?.content;
    if (!textContent) {
      throw new Error('Ingen tekstrespons fra AI');
    }

    return NextResponse.json({
      analysis: textContent,
    });
  } catch (err) {
    console.error('Error in combined-analysis:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunne ikke generere samlet analyse' },
      { status: 500 }
    );
  }
}
