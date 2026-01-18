import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Only create OpenAI client if API key exists
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, content, bullets, title, company, jobDescription } = body;
    
    if (!openai) {
      // Return mock response for development
      return NextResponse.json(getMockResponse(type, content, bullets));
    }
    
    let systemPrompt = '';
    let userPrompt = '';
    
    switch (type) {
      case 'rewrite-intro':
        systemPrompt = `Du er en professionel CV-skribent. Din opgave er at omskrive profilbeskrivelser så de er:
- Klare og præcise
- Relevante for den specifikke stilling
- Professionelle i tonen
- På dansk

VIGTIGT: 
- Du må KUN omskrive og forbedre eksisterende indhold
- Du må IKKE opfinde nye færdigheder, erfaringer eller kvalifikationer
- Hold beskrivelsen på 4-5 linjer
- Bevar alle fakta fra originalen`;
        
        userPrompt = `Omskriv denne profilbeskrivelse så den er mere relevant for stillingen:

ORIGINAL PROFIL:
${content}

JOBOPSLAG:
${jobDescription}

Giv kun den omskrevne tekst, ingen forklaringer.`;
        break;
        
      case 'generate-milestones':
        systemPrompt = `Du er en professionel CV-skribent. Din opgave er at skrive en kort narrativ beskrivelse af nøgleopgaver baseret på eksisterende bullet points.

VIGTIGT:
- Brug KUN information fra de givne bullet points
- Opfind IKKE nye fakta, tal eller erfaringer
- Skriv 2-3 sammenhængende sætninger
- Fokuser på ansvar og scope
- Skriv på dansk`;
        
        userPrompt = `Skriv en kort nøgleopgave-beskrivelse for denne stilling baseret på følgende punkter:

STILLING: ${title} hos ${company}

PUNKTER:
${bullets?.map((b: string) => `• ${b}`).join('\n')}

${jobDescription ? `JOBOPSLAG (til kontekst):\n${jobDescription}` : ''}

Giv kun den genererede tekst, ingen forklaringer.`;
        break;
        
      case 'rewrite-bullet':
        systemPrompt = `Du er en professionel CV-skribent. Din opgave er at omskrive CV-punkter så de er:
- Handlingsorienterede (start med et stærkt verbum)
- Kvantificerbare hvor muligt
- Relevante for stillingen
- Præcise og kortfattede

VIGTIGT:
- Du må KUN omskrive eksisterende indhold
- Du må IKKE tilføje nye tal, resultater eller fakta der ikke fremgår
- Bevar alle originale fakta`;
        
        userPrompt = `Omskriv dette CV-punkt så det er mere slagkraftigt:

ORIGINAL:
${content}

${jobDescription ? `JOBOPSLAG:\n${jobDescription}` : ''}

Giv kun det omskrevne punkt, ingen forklaringer.`;
        break;
        
      default:
        return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
    }
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    
    const suggestion = completion.choices[0]?.message?.content?.trim() || '';
    
    return NextResponse.json({
      suggestion,
      rationale: type === 'rewrite-intro' 
        ? 'Optimeret for relevans og tydelighed'
        : type === 'generate-milestones'
        ? 'Genereret fra dine eksisterende punkter'
        : undefined,
    });
    
  } catch (error) {
    console.error('CV AI assist error:', error);
    return NextResponse.json(
      { error: 'AI assistance fejlede' },
      { status: 500 }
    );
  }
}

// Mock responses for development without API key
function getMockResponse(type: string, content?: string, bullets?: string[]) {
  switch (type) {
    case 'rewrite-intro':
      return {
        suggestion: content 
          ? `${content.split('.')[0]}. Med dokumenteret erfaring inden for området leverer jeg resultater gennem struktureret tilgang og stærkt samarbejde.`
          : 'Erfaren professionel med stærk track record inden for kernekompetencer.',
        rationale: 'Optimeret for tydelighed og relevans',
      };
      
    case 'generate-milestones':
      return {
        suggestion: bullets && bullets.length > 0
          ? `Ansvarlig for ${bullets[0]?.toLowerCase().slice(0, 50) || 'kerneopgaver'}. Bidrog til at drive resultater gennem tværgående samarbejde og systematisk tilgang.`
          : 'Tilføj punkter først for at generere nøgleopgaver.',
        rationale: 'Genereret fra dine eksisterende punkter',
      };
      
    case 'rewrite-bullet':
      return {
        suggestion: content || 'Drev [handling] med [resultat]',
      };
      
    default:
      return { suggestion: '', error: 'Unknown type' };
  }
}
