import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Force Node.js runtime for file operations
export const runtime = 'nodejs';

// Helper til at udtrække tekst fra PDF
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamisk import af pdf-parse for at undgå bundling issues
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error('Kunne ikke læse PDF fil. Sørg for at filen er en valid PDF.');
  }
}

// Helper til at udtrække tekst fra DOCX
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    // Dynamisk import af mammoth
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error('Kunne ikke læse DOCX fil. Sørg for at filen er en valid DOCX.');
  }
}

// Helper til at kalde OpenAI API
async function callOpenAI(cvText: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY er ikke sat i miljøvariabler');
  }

  const prompt = `SYSTEMROLLE:
Du er en kritisk, analytisk CV-analytiker.

FORMÅL:
Din opgave er udelukkende at UDLEDE og AFGRÆNSE, ikke at opsummere pænt,
ikke at anbefale roller og ikke at vurdere egnethed.
Analysen skal være nøgtern, dokumentationsbaseret og gennemsigtig.

ABSOLUTTE REGLER (BRUD = FEJL):
- Du må KUN bruge information, der står eksplicit i CV-teksten.
- Du må IKKE antage færdigheder, ansvar, senioritet eller resultater.
- Du må IKKE skrive at profilen er "velegnet", "egnet", "stærk" eller lignende.
- Rosende eller vurderende adjektiver er forbudt, medmindre de straks
  forklares med konkret CV-evidens i samme sætning.
- Gentag ikke CV'ets egne formuleringer – udled i egne ord.
- Hvis noget ikke kan dokumenteres, skal det fremgå eksplicit.
- Ingen sektioner må blandes eller flettes sammen.
- Hvis strukturen nedenfor ikke følges præcist, er svaret ugyldigt.

SPROG:
- Dansk
- Professionelt, nøgternt, analytisk
- Ingen marketing- eller LinkedIn-sprog

CV-TEKST:
${cvText}

STRUKTUR (SKAL FØLGES 1:1 – SAMME OVERSKRIFTER):

OVERORDNET UDLEDNING
[1–2 korte afsnit. Beskriv hvilken type profil CV'et samlet set viser (fx operativ vs. strategisk, specialist vs. generalist). Beskriv eventuel progression i ansvar eller kompleksitet, uden at bruge rosende formuleringer.]

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
            content: 'Du er en ekspert HR-analytiker der analyserer CVer præcist og struktureret.',
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
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Ingen fil uploadet' },
        { status: 400 }
      );
    }

    // Tjek filtype
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();

    if (!['pdf', 'docx', 'txt'].includes(fileExtension || '')) {
      return NextResponse.json(
        { error: 'Kun PDF, DOCX eller TXT filer er tilladt' },
        { status: 400 }
      );
    }

    // Konverter fil til buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Udtræk tekst baseret på filtype
    let cvText: string;

    if (fileExtension === 'pdf') {
      cvText = await extractTextFromPDF(buffer);
    } else if (fileExtension === 'docx') {
      cvText = await extractTextFromDOCX(buffer);
    } else if (fileExtension === 'txt') {
      cvText = buffer.toString('utf-8');
    } else {
      return NextResponse.json(
        { error: 'Ugyldig filtype' },
        { status: 400 }
      );
    }

    // Tjek om der er tekst i filen
    if (!cvText || cvText.trim().length < 50) {
      return NextResponse.json(
        { error: 'CV\'et indeholder ikke nok tekst til analyse' },
        { status: 400 }
      );
    }

    // Kald OpenAI API
    const summary = await callOpenAI(cvText);

    return NextResponse.json({
      summary,
      cvText, // Send med så vi kan bruge det til revision
    });

  } catch (error) {
    console.error('Fejl i extract endpoint:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Der opstod en fejl ved behandling af CV\'et' 
      },
      { status: 500 }
    );
  }
}
