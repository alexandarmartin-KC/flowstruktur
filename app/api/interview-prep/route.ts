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
        { error: 'Job posting, tailored CV, application, and dimension scores are required' },
        { status: 400 }
      );
    }

    // Build dimension scores text with levels
    const getLevel = (score: number): string => {
      if (score >= 3.7) return "High";
      if (score >= 2.5) return "Moderate";
      return "Low";
    };

    let dimensionsText = "WORK_STYLE_PROFILE (1-5 scale):\n";
    for (const [dimension, score] of Object.entries(dimensionScores)) {
      const level = getLevel(score);
      dimensionsText += `- ${dimension}: ${score.toFixed(1)} (${level})\n`;
    }

    // Include current date for accurate duration calculations
    const currentDate = new Date().toLocaleDateString('da-DK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    let userMessage = `CURRENT DATE: ${currentDate} (use this when evaluating employment durations - "Present" means today)

Prepare the user for a job interview:

JOB_POSTING:
${jobPosting}

TAILORED_CV:
${tailoredCv}

APPLICATION:
${application}

${dimensionsText}

Generate interview preparation following the output structure exactly.`;

    if (feedback) {
      userMessage += `\n\nUSER_FEEDBACK:\n${feedback}`;
    }

    const response = await getOpenAI().chat.completions.create({
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
      throw new Error('No text response from AI');
    }

    return NextResponse.json({
      preparation: textContent,
    });
  } catch (err) {
    console.error('Error in interview-prep:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not generate interview preparation' },
      { status: 500 }
    );
  }
}
