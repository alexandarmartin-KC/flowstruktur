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

// Input interfaces
interface DimensionScore {
  score: string;
  level: string;
}

interface Step1Data {
  cv_summary: string;
}

interface Step2Data {
  dimension_scores: {
    [dimension: string]: DimensionScore;
  };
}

interface Step3Data {
  analysis_text: string;
  clarification_answers?: {
    preference_influence?: string;
    temporary_roles?: string;
    preference_stability?: string;
  };
}

interface UserAnswer {
  question_id: string;
  answer: string | string[];
}

interface CareerCoachRequest {
  step1_json: Step1Data;
  step2_json: Step2Data;
  step3_json: Step3Data;
  user_choice?: 'A' | 'B' | 'C' | '';
  job_ad_text_or_url?: string;
  user_answers?: UserAnswer[];
}

// Output interfaces
interface CoachQuestion {
  id: string;
  type: 'single_choice' | 'multi_choice' | 'short_text';
  prompt: string;
  options?: string[];
}

interface DirectionState {
  choice: 'A' | 'B' | 'C' | 'UNSET';
  priorities_top3: string[];
  non_negotiables: string[];
  negotiables: string[];
  cv_weighting_focus: string[];
  risk_notes: string[];
  next_step_ready_for_jobs: boolean;
}

interface CareerCoachResponse {
  mode: 'ask_to_choose' | 'deepening';
  coach_message: string;
  questions: CoachQuestion[];
  direction_state: DirectionState;
}

export async function POST(request: NextRequest) {
  try {
    const body: CareerCoachRequest = await request.json();
    
    const { 
      step1_json, 
      step2_json, 
      step3_json, 
      user_choice, 
      job_ad_text_or_url,
      user_answers 
    } = body;

    // Validate required inputs
    if (!step1_json || !step2_json || !step3_json) {
      return NextResponse.json(
        { error: 'step1_json, step2_json, og step3_json er påkrævet' },
        { status: 400 }
      );
    }

    // Map clarification answers to the expected format
    const clarificationVars = step3_json.clarification_answers 
      ? {
          preference_influence: mapClarificationAnswer(step3_json.clarification_answers.preference_influence, 'preference_influence'),
          temporary_roles: mapClarificationAnswer(step3_json.clarification_answers.temporary_roles, 'temporary_roles'),
          preference_stability: mapClarificationAnswer(step3_json.clarification_answers.preference_stability, 'preference_stability'),
        }
      : null;

    // Build the user message
    let userMessage = `step1_json:
${JSON.stringify(step1_json, null, 2)}

step2_json:
${JSON.stringify(step2_json, null, 2)}

step3_json:
${JSON.stringify({
  analysis_text: step3_json.analysis_text,
  ...(clarificationVars && { clarification_variables: clarificationVars })
}, null, 2)}

user_choice: ${user_choice || '(tom)'}`;

    if (user_choice === 'C' && job_ad_text_or_url) {
      userMessage += `\n\njob_ad_text_or_url:\n${job_ad_text_or_url}`;
    }

    if (user_answers && user_answers.length > 0) {
      userMessage += `\n\nuser_answers:\n${JSON.stringify(user_answers, null, 2)}`;
    }

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: STEP_PROMPTS.KARRIERE_COACH,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: 2000,
      temperature: 0.5,
    });

    const textContent = response.choices[0]?.message?.content;
    if (!textContent) {
      throw new Error('Ingen tekstrespons fra AI');
    }

    // Parse the JSON response
    let parsedResponse: CareerCoachResponse;
    try {
      // Clean up potential markdown code blocks
      const cleanedContent = textContent
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      
      parsedResponse = JSON.parse(cleanedContent);
      
      // Validate and ensure required fields exist
      parsedResponse = validateAndNormalizeResponse(parsedResponse, user_choice);
      
    } catch (parseErr) {
      console.error('Failed to parse AI response as JSON:', textContent);
      // Return a fallback response
      return NextResponse.json({
        mode: 'ask_to_choose',
        coach_message: 'Der opstod en fejl. Prøv venligst igen.',
        questions: [],
        direction_state: {
          choice: 'UNSET',
          priorities_top3: [],
          non_negotiables: [],
          negotiables: [],
          cv_weighting_focus: [],
          risk_notes: [],
          next_step_ready_for_jobs: false,
        }
      });
    }

    return NextResponse.json(parsedResponse);
  } catch (err) {
    console.error('Error in career-coach:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunne ikke generere karrierecoach-svar' },
      { status: 500 }
    );
  }
}

// Helper function to map clarification answers to expected format
function mapClarificationAnswer(answer: string | undefined, type: string): string {
  if (!answer) return 'DK';
  
  const lowerAnswer = answer.toLowerCase();
  
  if (type === 'preference_influence') {
    if (lowerAnswer.includes('de fleste') || lowerAnswer.includes('most')) return 'MOST';
    if (lowerAnswer.includes('nogle') || lowerAnswer.includes('some')) return 'SOME';
    if (lowerAnswer.includes('nej') || lowerAnswer.includes('no')) return 'NO';
    return 'DK';
  }
  
  if (type === 'temporary_roles') {
    if (lowerAnswer === 'ja' || lowerAnswer.includes('yes')) return 'YES';
    if (lowerAnswer === 'nej' || lowerAnswer.includes('no')) return 'NO';
    if (lowerAnswer.includes('delvist') || lowerAnswer.includes('partly')) return 'PARTLY';
    return 'DK';
  }
  
  if (type === 'preference_stability') {
    if (lowerAnswer.includes('stabil') || lowerAnswer.includes('stable')) return 'STABLE';
    if (lowerAnswer.includes('ændret') || lowerAnswer.includes('changed')) return 'CHANGED';
    return 'DK';
  }
  
  return 'DK';
}

// Validate and normalize the response
function validateAndNormalizeResponse(
  response: CareerCoachResponse, 
  userChoice?: string
): CareerCoachResponse {
  // Ensure mode is set correctly
  if (!response.mode) {
    response.mode = userChoice ? 'deepening' : 'ask_to_choose';
  }
  
  // Ensure direction_state exists
  if (!response.direction_state) {
    response.direction_state = {
      choice: 'UNSET',
      priorities_top3: [],
      non_negotiables: [],
      negotiables: [],
      cv_weighting_focus: [],
      risk_notes: [],
      next_step_ready_for_jobs: false,
    };
  }
  
  // Ensure arrays exist
  response.direction_state.priorities_top3 = response.direction_state.priorities_top3 || [];
  response.direction_state.non_negotiables = response.direction_state.non_negotiables || [];
  response.direction_state.negotiables = response.direction_state.negotiables || [];
  response.direction_state.cv_weighting_focus = response.direction_state.cv_weighting_focus || [];
  response.direction_state.risk_notes = response.direction_state.risk_notes || [];
  
  // Set choice based on user input if provided
  if (userChoice && userChoice !== '') {
    response.direction_state.choice = userChoice as 'A' | 'B' | 'C';
  }
  
  // MODE 1 rules
  if (response.mode === 'ask_to_choose') {
    response.direction_state.choice = 'UNSET';
    response.direction_state.next_step_ready_for_jobs = false;
  }
  
  // MODE 2 rules - only ready for jobs if we have enough info
  if (response.mode === 'deepening') {
    const hasChoice = response.direction_state.choice !== 'UNSET';
    const hasPriorities = response.direction_state.priorities_top3.length >= 2;
    const hasNonNegotiables = response.direction_state.non_negotiables.length >= 1 ||
      response.direction_state.negotiables.some(n => n.toLowerCase().includes('ingen'));
    
    response.direction_state.next_step_ready_for_jobs = hasChoice && hasPriorities && hasNonNegotiables;
  }
  
  // Ensure questions array exists
  if (!response.questions) {
    response.questions = [];
  }
  
  // Ensure coach_message exists
  if (!response.coach_message) {
    response.coach_message = '';
  }
  
  return response;
}
