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

interface SimulationFeedback {
  whyAsked: string;
  whatAnswerShows: string;
  unclearPoints: string[];
  howToStrengthen: string;
  whatToAvoid: string[];
  nextQuestion: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const {
      question,
      userAnswer,
      jobPosting,
      resolvedCv,
      previousFeedback,
      questionIndex,
      totalQuestions,
    }: {
      question: string;
      userAnswer: string;
      jobPosting: string;
      resolvedCv: string;
      previousFeedback?: SimulationFeedback;
      questionIndex: number;
      totalQuestions: number;
    } = await request.json();

    if (!question || !userAnswer || !jobPosting || !resolvedCv) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    // Build system message with interview context
    let systemMessage = STEP_PROMPTS.INTERVIEW_SIMULATION;

    // Include current date for accurate duration calculations
    const currentDate = new Date().toLocaleDateString('da-DK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Build user message
    let userMessage = `CURRENT DATE: ${currentDate} (use this when evaluating employment durations - "Present" means today)

Analyze this interview answer:

INTERVIEW QUESTION:
"${question}"

USER'S ANSWER:
"${userAnswer}"

JOB DESCRIPTION:
${jobPosting}

USER'S CV:
${resolvedCv}

PROGRESS:
- Question ${questionIndex + 1} of ${totalQuestions}

Provide structured feedback following the exact JSON format specified. Be neutral, factual, and helpful. Do NOT praise or criticize - analyze.`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemMessage,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const textContent = response.choices[0]?.message?.content;
    if (!textContent) {
      throw new Error('No response from AI');
    }

    // Parse JSON from response
    let feedback: SimulationFeedback;
    try {
      // Try to extract JSON from the response
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        feedback = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback structure
        feedback = {
          whyAsked: 'Unable to parse response. Please try again.',
          whatAnswerShows: textContent,
          unclearPoints: [],
          howToStrengthen: 'Consider providing more specific details from your experience.',
          whatToAvoid: [],
          nextQuestion: null,
        };
      }
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      // Return basic structure if parsing fails
      feedback = {
        whyAsked: 'Unable to parse response.',
        whatAnswerShows: textContent,
        unclearPoints: [],
        howToStrengthen: 'Please try submitting your answer again.',
        whatToAvoid: [],
        nextQuestion: null,
      };
    }

    return NextResponse.json({
      feedback,
    });
  } catch (err) {
    console.error('Error in interview-simulation:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not process feedback' },
      { status: 500 }
    );
  }
}
