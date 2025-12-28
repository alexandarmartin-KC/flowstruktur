import { NextRequest, NextResponse } from 'next/server';

// Helper til at kalde Claude API for revision
async function callClaudeAPIForRevision(
  originalSummary: string,
  feedback: string,
  cvText: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY er ikke sat i miljøvariabler');
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
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022', // Kan ændres efter din Anthropic-konto
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Claude API fejl: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Kunne ikke kalde Claude API: ${error.message}`);
    }
    throw new Error('Ukendt fejl ved kald til Claude API');
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

    // Kald Claude API for revision
    const revised = await callClaudeAPIForRevision(originalSummary, feedback, cvText);

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
