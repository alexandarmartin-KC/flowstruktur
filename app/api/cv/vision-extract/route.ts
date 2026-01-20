import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Enhanced CV extraction using pdfjs-dist for better layout handling
 * This preserves column structure better than pdf-parse
 */

async function extractWithLayout(buffer: Buffer): Promise<{ text: string; hasColumns: boolean }> {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    
    // Load PDF
    const data = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    
    console.log('PDF.js: Loaded PDF with', pdf.numPages, 'pages');
    
    let fullText = '';
    let hasColumns = false;
    
    for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 3); pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });
      
      // Group text items by their approximate X position (for column detection)
      const leftColumn: { y: number; text: string }[] = [];
      const rightColumn: { y: number; text: string }[] = [];
      const midPoint = viewport.width / 2;
      
      for (const item of textContent.items) {
        if ('str' in item && item.str.trim()) {
          const x = 'transform' in item ? item.transform[4] : 0;
          const y = 'transform' in item ? viewport.height - item.transform[5] : 0;
          
          if (x < midPoint * 0.6) {
            leftColumn.push({ y, text: item.str });
          } else {
            rightColumn.push({ y, text: item.str });
          }
        }
      }
      
      // Sort by Y position (top to bottom)
      leftColumn.sort((a, b) => a.y - b.y);
      rightColumn.sort((a, b) => a.y - b.y);
      
      // Check if this looks like a two-column layout
      if (leftColumn.length > 5 && rightColumn.length > 5) {
        hasColumns = true;
        
        // Add column markers
        fullText += `\n=== PAGE ${pageNum} - LEFT SIDEBAR ===\n`;
        fullText += leftColumn.map(item => item.text).join('\n');
        fullText += `\n\n=== PAGE ${pageNum} - MAIN CONTENT ===\n`;
        fullText += rightColumn.map(item => item.text).join('\n');
      } else {
        // Single column - just extract in order
        const allItems = [...leftColumn, ...rightColumn].sort((a, b) => a.y - b.y);
        fullText += `\n=== PAGE ${pageNum} ===\n`;
        fullText += allItems.map(item => item.text).join('\n');
      }
    }
    
    return { text: fullText, hasColumns };
  } catch (error) {
    console.error('PDF.js extraction error:', error);
    // Fallback to pdf-parse
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return { text: data.text, hasColumns: false };
  }
}

const SYSTEM_PROMPT = `You are extracting structured data from CV text. The text has been pre-processed to show LEFT SIDEBAR and MAIN CONTENT sections separately.

## CRITICAL RULES:
1. COPY text EXACTLY as written - every word, every character
2. NEVER shorten or abbreviate anything (not "Manage" instead of "Manager")
3. Include ALL bullet points completely
4. Include ALL skills, ALL languages, ALL education entries

## TYPICAL CV STRUCTURE:
LEFT SIDEBAR usually contains:
- Contact info (name, email, phone, location)
- Skills list
- Languages with levels
- Education entries

MAIN CONTENT usually contains:
- Professional summary/profile paragraph
- Work experience with dates and bullet points

## OUTPUT FORMAT (JSON only):
{
  "contact": {
    "name": "Full name",
    "email": "email",
    "phone": "phone",
    "location": "location"
  },
  "professionalIntro": "Complete profile/summary paragraph",
  "experience": [
    {
      "title": "Complete job title",
      "company": "Company name",
      "location": "Location if shown",
      "startDate": "Start date as written",
      "endDate": "End date or null",
      "keyMilestones": "Description paragraph if any",
      "bullets": ["Complete bullet 1", "Complete bullet 2"]
    }
  ],
  "education": [
    {
      "title": "Degree name",
      "institution": "School name",
      "year": "Year"
    }
  ],
  "skills": ["skill1", "skill2"],
  "languages": [
    { "language": "Language", "level": "Level as written" }
  ]
}`;

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
      return NextResponse.json(
        { error: 'Ingen fil uploadet' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Kun PDF filer understøttes' },
        { status: 400 }
      );
    }

    console.log('Vision Extract: Processing PDF file:', file.name);
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Extract text with layout awareness
    const { text, hasColumns } = await extractWithLayout(buffer);
    
    console.log('Vision Extract: Extracted text length:', text.length);
    console.log('Vision Extract: Has columns:', hasColumns);
    console.log('Vision Extract: First 500 chars:', text.substring(0, 500));
    
    // Send to GPT-4o for structuring
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 16000,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Extract structured data from this CV:\n\n${text}` },
      ],
    });
    
    const responseText = response.choices[0]?.message?.content || '';
    
    // Parse JSON response
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    const structured = JSON.parse(jsonStr.trim());
    
    console.log('Vision Extract: Parsed successfully', {
      experienceCount: structured.experience?.length || 0,
      educationCount: structured.education?.length || 0,
      skillsCount: structured.skills?.length || 0,
    });
    
    // Return both the layout-aware text and structured data
    // The text is needed for reload/re-parsing later
    return NextResponse.json({
      ...structured,
      _rawText: text, // Include the layout-aware text for future re-parsing
      _hasColumns: hasColumns,
    });
    
  } catch (error) {
    console.error('Vision extract error:', error);
    return NextResponse.json(
      { 
        error: 'Extraction fejlede: ' + (error instanceof Error ? error.message : 'Ukendt fejl'),
        fallbackToStandard: true 
      },
      { status: 500 }
    );
  }
}
