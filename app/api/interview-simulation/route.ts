import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { STEP_PROMPTS } from '@/lib/system-prompts';

const openai = new OpenAI();

interface SimulationFeedback {
  feedback: string;
  strengths: string;
  improvement: string;
  cvReference: string;
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
        { error: 'Alle påkrævet felter skal være udfyldt' },
        { status: 400 }
      );
    }

    // Build system message with interview context
    let systemMessage = STEP_PROMPTS.INTERVIEW_SIMULATION;

    // Build user message
    let userMessage = `Du er nu i gang med en jobsamtale.

SPØRGSMÅL:
"${question}"

KANDIDATENS SVAR:
"${userAnswer}"

KONTEKST - JOBOPSLAG:
${jobPosting}

KANDIDATENS CV:
${resolvedCv}

INTERVIEW STATUS:
- Spørgsmål ${questionIndex + 1} af ${totalQuestions}
${previousFeedback ? `- Tidligere feedback: ${previousFeedback.feedback}` : ''}

Giv feedback på svaret. Vær konstruktiv og hjælpsom.
Output som JSON med præcis struktur som angivet.`;

    const response = await openai.chat.completions.create({
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
      throw new Error('Ingen respons fra AI');
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
          feedback: textContent,
          strengths: 'Dit svar havde gode elementer',
          improvement: 'Prøv at være mere konkret med eksempler fra din erfaring',
          cvReference: 'Se dine arbejdserfaringer',
          nextQuestion: null,
        };
      }
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      // Return basic structure if parsing fails
      feedback = {
        feedback: textContent,
        strengths: 'Dit svar havde positive elementer',
        improvement: 'Kontinuer med næste spørgsmål',
        cvReference: '',
        nextQuestion: null,
      };
    }

    return NextResponse.json({
      feedback,
    });
  } catch (err) {
    console.error('Error in interview-simulation:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunne ikke processere feedback' },
      { status: 500 }
    );
  }
}
