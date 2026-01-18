import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Only create OpenAI client if API key exists
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Storage key for CV extraction data
const CV_EXTRACTION_KEY = 'flowstruktur_cv_extraction';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, content, bullets, title, company, jobDescription, cvData } = body;
    
    if (!openai) {
      // Return mock response for development
      return NextResponse.json(getMockResponse(type, content, bullets));
    }
    
    let systemPrompt = '';
    let userPrompt = '';
    
    switch (type) {
      case 'rewrite-intro':
        systemPrompt = `Du er en CV-assistent der hjælper med at forfine profilbeskrivelser.

STRENGE REGLER:
- Du må KUN omskrive og forbedre eksisterende indhold
- Du må ALDRIG opfinde nye færdigheder, erfaringer, tal eller kvalifikationer
- Alle fakta skal stamme direkte fra originalteksten
- Hold beskrivelsen på 4-5 linjer
- Skriv på dansk
- Fokuser på klarhed og relevans for jobbet`;
        
        userPrompt = `Omskriv denne profilbeskrivelse så den er mere relevant for stillingen.

DU MÅ KUN BRUGE INFORMATION FRA ORIGINALEN:

ORIGINAL PROFIL:
${content}

JOBOPSLAG:
${jobDescription}

Giv kun den omskrevne tekst, ingen forklaringer.`;
        break;
        
      case 'generate-intro-from-experience':
        systemPrompt = `Du er en CV-assistent. Din opgave er at skrive en kort professionel profilbeskrivelse.

STRENGE REGLER:
- Du skal UDELUKKENDE basere teksten på CV-data der gives til dig
- Du må ALDRIG opfinde fakta, tal, virksomheder eller kvalifikationer
- Hvis der ikke er nok data, skriv en generisk men ærlig beskrivelse
- Hold teksten på 4-5 linjer
- Skriv på dansk
- Fokuser på fakta der kan verificeres i CV'et`;
        
        userPrompt = `Skriv en kort profilbeskrivelse baseret på CV-data.

CV-DATA (brug KUN dette):
${cvData || 'Ingen specifik CV-data tilgængelig'}

JOBOPSLAG (til kontekst - tilpas tonen, men opfind IKKE nye fakta):
${jobDescription}

Giv kun profilbeskrivelsen, ingen forklaringer.`;
        break;
        
      case 'generate-milestones':
        systemPrompt = `Du er en CV-assistent. Din opgave er at skrive en kort sammenfatning af nøgleopgaver.

STRENGE REGLER:
- Brug UDELUKKENDE information fra de givne bullet points
- Opfind ALDRIG nye fakta, tal, resultater eller erfaringer
- Hvis punkterne ikke indeholder specifikke tal, opfind dem IKKE
- Skriv 2-3 sammenhængende sætninger
- Skriv på dansk`;
        
        userPrompt = `Skriv en kort sammenfatning baseret på følgende punkter.

DU MÅ KUN BRUGE INFORMATION FRA DISSE PUNKTER:

STILLING: ${title} hos ${company}

PUNKTER:
${bullets?.map((b: string) => `• ${b}`).join('\n')}

${jobDescription ? `JOBOPSLAG (til tone, IKKE til nye fakta):\n${jobDescription}` : ''}

Giv kun den genererede tekst, ingen forklaringer.`;
        break;
        
      case 'rewrite-bullet':
        systemPrompt = `Du er en CV-assistent. Din opgave er at omskrive et CV-punkt.

STRENGE REGLER:
- Du må KUN omskrive eksisterende indhold
- Du må ALDRIG tilføje nye tal, resultater, teknologier eller fakta
- Hvis originalen ikke har tal, OPFIND IKKE tal
- Start gerne med et handlingsverbum
- Hold det kortfattet
- Skriv på dansk`;
        
        userPrompt = `Omskriv dette CV-punkt så det er mere slagkraftigt.

DU MÅ KUN BRUGE INFORMATION FRA ORIGINALEN:

ORIGINAL:
${content}

${jobDescription ? `JOBOPSLAG (til tone):\n${jobDescription}` : ''}

Giv kun det omskrevne punkt, ingen forklaringer.`;
        break;
        
      case 'tighten-text':
        systemPrompt = `Du er en redaktør. Din opgave er at forkorte og stramme tekst.

STRENGE REGLER:
- Fjern kun overflødige ord
- Du må IKKE ændre fakta eller tilføje nyt indhold
- Bevar al vigtig information
- Skriv på dansk`;
        
        userPrompt = `Forkort denne tekst uden at miste vigtig information:

${content}

Giv kun den forkortede tekst.`;
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
      temperature: 0.5, // Lower temperature for more consistent, factual output
      max_tokens: 500,
    });
    
    const suggestion = completion.choices[0]?.message?.content?.trim() || '';
    
    // Add rationale explaining the source of the content
    let rationale = '';
    switch (type) {
      case 'rewrite-intro':
        rationale = 'Optimeret baseret på din originale tekst';
        break;
      case 'generate-intro-from-experience':
        rationale = 'Genereret fra din erfaring i CV\'et';
        break;
      case 'generate-milestones':
        rationale = 'Sammenfattet fra dine eksisterende punkter';
        break;
      case 'rewrite-bullet':
        rationale = 'Omskrevet for klarhed';
        break;
      case 'tighten-text':
        rationale = 'Forkortet uden tab af information';
        break;
    }
    
    return NextResponse.json({
      suggestion,
      rationale,
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
        rationale: 'Optimeret baseret på din originale tekst',
      };
      
    case 'generate-intro-from-experience':
      return {
        suggestion: 'Erfaren professionel med solid baggrund inden for mit felt. Min erfaring omfatter håndtering af komplekse opgaver og samarbejde på tværs af teams.',
        rationale: 'Genereret fra din erfaring i CV\'et',
      };
      
    case 'generate-milestones':
      return {
        suggestion: bullets && bullets.length > 0
          ? `Ansvarlig for ${bullets[0]?.toLowerCase().slice(0, 50) || 'kerneopgaver'}. Bidrog til at drive resultater gennem tværgående samarbejde og systematisk tilgang.`
          : 'Tilføj punkter først for at generere nøgleopgaver.',
        rationale: 'Sammenfattet fra dine eksisterende punkter',
      };
      
    case 'rewrite-bullet':
      return {
        suggestion: content || 'Drev [handling] med [resultat]',
        rationale: 'Omskrevet for klarhed',
      };
      
    case 'tighten-text':
      return {
        suggestion: content ? content.split('.').slice(0, 2).join('. ') + '.' : '',
        rationale: 'Forkortet uden tab af information',
      };
      
    default:
      return { suggestion: '', error: 'Unknown type' };
  }
}
