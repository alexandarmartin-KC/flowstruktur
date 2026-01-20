import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Vision-based CV extraction - uses GPT-4o's native PDF support
 * This reads the PDF directly as an image for perfect layout handling
 */

const VISION_PROMPT = `You are copying text from a CV/Resume document. Your ONLY job is to copy text EXACTLY - character for character.

## ABSOLUTE RULES - VIOLATIONS ARE FAILURES:

1. **COPY EXACTLY** - Every single word must be copied exactly as written
2. **NO SHORTENING** - Never shorten "Manager" to "Manage", "Security" to "Sec", etc.
3. **NO PARAPHRASING** - Do not rewrite or summarize anything
4. **COMPLETE BULLETS** - Copy each bullet point in its entirety, even if long
5. **ALL INFORMATION** - Include every job, every education entry, every skill

## LAYOUT HANDLING:
- This is likely a two-column CV
- LEFT SIDEBAR contains: Contact info, Skills, Languages, Education
- RIGHT/MAIN contains: Profile/Summary, Work Experience with bullet points
- Read EACH column completely

## EXACT OUTPUT FORMAT (JSON):
{
  "contact": {
    "name": "[COPY full name exactly]",
    "email": "[COPY email exactly]",
    "phone": "[COPY phone exactly]",
    "location": "[COPY location exactly]"
  },
  "professionalIntro": "[COPY the entire profile/summary paragraph word-for-word, including all sentences]",
  "experience": [
    {
      "title": "[COPY the complete job title - every word]",
      "company": "[COPY company name exactly]",
      "location": "[COPY location if shown]",
      "startDate": "[COPY start date exactly as written]",
      "endDate": "[COPY end date exactly, or null if current/Nu/Present]",
      "keyMilestones": "[COPY any description paragraph exactly]",
      "bullets": [
        "[COPY bullet 1 completely - the ENTIRE sentence]",
        "[COPY bullet 2 completely - the ENTIRE sentence]"
      ]
    }
  ],
  "education": [
    {
      "title": "[COPY degree/certification name exactly]",
      "institution": "[COPY school/organization name exactly]",
      "year": "[COPY year exactly]"
    }
  ],
  "skills": ["[COPY each skill exactly as written]"],
  "languages": [
    {
      "language": "[COPY language name]",
      "level": "[COPY level exactly - e.g. 'Modersmål', 'Flydende']"
    }
  ]
}

## VERIFICATION BEFORE RESPONDING:
- Is every job title COMPLETE? (not cut off mid-word)
- Is every bullet point the FULL sentence from the CV?
- Are all education institutions included?
- Are all skills from the sidebar included?

Return ONLY the JSON. No explanations.`;

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
    
    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    
    console.log('Vision Extract: PDF size:', buffer.length, 'bytes');
    
    // GPT-4o can read PDFs directly via base64
    // We send it as a file with the PDF mime type
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 16000,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: VISION_PROMPT 
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${base64}`,
                detail: "high"
              }
            }
          ],
        },
      ],
    });
    
    const responseText = response.choices[0]?.message?.content || '';
    console.log('Vision Extract: Response length:', responseText.length);
    console.log('Vision Extract: First 500 chars:', responseText.substring(0, 500));
    
    // Parse JSON response
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    const structured = JSON.parse(jsonStr.trim());
    
    // Log what we got for debugging
    console.log('Vision Extract: Parsed successfully', {
      hasContact: !!structured.contact,
      experienceCount: structured.experience?.length || 0,
      educationCount: structured.education?.length || 0,
      skillsCount: structured.skills?.length || 0,
      languagesCount: structured.languages?.length || 0,
    });
    
    // Log first experience title to verify no truncation
    if (structured.experience?.[0]) {
      console.log('Vision Extract: First job title:', structured.experience[0].title);
      console.log('Vision Extract: First job bullets count:', structured.experience[0].bullets?.length || 0);
    }
    
    return NextResponse.json(structured);
    
  } catch (error) {
    console.error('Vision extract error:', error);
    return NextResponse.json(
      { 
        error: 'Vision extraction fejlede: ' + (error instanceof Error ? error.message : 'Ukendt fejl'),
        fallbackToStandard: true 
      },
      { status: 500 }
    );
  }
}
