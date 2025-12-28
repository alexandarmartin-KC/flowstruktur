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

  const prompt = `DU ER CLAUDE. DU SKAL LØSE OPGAVEN I TO TVUNGNE TRIN.
DU MÅ IKKE SPRINGE TRIN OVER.
DET ENDELIGE SVAR SKAL VÆRE RESULTATET AF TRIN 2.

════════════════════════════════
TRIN 1 — RÅ, FAKTABASERET ANALYSE
════════════════════════════════

ROLLE:
Du er en streng, faktabaseret CV-analytiker.

OPGAVE:
Revidér analysen baseret på brugerens feedback, men udtræk stadig kun det, 
der med sikkerhed kan dokumenteres i CV-teksten.

REGLER:
- Brug KUN information, der står eksplicit i CV'et.
- Tag højde for brugerens feedback.
- Hvis brugeren nævner noget der IKKE står i CV'et, markér det som "Bruger oplyser: [information]".
- Ingen vurderinger, ingen ros, ingen anbefalinger.
- Ingen antagelser om senioritet, strategi, ledelse eller resultater.
- Undgå alle adjektiver som "stærk", "betydelig", "dygtig", "solid".

ORIGINAL ANALYSE:
${originalSummary}

BRUGERENS FEEDBACK:
${feedback}

ORIGINAL CV-TEKST:
${cvText}

════════════════════════════════
TRIN 2 — KRITISK OMSKRIVNING (DETTE ER DET ENDELIGE OUTPUT)
════════════════════════════════

ROLLE:
Du er nu en erfaren konsulent og analytisk redaktør.

OPGAVE:
Omskriv den reviderede analyse til en skarp, professionel analyse
på niveau med intern konsulent- eller lederrapportering.

VIGTIGE PRINCIPPER:
- Brug KUN information fra TRIN 1.
- Tilføj ingen nye fakta.
- Formulér tydelige udledninger, prioriteringer og afgrænsninger.
- Brug aktiv kontrast (fx "ikke X, men Y").
- Placér profilen tydeligt (operativ vs. strategisk, specialist vs. generalist).
- Skriv nøgternt, præcist og menneskeligt.
- Undgå CV-sprog og LinkedIn-sprog fuldstændigt.
- Ingen anbefalinger og ingen "egnethedsvurderinger".

DET ENDELIGE OUTPUT SKAL HAVE FØLGENDE STRUKTUR (SKAL FØLGES 1:1):

OVERORDNET UDLEDNING
[1–2 afsnit. Placér profilen klart gennem kontrast og afgrænsning. Beskriv hvad profilen tydeligt er – og dermed også hvad den ikke er.]

HVAD PROFILEN TYDELIGT VISER
- [Punkt 1: forklaring af både *hvad* og *hvorfor*]
- [Punkt 2: forklaring af både *hvad* og *hvorfor*]
- [Punkt 3: forklaring af både *hvad* og *hvorfor*]

HVAD PROFILEN TYDELIGT IKKE VISER
- [Brug formuleringer som: "Der er ikke dokumentation for...", "CV'et indikerer ikke...", "Kan ikke udledes..."]
- [Punkt 2]
- [Punkt 3]

SAMLET NEUTRAL KONKLUSION
[2–3 linjer. Skriv som til en beslutningstager. Ingen ros. Ingen anbefalinger.]

HUSK: Outputt kun resultatet af TRIN 2.`;

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
