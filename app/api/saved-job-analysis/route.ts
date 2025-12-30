import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { STEP_PROMPTS } from '@/lib/system-prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const {
      jobDescription,
      cvAnalysis,
      personalityData,
      combinedAnalysis,
    } = await req.json();

    if (!jobDescription || !cvAnalysis || !personalityData || !combinedAnalysis) {
      return NextResponse.json(
        { error: 'Manglende påkrævet data' },
        { status: 400 }
      );
    }

    const prompt = `${STEP_PROMPTS.GEMT_JOB_ANALYSE}

INPUT DATA:

A) STILLINGSOPSLAG_TEXT:
${jobDescription}

B) GODKENDT_CV_ANALYSE:
${cvAnalysis}

C) PERSONPROFIL_DATA:
${JSON.stringify(personalityData, null, 2)}

D) SAMLET_ANALYSE_TEXT:
${combinedAnalysis}

Producer nu en fuldstændig jobmatch-analyse efter den angivne outputstruktur.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: STEP_PROMPTS.GEMT_JOB_ANALYSE,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const analysis = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error in saved-job-analysis:', error);
    return NextResponse.json(
      { error: 'Fejl ved analyse af gemt job' },
      { status: 500 }
    );
  }
}
