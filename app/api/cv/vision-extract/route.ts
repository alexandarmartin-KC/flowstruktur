import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Vision-based CV extraction
 * Receives base64 images of PDF pages rendered on client-side
 * Uses GPT-4o Vision to read the CV exactly as it appears visually
 */

const VISION_PROMPT = `You are reading a CV/Resume image. Your job is to extract ALL text EXACTLY as written.

CRITICAL RULES:
1. COPY every word EXACTLY - character for character
2. NEVER shorten, abbreviate, or paraphrase anything
3. If text says "Certificated Security Manager, CFPA" - copy ALL of it
4. If text says "Danish Institute for Fire & Security" - copy ALL of it
5. Include ALL bullet points COMPLETELY
6. Include ALL skills, ALL languages with levels, ALL education

LAYOUT:
- This CV likely has two columns
- LEFT sidebar: Contact, Skills, Languages, Education
- RIGHT main area: Profile summary, Work Experience

OUTPUT FORMAT (JSON only):
{
  "contact": {
    "name": "Full name exactly as written",
    "email": "email exactly",
    "phone": "phone exactly",
    "location": "full address/location"
  },
  "professionalIntro": "Complete profile/summary paragraph - every word",
  "experience": [
    {
      "title": "Complete job title - every word",
      "company": "Company name exactly",
      "location": "Location if shown",
      "startDate": "Start date exactly as written",
      "endDate": "End date exactly, or null if current/Nu/Present",
      "keyMilestones": "Any description paragraph - complete",
      "bullets": ["Complete bullet 1 - full sentence", "Complete bullet 2 - full sentence"]
    }
  ],
  "education": [
    {
      "title": "Degree/certification name - complete",
      "institution": "School/organization name - complete",
      "year": "Year exactly as shown"
    }
  ],
  "skills": ["Skill 1 exactly", "Skill 2 exactly"],
  "languages": [
    { "language": "Language name", "level": "Level exactly as shown e.g. 'native', 'fluent'" }
  ]
}

VERIFICATION before responding:
- Did I copy EVERY word from job titles? (not "Manager" → "Mana")
- Did I copy EVERY word from institution names?
- Did I include parenthetical info like "(CFPA)" or "(native)"?
- Are all bullet points COMPLETE sentences?

Return ONLY valid JSON.`;

export async function POST(request: NextRequest) {
  try {
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API ikke tilgængelig' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { images } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'Ingen billeder modtaget' }, { status: 400 });
    }

    console.log('Vision Extract: Received', images.length, 'page images');

    // Build image content for Vision API
    const imageContent = images.map((img: { base64: string }, idx: number) => {
      // Handle both full data URL and raw base64
      const imageUrl = img.base64.startsWith('data:') 
        ? img.base64 
        : `data:image/png;base64,${img.base64}`;
      
      console.log(`Vision Extract: Page ${idx + 1} image size: ${imageUrl.length} chars`);
      
      return {
        type: "image_url" as const,
        image_url: {
          url: imageUrl,
          detail: "high" as const,
        },
      };
    });

    console.log('Vision Extract: Sending to GPT-4o Vision...');

    // Call GPT-4o Vision
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
    console.log('Vision Extract: Response length:', responseText.length);
    console.log('Vision Extract: First 500 chars:', responseText.substring(0, 500));

    // Parse JSON response
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const structured = JSON.parse(jsonStr.trim());

    console.log('Vision Extract: Parsed successfully', {
      hasContact: !!structured.contact,
      contactName: structured.contact?.name,
      experienceCount: structured.experience?.length || 0,
      educationCount: structured.education?.length || 0,
      skillsCount: structured.skills?.length || 0,
      languagesCount: structured.languages?.length || 0,
    });

    // Log education to verify full text
    if (structured.education) {
      structured.education.forEach((edu: any, i: number) => {
        console.log(`Education[${i}]: "${edu.title}" at "${edu.institution}"`);
      });
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
