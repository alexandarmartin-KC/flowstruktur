import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI();

const REWRITE_INSTRUCTIONS = {
  shorter: `Gør ansøgningen KORTERE uden at miste de vigtigste pointer. 
- Behold alle faktuelle informationer
- Fjern fyldord og gentagelser
- Stram formuleringerne
- Mål: Reducer længden med 20-30%`,

  more_concrete: `Gør ansøgningen MERE KONKRET:
- Tilføj konkrete eksempler hvor der står "erfaring med..."
- Omskriv vage udsagn til præcise beskrivelser
- Brug tal, systemer, metoder hvor relevant
- Undgå abstrakte vendinger`,

  more_professional: `Gør ansøgningen MERE PROFESSIONEL:
- Brug formel, men moderne dansk
- Undgå kollokvialismer
- Behold varme, men hæv niveauet
- Brug branche-relevant sprog`,

  more_targeted: `Gør ansøgningen MERE MÅLRETTET mod jobbet:
- Fremhæv den erfaring der er mest relevant for jobbet
- Brug jobbets terminologi
- Skab tydeligere kobling mellem erfaring og jobkrav
- Reducer irrelevant information`,
};

const REWRITE_PROMPT = `DU ER EN ERFAREN ANSØGNINGSRÅDGIVER.

OPGAVE:
Omskriv den eksisterende ansøgning i henhold til brugerens ønske.

ABSOLUTTE REGLER:
- Behold ALT faktuelt indhold - opfind IKKE ny erfaring
- Ansøgningen skal stadig være på dansk
- Bevar den samme grundstruktur (åbning, hoveddele, afslutning)
- Returner den komplette omskrevne ansøgning som ren tekst
- Ingen markdown, ingen overskrifter
- Brug almindelige linjeskift mellem afsnit

TONE:
- Professionel og naturlig
- Ikke overdrevet salgsorienteret
- Konkret og troværdig`;

export async function POST(request: NextRequest) {
  try {
    const { 
      currentApplication,
      instruction,
      jobDescription,
    } = await request.json();

    if (!currentApplication || !instruction) {
      return NextResponse.json(
        { error: 'Manglende påkrævet data' },
        { status: 400 }
      );
    }

    const instructionText = REWRITE_INSTRUCTIONS[instruction as keyof typeof REWRITE_INSTRUCTIONS];
    if (!instructionText) {
      return NextResponse.json(
        { error: 'Ukendt omskrivnings-instruktion' },
        { status: 400 }
      );
    }

    const userMessage = `Omskriv denne ansøgning:

NUVÆRENDE ANSØGNING:
${currentApplication}

${jobDescription ? `JOBOPSLAG (til reference):
${jobDescription}` : ''}

INSTRUKTION:
${instructionText}

Returner den komplette omskrevne ansøgning som ren tekst.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: REWRITE_PROMPT,
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
    console.error('Error in application rewrite:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunne ikke omskrive ansøgning' },
      { status: 500 }
    );
  }
}
