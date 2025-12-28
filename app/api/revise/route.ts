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

  const prompt = `Du er en kritisk og analytisk CV-analytiker. Du skal revidere en CV-analyse baseret på brugerens feedback.

VIGTIGE REGLER:
- Du må KUN bruge information, der står eksplicit i CV'et.
- Du må IKKE antage færdigheder, ansvar eller senioritet, som ikke er dokumenteret.
- Undgå rosende eller vurderende adjektiver uden konkret evidens.
- Gentag ikke CV'ets formuleringer direkte – udled og fortolk.
- Hvis brugeren nævner noget der IKKE står i CV'et, markér det som "Bruger oplyser: [information]".
- Respektér brugerens feedback, men vær ærlig om hvad der kommer fra CV'et vs. brugeren.

ORIGINAL ANALYSE:
${originalSummary}

BRUGERENS FEEDBACK:
${feedback}

ORIGINAL CV-TEKST:
${cvText}

REVIDER ANALYSEN OG STRUKTURÉR DEN PRÆCIS SOM FØLGER:

OVERORDNET UDLEDNING
[1–2 afsnit, der beskriver hvilken type profil CV'et samlet set viser. Tag højde for brugerens feedback.]

HVAD CV'ET DOKUMENTERER
- [Faktisk, verificerbart forhold 1]
- [Faktisk, verificerbart forhold 2]
- [Faktisk, verificerbart forhold 3]
- [Faktisk, verificerbart forhold 4]
- [Faktisk, verificerbart forhold 5]

STYRKER DER KAN UDLEDES
- [Styrke 1 + forklaring baseret på CV-indhold]
- [Styrke 2 + forklaring baseret på CV-indhold]
- [Styrke 3 + forklaring baseret på CV-indhold]

BEGRÆNSNINGER / HVAD DER IKKE KAN UDLEDES
- [Forhold der ikke er dokumenteret 1]
- [Forhold der ikke er dokumenteret 2]
- [Forhold der ikke er dokumenteret 3]

SAMLET NEUTRAL KONKLUSION
[Kort, afbalanceret afslutning. Beskriv hvilke typer roller/problemer profilen virker bedst egnet til.]

Ingen overskrifter må udelades. Ingen sektioner må flettes sammen.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Bedste model - brug gpt-3.5-turbo for billigere alternativ
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
