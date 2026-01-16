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
  // NY sektion 3A: Karrierespring (kun hvis relevant)
  section3a_karrierespring?: {
    included: boolean;
    title?: string;
    content?: string;
  };
  // NY sektion 3B: Overgangsstrategi (kun hvis karrierespring er inkluderet)
  section3b_overgangsstrategi?: {
    included: boolean;
    title?: string;
    intro?: string;
    strategies?: Array<{
      title: string;
      description: string;
    }>;
    closing?: string;
  };
  section4_krav?: { title: string; content: string; points?: string[] };
  // NY sektion 4: Hvad dette job vil betyde (Mere af/Mindre af)
  section4_konsekvens?: { 
    title: string; 
    mere_af: string[]; 
    mindre_af: string[];
  };
  // NY sektion 5: Dit beslutningsspejl
  section5_beslutning?: {
    title: string;
    giver_mening_hvis: string | string[];
    skaber_friktion_hvis: string | string[];
  };
  // NY sektion 6: Beslutningsopsummering
  section6_beslutningsopsummering?: {
    excluded?: boolean;
    excluded_reason?: string;
    title?: string;
    subtitle?: string;
    kort_sagt?: string;
    taler_for?: string[];
    taler_imod?: string[];
    trade_off?: {
      summary: string;
      mere_af: string[];
      mindre_af: string[];
    };
    kontrolspoergsmaal?: string;
  };
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
    
    // If user provided a URL, fetch the actual job ad content
    let actualJobAdContent = job_ad_text_or_url || '';
    if (isJobSpejlingRequest && job_ad_text_or_url) {
      const trimmedInput = job_ad_text_or_url.trim();
      // Check if it's a URL
      if (trimmedInput.startsWith('http://') || trimmedInput.startsWith('https://')) {
        console.log('Job ad is a URL, fetching content:', trimmedInput.substring(0, 100));
        try {
          const fetchedContent = await fetchJobAdFromUrl(trimmedInput);
          if (fetchedContent && fetchedContent.length > 200) {
            actualJobAdContent = fetchedContent;
            console.log('Successfully fetched job ad content, length:', fetchedContent.length);
          } else {
            console.warn('Fetched content too short or empty, using original input');
          }
        } catch (err) {
          console.error('Failed to fetch job ad URL:', err);
          // Keep the original URL text as fallback
        }
      }
    }
    
    // Pre-extract job title if this is a job spejling request
    let extractedJobTitle = '';
    if (isJobSpejlingRequest && actualJobAdContent) {
      extractedJobTitle = await extractJobTitleFromAd(actualJobAdContent);
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
      console.log('Job Spejling - job_ad length:', actualJobAdContent?.length || 0);
      console.log('Job Spejling - job_ad first 500 chars:', actualJobAdContent?.substring(0, 500));
      
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
${actualJobAdContent}
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

    if (user_choice === 'C' && actualJobAdContent) {
      userMessage += `\n\njob_ad_text_or_url:\n${actualJobAdContent}`;
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
      
      // CRITICAL: Override job_title AND fix content if we pre-extracted it
      // This ensures the model can't substitute a CV title for the actual job ad title
      if (isJobSpejlingRequest && extractedJobTitle && parsedResponse.mode === 'job_spejling') {
        // Log the full response for debugging
        console.log('Job Spejling - extracted title:', extractedJobTitle);
        console.log('Job Spejling - model job_title:', parsedResponse.job_title);
        
        const modelTitle = parsedResponse.job_title || '';
        
        // Always override job_title with the extracted title
        parsedResponse.job_title = extractedJobTitle;
        
        // If model used a wrong title (e.g. "Project Manager" instead of "Campus Security Manager"),
        // replace ALL occurrences in the entire response
        if (modelTitle && modelTitle.toLowerCase() !== extractedJobTitle.toLowerCase()) {
          console.log(`Job title mismatch! Replacing "${modelTitle}" with "${extractedJobTitle}" in all content`);
          
          // Convert response to string, replace wrong title, parse back
          let responseStr = JSON.stringify(parsedResponse);
          
          // Replace the wrong title with correct title (case-insensitive)
          const wrongTitleRegex = new RegExp(modelTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          responseStr = responseStr.replace(wrongTitleRegex, extractedJobTitle);
          
          // Also replace common generic titles that might be used
          const genericTitles = ['Project Manager', 'Projektleder', 'Manager', 'Leder'];
          for (const genericTitle of genericTitles) {
            if (genericTitle.toLowerCase() !== extractedJobTitle.toLowerCase()) {
              // Only replace if it's in a job context (preceded by "som " or "Jobbet som" or at start)
              const contextRegex = new RegExp(`(Jobbet som |jobbet som |[Ss]om |[Ss]tillingen som |rollen som )${genericTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
              responseStr = responseStr.replace(contextRegex, `$1${extractedJobTitle}`);
            }
          }
          
          try {
            parsedResponse = JSON.parse(responseStr);
            console.log('Successfully replaced wrong job title in response content');
          } catch (e) {
            console.error('Failed to parse corrected response, using original with fixed job_title');
          }
        }
        
        // Log final result
        console.log('Job Spejling - final job_title:', parsedResponse.job_title);
        console.log('Job Spejling - section1 content preview:', 
          (parsedResponse.section1_jobkrav?.content || parsedResponse.section1_overordnet?.content)?.substring(0, 200));
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

// Helper function to extract job title from job ad - uses regex patterns first, then GPT as fallback
async function extractJobTitleFromAd(jobAdText: string): Promise<string> {
  console.log('extractJobTitleFromAd called with text length:', jobAdText?.length);
  console.log('First 500 chars of job ad:', jobAdText?.substring(0, 500));
  
  // FIRST: Try to extract the first non-empty line that looks like a title
  const lines = jobAdText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length > 0) {
    const firstLine = lines[0];
    // If first line is short enough to be a title (max ~80 chars) and doesn't contain typical body text markers
    if (firstLine.length > 3 && firstLine.length < 80 && 
        !firstLine.includes('.') && 
        !firstLine.toLowerCase().startsWith('vi ') &&
        !firstLine.toLowerCase().startsWith('er du') &&
        !firstLine.toLowerCase().startsWith('har du') &&
        !firstLine.toLowerCase().startsWith('om ')) {
      console.log('Extracted job title from first line:', firstLine);
      return firstLine;
    }
  }
  
  // SECOND: Try to extract using common patterns (English and Danish)
  const patterns = [
    // Danish patterns
    /^((?:Erfaren |Senior |Junior )?[A-ZÆØÅa-zæøå\s-]+(?:leder|manager|specialist|konsulent|medarbejder|chef|koordinator|ansvarlig|rådgiver|analytiker|udvikler|ingeniør|controller|assistent|projektleder))(?:\n|$)/im,
    /(?:Stilling|Titel|Position):\s*([A-ZÆØÅa-zæøå\s-]+?)(?:\n|$)/i,
    /(?:Vi søger|Søger)\s+(?:en |an )?([A-ZÆØÅa-zæøå\s-]+?)(?:\s+til|\s+for|\s+som|\s*\n)/i,
    // English patterns
    /Step into the role of ([A-Za-z\s-]+?)(?:\s+for|\s+at|\s*\n)/i,
    /(?:Position|Role|Job Title):\s*([A-Za-z\s-]+?)(?:\n|$)/i,
    /(?:We are looking for|Looking for)\s+(?:a |an )?([A-Za-z\s-]+?)(?:\s+to|\s+for|\s*\n)/i,
    /^([A-Z][A-Za-z\s-]+(?:Manager|Specialist|Officer|Director|Lead|Coordinator|Consultant|Engineer|Developer|Analyst|Administrator))/m,
  ];
  
  for (const pattern of patterns) {
    const match = jobAdText.match(pattern);
    if (match && match[1]) {
      const title = match[1].trim();
      if (title.length > 3 && title.length < 80) {
        console.log('Extracted job title via regex pattern:', title);
        return title;
      }
    }
  }
  
  // FALLBACK: Use GPT to extract title
  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Du er en præcis tekst-ekstraktor. Din ENESTE opgave er at finde den EKSAKTE jobtitel fra en jobannonce.

REGLER:
- Returner KUN jobtitlen - PRÆCIS som den står i teksten
- Jobtitlen er typisk i starten af annoncen
- Kig efter "Step into the role of [TITEL]", "Position: [TITEL]", "[TITEL] wanted" etc.
- ALDRIG opfind en titel - kun brug hvad der står i teksten
- ALDRIG returner generiske titler som "Project Manager" medmindre det PRÆCIST står i annoncen
- Returner max 8 ord`
        },
        {
          role: 'user',
          content: `Find den EKSAKTE jobtitel i denne jobannonce. Returner KUN titlen:\n\n${jobAdText.substring(0, 2000)}`
        }
      ],
      max_tokens: 30,
      temperature: 0
    });
    
    const title = response.choices[0]?.message?.content?.trim();
    console.log('GPT extracted job title:', title);
    
    if (title && title.length > 3 && title.length < 80) {
      return title;
    }
    return '';
  } catch (err) {
    console.error('Error extracting job title:', err);
    return '';
  }
}

// Helper function to fetch job ad content from URL
async function fetchJobAdFromUrl(url: string): Promise<string> {
  try {
    console.log('Fetching job ad from URL:', url);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'da,en;q=0.9',
      },
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log('Fetched HTML length:', html.length);
    
    // Extract text content from HTML (simple approach)
    // Remove script and style tags first
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
    
    // Replace common block elements with newlines
    text = text
      .replace(/<\/?(div|p|br|h[1-6]|li|tr)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')  // Remove remaining tags
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, ' ')  // Collapse whitespace
      .replace(/\n\s*\n/g, '\n')  // Collapse multiple newlines
      .trim();
    
    console.log('Extracted text length:', text.length);
    console.log('First 500 chars of extracted text:', text.substring(0, 500));
    
    return text;
  } catch (err) {
    console.error('Error fetching job ad URL:', err);
    throw err;
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
