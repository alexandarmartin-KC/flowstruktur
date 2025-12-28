import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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

  const systemPrompt = `DU ER CLAUDE. DU SKAL LØSE OPGAVEN I TO TVUNGNE TRIN.
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
TRIN 2 — SENIOR KONSULENT & REDAKTØR
════════════════════════════════

ROLLE:
Du er nu senior konsulent og redaktør.

OPGAVE:
Du får en analytisk CV-vurdering fra TRIN 1.
Din opgave er at forfine den til et niveau,
der kan afleveres direkte til en leder eller beslutningstager.

REGLER:
- Du må IKKE tilføje nye fakta.
- Du må IKKE gentage pointer.
- Du skal reducere teksten, ikke udvide den.
- Identificér 1–2 centrale karakteristika ved profilen.
- Alt andet skal underordnes disse eller udelades.
- Skriv med professionel dømmekraft.

OPGAVE:
1. Identificér profilens primære kendetegn.
2. Fjern gentagelser og sekundære observationer.
3. Skær sproget, så hver sætning tilfører ny indsigt.

OUTPUTFORMAT (SKAL FØLGES 1:1):

PROFILKARAKTERISTIK
[1 kort afsnit (maks 5 linjer)]

CENTRALE OBSERVATIONER
- [Punkt 1]
- [Punkt 2]
- [Punkt 3]

AFGRÆNSNINGER
- [Punkt 1]
- [Punkt 2]

SAMLET FAGLIG VURDERING
[2 linjer. Skriv som til en leder.]

HUSK: Outputt kun resultatet af TRIN 2.`;

  try {
    const client = new OpenAI({ apiKey });
    
    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.25,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: 'Du er en senior konsulent der destillerer CV-analyser til essentielle indsigter for ledere.',
        },
        {
          role: 'user',
          content: systemPrompt,
        },
      ],
    });

    return completion.choices[0].message.content || '';
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
