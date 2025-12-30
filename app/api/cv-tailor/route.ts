import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI();

const CV_SECTIONS_PROMPT = `DU ER EN PROFESSIONEL CV-RÅDGIVER.

ABSOLUTTE REGLER:
- Brug KUN information fra det originale CV
- Opfind IKKE erfaring, resultater, teknologier eller ansvar
- Hvis noget ikke er dokumenteret, marker det som "ikke dokumenteret"
- Brug nøgternt, professionelt sprog
- Ingen salgsretorik
- Bevar faktuel korrekthed

OPGAVE:
Analysér CV'et sektion for sektion i forhold til jobopslaget.
For hver sektion skal du:
1. Foreslå en målrettet version baseret på jobopslaget
2. Bevare faktuel korrekthed
3. Forklare hvad der er prioriteret eller fremhævet

OUTPUT FORMAT (JSON):
{
  "sections": [
    {
      "id": "unique-id",
      "name": "Sektionsnavn",
      "originalText": "Original tekst fra CV",
      "suggestedText": "Foreslået tilpasset tekst",
      "matchNote": "Kort faktuel vurdering af match til jobbet",
      "status": "pending"
    }
  ],
  "uncoveredRequirements": [
    "Krav fra jobopslaget som ikke er dækket i CV'et"
  ]
}

VIGTIGT:
- Returner ALTID valid JSON
- Hver sektion skal have alle felter udfyldt
- suggestedText må KUN indeholde information fra originalText
- matchNote skal være kort og faktuel`;

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
