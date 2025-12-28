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

  const prompt = `DU ER CLAUDE. DU SKAL LØSE OPGAVEN I TO TVUNGNE TRIN.
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
TRIN 2 — KRITISK OMSKRIVNING (DETTE ER DET ENDELIGE OUTPUT)
════════════════════════════════

ROLLE:
Du er nu en erfaren konsulent og analytisk redaktør.

OPGAVE:
Omskriv indholdet fra TRIN 1 til en skarp, professionel analyse
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

════════════════════════════════
INPUT
════════════════════════════════

Her er CV-teksten:

"""
${cvText}
"""

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
