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
  request_job_examples?: boolean;
  request_spejling?: boolean;
  request_post_feedback_questions?: boolean;
  post_feedback_answers?: UserAnswer[];
  job_examples_feedback?: {
    overall_feedback: string;
    job_examples: Array<{
      job_id: string;
      job_title: string;
      experience: string;
      friction?: string[];
      adjustments?: string[];
    }>;
  };
  direction_state?: DirectionState;
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

interface JobExample {
  id: string;
  title: string;
  description: string;
}

interface CareerCoachResponse {
  mode: 'ask_to_choose' | 'deepening' | 'job_examples' | 'spejling';
  coach_message: string;
  questions: CoachQuestion[];
  direction_state: DirectionState;
  job_examples?: JobExample[];
  // Spejling fields
  summary_paragraph?: string;
  patterns?: string[];
  unclear?: string[];
  next_step_explanation?: string;
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
      user_answers,
      request_job_examples,
      request_spejling,
      request_post_feedback_questions,
      post_feedback_answers,
      job_examples_feedback,
      direction_state: inputDirectionState
    } = body;

    // Validate required inputs
    if (!step1_json || !step2_json || !step3_json) {
      return NextResponse.json(
        { error: 'step1_json, step2_json, og step3_json er påkrævet' },
        { status: 400 }
      );
    }

    // Auto-detect if user_answers contain job example responses → trigger spejling
    const hasJobExampleAnswers = user_answers?.some(a => 
      a.question_id.startsWith('experience_job_') || a.question_id === 'clarity_check'
    ) ?? false;
    
    const shouldTriggerSpejling = request_spejling || hasJobExampleAnswers;

    // Build job_examples_feedback from user_answers if not provided
    let feedbackForSpejling = job_examples_feedback;
    if (hasJobExampleAnswers && !job_examples_feedback) {
      const jobExperienceAnswers = user_answers?.filter(a => a.question_id.startsWith('experience_job_')) || [];
      feedbackForSpejling = {
        overall_feedback: 'from_questions',
        job_examples: jobExperienceAnswers.map((ans, idx) => ({
          job_id: `job_${idx + 1}`,
          job_title: `Jobeksempel ${idx + 1}`,
          experience: ans.answer === 'Det giver mening for mig' ? 'giver_mening' : 
                     ans.answer === 'Det er delvist rigtigt' ? 'delvist' : 'ikke_noget'
        }))
      };
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

    if (request_job_examples) {
      userMessage += `\n\nREQUEST: Brugeren har bekræftet retningen og ønsker nu at se JOBEKSEMPLER. Generér 3 jobeksempler.`;
    }

    // Handle post-feedback questions request
    if (request_post_feedback_questions && job_examples_feedback) {
      userMessage += `\n\nREQUEST: POST-FEEDBACK SPØRGSMÅL

Brugeren har set jobeksemplerne og givet følgende feedback:
${JSON.stringify(job_examples_feedback, null, 2)}

Direction state fra Step 4:
${JSON.stringify(inputDirectionState, null, 2)}

Generér 2-3 afklarende coaching spørgsmål baseret på brugerens feedback på jobeksemplerne. 
Spørgsmålene skal hjælpe med at forstå:
- Hvad der specifikt tiltalte eller ikke tiltalte ved eksemplerne
- Hvilke elementer der er vigtigst for brugeren
- Om der er særlige bekymringer eller ønsker der skal adresseres

Returnér mode: "deepening" med questions array.`;
    }

    if (shouldTriggerSpejling && feedbackForSpejling) {
      // Include post_feedback_answers if available
      let postFeedbackContext = '';
      if (post_feedback_answers && post_feedback_answers.length > 0) {
        postFeedbackContext = `\n\nBrugerens svar på opfølgende spørgsmål:\n${JSON.stringify(post_feedback_answers, null, 2)}`;
      }
      
      userMessage += `\n\nREQUEST: SPEJLING (Step 5B)

Brugeren har set jobeksemplerne og givet følgende feedback:
${JSON.stringify(feedbackForSpejling, null, 2)}

Direction state fra Step 4:
${JSON.stringify(inputDirectionState, null, 2)}${postFeedbackContext}

Generér en spejling baseret på brugerens reaktioner og alle deres svar.`;
    }

    // Determine which system prompt to use
    let systemPrompt = STEP_PROMPTS.KARRIERE_COACH;
    if (request_job_examples) {
      systemPrompt = STEP_PROMPTS.JOB_EKSEMPLER;
    } else if (shouldTriggerSpejling) {
      systemPrompt = STEP_PROMPTS.SPEJLING;
    }

    // Use higher token limit for spejling since it produces more content
    // Full spejling with all 6 sections + JSON structure needs ~5000-6000 tokens
    const maxTokens = shouldTriggerSpejling ? 6000 : 2000;
    
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: maxTokens,
      temperature: 0.5,
      response_format: shouldTriggerSpejling ? { type: 'json_object' } : undefined,
    });

    const textContent = response.choices[0]?.message?.content;
    if (!textContent) {
      throw new Error('Ingen tekstrespons fra AI');
    }

    // Debug logging for spejling
    if (shouldTriggerSpejling) {
      console.log('Spejling response raw:', textContent.substring(0, 500));
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
      
      // Debug logging for spejling parsed response
      if (shouldTriggerSpejling) {
        console.log('Spejling parsed - mode:', parsedResponse.mode);
        console.log('Spejling parsed - summary_paragraph:', parsedResponse.summary_paragraph?.substring(0, 100));
        console.log('Spejling parsed - patterns length:', parsedResponse.patterns?.length);
        console.log('Spejling parsed - unclear length:', parsedResponse.unclear?.length);
        console.log('Spejling parsed - next_step_explanation:', parsedResponse.next_step_explanation?.substring(0, 100));
      }
      
      // Validate and ensure required fields exist
      parsedResponse = validateAndNormalizeResponse(parsedResponse, user_choice, shouldTriggerSpejling);
      
    } catch (parseErr) {
      console.error('Failed to parse AI response as JSON:', textContent);
      console.error('Parse error:', parseErr);
      
      // For spejling mode, try to extract any useful content
      if (shouldTriggerSpejling) {
        // Try to find JSON within the response
        const jsonMatch = textContent.match(/\{[\s\S]*"mode"\s*:\s*"spejling"[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedResponse = JSON.parse(jsonMatch[0]);
            parsedResponse = validateAndNormalizeResponse(parsedResponse, user_choice, shouldTriggerSpejling);
            return NextResponse.json(parsedResponse);
          } catch (e) {
            console.error('Secondary JSON parse also failed');
          }
        }
        
        // Return a more helpful error for spejling
        return NextResponse.json({
          mode: 'spejling',
          coach_message: '',
          questions: [],
          summary_paragraph: 'Der opstod en teknisk fejl under generering af spejlingen. AI-svaret kunne ikke parses korrekt. Prøv venligst igen.',
          patterns: [],
          unclear: [],
          next_step_explanation: '',
          direction_state: {
            choice: 'UNSET',
            priorities_top3: [],
            non_negotiables: [],
            negotiables: [],
            cv_weighting_focus: [],
            risk_notes: [],
            next_step_ready_for_jobs: true,
          }
        });
      }
      
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
  userChoice?: string,
  isSpejling?: boolean
): CareerCoachResponse {
  // Ensure mode is set correctly
  if (!response.mode) {
    if (isSpejling) {
      response.mode = 'spejling';
    } else {
      response.mode = userChoice ? 'deepening' : 'ask_to_choose';
    }
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
  
  // MODE 2 rules - ready for jobs if:
  // 1. AI explicitly set it to true, OR
  // 2. We have a choice and no more questions to ask
  if (response.mode === 'deepening') {
    const hasChoice = response.direction_state.choice !== 'UNSET';
    const noMoreQuestions = !response.questions || response.questions.length === 0;
    
    // Trust the AI's decision if it set ready to true, otherwise check conditions
    if (!response.direction_state.next_step_ready_for_jobs) {
      response.direction_state.next_step_ready_for_jobs = hasChoice && noMoreQuestions;
    }
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
