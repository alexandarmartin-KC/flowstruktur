import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { STEP_PROMPTS } from '@/lib/system-prompts';

// Lazy initialization to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAI() {
  if (!openai) {
    openai = new OpenAI();
  }
  return openai;
}

interface DimensionScores {
  [dimension: string]: number;
}

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

    // Build dimension descriptions without scores (per prompt requirements)
    const getLevel = (score: number): string => {
      if (score >= 3.7) return "høj";
      if (score >= 2.5) return "moderat";
      return "lav";
    };

    const dimensionDescriptions: Record<string, Record<string, string>> = {
      "Struktur & Rammer": {
        "lav": "lavt behov for faste rammer, kan arbejde i uklare kontekster",
        "moderat": "balance mellem behov for struktur og fleksibilitet",
        "høj": "tydeligt behov for klare rammer og definerede processer"
      },
      "Beslutningsstil": {
        "lav": "høj tolerance for beslutninger under usikkerhed",
        "moderat": "afbalanceret beslutningsstil, tilpasser efter situation",
        "høj": "behov for grundig overvejelse før beslutninger"
      },
      "Forandring & Stabilitet": {
        "lav": "høj tolerance for forandring, tilpasser sig hurtigt",
        "moderat": "kan håndtere forandringer hvis de er forudsigelige",
        "høj": "tydeligt behov for stabilitet og forudsigelighed"
      },
      "Selvstændighed & Sparring": {
        "lav": "høj grad af selvstændighed, foretrækker autonomi",
        "moderat": "balance mellem selvstændighed og samarbejde",
        "høj": "tydeligt behov for sparring og dialog"
      },
      "Sociale præferencer i arbejdet": {
        "lav": "lavt behov for social interaktion, foretrækker fordybelse",
        "moderat": "afbalanceret socialt behov",
        "høj": "højt behov for social kontakt og samarbejde"
      },
      "Ledelse & Autoritet": {
        "lav": "lavt behov for hierarkisk ledelse, trives med selvstyring",
        "moderat": "fleksibel i forhold til ledelsesform",
        "høj": "behov for klar ledelse og retning"
      },
      "Tempo & Belastning": {
        "lav": "høj tolerance for tempo og belastning",
        "moderat": "vis robusthed kombineret med behov for balance",
        "høj": "lav tolerance for vedvarende højt tempo"
      },
      "Konflikt & Feedback": {
        "lav": "høj tolerance for direkte kommunikation og uenighed",
        "moderat": "behov for konstruktiv og respektfuld dialog",
        "høj": "lav tolerance for konfliktfyldte miljøer"
      }
    };

    let dimensionsText = "ARBEJDSPROFIL (arbejdsdimensioner):\n";
    for (const [dimension, score] of Object.entries(dimensionScores)) {
      const level = getLevel(score);
      const description = dimensionDescriptions[dimension]?.[level] || level;
      dimensionsText += `- ${dimension}: ${description}\n`;
    }

    const userMessage = `CV-RESUMÉ:
${cvAnalysis}

${dimensionsText}

Generér den samlede analyse.`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: STEP_PROMPTS.SAMLET_ANALYSE,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: 1000,
      temperature: 0.5,
    });

    const textContent = response.choices[0]?.message?.content;
    if (!textContent) {
      throw new Error('Ingen tekstrespons fra AI');
    }

    return NextResponse.json({
      analysis: textContent.trim(),
    });
  } catch (err) {
    console.error('Error in combined-analysis:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunne ikke generere samlet analyse' },
      { status: 500 }
    );
  }
}
