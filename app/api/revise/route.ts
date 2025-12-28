import { NextRequest, NextResponse } from 'next/server';

// Helper til at kalde OpenAI API for revision
async function callOpenAIForRevision(
  originalSummary: string,
  feedback: string,
  cvText: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY er ikke sat i miljøvariabler');
  }

  const prompt = `Du er en ekspert HR-analytiker. Du skal revidere en CV-analyse baseret på brugerens feedback.

ORIGINAL ANALYSE:
${originalSummary}

BRUGERENS FEEDBACK:
${feedback}

ORIGINAL CV-TEKST:
${cvText}

INSTRUKTIONER:
1. Læs brugerens feedback omhyggeligt
2. Revidér analysen baseret på feedbacken
3. Brug STADIG kun information fra CV-teksten
4. Hvis brugeren nævner noget der IKKE står i CV'et, skal du markere det som "Bruger oplyser: [information]" - du må IKKE præsentere det som om det står i CV'et
5. Respektér brugerens ønsker, men vær ærlig om hvad der kommer fra CV'et vs. brugeren
6. Formater dit svar PRÆCIS som vist nedenfor

OUTPUT FORMAT (brug PRÆCIS denne struktur):

TEKST:
[Revideret sammenfatning der tager højde for feedbacken]

BULLETS:
- [Revideret eller ny bullet punkt 1]
- [Revideret eller ny bullet punkt 2]
- [Revideret eller ny bullet punkt 3]
- [Revideret eller ny bullet punkt 4]
- [Revideret eller ny bullet punkt 5]

KILDE-NOTER:
[Opdaterede noter om kilder + eventuel note om bruger-tilføjet information]`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Kan ændres til gpt-4-turbo, gpt-4, eller gpt-3.5-turbo
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: 'Du er en ekspert HR-analytiker der reviderer CV-analyser baseret på brugerfeedback.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API fejl: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Kunne ikke kalde OpenAI API: ${error.message}`);
    }
    throw new Error('Ukendt fejl ved kald til OpenAI API');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalSummary, feedback, cvText } = body;

    // Validér input
    if (!originalSummary || !feedback || !cvText) {
      return NextResponse.json(
        { error: 'Manglende påkrævet data (originalSummary, feedback, cvText)' },
        { status: 400 }
      );
    }

    if (feedback.trim().length < 10) {
      return NextResponse.json(
        { error: 'Feedback skal være mindst 10 tegn' },
        { status: 400 }
      );
    }

    // Kald OpenAI API for revision
    const revised = await callOpenAIForRevision(originalSummary, feedback, cvText);

    return NextResponse.json({
      revised,
    });

  } catch (error) {
    console.error('Fejl i revise endpoint:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Der opstod en fejl ved revision af analysen' 
      },
      { status: 500 }
    );
  }
}
