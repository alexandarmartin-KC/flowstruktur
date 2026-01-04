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

interface ClarifyingAnswers {
  [key: string]: string | null | undefined;
}

interface ClarificationQuestion {
  id: string;
  title: string;
  type: 'single_choice' | 'short_text_optional';
  options: string[];
}

interface AnalysisResponse {
  needs_clarifications: boolean;
  clarifications: ClarificationQuestion[];
  analysis_text: string;
  ui_state: 'clarifications_only' | 'analysis_only';
}

export async function POST(request: NextRequest) {
  try {
    const { cvAnalysis, dimensionScores, clarifyingAnswers }: { 
      cvAnalysis: string; 
      dimensionScores: DimensionScores;
      clarifyingAnswers?: ClarifyingAnswers;
    } = await request.json();

    if (!cvAnalysis || !dimensionScores) {
      return NextResponse.json(
        { error: 'CV-analyse og dimensionsscorer er påkrævet' },
        { status: 400 }
      );
    }

    // Build dimension descriptions with levels only (no scores)
    const getLevel = (score: number): string => {
      if (score >= 3.7) return "høj";
      if (score >= 2.5) return "moderat";
      return "lav";
    };

    // Build step1 JSON-like structure
    const step1Data = {
      cv_summary: cvAnalysis
    };

    // Build step2 JSON-like structure for the prompt
    const step2Data = {
      dimension_scores: Object.fromEntries(
        Object.entries(dimensionScores).map(([dimension, score]) => [
          dimension,
          { score: score.toFixed(1), level: getLevel(score) }
        ])
      )
    };

    // Build clarifying answers JSON if provided
    let clarifyingAnswersJson = '(ingen svar endnu)';
    const hasAnswers = clarifyingAnswers && Object.values(clarifyingAnswers).some(v => v && v !== '');
    if (hasAnswers) {
      clarifyingAnswersJson = JSON.stringify(clarifyingAnswers, null, 2);
    }

    const userMessage = `step1_json:
${JSON.stringify(step1Data, null, 2)}

step2_json:
${JSON.stringify(step2Data, null, 2)}

clarification_answers_json:
${clarifyingAnswersJson}`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: STEP_PROMPTS.SAMLET_ANALYSE,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const textContent = response.choices[0]?.message?.content;
    if (!textContent) {
      throw new Error('Ingen tekstrespons fra AI');
    }

    // Parse the JSON response
    let parsedResponse: AnalysisResponse;
    try {
      // Clean up potential markdown code blocks
      const cleanedContent = textContent
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      
      parsedResponse = JSON.parse(cleanedContent);
      
      // Ensure ui_state is set correctly based on logic
      if (!parsedResponse.ui_state) {
        if (parsedResponse.needs_clarifications && parsedResponse.clarifications.length > 0 && !parsedResponse.analysis_text) {
          parsedResponse.ui_state = 'clarifications_only';
        } else {
          parsedResponse.ui_state = 'analysis_only';
        }
      }
      
      // Handle legacy ui_hint field if present
      if ('ui_hint' in parsedResponse && !parsedResponse.ui_state) {
        parsedResponse.ui_state = (parsedResponse as { ui_hint?: string }).ui_hint as 'clarifications_only' | 'analysis_only';
      }
      
    } catch (parseErr) {
      console.error('Failed to parse AI response as JSON:', textContent);
      // Fallback: return the text as analysis
      return NextResponse.json({
        needs_clarifications: false,
        clarifications: [],
        analysis_text: textContent.trim(),
        ui_state: 'analysis_only'
      });
    }

    return NextResponse.json(parsedResponse);
  } catch (err) {
    console.error('Error in combined-analysis:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunne ikke generere samlet analyse' },
      { status: 500 }
    );
  }
}
