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
        { error: 'Job posting and CV are required' },
        { status: 400 }
      );
    }

    // Build the user message with all available context
    let userMessage = `Analyze the user's profile against the job posting:

JOB_POSTING:
${jobPosting}

USER_CV:
${resolvedCv}`;

    if (tailoredCv) {
      userMessage += `\n\nTAILORED_CV_FOR_THIS_JOB:
${tailoredCv}`;
    }

    if (application) {
      userMessage += `\n\nUSER_APPLICATION:
${application}`;
    }

    if (userProfile && Object.keys(userProfile).length > 0) {
      userMessage += `\n\nUSER_PROFILE:
${Object.entries(userProfile)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}`;
    }

    if (dimensionScores && Object.keys(dimensionScores).length > 0) {
      userMessage += `\n\nWORK_STYLE_PROFILE (1-5 scale):
${Object.entries(dimensionScores)
  .map(([dim, score]) => `- ${dim}: ${score}`)
  .join('\n')}`;
    }

    userMessage += `\n\nGenerate interview analysis as JSON with the exact structure specified in the prompt.`;

    const response = await getOpenAI().chat.completions.create({
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
      throw new Error('No response from AI');
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
      { error: err instanceof Error ? err.message : 'Could not analyze interview' },
      { status: 500 }
    );
  }
}
