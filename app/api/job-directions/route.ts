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

// Types for the new "NY RETNING" flow
interface Step4BAnswers {
  Q1?: string;
  Q2?: string[];
  Q2_free_text?: string;
  Q3?: string[];
  Q4?: string;
}

interface NewDirectionRequest {
  step1_cv_abstract: string;
  step2_workstyle: DimensionScores | { dimension_scores: Record<string, { score: string; level: string }> };
  step4b_answers?: Step4BAnswers | null;
}

// System prompt for NY RETNING flow
const NY_RETNING_SYSTEM_PROMPT = `Du er en JSON API. Du SKAL returnere KUN valid JSON.
Inkludér IKKE markdown, code fences, kommentarer eller ekstra tekst.
Hvis du ikke kan udføre opgaven, returnér kun {"error": "..."}.

Du er i sporet "NY RETNING".

PRODUKTDEFINITION
Ny retning er primært en TRANSFERANALYSE.
Den indeholder en kort spejling, men KUN som syntese af brugerens egne valg – ikke som fortolkning af personlighed eller motivation.

Dette er IKKE en personlighedstest.
Det er et overblik over, hvad brugerens erfaring kan bruges til i nye sammenhænge.

FORMÅL
Hjælp brugeren med at se:
1. Hvilke arbejdsmønstre der ser ud til at være bærende
2. Hvad der overfører til nye kontekster
3. Hvad der typisk kræver opbygning/afklaring

Derefter: jobeksempler + reaktion + kort spejling baseret på brugerens svar.

HÅRDE REGLER
R1) Ingen virksomheder, lokationer eller konkrete jobopslag.
R2) Ingen jobtitler som anbefalinger; kun generiske rollefamilier og syntetiske jobeksempler.
R3) Ingen "match/passer til/score/anbefales".
R4) Ingen vurdering af egnethed eller kompetenceniveau.
R5) INGEN psykologisering:
    - Ingen "dybere trang", "drivkræfter", "blinde vinkler", "motivation"
    - Ingen "du trives med", "du motiveres af", "du søger"
    - Ingen "udbrændthed", "dominans", "sårbarhed"
    - Ingen årsagsforklaringer af personlighed
R6) Ingen præferencedimension-navne/labels (fx "Ledelse & Autoritet"). Du må gerne omskrive til hverdagssprog.
R7) Output skal være STRIKT JSON og følge skemaet nedenfor.
R8) Du må kun udlede mønstre fra: step1_cv_abstract, step2_workstyle og step4b_answers (hvis tilgængelig). Ingen gæt.
R9) Spejling er SYNTESE af brugerens valg, ikke fortolkning af hvem de er.

ADFÆRD
- Hvis step4b_answers er null eller mangler vigtige felter, skal du returnere KUN spørgsmålene (flow_state="NEEDS_ANSWERS") og ikke generere retninger/eksempler endnu.
- Hvis step4b_answers er udfyldt, skal du returnere retninger + 3 jobeksempler + refleksionsspørgsmål pr. eksempel + (tom) spejlingssektion klar til senere (flow_state="READY_FOR_EXAMPLES").
- Spejling (Step 5B) laves først EFTER brugeren har svaret på de 3 jobeksempler. Derfor skal du i denne respons returnere en placeholder for spejling og et felt som beskriver hvilken data der kræves for at generere spejlingen senere.

JSON-SKEMA (SKAL OVERHOLDES)
{
  "flow_state": "NEEDS_ANSWERS" | "READY_FOR_EXAMPLES",
  "version": "4B_JSON_v1",
  "inputs_echo": {
    "has_step1": boolean,
    "has_step2": boolean,
    "has_step4b_answers": boolean
  },
  "step4b_questions": [
    {
      "id": "Q1",
      "text": string,
      "type": "single_select",
      "options": [{"id": string, "label": string}]
    },
    {
      "id": "Q2",
      "text": string,
      "type": "multi_select",
      "max_select": number,
      "options": [{"id": string, "label": string}],
      "free_text_option": {"enabled": boolean, "prompt": string}
    },
    {
      "id": "Q3",
      "text": string,
      "type": "multi_select",
      "max_select": number,
      "options": [{"id": string, "label": string}]
    },
    {
      "id": "Q4",
      "text": string,
      "type": "single_select",
      "options": [{"id": string, "label": string}]
    }
  ],
  "transfer_directions": [
    {
      "id": "D1",
      "title": string,
      "description": string,
      "what_transfers": string,
      "what_to_build": string
    }
  ],
  "job_examples": [
    {
      "id": "E1",
      "title": string,
      "day_to_day": string,
      "typical_responsibility": string,
      "reflection": {
        "q1": {
          "text": string,
          "type": "single_select",
          "options": [{"id": "YES", "label": "Det giver mening for mig"}, {"id": "PARTLY", "label": "Det er delvist rigtigt"}, {"id": "NO", "label": "Det er ikke noget for mig"}]
        },
        "q2": {
          "text": string,
          "type": "multi_select_conditional",
          "show_if_q1_in": ["PARTLY","NO"],
          "max_select": 2,
          "options": [
            {"id": "TASKS", "label": "Opgaverne"},
            {"id": "RESP", "label": "Ansvarsniveauet"},
            {"id": "WORKFORM", "label": "Arbejdsformen i hverdagen (fx tempo/rammer/fleksibilitet)"},
            {"id": "COLLAB", "label": "Samarbejdsformen"},
            {"id": "OTHER", "label": "Noget andet"}
          ]
        },
        "q3": {
          "text": string,
          "type": "multi_select",
          "max_select": 2,
          "options": [
            {"id": "RESP_MORE", "label": "Mere ansvar"},
            {"id": "RESP_LESS", "label": "Mindre ansvar"},
            {"id": "INDEP_MORE", "label": "Mere selvstændighed"},
            {"id": "COLLAB_MORE", "label": "Mere samarbejde"},
            {"id": "STRAT_MORE", "label": "Mere strategisk"},
            {"id": "OPER_MORE", "label": "Mere operationelt"},
            {"id": "FLEX_MORE", "label": "Mere fleksibilitet"},
            {"id": "STRUCT_MORE", "label": "Mere faste rammer"}
          ]
        }
      }
    }
  ],
  "reflection_placeholder": {
    "status": "WAITING_FOR_EXAMPLE_ANSWERS",
    "needs": {
      "example_answers_schema": {
        "E1": {"q1": "YES|PARTLY|NO", "q2": ["..."], "q3": ["..."]},
        "E2": {"q1": "YES|PARTLY|NO", "q2": ["..."], "q3": ["..."]},
        "E3": {"q1": "YES|PARTLY|NO", "q2": ["..."], "q3": ["..."]}
      }
    }
  }
}

KRAV TIL INDHOLD
- step4b_questions: Brug præcis disse 4 spørgsmål (kan omskrives sprogligt, men samme mening):
  Q1: hvad er vigtigst ved "ny retning" (3 valgmuligheder)
  Q2: hvilke arbejdsmønstre vil du tage med (vælg op til 3 + optional fri tekst)
  Q3: hvilke rammer betyder mest (vælg op til 2)
  Q4: hvor meget ændring kan du acceptere på kort sigt (3 valgmuligheder)

- transfer_directions: Returnér 2–4 retninger når flow_state="READY_FOR_EXAMPLES".
  De skal være "rollefamilier/arbejdsmønstre" (ikke brancher).
- job_examples: Returnér præcis 3 jobeksempler når flow_state="READY_FOR_EXAMPLES".
  De skal afspejle transfer_directions og brugerens step4b_answers.

Returnér kun JSON.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is the new NY RETNING flow
    if ('step1_cv_abstract' in body || 'step2_workstyle' in body) {
      return handleNewDirectionFlow(body as NewDirectionRequest);
    }
    
    // Legacy flow for backwards compatibility
    const { cvAnalysis, dimensionScores, feedback }: { 
      cvAnalysis: string; 
      dimensionScores: DimensionScores;
      feedback?: string;
    } = body;

    if (!cvAnalysis || !dimensionScores) {
      return NextResponse.json(
        { error: 'CV-analyse og dimensionsscorer er påkrævet' },
        { status: 400 }
      );
    }

    // Build dimension scores text with levels
    const getLevel = (score: number): string => {
      if (score >= 3.7) return "Høj";
      if (score >= 2.5) return "Moderat";
      return "Lav";
    };

    let dimensionsText = "PERSONPROFIL_DATA (1-5 skala):\n";
    for (const [dimension, score] of Object.entries(dimensionScores)) {
      const level = getLevel(score);
      dimensionsText += `- ${dimension}: ${score.toFixed(1)} (${level})\n`;
    }

    let userMessage = `Foreslå relevante jobretninger baseret på profilen:

CV_ANALYSE:
${cvAnalysis}

${dimensionsText}

Generér 5-7 mulige jobretninger der følger outputstrukturen præcist.`;

    if (feedback) {
      userMessage += `\n\nBRUGERFEEDBACK:\n${feedback}`;
    }

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: STEP_PROMPTS.MULIGHEDER_OVERSIGT,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: 3000,
      temperature: 0.7,
    });

    const textContent = response.choices[0]?.message?.content;
    if (!textContent) {
      throw new Error('Ingen tekstrespons fra AI');
    }

    return NextResponse.json({
      directions: textContent,
    });
  } catch (err) {
    console.error('Error in job-directions:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunne ikke generere jobretninger' },
      { status: 500 }
    );
  }
}

// Handler for the new NY RETNING flow
async function handleNewDirectionFlow(body: NewDirectionRequest): Promise<NextResponse> {
  const { step1_cv_abstract, step2_workstyle, step4b_answers } = body;
  
  // Validate inputs
  const hasStep1 = Boolean(step1_cv_abstract && step1_cv_abstract.trim().length > 0);
  const hasStep2 = Boolean(step2_workstyle && Object.keys(step2_workstyle).length > 0);
  const hasStep4bAnswers = Boolean(
    step4b_answers && 
    step4b_answers.Q1 && 
    step4b_answers.Q2 && 
    step4b_answers.Q2.length > 0 &&
    step4b_answers.Q3 &&
    step4b_answers.Q3.length > 0 &&
    step4b_answers.Q4
  );
  
  // If no input data at all, return error
  if (!hasStep1 && !hasStep2) {
    return NextResponse.json(
      { error: 'Manglende inputdata: step1_cv_abstract eller step2_workstyle er påkrævet' },
      { status: 400 }
    );
  }
  
  // If answers are missing or incomplete, return the questions
  if (!hasStep4bAnswers) {
    return NextResponse.json(generateQuestionsResponse(hasStep1, hasStep2));
  }
  
  // Format workstyle for the prompt
  let workstyleText = '';
  if ('dimension_scores' in step2_workstyle) {
    // New format with dimension_scores object
    workstyleText = Object.entries(step2_workstyle.dimension_scores)
      .map(([dim, data]) => `- ${dim}: niveau ${data.level}`)
      .join('\n');
  } else {
    // Simple numeric scores
    const getLevel = (score: number): string => {
      if (score >= 3.7) return "høj";
      if (score >= 2.5) return "moderat";
      return "lav";
    };
    workstyleText = Object.entries(step2_workstyle)
      .map(([dim, score]) => `- ${dim}: niveau ${getLevel(score)}`)
      .join('\n');
  }
  
  // Format answers for the prompt
  const answersText = `
Q1 (Vigtigst ved ny retning): ${step4b_answers!.Q1}
Q2 (Arbejdsmønstre at tage med): ${step4b_answers!.Q2!.join(', ')}${step4b_answers!.Q2_free_text ? ` + "${step4b_answers!.Q2_free_text}"` : ''}
Q3 (Vigtigste rammer): ${step4b_answers!.Q3!.join(', ')}
Q4 (Acceptabel ændring): ${step4b_answers!.Q4}`;

  const userMessage = `INPUT:

step1_cv_abstract:
${step1_cv_abstract || '(ikke tilgængelig)'}

step2_workstyle (omskrevet til hverdagssprog, IKKE vis labels):
${workstyleText || '(ikke tilgængelig)'}

step4b_answers:
${answersText}

Generér nu transfer_directions (2-4 retninger) og job_examples (præcis 3) baseret på ovenstående input.
Husk: Ingen virksomheder, ingen konkrete jobtitler som anbefalinger, ingen match-sprog.
Returner KUN valid JSON i det specificerede format.`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: NY_RETNING_SYSTEM_PROMPT,
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
      throw new Error('Ingen tekstrespons fra AI');
    }

    // Parse and validate the JSON response
    let parsedResponse;
    try {
      // Remove any potential markdown code blocks
      const cleanedContent = textContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsedResponse = JSON.parse(cleanedContent);
    } catch {
      console.error('Failed to parse AI response as JSON:', textContent);
      return NextResponse.json(
        { error: 'AI returnerede ikke valid JSON' },
        { status: 500 }
      );
    }

    // Ensure the response has the required structure
    const validatedResponse = {
      flow_state: 'READY_FOR_EXAMPLES' as const,
      version: '4B_JSON_v1',
      inputs_echo: {
        has_step1: hasStep1,
        has_step2: hasStep2,
        has_step4b_answers: true,
      },
      step4b_questions: [], // Empty since answers are provided
      transfer_directions: parsedResponse.transfer_directions || [],
      job_examples: parsedResponse.job_examples || [],
      reflection_placeholder: {
        status: 'WAITING_FOR_EXAMPLE_ANSWERS' as const,
        needs: {
          example_answers_schema: {
            E1: { q1: 'YES|PARTLY|NO', q2: ['...'], q3: ['...'] },
            E2: { q1: 'YES|PARTLY|NO', q2: ['...'], q3: ['...'] },
            E3: { q1: 'YES|PARTLY|NO', q2: ['...'], q3: ['...'] },
          },
        },
      },
    };

    return NextResponse.json(validatedResponse);
  } catch (err) {
    console.error('Error in new direction flow:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunne ikke generere ny retning analyse' },
      { status: 500 }
    );
  }
}

// Generate the initial questions response when step4b_answers is missing
function generateQuestionsResponse(hasStep1: boolean, hasStep2: boolean) {
  return {
    flow_state: 'NEEDS_ANSWERS',
    version: '4B_JSON_v1',
    inputs_echo: {
      has_step1: hasStep1,
      has_step2: hasStep2,
      has_step4b_answers: false,
    },
    step4b_questions: [
      {
        id: 'Q1',
        text: 'Hvad er vigtigst for dig, når du overvejer en ny retning?',
        type: 'single_select',
        options: [
          { id: 'STABILITY', label: 'At bevare en vis stabilitet og tryghed i overgangen' },
          { id: 'GROWTH', label: 'At finde nye udfordringer og muligheder for at lære' },
          { id: 'MEANING', label: 'At arbejdet giver mere mening eller passer bedre til mig' },
        ],
      },
      {
        id: 'Q2',
        text: 'Hvilke arbejdsmønstre fra din nuværende erfaring vil du gerne tage med videre?',
        type: 'multi_select',
        max_select: 3,
        options: [
          { id: 'COORD', label: 'At koordinere og holde overblik over mange dele' },
          { id: 'SOLVE', label: 'At løse problemer og finde løsninger' },
          { id: 'PEOPLE', label: 'At arbejde tæt sammen med andre mennesker' },
          { id: 'STRUCTURE', label: 'At skabe struktur og systematik' },
          { id: 'CREATE', label: 'At skabe nyt eller udvikle idéer' },
          { id: 'ANALYZE', label: 'At analysere og forstå komplekse sammenhænge' },
          { id: 'LEAD', label: 'At tage ansvar og lede andre' },
          { id: 'SUPPORT', label: 'At støtte og hjælpe andre med deres opgaver' },
        ],
        free_text_option: {
          enabled: true,
          prompt: 'Eller beskriv kort med dine egne ord:',
        },
      },
      {
        id: 'Q3',
        text: 'Hvilke rammer betyder mest for dig i et nyt job?',
        type: 'multi_select',
        max_select: 2,
        options: [
          { id: 'FLEX', label: 'Fleksibilitet i hverdagen (tid, sted, opgaver)' },
          { id: 'CLEAR', label: 'Klare forventninger og tydelig struktur' },
          { id: 'AUTONOMY', label: 'Mulighed for at arbejde selvstændigt' },
          { id: 'TEAM', label: 'Tæt samarbejde med et fast team' },
          { id: 'PACE', label: 'Et roligt og forudsigeligt tempo' },
          { id: 'DYNAMIC', label: 'Variation og dynamik i hverdagen' },
        ],
      },
      {
        id: 'Q4',
        text: 'Hvor stor en ændring er du klar til på kort sigt?',
        type: 'single_select',
        options: [
          { id: 'SMALL', label: 'Små justeringer – jeg vil helst bygge videre på det, jeg kender' },
          { id: 'MODERATE', label: 'Moderat ændring – jeg er åben for noget nyt, men med sikkerhedsnet' },
          { id: 'LARGE', label: 'Større ændring – jeg er klar til at prøve noget helt andet' },
        ],
      },
    ],
    transfer_directions: [],
    job_examples: [],
    reflection_placeholder: {
      status: 'WAITING_FOR_EXAMPLE_ANSWERS',
      needs: {
        example_answers_schema: {
          E1: { q1: 'YES|PARTLY|NO', q2: ['...'], q3: ['...'] },
          E2: { q1: 'YES|PARTLY|NO', q2: ['...'], q3: ['...'] },
          E3: { q1: 'YES|PARTLY|NO', q2: ['...'], q3: ['...'] },
        },
      },
    },
  };
}
