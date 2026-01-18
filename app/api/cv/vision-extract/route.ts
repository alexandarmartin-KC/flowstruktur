import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Vision-based CV extraction - converts PDF to images and uses GPT-4 Vision
 * This is MUCH better for complex layouts like two-column CVs
 */

const VISION_PROMPT = `You are an expert CV/Resume parser. You will be shown images of a CV/Resume.

Your task is to extract ALL information from the CV and return it as structured JSON.

CRITICAL RULES:
1. Extract EVERY piece of information visible in the CV
2. NEVER invent data - only extract what you can see
3. Preserve the exact wording and language from the CV
4. Handle two-column layouts correctly - read left column fully, then right column
5. Include ALL job positions, education, skills, and languages

Pay special attention to:
- Two-column layouts (sidebar + main content)
- Left sidebar typically contains: Contact, Skills, Languages, Education
- Right/main column typically contains: Profile, Work Experience with bullets
- Dates that appear near job titles
- ALL bullet points under each job

Return a JSON object with this structure:
{
  "contact": {
    "name": "Full name",
    "email": "email@example.com",
    "phone": "phone number",
    "location": "city, country",
    "linkedin": "linkedin url if present",
    "website": "website if present"
  },
  "professionalIntro": "The profile/summary paragraph exactly as written",
  "experience": [
    {
      "title": "Job title exactly as written",
      "company": "Company name exactly as written",
      "location": "Location if shown",
      "startDate": "Start date as shown (e.g., 'april 2015', 'January 2020')",
      "endDate": "End date or null if current",
      "keyMilestones": "Any narrative paragraph about the role",
      "bullets": ["All", "bullet", "points", "for", "this", "role"]
    }
  ],
  "education": [
    {
      "title": "Degree/certification name",
      "institution": "School/organization",
      "year": "Year or range"
    }
  ],
  "skills": ["All", "skills", "listed"],
  "languages": [
    {
      "language": "Language name",
      "level": "native|fluent|advanced|intermediate|basic"
    }
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

    // Check file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Kun PDF filer understøttes af vision extraction' },
        { status: 400 }
      );
    }

    // Convert file to buffer and then to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Convert PDF to images using pdf-parse to get page count, then convert pages
    const pdfParse = (await import('pdf-parse')).default;
    const pdfData = await pdfParse(buffer);
    const numPages = pdfData.numpages;
    
    console.log(`Vision Extract: Processing PDF with ${numPages} pages`);
    
    // For now, we'll convert the PDF to PNG using pdf-poppler or similar
    // But since that requires system dependencies, let's use a simpler approach:
    // Use OpenAI's file handling which can process PDFs directly
    
    // Convert buffer to base64 for API
    const base64Pdf = buffer.toString('base64');
    
    // Create a data URL for the PDF
    const pdfDataUrl = `data:application/pdf;base64,${base64Pdf}`;
    
    // Note: OpenAI Vision API doesn't directly support PDFs
    // We need to convert to images first
    // For now, let's use a hybrid approach with better text extraction
    
    return NextResponse.json(
      { 
        error: 'Vision extraction kræver PDF-til-billede konvertering. Brug standard extraction indtil videre.',
        fallbackToStandard: true
      },
      { status: 501 }
    );
    
  } catch (error) {
    console.error('Vision extract error:', error);
    return NextResponse.json(
      { error: 'Vision extraction fejlede' },
      { status: 500 }
    );
  }
}
