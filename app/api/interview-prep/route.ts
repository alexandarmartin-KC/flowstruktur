import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { STEP_PROMPTS } from '@/lib/system-prompts';

const openai = new OpenAI();

interface DimensionScores {
  [dimension: string]: number;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      jobPosting,
      tailoredCv,
      application,
      dimensionScores,
      feedback 
    }: { 
      jobPosting: string;
      tailoredCv: string;
      application: string;
      dimensionScores: DimensionScores;
      feedback?: string;
    } = await request.json();

    if (!jobPosting || !tailoredCv || !application || !dimensionScores) {
      return NextResponse.json(
        { error: 'Stillingsopslag, tilpasset CV, ansøgning og dimensionsscorer er påkrævet' },
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

    let userMessage = `Forbered brugeren til jobsamtale:

STILLINGSOPSLAG_TEXT:
${jobPosting}

TILPASSET_CV:
${tailoredCv}

ANSØGNING:
${application}

${dimensionsText}

Generér samtaleforberedelse der følger outputstrukturen præcist.`;

    if (feedback) {
      userMessage += `\n\nBRUGERFEEDBACK:\n${feedback}`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: STEP_PROMPTS.JOBSAMTALE,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const textContent = response.choices[0]?.message?.content;
    if (!textContent) {
      throw new Error('Ingen tekstrespons fra AI');
    }

    return NextResponse.json({
      preparation: textContent,
    });
  } catch (err) {
    console.error('Error in interview-prep:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunne ikke generere samtaleforberedelse' },
      { status: 500 }
    );
  }
}
