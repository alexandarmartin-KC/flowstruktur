import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { fromBuffer } from 'pdf2pic';
import { tmpdir } from 'os';
import { join } from 'path';
import { promises as fs } from 'fs';

export const runtime = 'nodejs';

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Vision-based CV extraction - converts PDF to images and uses GPT-4 Vision
 * This is MUCH better for complex layouts like two-column CVs
 */

const VISION_PROMPT = `You are extracting data from a CV/Resume image. Your job is to copy text EXACTLY as shown.

CRITICAL - DO NOT:
- Shorten or abbreviate anything
- Paraphrase or reword anything
- Skip any information
- Invent or assume anything

CRITICAL - DO:
- Copy every word EXACTLY as written
- Preserve original language (Danish/English)
- Include ALL bullet points completely
- Capture ALL job positions, education, skills

For two-column layouts:
- Left sidebar: Contact, Skills, Languages, Education
- Right/main: Profile summary, Work Experience

Return ONLY this JSON structure:
{
  "contact": {
    "name": "Full name exactly",
    "email": "email@example.com",
    "phone": "phone number",
    "location": "city, country"
  },
  "professionalIntro": "Copy the profile/summary paragraph EXACTLY word-for-word",
  "experience": [
    {
      "title": "EXACT job title as written",
      "company": "EXACT company name as written",
      "location": "Location if shown",
      "startDate": "Start date exactly as shown",
      "endDate": "End date exactly as shown, or null if current",
      "keyMilestones": "Any narrative paragraph copied exactly",
      "bullets": ["Copy each bullet point EXACTLY and COMPLETELY"]
    }
  ],
  "education": [
    {
      "title": "EXACT degree/certification name",
      "institution": "EXACT school/organization name",
      "year": "Year exactly as shown"
    }
  ],
  "skills": ["Each skill exactly as written"],
  "languages": [
    {
      "language": "Language name",
      "level": "Level exactly as shown"
    }
  ]
}

Return ONLY valid JSON. No explanations.`;

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

    console.log('Vision Extract: Starting PDF to image conversion');
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Convert PDF pages to images
    const options = {
      density: 200,
      saveFilename: "cv_page",
      savePath: tmpdir(),
      format: "png",
      width: 1600,
      height: 2200,
    };
    
    const convert = fromBuffer(buffer, options);
    
    // Convert first 3 pages (most CVs are 1-3 pages)
    const images: string[] = [];
    
    for (let page = 1; page <= 3; page++) {
      try {
        const result = await convert(page, { responseType: "base64" });
        if (result.base64) {
          images.push(result.base64);
          console.log(`Vision Extract: Converted page ${page}`);
        }
      } catch {
        // No more pages
        break;
      }
    }
    
    if (images.length === 0) {
      return NextResponse.json(
        { error: 'Kunne ikke konvertere PDF til billeder' },
        { status: 500 }
      );
    }
    
    console.log(`Vision Extract: Sending ${images.length} page(s) to GPT-4 Vision`);
    
    // Prepare image content for GPT-4 Vision
    const imageContent = images.map((base64, idx) => ({
      type: "image_url" as const,
      image_url: {
        url: `data:image/png;base64,${base64}`,
        detail: "high" as const,
      },
    }));
    
    // Call GPT-4 Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 16000,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: VISION_PROMPT },
            ...imageContent,
          ],
        },
      ],
    });
    
    const responseText = response.choices[0]?.message?.content || '';
    console.log('Vision Extract: Got response, length:', responseText.length);
    
    // Parse JSON response
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    const structured = JSON.parse(jsonStr.trim());
    
    console.log('Vision Extract: Successfully parsed response', {
      hasContact: !!structured.contact,
      experienceCount: structured.experience?.length || 0,
      educationCount: structured.education?.length || 0,
      skillsCount: structured.skills?.length || 0,
    });
    
    return NextResponse.json(structured);
    
  } catch (error) {
    console.error('Vision extract error:', error);
    return NextResponse.json(
      { error: 'Vision extraction fejlede: ' + (error instanceof Error ? error.message : 'Ukendt fejl') },
      { status: 500 }
    );
  }
}
