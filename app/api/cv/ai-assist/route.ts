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
    const { type, content, bullets, title, company, jobDescription, cvData, language = 'da' } = body;
    
    // Language instruction based on CV language
    const langInstruction = language === 'en' 
      ? 'Write in English' 
      : 'Skriv på dansk';
    
    if (!openai) {
      // Return mock response for development
      return NextResponse.json(getMockResponse(type, content, bullets, language));
    }
    
    let systemPrompt = '';
    let userPrompt = '';
    
    switch (type) {
      case 'rewrite-intro':
        systemPrompt = language === 'en' 
          ? `You are a CV assistant helping to refine profile descriptions.

STRICT RULES:
- You may ONLY rewrite and improve existing content
- You may NEVER invent new skills, experiences, numbers, or qualifications
- All facts must come directly from the original text
- Keep the description to 4-5 lines
- Write in English
- Focus on clarity and relevance for the job`
          : `Du er en CV-assistent der hjælper med at forfine profilbeskrivelser.

STRENGE REGLER:
- Du må KUN omskrive og forbedre eksisterende indhold
- Du må ALDRIG opfinde nye færdigheder, erfaringer, tal eller kvalifikationer
- Alle fakta skal stamme direkte fra originalteksten
- Hold beskrivelsen på 4-5 linjer
- Skriv på dansk
- Fokuser på klarhed og relevans for jobbet`;
        
        userPrompt = language === 'en'
          ? `Rewrite this profile description to be more relevant for the position.

YOU MAY ONLY USE INFORMATION FROM THE ORIGINAL:

ORIGINAL PROFILE:
${content}

JOB POSTING:
${jobDescription}

Provide only the rewritten text, no explanations.`
          : `Omskriv denne profilbeskrivelse så den er mere relevant for stillingen.

DU MÅ KUN BRUGE INFORMATION FRA ORIGINALEN:

ORIGINAL PROFIL:
${content}

JOBOPSLAG:
${jobDescription}

Giv kun den omskrevne tekst, ingen forklaringer.`;
        break;
        
      case 'generate-intro-from-experience':
        systemPrompt = language === 'en'
          ? `You are a CV assistant. Your task is to write a short professional profile description.

STRICT RULES:
- You must ONLY base the text on CV data given to you
- You may NEVER invent facts, numbers, companies, or qualifications
- If there is not enough data, write a generic but honest description
- Keep the text to 4-5 lines
- Write in English
- Focus on facts that can be verified in the CV`
          : `Du er en CV-assistent. Din opgave er at skrive en kort professionel profilbeskrivelse.

STRENGE REGLER:
- Du skal UDELUKKENDE basere teksten på CV-data der gives til dig
- Du må ALDRIG opfinde fakta, tal, virksomheder eller kvalifikationer
- Hvis der ikke er nok data, skriv en generisk men ærlig beskrivelse
- Hold teksten på 4-5 linjer
- Skriv på dansk
- Fokuser på fakta der kan verificeres i CV'et`;
        
        userPrompt = language === 'en'
          ? `Write a short profile description based on CV data.

CV DATA (use ONLY this):
${cvData || 'No specific CV data available'}

JOB POSTING (for context - adapt the tone, but do NOT invent new facts):
${jobDescription}

Provide only the profile description, no explanations.`
          : `Skriv en kort profilbeskrivelse baseret på CV-data.

CV-DATA (brug KUN dette):
${cvData || 'Ingen specifik CV-data tilgængelig'}

JOBOPSLAG (til kontekst - tilpas tonen, men opfind IKKE nye fakta):
${jobDescription}

Giv kun profilbeskrivelsen, ingen forklaringer.`;
        break;
        
      case 'generate-milestones':
        systemPrompt = language === 'en'
          ? `You are a CV assistant. Your task is to write a short summary of key responsibilities.

STRICT RULES:
- Use ONLY information from the given bullet points
- NEVER invent new facts, numbers, results, or experiences
- If the points don't contain specific numbers, do NOT invent them
- Write 2-3 coherent sentences
- Write in English`
          : `Du er en CV-assistent. Din opgave er at skrive en kort sammenfatning af nøgleopgaver.

STRENGE REGLER:
- Brug UDELUKKENDE information fra de givne bullet points
- Opfind ALDRIG nye fakta, tal, resultater eller erfaringer
- Hvis punkterne ikke indeholder specifikke tal, opfind dem IKKE
- Skriv 2-3 sammenhængende sætninger
- Skriv på dansk`;
        
        userPrompt = language === 'en'
          ? `Write a short summary based on the following points.

YOU MAY ONLY USE INFORMATION FROM THESE POINTS:

POSITION: ${title} at ${company}

POINTS:
${bullets?.map((b: string) => `• ${b}`).join('\n')}

${jobDescription ? `JOB POSTING (for tone, NOT for new facts):\n${jobDescription}` : ''}

Provide only the generated text, no explanations.`
          : `Skriv en kort sammenfatning baseret på følgende punkter.

DU MÅ KUN BRUGE INFORMATION FRA DISSE PUNKTER:

STILLING: ${title} hos ${company}

PUNKTER:
${bullets?.map((b: string) => `• ${b}`).join('\n')}

${jobDescription ? `JOBOPSLAG (til tone, IKKE til nye fakta):\n${jobDescription}` : ''}

Giv kun den genererede tekst, ingen forklaringer.`;
        break;
        
      case 'rewrite-bullet':
        systemPrompt = language === 'en'
          ? `You are a CV assistant. Your task is to rewrite a CV bullet point.

STRICT RULES:
- You may ONLY rewrite existing content
- You may NEVER add new numbers, results, technologies, or facts
- If the original doesn't have numbers, do NOT invent numbers
- Start with an action verb if possible
- Keep it concise
- Write in English`
          : `Du er en CV-assistent. Din opgave er at omskrive et CV-punkt.

STRENGE REGLER:
- Du må KUN omskrive eksisterende indhold
- Du må ALDRIG tilføje nye tal, resultater, teknologier eller fakta
- Hvis originalen ikke har tal, OPFIND IKKE tal
- Start gerne med et handlingsverbum
- Hold det kortfattet
- Skriv på dansk`;
        
        userPrompt = language === 'en'
          ? `Rewrite this CV bullet point to be more impactful.

YOU MAY ONLY USE INFORMATION FROM THE ORIGINAL:

ORIGINAL:
${content}

${jobDescription ? `JOB POSTING (for tone):\n${jobDescription}` : ''}

Provide only the rewritten point, no explanations.`
          : `Omskriv dette CV-punkt så det er mere slagkraftigt.

DU MÅ KUN BRUGE INFORMATION FRA ORIGINALEN:

ORIGINAL:
${content}

${jobDescription ? `JOBOPSLAG (til tone):\n${jobDescription}` : ''}

Giv kun det omskrevne punkt, ingen forklaringer.`;
        break;
        
      case 'tighten-text':
        systemPrompt = language === 'en'
          ? `You are an editor. Your task is to shorten and tighten text.

STRICT RULES:
- Only remove unnecessary words
- You may NOT change facts or add new content
- Preserve all important information
- Write in English`
          : `Du er en redaktør. Din opgave er at forkorte og stramme tekst.

STRENGE REGLER:
- Fjern kun overflødige ord
- Du må IKKE ændre fakta eller tilføje nyt indhold
- Bevar al vigtig information
- Skriv på dansk`;
        
        userPrompt = language === 'en'
          ? `Shorten this text without losing important information:

${content}

Provide only the shortened text.`
          : `Forkort denne tekst uden at miste vigtig information:

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
function getMockResponse(type: string, content?: string, bullets?: string[], language: string = 'da') {
  const isEnglish = language === 'en';
  
  switch (type) {
    case 'rewrite-intro':
      return {
        suggestion: content 
          ? isEnglish
            ? `${content.split('.')[0]}. With documented experience in the field, I deliver results through structured approach and strong collaboration.`
            : `${content.split('.')[0]}. Med dokumenteret erfaring inden for området leverer jeg resultater gennem struktureret tilgang og stærkt samarbejde.`
          : isEnglish
            ? 'Experienced professional with strong track record in core competencies.'
            : 'Erfaren professionel med stærk track record inden for kernekompetencer.',
        rationale: isEnglish ? 'Optimized based on your original text' : 'Optimeret baseret på din originale tekst',
      };
      
    case 'generate-intro-from-experience':
      return {
        suggestion: isEnglish
          ? 'Experienced professional with solid background in my field. My experience includes handling complex tasks and cross-team collaboration.'
          : 'Erfaren professionel med solid baggrund inden for mit felt. Min erfaring omfatter håndtering af komplekse opgaver og samarbejde på tværs af teams.',
        rationale: isEnglish ? 'Generated from your CV experience' : 'Genereret fra din erfaring i CV\'et',
      };
      
    case 'generate-milestones':
      return {
        suggestion: bullets && bullets.length > 0
          ? isEnglish
            ? `Responsible for ${bullets[0]?.toLowerCase().slice(0, 50) || 'core tasks'}. Contributed to driving results through cross-functional collaboration and systematic approach.`
            : `Ansvarlig for ${bullets[0]?.toLowerCase().slice(0, 50) || 'kerneopgaver'}. Bidrog til at drive resultater gennem tværgående samarbejde og systematisk tilgang.`
          : isEnglish
            ? 'Add bullet points first to generate key milestones.'
            : 'Tilføj punkter først for at generere nøgleopgaver.',
        rationale: isEnglish ? 'Summarized from your existing points' : 'Sammenfattet fra dine eksisterende punkter',
      };
      
    case 'rewrite-bullet':
      return {
        suggestion: content || (isEnglish ? 'Drove [action] with [result]' : 'Drev [handling] med [resultat]'),
        rationale: isEnglish ? 'Rewritten for clarity' : 'Omskrevet for klarhed',
      };
      
    case 'tighten-text':
      return {
        suggestion: content ? content.split('.').slice(0, 2).join('. ') + '.' : '',
        rationale: isEnglish ? 'Shortened without losing information' : 'Forkortet uden tab af information',
      };
      
    default:
      return { suggestion: '', error: 'Unknown type' };
  }
}
