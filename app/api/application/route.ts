import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI();

const APPLICATION_PROMPT = `DU ER EN PROFESSIONEL ANSØGNINGSSKRIVER.

ABSOLUTTE REGLER:
- Brug KUN information fra det tilpassede CV og CV-analysen
- Opfind IKKE erfaring, resultater, teknologier eller ansvar
- Brug naturligt, professionelt dansk
- Ingen overdreven selvpromovering eller salgsretorik
- Ansøgningen skal være konkret og relevant
- Bevar faktuel korrekthed

OPGAVE:
Skriv en professionel ansøgning baseret på det tilpassede CV og jobopslaget.

FORMAT:
- Skriv ansøgningen som ren tekst (IKKE markdown)
- Start med en stærk åbning der viser motivation
- 2-3 afsnit der kobler dokumenteret erfaring til jobkrav
- Afslut professionelt
- Brug almindelige linjeskift mellem afsnit
- Ingen overskrifter eller punktform
- Længde: 250-400 ord

TONE:
- Professionel men personlig
- Konkret og faktabaseret
- Engageret uden at være overdrevet`;

export async function POST(request: NextRequest) {
  try {
    const { 
      jobDescription,
      tailoredCv,
      cvAnalysis,
      personalityData,
      combinedAnalysis,
    } = await request.json();

    if (!jobDescription) {
      return NextResponse.json(
        { error: 'Manglende påkrævet data' },
        { status: 400 }
      );
    }

    const userMessage = `Skriv en professionel ansøgning til dette job:

STILLINGSOPSLAG:
${jobDescription}

${tailoredCv ? `TILPASSET CV (godkendt af brugeren):
${tailoredCv}` : ''}

CV-ANALYSE:
${cvAnalysis || 'Ikke tilgængelig'}

${personalityData ? `ARBEJDSSTIL OG PRÆFERENCER:
${JSON.stringify(personalityData, null, 2)}` : ''}

Skriv en fuld ansøgning som ren tekst. Brug KUN dokumenteret erfaring fra CV'et.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: APPLICATION_PROMPT,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const textContent = response.choices[0]?.message?.content;
    if (!textContent) {
      throw new Error('Ingen tekstrespons fra AI');
    }

    return NextResponse.json({
      application: textContent,
    });
  } catch (err) {
    console.error('Error in application:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunne ikke generere ansøgning' },
      { status: 500 }
    );
  }
}
