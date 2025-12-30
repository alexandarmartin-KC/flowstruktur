import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI();

const CV_SECTIONS_PROMPT = `DU ER CLAUDE.
DU FUNGERER SOM EN STRUKTURERET, FAKTABASERET ASSISTENT
TIL JOB-SPECIFIK CV-TILPASNING.

════════════════════════════════
FORMÅL
════════════════════════════════

Du hjælper en jobansøger med at tilpasse sit CV til et konkret job
ved at strukturere og tydeliggøre eksisterende erfaring.

Dette trin handler udelukkende om:
"Hvad brugeren har" – ikke hvordan det sælges.

════════════════════════════════
ABSOLUTTE REGLER (MÅ IKKE BRYDES)
════════════════════════════════

- Brug KUN information fra ORIGINALT_CV og GODKENDT_CV_ANALYSE
- Opfind ALDRIG erfaring, resultater, teknologier eller ansvar
- Hvis noget ikke er dokumenteret, marker som: "ikke dokumenteret i CV'et"
- Ingen salgsretorik
- Ingen egnethedsvurderinger
- Ingen scores eller procenter
- Alle forslag skal kunne godkendes, redigeres eller afvises

════════════════════════════════
GLOBAL KONTEKST
════════════════════════════════

Navn, kontaktoplysninger og persondata er GLOBALE.
De må IKKE ændres eller gentages i CV-indholdet.

════════════════════════════════
STANDARD CV-SEKTIONER
════════════════════════════════

Behandl disse sektioner i rækkefølge:
1) Profil / Resumé
2) Erfaring
3) Kompetencer
4) Uddannelse
5) Certificeringer / Øvrigt

════════════════════════════════
OUTPUT FORMAT (JSON)
════════════════════════════════

{
  "sections": [
    {
      "id": "profil",
      "name": "Profil",
      "originalText": "Original tekst fra CV",
      "suggestedText": "Foreslået tilpasset tekst baseret KUN på dokumenteret erfaring",
      "matchNote": "Kort, faktuel beskrivelse af hvordan sektionen relaterer til jobkrav",
      "status": "pending"
    }
  ],
  "uncoveredRequirements": [
    "Krav fra jobopslaget som ikke er tydeligt dokumenteret i CV'et"
  ]
}

════════════════════════════════
REGLER FOR OUTPUT
════════════════════════════════

- Returner ALTID valid JSON
- Hver sektion skal have alle felter udfyldt
- suggestedText må KUN indeholde information fra originalText
- matchNote skal være kort og faktuel (ingen vurdering af egnethed)
- uncoveredRequirements skal liste konkrete mangler

════════════════════════════════
VIGTIG PRINCIP
════════════════════════════════

Du er et strukturerende værktøj – ikke en forfatter.
Klarhed og faktuel korrekthed har altid forrang
for formulering og gennemslagskraft.`;

export async function POST(request: NextRequest) {
  try {
    const {
      jobDescription,
      cvAnalysis,
      personalityData,
      combinedAnalysis,
      originalCv,
      mode,
    } = await request.json();

    if (!jobDescription || !cvAnalysis) {
      return NextResponse.json(
        { error: 'Manglende påkrævet data' },
        { status: 400 }
      );
    }

    // If mode is 'sections', return structured section-by-section analysis
    if (mode === 'sections') {
      const userMessage = `Analysér CV'et sektion for sektion i forhold til dette job:

STILLINGSOPSLAG:
${jobDescription}

ORIGINALT CV:
${originalCv || 'Ikke tilgængeligt - brug CV-analysen nedenfor'}

CV-ANALYSE:
${cvAnalysis}

Returnér JSON med sektioner og ikke-dækkede krav.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: CV_SECTIONS_PROMPT,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        max_tokens: 3000,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const textContent = response.choices[0]?.message?.content;
      if (!textContent) {
        throw new Error('Ingen tekstrespons fra AI');
      }

      try {
        const parsed = JSON.parse(textContent);
        return NextResponse.json(parsed);
      } catch {
        // If JSON parsing fails, return as analysis text
        return NextResponse.json({ analysis: textContent });
      }
    }

    // Default: return text analysis (backward compatibility)
    const userMessage = `Analysér hvordan brugerens CV matcher dette job:

A) STILLINGSOPSLAG_TEXT:
${jobDescription}

B) GODKENDT_CV_ANALYSE:
${cvAnalysis}

C) PERSONPROFIL_DATA:
${JSON.stringify(personalityData, null, 2)}

D) SAMLET_ANALYSE_TEXT:
${combinedAnalysis}

Producer nu en fuldstændig CV-match analyse.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: CV_SECTIONS_PROMPT,
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
      analysis: textContent,
    });
  } catch (err) {
    console.error('Error in cv-tailor:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunne ikke analysere CV' },
      { status: 500 }
    );
  }
}
