import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI();

interface DimensionScores {
  struktur: number;
  beslutning: number;
  forandring: number;
  selvstaendighed: number;
  sociale: number;
  ledelse: number;
  tempo: number;
  konflikt: number;
}

const SYSTEM_PROMPT = `DU ER EN ARBEJDSPSYKOLOGISK ANALYTIKER.

FORMÅL:
Du skal analysere svar fra et spørgeskema om arbejdspræferencer
og udlede en professionel personligheds- og arbejdsprofil,
der kan bruges til job- og rolle-match.

VIGTIGE PRINCIPPER:
- Dette er IKKE en klinisk personlighedstest.
- Resultater er indikatorer, ikke sandheder.
- Du må ikke bruge labels, typer eller diagnoser.
- Du må ikke vurdere menneskelig værdi eller egnethed.
- Fokus er på arbejdsmønstre, præferencer og potentiel friktion.

OUTPUTSTRUKTUR (SKAL FØLGES NØJAGTIGT):

OVERORDNET ARBEJDSPROFIL
[1 kort afsnit, der samler arbejdsstil og præferencer]

ARBEJDSMØNSTRE
[Punktliste over centrale præferencer i hverdagen - brug → som bullet]

POTENTIELLE STYRKER I ARBEJDSKONTEKST
[3–5 punkter baseret på dimensionskombinationer - brug → som bullet]

POTENTIELLE FRIKTIONSPUNKTER
[3–5 punkter, der kan opstå i visse roller eller miljøer - brug → som bullet]

RAMMER HVOR PROFILEN TYPISK TRIVES
[Beskriv organisatoriske forhold (struktur, tempo, samarbejde)]

RAMMER HVOR DER KAN OPSTÅ UDFORDRINGER
[Beskriv miljøer hvor profilen kan opleve belastning]

AFSLUTTENDE NOTE
[En kort tekst der tydeliggør, at profilen er vejledende og skal ses i sammenhæng med erfaring, kompetencer og kontekst]

SPROG:
- Dansk
- Nøgternt, professionelt, menneskeligt
- Ingen CV- eller LinkedIn-sprog
- Brug IKKE dekorative linjer, streger eller unicode-tegn`;

export async function POST(request: NextRequest) {
  try {
    const { scores }: { scores: DimensionScores } = await request.json();

    if (!scores) {
      return NextResponse.json(
        { error: 'Scores er påkrævet' },
        { status: 400 }
      );
    }

    const userMessage = `Analysér følgende dimensionsscorer (skala 1-5, hvor 1 er lav og 5 er høj):

1. Struktur & Rammer: ${scores.struktur}/5
   (Høj score = foretrækker klare rammer og forudsigelighed)
   
2. Beslutningsstil: ${scores.beslutning}/5
   (Høj score = foretrækker analytisk, grundig tilgang)
   
3. Forandring & Stabilitet: ${scores.forandring}/5
   (Høj score = foretrækker stabilitet frem for forandring)
   
4. Selvstændighed & Sparring: ${scores.selvstaendighed}/5
   (Høj score = foretrækker at arbejde selvstændigt)
   
5. Sociale præferencer: ${scores.sociale}/5
   (Høj score = foretrækker meget social interaktion)
   
6. Ledelse & Autoritet: ${scores.ledelse}/5
   (Høj score = komfortabel med at tage ledelse)
   
7. Tempo & Belastning: ${scores.tempo}/5
   (Høj score = trives med højt tempo og pres)
   
8. Konflikt & Feedback: ${scores.konflikt}/5
   (Høj score = komfortabel med direkte feedback og konfrontation)

Giv en arbejdsprofil baseret på disse scorer.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      max_tokens: 2000,
    });

    const textContent = response.choices[0]?.message?.content;
    if (!textContent) {
      throw new Error('Ingen tekstrespons fra AI');
    }

    return NextResponse.json({
      profile: textContent,
      scores: scores,
    });
  } catch (error) {
    console.error('Personality analysis error:', error);
    return NextResponse.json(
      { error: 'Der opstod en fejl ved analyse af personlighedsprofil' },
      { status: 500 }
    );
  }
}
