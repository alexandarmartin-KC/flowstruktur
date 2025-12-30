import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { STEP_PROMPTS } from '@/lib/system-prompts';

const openai = new OpenAI();

export async function POST(request: NextRequest) {
  try {
    const { 
      jobDescription,
      cvAnalysis,
      personalityData,
      combinedAnalysis,
    } = await request.json();

    if (!jobDescription || !cvAnalysis || !personalityData || !combinedAnalysis) {
      return NextResponse.json(
        { error: 'Manglende påkrævet data' },
        { status: 400 }
      );
    }

    const userMessage = `Analysér hvordan brugerens CV matcher dette job:

A) STILLINGSOPSLAG_TEXT:
${jobDescription}

B) GODKENDT_CV_ANALYSE:
${cvAnalysis}

C) PERSONPROFIL_DATA:
${JSON.stringify(personalityData, null, 2)}

D) SAMLET_ANALYSE_TEXT:
${combinedAnalysis}

Producer nu en fuldstændig CV-match analyse efter den angivne outputstruktur.`;

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
    console.error('Error in cv-tailor:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunne ikke analysere CV' },
      { status: 500 }
    );
  }
}
