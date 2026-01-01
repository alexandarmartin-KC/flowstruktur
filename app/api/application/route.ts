import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI();

const APPLICATION_ANALYSIS_PROMPT = `DU ER EN ANALYTIKER DER MATCHER CV MOD JOBKRAV.

OPGAVE:
Før du skriver ansøgningen, skal du lave en systematisk analyse.

TRIN 1 - MATCH-PUNKTER (minimum 3):
For hvert hovedkrav i jobbet, find DOKUMENTERET bevis fra CV'et:
- Krav: [hvad jobbet kræver]
- Bevis: [konkret erfaring fra CV der matcher]

TRIN 2 - GAPS/RISICI (minimum 1):
Identificér krav hvor CV'et har begrænset match:
- Krav: [hvad der mangler eller er svagt]
- Note: [hvordan det kan adresseres i ansøgningen]

TRIN 3 - ANBEFALET VINKEL:
Beskriv den bedste måde at frame ansøgerens styrker på.

RETURNER JSON:
{
  "matchPoints": [
    {"requirement": "...", "evidence": "..."}
  ],
  "gaps": [
    {"requirement": "...", "note": "..."}
  ],
  "recommendedFraming": "..."
}`;

const APPLICATION_WRITING_PROMPT = `DU ER EN PROFESSIONEL ANSØGNINGSSKRIVER.

ABSOLUTTE REGLER:
- Brug KUN information fra det tilpassede CV og analysen
- Opfind IKKE erfaring, resultater, teknologier eller ansvar
- Brug naturligt, professionelt dansk
- Ingen overdreven selvpromovering eller salgsretorik
- Ansøgningen skal være konkret og relevant
- Bevar faktuel korrekthed

OPGAVE:
Skriv en professionel ansøgning baseret på analysen og CV'et.

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
      resolvedCv,
      userProfile,
      dimensionScores,
    } = await request.json();

    if (!jobDescription || !resolvedCv) {
      return NextResponse.json(
        { error: 'Manglende påkrævet data' },
        { status: 400 }
      );
    }

    // Step 1: Analyze CV vs Job to find matches and gaps
    const analysisMessage = `Analysér dette CV mod jobopslaget:

STILLINGSOPSLAG:
${jobDescription}

CV-INDHOLD:
${resolvedCv}

${userProfile ? `KANDIDAT-PROFIL:
${JSON.stringify(userProfile, null, 2)}` : ''}

${dimensionScores && Object.keys(dimensionScores).length > 0 ? `ARBEJDSSTIL:
${JSON.stringify(dimensionScores, null, 2)}` : ''}

Returner en JSON-analyse med matchPoints (min 3), gaps (min 1) og recommendedFraming.`;

    const analysisResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: APPLICATION_ANALYSIS_PROMPT,
        },
        {
          role: 'user',
          content: analysisMessage,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
      temperature: 0.3,
    });

    const analysisContent = analysisResponse.choices[0]?.message?.content;
    if (!analysisContent) {
      throw new Error('Ingen analyse-respons fra AI');
    }

    const analysis = JSON.parse(analysisContent);

    // Step 2: Write application based on analysis
    const writingMessage = `Skriv en professionel ansøgning baseret på denne analyse:

STILLINGSOPSLAG:
${jobDescription}

CV-INDHOLD:
${resolvedCv}

ANALYSE:
${JSON.stringify(analysis, null, 2)}

Skriv en fuld ansøgning som ren tekst. Brug KUN dokumenteret erfaring fra CV'et og analysen.`;

    const writingResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: APPLICATION_WRITING_PROMPT,
        },
        {
          role: 'user',
          content: writingMessage,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const textContent = writingResponse.choices[0]?.message?.content;
    if (!textContent) {
      throw new Error('Ingen tekstrespons fra AI');
    }

    return NextResponse.json({
      application: textContent,
      analysis: {
        matchPoints: analysis.matchPoints || [],
        gaps: analysis.gaps || [],
        recommendedFraming: analysis.recommendedFraming || '',
      },
    });
  } catch (err) {
    console.error('Error in application:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunne ikke generere ansøgning' },
      { status: 500 }
    );
  }
}
