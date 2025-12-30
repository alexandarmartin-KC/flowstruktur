import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { STEP_PROMPTS } from '@/lib/system-prompts';

const openai = new OpenAI();

export async function POST(request: NextRequest) {
  try {
    const { 
      tailoredCv, 
      jobPosting,
      feedback 
    }: { 
      tailoredCv: string;
      jobPosting: string;
      feedback?: string;
    } = await request.json();

    if (!tailoredCv || !jobPosting) {
      return NextResponse.json(
        { error: 'Tilpasset CV og stillingsopslag er påkrævet' },
        { status: 400 }
      );
    }

    let userMessage = `Skriv en ansøgning baseret på CV og stillingsopslag:

TILPASSET_CV:
${tailoredCv}

STILLINGSOPSLAG_TEXT:
${jobPosting}

Generér en professionel ansøgning der følger outputstrukturen præcist.`;

    if (feedback) {
      userMessage += `\n\nBRUGERFEEDBACK:\n${feedback}`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: STEP_PROMPTS.ANSØGNING,
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
      application: textContent,
    });
  } catch (err) {
    console.error('Error in application:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunne ikke generere ansøgning' },
      { status: 500 }
    );
  }
}
