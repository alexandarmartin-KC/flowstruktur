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

interface Lag2Request {
  // Data from Lag 1 (transferoversigt)
  transfer_summary: {
    summary_paragraph: string;
    patterns: string[];
  };
  // Original CV abstract
  step1_cv_abstract: string;
  // Workstyle scores
  step2_workstyle: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body: Lag2Request = await request.json();
    
    const { transfer_summary, step1_cv_abstract, step2_workstyle } = body;

    if (!transfer_summary || !step1_cv_abstract) {
      return NextResponse.json(
        { error: 'Missing required fields: transfer_summary and step1_cv_abstract' },
        { status: 400 }
      );
    }

    const client = getOpenAI();

    // Build context for the LLM
    const userContext = `
BRUGERENS KONTEKST:

=== TRANSFEROVERSIGT (LAG 1) ===
Observerede arbejdsmønstre:
${transfer_summary.summary_paragraph}

Arbejdsformer der ser ud til at være overførbare:
${transfer_summary.patterns?.[0] || 'Ikke angivet'}

=== CV ABSTRAKT ===
${step1_cv_abstract}

=== ARBEJDSPROFIL (opsummering) ===
${JSON.stringify(step2_workstyle, null, 2)}
`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: STEP_PROMPTS.NY_RETNING_LAG2,
        },
        {
          role: 'user',
          content: userContext,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    try {
      // Clean up potential markdown formatting
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();

      const parsed = JSON.parse(cleanContent);
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', content);
      return NextResponse.json(
        { 
          error: 'Failed to parse AI response',
          raw_content: content 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in job-directions-clarification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
