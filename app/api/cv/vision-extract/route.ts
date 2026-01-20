import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * NEW APPROACH: Two-pass extraction
 * Pass 1: AI identifies line numbers for each section
 * Pass 2: Code extracts text directly from those lines
 * This prevents AI from modifying/truncating text
 */

async function extractWithLayout(buffer: Buffer): Promise<{ lines: string[]; text: string }> {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    const data = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    
    console.log('PDF.js: Loaded PDF with', pdf.numPages, 'pages');
    
    const allLines: string[] = [];
    
    for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 3); pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });
      
      // Group text by Y position to form lines
      const lineMap = new Map<number, { x: number; text: string }[]>();
      const midPoint = viewport.width / 2;
      
      for (const item of textContent.items) {
        if ('str' in item && item.str.trim()) {
          const x = 'transform' in item ? item.transform[4] : 0;
          const y = 'transform' in item ? Math.round(item.transform[5] / 5) * 5 : 0; // Round to group nearby items
          
          if (!lineMap.has(y)) {
            lineMap.set(y, []);
          }
          lineMap.get(y)!.push({ x, text: item.str });
        }
      }
      
      // Sort by Y (descending for top-to-bottom)
      const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);
      
      for (const y of sortedYs) {
        const items = lineMap.get(y)!.sort((a, b) => a.x - b.x);
        // Separate left and right columns
        const leftItems = items.filter(i => i.x < midPoint * 0.6);
        const rightItems = items.filter(i => i.x >= midPoint * 0.6);
        
        if (leftItems.length > 0) {
          allLines.push('[L] ' + leftItems.map(i => i.text).join(' '));
        }
        if (rightItems.length > 0) {
          allLines.push('[R] ' + rightItems.map(i => i.text).join(' '));
        }
      }
    }
    
    return { lines: allLines, text: allLines.join('\n') };
  } catch (error) {
    console.error('PDF.js extraction error:', error);
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    const lines = data.text.split('\n').filter((l: string) => l.trim());
    return { lines, text: data.text };
  }
}

// AI only identifies structure - does NOT copy text
const STRUCTURE_PROMPT = `Analyze this CV and identify the LINE NUMBERS for each section.
DO NOT copy any text - just tell me which lines contain what.

For each item found, give me the EXACT LINE NUMBER(s) where it appears.
Lines are numbered starting from 1.
Lines starting with [L] are from the left sidebar.
Lines starting with [R] are from the main content area.

Return JSON with this structure:
{
  "name_lines": [1],
  "email_line": 5,
  "phone_line": 6,
  "location_lines": [7, 8],
  "profile_lines": [15, 16, 17, 18],
  "experience": [
    {
      "title_line": 20,
      "company_line": 21,
      "date_line": 22,
      "bullet_lines": [23, 24, 25, 26]
    }
  ],
  "education": [
    {
      "title_line": 50,
      "institution_line": 51,
      "year_line": 52
    }
  ],
  "skills_lines": [10, 11, 12, 13],
  "languages": [
    { "language_line": 40, "level_line": 40 }
  ]
}

Only return valid JSON. Be thorough - include ALL jobs, ALL education, ALL skills.`;

export async function POST(request: NextRequest) {
  try {
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API ikke tilgængelig' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Ingen fil uploadet' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf')) {
      return NextResponse.json({ error: 'Kun PDF filer understøttes' }, { status: 400 });
    }

    console.log('Vision Extract: Processing PDF file:', file.name);
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Extract lines with layout awareness
    const { lines, text } = await extractWithLayout(buffer);
    
    console.log('Vision Extract: Extracted', lines.length, 'lines');
    
    // Create numbered line list for AI
    const numberedLines = lines.map((line, idx) => `${idx + 1}: ${line}`).join('\n');
    
    console.log('Vision Extract: First 20 lines:', numberedLines.substring(0, 1000));
    
    // Pass 1: AI identifies structure (line numbers only)
    const structureResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 8000,
      temperature: 0,
      messages: [
        { role: "system", content: STRUCTURE_PROMPT },
        { role: "user", content: `Here are the numbered lines from the CV:\n\n${numberedLines}` },
      ],
    });
    
    const structureText = structureResponse.choices[0]?.message?.content || '';
    console.log('Vision Extract: Structure response:', structureText.substring(0, 500));
    
    // Parse structure
    let structure: any;
    try {
      let jsonStr = structureText;
      const jsonMatch = structureText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1];
      structure = JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error('Failed to parse structure:', e);
      // Fall back to old method
      return NextResponse.json({ error: 'Structure parse failed', fallbackToStandard: true }, { status: 500 });
    }
    
    // Pass 2: Extract text directly from lines
    const getLineText = (lineNum: number | undefined): string => {
      if (!lineNum || lineNum < 1 || lineNum > lines.length) return '';
      return lines[lineNum - 1].replace(/^\[(L|R)\]\s*/, '').trim();
    };
    
    const getMultiLineText = (lineNums: number[] | undefined): string => {
      if (!lineNums || !Array.isArray(lineNums)) return '';
      return lineNums.map(n => getLineText(n)).filter(t => t).join(' ');
    };
    
    // Build structured data from ORIGINAL lines
    const result: any = {
      contact: {
        name: getMultiLineText(structure.name_lines),
        email: getLineText(structure.email_line),
        phone: getLineText(structure.phone_line),
        location: getMultiLineText(structure.location_lines),
      },
      professionalIntro: getMultiLineText(structure.profile_lines),
      experience: (structure.experience || []).map((exp: any) => ({
        title: getLineText(exp.title_line),
        company: getLineText(exp.company_line),
        startDate: getLineText(exp.date_line)?.split(/[-–—]/)[0]?.trim() || '',
        endDate: getLineText(exp.date_line)?.split(/[-–—]/)[1]?.trim() || null,
        keyMilestones: getMultiLineText(exp.milestone_lines),
        bullets: (exp.bullet_lines || []).map((n: number) => getLineText(n)),
      })),
      education: (structure.education || []).map((edu: any) => ({
        title: getLineText(edu.title_line),
        institution: getLineText(edu.institution_line),
        year: getLineText(edu.year_line),
      })),
      skills: (structure.skills_lines || []).map((n: number) => getLineText(n)),
      languages: (structure.languages || []).map((lang: any) => {
        const langText = getLineText(lang.language_line);
        // Parse "Danish (native)" format
        const match = langText.match(/^(.+?)\s*\((.+)\)$/);
        if (match) {
          return { language: match[1].trim(), level: match[2].trim() };
        }
        return { language: langText, level: getLineText(lang.level_line) };
      }),
      _rawText: text,
    };
    
    console.log('Vision Extract: Built result from original lines', {
      experienceCount: result.experience?.length || 0,
      educationCount: result.education?.length || 0,
      skillsCount: result.skills?.length || 0,
    });
    
    // Log first experience to verify
    if (result.experience?.[0]) {
      console.log('First job title:', result.experience[0].title);
      console.log('First job company:', result.experience[0].company);
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Vision extract error:', error);
    return NextResponse.json(
      { error: 'Extraction fejlede: ' + (error instanceof Error ? error.message : 'Ukendt fejl'), fallbackToStandard: true },
      { status: 500 }
    );
  }
}
