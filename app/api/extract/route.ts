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

// Helper til at kalde Claude API
async function callClaudeAPI(cvText: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY er ikke sat i miljøvariabler');
  }

  const prompt = `Du er en ekspert HR-analytiker. Din opgave er at analysere et CV og udtrække nøgleinformation på en struktureret måde.

VIGTIGT: Du må IKKE opfinde information. Alle fakta skal være direkte fra CV'et. Hvis noget er uklart eller ikke nævnt, skal du skrive "Ikke oplyst i CV'et".

CV-TEKST:
${cvText}

INSTRUKTIONER:
1. Læs CV'et omhyggeligt
2. Udtræk nøgleinformation om erfaring, uddannelse og kompetencer
3. Formater dit svar PRÆCIS som vist nedenfor

OUTPUT FORMAT (brug PRÆCIS denne struktur):

TEKST:
[Skriv 1-2 afsnit der sammenfatter personens professionelle baggrund, nøgleerfaring og styrker baseret UDELUKKENDE på CV-teksten]

BULLETS:
- [Nøgleerfaring eller kompetence 1]
- [Nøgleerfaring eller kompetence 2]
- [Nøgleerfaring eller kompetence 3]
- [Nøgleerfaring eller kompetence 4]
- [Nøgleerfaring eller kompetence 5]

KILDE-NOTER:
[1-3 korte noter om hvilke dele af CV'et du har fokuseret på, fx "Erfaring fra [område]", "Uddannelse i [felt]", "Kompetencer inden for [teknologi/metode]"]`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022', // Kan ændres efter din Anthropic-konto
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Claude API fejl: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Kunne ikke kalde Claude API: ${error.message}`);
    }
    throw new Error('Ukendt fejl ved kald til Claude API');
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

    // Kald Claude API
    const summary = await callClaudeAPI(cvText);

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
