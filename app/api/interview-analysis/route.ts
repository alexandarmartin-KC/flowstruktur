import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { STEP_PROMPTS } from '@/lib/system-prompts';

const openai = new OpenAI();

interface CVRisk {
  title: string;
  description: string;
  example: string;
  severity: 'high' | 'medium' | 'low';
}

interface InterviewQuestion {
  question: string;
  context: string;
  suggestedApproach: string;
}

interface InterviewAnalysis {
  risks: CVRisk[];
  strengths: string[];
  expectedQuestions: InterviewQuestion[];
}

export async function POST(request: NextRequest) {
  try {
    const {
      jobPosting,
      resolvedCv,
      tailoredCv,
      application,
      userProfile,
      dimensionScores,
    }: {
      jobPosting: string;
      resolvedCv: string;
      tailoredCv?: string;
      application?: string;
      userProfile?: any;
      dimensionScores?: Record<string, number>;
    } = await request.json();

    if (!jobPosting || !resolvedCv) {
      return NextResponse.json(
        { error: 'Stillingsopslag og CV er påkrævet' },
        { status: 400 }
      );
    }

    // Build the user message with all available context
    let userMessage = `Analysér brugerens profil i forhold til jobopslaget:

STILLINGSOPSLAG:
${jobPosting}

BRUGERS CV:
${resolvedCv}`;

    if (tailoredCv) {
      userMessage += `\n\nTILPASSET CV TIL DETTE JOB:
${tailoredCv}`;
    }

    if (application) {
      userMessage += `\n\nBRUGERS ANSØGNING:
${application}`;
    }

    if (userProfile && Object.keys(userProfile).length > 0) {
      userMessage += `\n\nBRUGER PROFIL:
${Object.entries(userProfile)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}`;
    }

    if (dimensionScores && Object.keys(dimensionScores).length > 0) {
      userMessage += `\n\nARBEJDSSTIL PROFIL (1-5 skala):
${Object.entries(dimensionScores)
  .map(([dim, score]) => `- ${dim}: ${score}`)
  .join('\n')}`;
    }

    userMessage += `\n\nGenerer interview-analyse som JSON med præcis struktur som angivet i prompten.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: STEP_PROMPTS.INTERVIEW_ANALYSIS,
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
      throw new Error('Ingen respons fra AI');
    }

    // Parse JSON from response
    let analysis: InterviewAnalysis;
    try {
      // Try to extract JSON from the response
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, create a basic structure from text
        analysis = {
          risks: [],
          strengths: [],
          expectedQuestions: [],
        };
      }
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      // Return basic structure if parsing fails
      analysis = {
        risks: [],
        strengths: [],
        expectedQuestions: [],
      };
    }

    return NextResponse.json({
      analysis,
    });
  } catch (err) {
    console.error('Error in interview-analysis:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunne ikke analysere interview' },
      { status: 500 }
    );
  }
}
