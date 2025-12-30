import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { STEP_PROMPTS } from '@/lib/system-prompts';

const openai = new OpenAI();

export async function POST(request: NextRequest) {
  try {
    const { 
      originalCv, 
      jobPosting,
      feedback 
    }: { 
      originalCv: string;
      jobPosting: string;
      feedback?: string;
    } = await request.json();

    if (!originalCv || !jobPosting) {
      return NextResponse.json(
        { error: 'Originalt CV og stillingsopslag er påkrævet' },
        { status: 400 }
      );
    }

    let userMessage = `Tilpas CV'et til stillingsopslaget:

ORIGINALT_CV:
${originalCv}

STILLINGSOPSLAG_TEXT:
${jobPosting}

Generér et tilpasset CV der følger outputstrukturen præcist. Brug KUN erfaring fra det originale CV.`;

    if (feedback) {
      userMessage += `\n\nBRUGERFEEDBACK:\n${feedback}`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: STEP_PROMPTS.CV_TILPASNING,
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
      tailoredCv: textContent,
    });
  } catch (err) {
    console.error('Error in cv-tailor:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunne ikke tilpasse CV' },
      { status: 500 }
    );
  }
}
