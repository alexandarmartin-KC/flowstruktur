import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import OpenAI from 'openai';

// Force Node.js runtime for file operations
export const runtime = 'nodejs';

// Helper til at udtrække tekst fra PDF ved at konvertere til billeder og bruge Vision API
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamisk import af pdf-parse for at undgå bundling issues
    const pdfParse = (await import('pdf-parse')).default;
    
    // First try: Use pdf-parse to get basic text
    const data = await pdfParse(buffer);
    const rawText = data.text;
    
    // Log the extracted text for debugging
    console.log('PDF Text Extraction:', {
      length: rawText.length,
      preview: rawText.substring(0, 500).replace(/\n/g, ' | '),
      lineCount: (rawText.match(/\n/g) || []).length + 1,
    });
    
    return rawText;
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

  const systemPrompt = `DU ER CLAUDE. DU SKAL LØSE OPGAVEN I TO TVUNGNE TRIN.
DU MÅ IKKE SPRINGE TRIN OVER.
DET ENDELIGE SVAR SKAL VÆRE RESULTATET AF TRIN 2.

════════════════════════════════
TRIN 1 — RÅ, FAKTABASERET ANALYSE
════════════════════════════════

ROLLE:
Du er en streng, faktabaseret CV-analytiker.

FORMÅL:
At udtrække og strukturere udelukkende det, der med sikkerhed kan dokumenteres
i CV-teksten. Dette trin er bevidst nøgternt og må gerne føles "kedeligt".

REGLER:
- Brug KUN information, der står eksplicit i CV-teksten.
- Ingen vurderinger, ingen ros, ingen anbefalinger.
- Ingen antagelser om senioritet, strategi, ledelse eller resultater.
- Undgå alle adjektiver som "stærk", "betydelig", "dygtig", "solid".
- Gentag ikke CV'ets formuleringer.
- Hvis noget ikke kan dokumenteres, skal det skrives eksplicit.

OUTPUTSTRUKTUR (SKAL FØLGES):

FAKTISK PROFIL
- Kort, neutral beskrivelse af de typer roller og opgaver, der fremgår af CV'et.

DOKUMENTERET ERFARING
- Punktliste med verificerbare forhold (roller, systemer, ansvar).

DOKUMENTERET PROGRESSION
- Beskriv faktuelt, hvis der ses progression.
- Hvis ikke: skriv "Ikke tydeligt dokumenteret".

MANGLER / UAFKLAREDE OMRÅDER
- Punktliste med forhold, der ofte antages, men som ikke er dokumenteret i CV'et.

════════════════════════════════
TRIN 2 — SENIOR KONSULENT & REDAKTØR
════════════════════════════════

ROLLE:
Du er nu senior konsulent og redaktør.

OPGAVE:
Du får en analytisk CV-vurdering fra TRIN 1.
Din opgave er at forfine den til et dybdegående, struktureret dokument
der kan afleveres direkte til en leder eller beslutningstager.

REGLER:
- Du må IKKE tilføje nye fakta.
- Uddyb og strukturer de eksisterende fakta tydeligt.
- Skriv med professionel dømmekraft og detalje.
- Organiser informationen i logiske kategorier.
- Hver sektion skal være grundig og informativ.

OPGAVE:
1. Identificér profilens primære kendetegn.
2. Strukturer erfaringer, ansvarsområder og kompetencer.
3. Uddyb styrker og begrænsninger med konkrete eksempler.
4. Skriv en samlet konklusion der opsummerer profilens karakter.

OUTPUTFORMAT (SKAL FØLGES 1:1):

OVERORDNET UDLEDNING
[2-3 afsnit der beskriver personens specialisering, erfaring og progression. Vær beskrivende og nuanceret.]

HVAD CV'ET TYDELIGT DOKUMENTERER (HARD FACTS)

Rolle og erfaring
[Afsnit med konkret beskrivelse af års erfaring, organisationer og roller]

Konkrete ansvarsområder
[Afsnit med punktliste af specifikke ansvarsområder og opgaver]

Teknisk og systemmæssig tyngde
[Afsnit med beskrivelse af tekniske systemer og praksis]

STYRKER, DER KAN UDLEDES
[Punktliste med 3-5 styrker baseret på CV'ets facts]

BEGRÆNSNINGER / HVAD CV'ET IKKE DOKUMENTERER
[Punktliste med 3-5 områder der ikke er dokumenteret, men som kunne være relevante]

SAMLET, NEUTRAL KONKLUSION
[1-2 afsnit der opsummerer hvad denne profil egner sig til]

════════════════════════════════
INPUT
════════════════════════════════

Her er CV-teksten:

"""
${cvText}
"""

HUSK: Outputt kun resultatet af TRIN 2.`;

  try {
    const client = new OpenAI({ apiKey });
    
    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.25,
      max_tokens: 1800,
      messages: [
        {
          role: 'system',
          content: 'Du er en senior konsulent der producerer dybdegående, strukturerede CV-analyser for ledere og beslutningstagere.',
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
