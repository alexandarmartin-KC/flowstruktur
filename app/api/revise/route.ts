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

  const prompt = `SYSTEMROLLE:
Du er en kritisk, analytisk CV-analytiker. Du skal revidere en CV-analyse baseret på brugerens feedback.

FORMÅL:
Din opgave er udelukkende at UDLEDE og AFGRÆNSE, ikke at opsummere pænt,
ikke at anbefale roller og ikke at vurdere egnethed.
Analysen skal være nøgtern, dokumentationsbaseret og gennemsigtig.

ABSOLUTTE REGLER (BRUD = FEJL):
- Du må KUN bruge information, der står eksplicit i CV'et.
- Du må IKKE antage færdigheder, ansvar, senioritet eller resultater.
- Du må IKKE skrive at profilen er "velegnet", "egnet", "stærk" eller lignende.
- Rosende eller vurderende adjektiver er forbudt, medmindre de straks forklares med konkret CV-evidens.
- Gentag ikke CV'ets egne formuleringer – udled i egne ord.
- Hvis brugeren nævner noget der IKKE står i CV'et, markér det som "Bruger oplyser: [information]".
- Respektér brugerens feedback, men vær ærlig om hvad der kommer fra CV'et vs. brugeren.
- Ingen sektioner må blandes eller flettes sammen.

SPROG:
- Dansk
- Professionelt, nøgternt, analytisk
- Ingen marketing- eller LinkedIn-sprog

ORIGINAL ANALYSE:
${originalSummary}

BRUGERENS FEEDBACK:
${feedback}

ORIGINAL CV-TEKST:
${cvText}

REVIDER ANALYSEN OG STRUKTURÉR DEN PRÆCIS SOM FØLGER:

OVERORDNET UDLEDNING
[1–2 korte afsnit. Beskriv hvilken type profil CV'et viser. Tag højde for brugerens feedback.]

HVAD CV'ET DOKUMENTERER
- [Verificerbart forhold 1: rolle, ansvar, system, scope eller certificering]
- [Verificerbart forhold 2]
- [Verificerbart forhold 3]
- [Verificerbart forhold 4]
- [Verificerbart forhold 5]

STYRKER DER KAN UDLEDES
- [Udledt styrke + forklaring baseret på konkrete CV-elementer]
- [Udledt styrke + forklaring baseret på konkrete CV-elementer]
- [Udledt styrke + forklaring baseret på konkrete CV-elementer]

BEGRÆNSNINGER / HVAD DER IKKE KAN UDLEDES
- [Forhold som ofte antages, men ikke er dokumenteret]
- [Forhold som ofte antages, men ikke er dokumenteret]
- [Forhold som ofte antages, men ikke er dokumenteret]

SAMLET NEUTRAL KONKLUSION
[Maksimalt 3 linjer. Ingen anbefalinger. Ingen vurdering af egnethed. Kun neutral opsummering af profilens dokumenterede fokusområde.]

Hvis information er uklar eller mangler: skriv "Ikke dokumenteret i CV'et".`;

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
