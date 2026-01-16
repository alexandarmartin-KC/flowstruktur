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
  switch_distance?: 'close' | 'far'; // For "Skift karrierespor": tæt på eller helt væk
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
  mode: 'ask_to_choose' | 'deepening' | 'job_examples' | 'spejling' | 'job_spejling';
  coach_message: string;
  questions: CoachQuestion[];
  direction_state: DirectionState;
  job_examples?: JobExample[];
  // Spejling fields
  summary_paragraph?: string;
  patterns?: string[];
  unclear?: string[];
  next_step_explanation?: string;
  // Job spejling fields (current structure - neutral analytiker)
  job_title?: string;
  job_category?: string;
  section1_jobkrav?: { title: string; content: string; points?: string[] };
  section2_match?: { title: string; content: string; points?: string[] };
  section3_opmærksomhed?: { title: string; content: string; points?: string[] };
  section4_krav?: { title: string; content: string; points?: string[] };
  closing_statement?: string;
  // Legacy job spejling fields (backwards compatibility with old coach structure)
  section1_overordnet?: { title: string; content: string };
  section2_jobbet?: { title: string; content: string; points?: string[] };
  section4_centrale?: { title: string; content: string };
  section5_krav?: { title: string; content: string; points?: string[] };
  section2_sammenfald?: { title: string; content: string; points?: string[] };
  section3_opmaerksomhed?: { title: string; content: string; points?: string[] };
  section4_uafklaret?: { title: string; content: string; points?: string[] };
  section5_refleksion?: { title: string; questions?: string[] };
}

export async function POST(request: NextRequest) {
  try {
    const body: CareerCoachRequest = await request.json();
    
    const { 
      step1_json, 
      step2_json, 
      step3_json, 
      user_choice,
      switch_distance,
      job_ad_text_or_url,
      user_answers,
      request_job_examples,
      request_spejling,
      request_post_feedback_questions,
      post_feedback_answers,
      job_examples_feedback,
      direction_state: inputDirectionState
    } = body;

    // Debug log incoming request
    console.log('Career coach request:', { user_choice, switch_distance, request_job_examples, hasAnswers: user_answers?.length || 0 });

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
    
    // Only trigger spejling if explicitly requested OR has job example answers
    // AND we're NOT requesting post-feedback questions
    const shouldTriggerSpejling = (request_spejling || hasJobExampleAnswers) && !request_post_feedback_questions;

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

    // Check early if this is job spejling (choice C with job ad)
    // Job spejling uses step1 (CV), step2 (work profile), and step3 (career analysis)
    const isJobSpejlingRequest = user_choice === 'C' && job_ad_text_or_url;
    
    // Pre-extract job title if this is a job spejling request
    let extractedJobTitle = '';
    if (isJobSpejlingRequest && job_ad_text_or_url) {
      extractedJobTitle = await extractJobTitleFromAd(job_ad_text_or_url);
      console.log('Pre-extracted job title for spejling:', extractedJobTitle);
    }

    // Build the user message
    let userMessage: string;
    
    if (isJobSpejlingRequest) {
      // CRITICAL: Structure message to prevent model confusion
      // 1. Job ad FIRST with extracted title prominently displayed
      // 2. Clear separation between job ad and user profile
      // 3. User profile LAST to prevent title contamination
      
      // Sanitize step1_json to remove any job titles that could confuse the model
      // We replace common job title patterns with generic placeholders
      const sanitizedStep1 = JSON.stringify(step1_json, null, 2)
        .replace(/"(job_?title|position|stilling|titel|role)":\s*"[^"]+"/gi, '"current_role": "[BRUGERENS NUVÆRENDE ROLLE - IKKE RELEVANT FOR DENNE ANALYSE]"')
        .replace(/"title":\s*"[^"]+"/gi, '"title": "[BRUGERENS TIDLIGERE TITEL]"');
      
      // Also sanitize step3_json analysis text to avoid title confusion
      const sanitizedStep3 = {
        ...step3_json,
        analysis_text: step3_json.analysis_text 
          ? `[Karriereanalyse - jobtitler er anonymiseret]\n${step3_json.analysis_text}`
          : ''
      };
      
      // Log the sanitized content for debugging
      console.log('Job Spejling - sanitized step1 preview:', sanitizedStep1.substring(0, 300));
      console.log('Job Spejling - job_ad length:', job_ad_text_or_url?.length || 0);
      console.log('Job Spejling - job_ad first 200 chars:', job_ad_text_or_url?.substring(0, 200));
      
      userMessage = `════════════════════════════════════════════════════════════════════════
████ JOBANNONCE - DU ANALYSERER DETTE JOB ████
════════════════════════════════════════════════════════════════════════

${extractedJobTitle ? `
████████████████████████████████████████████████████████████████████████
   JOBTITEL FRA ANNONCEN: "${extractedJobTitle}"
████████████████████████████████████████████████████████████████████████

DENNE TITEL ER ALLEREDE VERIFICERET. DU SKAL BRUGE PRÆCIS DENNE TITEL.
ALT ANALYSE SKAL HANDLE OM DETTE JOB: "${extractedJobTitle}"

` : ''}
JOBANNONCENS FULDE TEKST:
---
${job_ad_text_or_url}
---

════════════════════════════════════════════════════════════════════════
████ INSTRUKTION ████
════════════════════════════════════════════════════════════════════════

${extractedJobTitle ? `
⚠️ KRITISK: JOBTITLEN ER "${extractedJobTitle}"

1. I dit JSON output SKAL job_title være: "${extractedJobTitle}"
2. HELE din analyse SKAL handle om stillingen "${extractedJobTitle}"
3. section1_jobkrav SKAL beskrive hvad "${extractedJobTitle}" stillingen kræver baseret på ANNONCEN
4. section2_match SKAL beskrive match mellem "${extractedJobTitle}" og brugerens profil
5. IGNORER fuldstændigt brugerens nuværende jobtitel fra CV

ALLE sektioner skal analysere JOBANNONCEN "${extractedJobTitle}", IKKE brugerens CV-titel.
` : `
Læs jobannoncen ovenfor og find den EKSAKTE jobtitel fra annoncen.
Brug ALDRIG en titel fra brugerens CV.
`}

════════════════════════════════════════════════════════════════════════
████ BRUGERENS BAGGRUND (KUN TIL SAMMENLIGNING) ████
════════════════════════════════════════════════════════════════════════

BEMÆRK: Nedenfor er brugerens profil. Brug KUN til at sammenligne med jobbet.
JOBTITLEN KOMMER FRA ANNONCEN OVENFOR - ALDRIG fra dataen nedenfor.
Brugerens jobtitler er fjernet for at undgå forvirring.

Brugerens CV (step1_json - jobtitler anonymiseret):
${sanitizedStep1}

Brugerens arbejdsprofil (step2_json):
${JSON.stringify(step2_json, null, 2)}

Brugerens karriereanalyse (step3_json - jobtitler anonymiseret):
${JSON.stringify(sanitizedStep3, null, 2)}

════════════════════════════════════════════════════════════════════════
████ DIN OPGAVE ████
════════════════════════════════════════════════════════════════════════

Lav en job-spejling der sammenligner "${extractedJobTitle || 'jobbet fra annoncen'}" med brugerens profil.
${extractedJobTitle ? `

PÅMINDELSE: job_title = "${extractedJobTitle}" - INGEN UNDTAGELSER
PÅMINDELSE: section1_jobkrav handler om "${extractedJobTitle}" - hvad jobbet KRÆVER
PÅMINDELSE: ALDRIG brug brugerens CV-titel i analysen
` : ''}
Returnér JSON med mode: "job_spejling".`;
    } else {
      userMessage = `step1_json:
${JSON.stringify(step1_json, null, 2)}

step2_json:
${JSON.stringify(step2_json, null, 2)}

step3_json:
${JSON.stringify({
  analysis_text: step3_json.analysis_text,
  ...(clarificationVars && { clarification_variables: clarificationVars })
}, null, 2)}

user_choice: ${user_choice || '(tom)'}`;
    }    // Add switch_distance context for "Skift karrierespor" flow
    if (user_choice === 'B' && switch_distance) {
      const distanceDescription = switch_distance === 'close' 
        ? 'TÆT PÅ NUVÆRENDE - Brugeren vil skifte til en beslægtet branche eller rolle'
        : 'HELT VÆK FRA NUVÆRENDE - Brugeren vil skifte til en helt ny branche eller retning';
      userMessage += `\nswitch_distance: ${switch_distance}\nBeskrivelse: ${distanceDescription}`;
    }

    if (user_choice === 'C' && job_ad_text_or_url) {
      userMessage += `\n\njob_ad_text_or_url:\n${job_ad_text_or_url}`;
    }

    if (user_answers && user_answers.length > 0) {
      userMessage += `\n\nuser_answers:\n${JSON.stringify(user_answers, null, 2)}`;
    }

    if (request_job_examples) {
      // For job examples, use switch_distance to determine job types
      let choiceDescription: string;
      if (user_choice === 'A') {
        choiceDescription = 'BLIV I NUVÆRENDE SPOR - Brugeren vil blive i samme branche og bygge videre på eksisterende erfaring. Jobeksemplerne skal være inden for samme felt/branche med lignende arbejdsform.';
      } else if (user_choice === 'B' && switch_distance === 'close') {
        choiceDescription = 'SKIFT KARRIERESPOR (TÆT PÅ) - Brugeren vil skifte til en beslægtet branche eller rolle. Jobeksemplerne skal være i relaterede felter hvor brugerens kompetencer kan overføres.';
      } else if (user_choice === 'B' && switch_distance === 'far') {
        choiceDescription = 'SKIFT KARRIERESPOR (HELT VÆK) - Brugeren vil skifte til en helt ny branche. Jobeksemplerne skal vise roller i andre brancher med væsentligt anderledes arbejdsform, hvor brugerens kernekompetencer stadig er relevante.';
      } else {
        choiceDescription = 'Ukendt valg';
      }
      
      userMessage += `\n\nREQUEST: JOBEKSEMPLER

Brugerens RETNINGSVALG: ${user_choice}${switch_distance ? ` (${switch_distance})` : ''}
${choiceDescription}

Direction state med brugerens præferencer:
${JSON.stringify(inputDirectionState, null, 2)}

Generér 4 jobeksempler der matcher dette retningsvalg. 
VIGTIGT: Jobeksemplerne SKAL afspejle brugerens valgte retning.`;
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
    // isJobSpejlingRequest was defined earlier for message building
    let systemPrompt = STEP_PROMPTS.KARRIERE_COACH;
    if (isJobSpejlingRequest) {
      systemPrompt = STEP_PROMPTS.JOB_SPEJLING;
    } else if (request_job_examples) {
      systemPrompt = STEP_PROMPTS.JOB_EKSEMPLER;
    } else if (shouldTriggerSpejling) {
      systemPrompt = STEP_PROMPTS.SPEJLING;
    }

    // Use higher token limit for spejling since it produces more content
    // Full spejling with all 6 sections + JSON structure needs ~5000-6000 tokens
    // Job spejling also needs higher tokens for 5 detailed sections
    const maxTokens = (shouldTriggerSpejling || isJobSpejlingRequest) ? 6000 : 2000;
    
    // Use lower temperature for job spejling to ensure model follows instructions precisely
    // Higher temperature causes the model to "creatively interpret" job ads incorrectly
    const temperature = isJobSpejlingRequest ? 0.1 : 0.5;
    
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
      temperature: temperature,
      response_format: (shouldTriggerSpejling || isJobSpejlingRequest) ? { type: 'json_object' } : undefined,
    });

    const textContent = response.choices[0]?.message?.content;
    if (!textContent) {
      throw new Error('Ingen tekstrespons fra AI');
    }

    // Debug logging for spejling and job spejling
    if (shouldTriggerSpejling) {
      console.log('Spejling response raw:', textContent.substring(0, 500));
    }
    if (isJobSpejlingRequest) {
      console.log('Job Spejling response raw:', textContent.substring(0, 500));
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
      
      // CRITICAL: Override job_title if we pre-extracted it
      // This ensures the model can't substitute a CV title for the actual job ad title
      if (isJobSpejlingRequest && extractedJobTitle && parsedResponse.mode === 'job_spejling') {
        // Log the full response for debugging
        console.log('Job Spejling - extracted title:', extractedJobTitle);
        console.log('Job Spejling - model job_title:', parsedResponse.job_title);
        console.log('Job Spejling - section1_jobkrav content preview:', parsedResponse.section1_jobkrav?.content?.substring(0, 200));
        
        if (parsedResponse.job_title !== extractedJobTitle) {
          console.log(`Job title mismatch detected! Model returned "${parsedResponse.job_title}" but job ad says "${extractedJobTitle}". Correcting...`);
          parsedResponse.job_title = extractedJobTitle;
        }
        
        // Also check if section1_jobkrav mentions a wrong job title
        // This catches cases where the model uses CV title in the analysis content
        const section1Content = parsedResponse.section1_jobkrav?.content || parsedResponse.section1_overordnet?.content;
        if (section1Content) {
          const content = section1Content.toLowerCase();
          const correctTitle = extractedJobTitle.toLowerCase();
          
          // Log warning if content doesn't mention the correct job title
          if (!content.includes(correctTitle) && !content.includes(correctTitle.split(' ')[0])) {
            console.warn(`WARNING: section1 may not be about the correct job. Expected to mention "${extractedJobTitle}"`);
          }
        }
      }
      
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

// Helper function to extract job title from job ad using focused GPT call
async function extractJobTitleFromAd(jobAdText: string): Promise<string> {
  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Du er en præcis tekst-ekstraktor. Din ENESTE opgave er at finde den EKSAKTE jobtitel fra en jobannonce.

REGLER:
- Returner KUN jobtitlen på ENGELSK hvis annoncen er på engelsk
- Brug den PRÆCISE titel som står i annoncen - ALDRIG oversæt
- Jobtitlen er typisk i starten af annoncen, ofte i første linje eller efter "Role:", "Position:", "Job title:" etc.
- Kig efter mønstre som "Step into the role of [JOBTITEL]" eller "[JOBTITEL] - Company"
- Hvis annoncen siger "Campus Security Manager" - returner "Campus Security Manager"
- Hvis annoncen siger "Security Officer" - returner "Security Officer" 
- ALDRIG returner "Vagt" medmindre det EKSAKT står i teksten
- ALDRIG oversæt titlen til dansk
- Returner max 10 ord`
        },
        {
          role: 'user',
          content: `Find jobtitlen i denne jobannonce. Returner KUN titlen, ingen forklaring:\n\n${jobAdText.substring(0, 3000)}`
        }
      ],
      max_tokens: 50,
      temperature: 0
    });
    
    const title = response.choices[0]?.message?.content?.trim();
    if (title && title.length > 0 && title.length < 100) {
      console.log('Extracted job title:', title);
      return title;
    }
    return '';
  } catch (err) {
    console.error('Error extracting job title:', err);
    return '';
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
