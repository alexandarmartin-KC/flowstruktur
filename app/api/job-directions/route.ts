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
    const { cvAnalysis, dimensionScores, feedback }: { 
      cvAnalysis: string; 
      dimensionScores: DimensionScores;
      feedback?: string;
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

    let dimensionsText = "PERSONPROFIL_DATA (1-5 skala):\n";
    for (const [dimension, score] of Object.entries(dimensionScores)) {
      const level = getLevel(score);
      dimensionsText += `- ${dimension}: ${score.toFixed(1)} (${level})\n`;
    }

    let userMessage = `Foreslå relevante jobretninger baseret på profilen:

CV_ANALYSE:
${cvAnalysis}

${dimensionsText}

Generér 5-7 mulige jobretninger der følger outputstrukturen præcist.`;

    if (feedback) {
      userMessage += `\n\nBRUGERFEEDBACK:\n${feedback}`;
    }

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: STEP_PROMPTS.MULIGHEDER_OVERSIGT,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: 3000,
      temperature: 0.7,
    });

    const textContent = response.choices[0]?.message?.content;
    if (!textContent) {
      throw new Error('Ingen tekstrespons fra AI');
    }

    return NextResponse.json({
      directions: textContent,
    });
  } catch (err) {
    console.error('Error in job-directions:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunne ikke generere jobretninger' },
      { status: 500 }
    );
  }
}
