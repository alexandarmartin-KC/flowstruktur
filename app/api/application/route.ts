import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Lazy initialization to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAI() {
  if (!openai) {
    openai = new OpenAI();
  }
  return openai;
}

// Detect language from CV content
function detectLanguage(cvText: string): 'da' | 'en' {
  const danishKeywords = ['erfaring', 'uddannelse', 'kompetencer', 'ansvar', 'virksomhed', 'stilling'];
  const englishKeywords = ['experience', 'education', 'skills', 'responsibility', 'company', 'position'];
  
  let danishCount = 0;
  let englishCount = 0;
  
  const lowerText = cvText.toLowerCase();
  
  danishKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) danishCount++;
  });
  
  englishKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) englishCount++;
  });
  
  return englishCount > danishCount ? 'en' : 'da';
}

// Format date based on language
function formatDate(date: Date, language: 'da' | 'en'): string {
  if (language === 'en') {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    const day = date.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' 
                 : day === 2 || day === 22 ? 'nd' 
                 : day === 3 || day === 23 ? 'rd' 
                 : 'th';
    return `${months[date.getMonth()]} ${day}${suffix}, ${date.getFullYear()}`;
  } else {
    const months = ['januar', 'februar', 'marts', 'april', 'maj', 'juni',
                   'juli', 'august', 'september', 'oktober', 'november', 'december'];
    return `${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}`;
  }
}

// Create application header
function createHeader(userProfile: any, language: 'da' | 'en'): string {
  const { name, title, email, phone, location, city, country } = userProfile || {};
  
  const header: string[] = [];
  
  // Name (uppercase)
  if (name) {
    header.push(name.toUpperCase());
  }
  
  // Title
  if (title) {
    header.push(title);
  }
  
  header.push(''); // Empty line
  
  // Contact info line
  const contactParts: string[] = [];
  if (email) contactParts.push(email);
  if (phone) contactParts.push(phone);
  if (contactParts.length > 0) {
    header.push(contactParts.join(' // '));
  }
  
  header.push(''); // Empty line
  header.push(''); // Extra empty line
  
  // City + Date
  const today = new Date();
  const formattedDate = formatDate(today, language);
  
  if (city) {
    header.push(`${city}, ${formattedDate}`);
  } else {
    header.push(formattedDate);
  }
  
  header.push(''); // Empty line
  header.push(''); // Extra empty line
  
  return header.join('\n');
}

const APPLICATION_ANALYSIS_PROMPT = `DU ER EN ANALYTIKER DER MATCHER CV MOD JOBKRAV.

KONTEKST:
Det CV du modtager er ALLEREDE job-specifikt tilpasset. Det betyder at CV'et er optimeret til netop denne stilling.
Din opgave er at identificere de stærkeste match-punkter og eventuelle gaps.

OPGAVE:
Før du skriver ansøgningen, skal du lave en systematisk analyse.

TRIN 1 - MATCH-PUNKTER (minimum 3, gerne flere):
For hvert hovedkrav i jobbet, find DOKUMENTERET bevis fra det job-tilpassede CV:
- Krav: [hvad jobbet kræver]
- Bevis: [konkret erfaring fra CV der matcher]

FOKUSER PÅ:
- Specifikke færdigheder og teknologier nævnt i jobbet
- Ansvarsniveauer og roller der matcher
- Relevante brancher eller domæner
- Certificeringer eller uddannelser som matcher

TRIN 2 - GAPS/RISICI (minimum 1):
Identificér krav hvor CV'et har begrænset eller indirekte match:
- Krav: [hvad der mangler eller er svagt]
- Note: [hvordan det kan adresseres i ansøgningen - f.eks. gennem overførbare kompetencer]

TRIN 3 - ANBEFALET VINKEL:
Beskriv den bedste måde at frame ansøgerens styrker på for DENNE specifikke stilling.
Hvad skal fremhæves? Hvilken tone? Hvilke aspekter af erfaring er mest relevante?

RETURNER JSON:
{
  "matchPoints": [
    {"requirement": "...", "evidence": "..."}
  ],
  "gaps": [
    {"requirement": "...", "note": "..."}
  ],
  "recommendedFraming": "..."
}`;

const APPLICATION_WRITING_PROMPT = `DU ER EN PROFESSIONEL ANSØGNINGSSKRIVER.

KRITISK KONTEKST:
Du modtager et CV der er SPECIFIKT TILPASSET til det job ansøgningen skal handle om.
Dette betyder at CV'et allerede er optimeret til at fremhæve relevant erfaring for denne rolle.
Din opgave er at skrive en ansøgning der forklarer HVORFOR kandidaten er det rigtige match.

ABSOLUTTE REGLER:
- Brug KUN information fra det job-tilpassede CV og analysen
- Opfind IKKE erfaring, resultater, teknologier eller ansvar
- Brug naturligt, professionelt sprog (dansk eller engelsk baseret på CV-sproget)
- Ingen overdreven selvpromovering eller salgsretorik
- Ansøgningen skal være konkret og relevant FOR DENNE SPECIFIKKE STILLING
- Bevar faktuel korrekthed
- Vis forståelse for stillingens krav og virksomhedens behov
- Kobl dokumenteret erfaring DIREKTE til jobkrav

OPGAVE:
Skriv en målrettet ansøgning der demonstrerer fit mellem kandidat og rolle.

FORMAT:
- Skriv ansøgningen som ren tekst (IKKE markdown)
- Start DIREKTE med teksten (ingen header, ingen "Dear Hiring Team" - det kommer separat)
- Første afsnit: Åbning der viser motivation for DENNE specifikke stilling/virksomhed
- 2-3 afsnit der kobler dokumenteret erfaring til SPECIFIKKE jobkrav
- Afslut professionelt med interesse for næste skridt
- Brug almindelige linjeskift mellem afsnit
- Ingen overskrifter eller punktform
- Længde: 250-400 ord

TONE:
- Professionel men personlig
- Konkret og faktabaseret med specifikke eksempler
- Engageret og motiveret for NETOP denne rolle
- Ikke overdrevet - lad erfaringen tale for sig selv

SPROG:
- Skriv på det sprog som CV'et er skrevet på
- Hvis CV'et er på engelsk, skriv ansøgningen på engelsk
- Hvis CV'et er på dansk, skriv ansøgningen på dansk

FOKUSPUNKTER:
- Reference til konkrete projekter, teknologier, eller resultater fra CV'et
- Vis hvordan kandidatens erfaring løser virksomhedens behov
- Demonstrer forståelse for stillingens ansvar og udfordringer
- Fremhæv de mest relevante kompetencer fra det job-tilpassede CV`;

export async function POST(request: NextRequest) {
  try {
    const { 
      jobDescription,
      jobTitle,
      companyName,
      resolvedCv,
      userProfile,
      dimensionScores,
    } = await request.json();

    if (!jobDescription || !resolvedCv) {
      return NextResponse.json(
        { error: 'Manglende påkrævet data' },
        { status: 400 }
      );
    }

    // Detect language from CV content
    const cvLanguage = detectLanguage(resolvedCv);
    const isEnglish = cvLanguage === 'en';

    // Step 1: Analyze CV vs Job to find matches and gaps
    const analysisMessage = `Analysér dette job-tilpassede CV mod jobopslaget:

STILLINGSINFORMATION:
${jobTitle ? `Stilling: ${jobTitle}` : ''}
${companyName ? `Virksomhed: ${companyName}` : ''}

STILLINGSOPSLAG:
${jobDescription}

JOB-TILPASSET CV (dette CV er allerede optimeret til dette specifikke job):
${resolvedCv}

${userProfile ? `KANDIDAT-PROFIL:
${JSON.stringify(userProfile, null, 2)}` : ''}

${dimensionScores && Object.keys(dimensionScores).length > 0 ? `ARBEJDSSTIL-PROFIL:
${JSON.stringify(dimensionScores, null, 2)}` : ''}

Returner en JSON-analyse med matchPoints (min 3), gaps (min 1) og recommendedFraming.`;

    const analysisResponse = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: APPLICATION_ANALYSIS_PROMPT,
        },
        {
          role: 'user',
          content: analysisMessage,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
      temperature: 0.3,
    });

    const analysisContent = analysisResponse.choices[0]?.message?.content;
    if (!analysisContent) {
      throw new Error('Ingen analyse-respons fra AI');
    }

    const analysis = JSON.parse(analysisContent);

    // Step 2: Write application based on analysis
    const writingMessage = `Skriv en professionel ansøgning baseret på denne analyse:

STILLINGSINFORMATION:
${jobTitle ? `Stilling: ${jobTitle}` : ''}
${companyName ? `Virksomhed: ${companyName}` : ''}

STILLINGSOPSLAG:
${jobDescription}

JOB-TILPASSET CV (dette CV er allerede optimeret til netop denne stilling):
${resolvedCv}

ANALYSE AF MATCH MELLEM CV OG JOB:
${JSON.stringify(analysis, null, 2)}

VIGTIG INSTRUKTION:
Dette CV er SPECIFIKT tilpasset til ${jobTitle || 'denne stilling'}${companyName ? ` hos ${companyName}` : ''}.
Ansøgningen skal afspejle dette ved at:
1. Referere til de specifikke erfaringer fra CV'et der matcher jobbet
2. Vise forståelse for stillingens krav
3. Koble kandidatens dokumenterede kompetencer direkte til jobopslaget
4. Demonstrere motivation for netop denne rolle og virksomhed

Skriv en fuld ansøgning som ren tekst. Brug KUN dokumenteret erfaring fra CV'et og analysen.`;

    const writingResponse = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: APPLICATION_WRITING_PROMPT,
        },
        {
          role: 'user',
          content: writingMessage,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const textContent = writingResponse.choices[0]?.message?.content;
    if (!textContent) {
      throw new Error('Ingen tekstrespons fra AI');
    }

    // Add header with contact info and date
    const header = createHeader(userProfile, isEnglish ? 'en' : 'da');
    const fullApplication = header + textContent;

    return NextResponse.json({
      application: fullApplication,
      analysis: {
        matchPoints: analysis.matchPoints || [],
        gaps: analysis.gaps || [],
        recommendedFraming: analysis.recommendedFraming || '',
      },
    });
  } catch (err) {
    console.error('Error in application:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Kunne ikke generere ansøgning' },
      { status: 500 }
    );
  }
}
