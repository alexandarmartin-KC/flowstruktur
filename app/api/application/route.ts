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

// Detect language from CV content - improved detection
function detectLanguage(cvText: string): 'da' | 'en' {
  // Extended keyword lists for better detection
  const danishKeywords = [
    'erfaring', 'uddannelse', 'kompetencer', 'ansvar', 'virksomhed', 'stilling',
    'arbejde', 'opgaver', 'projekter', 'ledelse', 'udvikling', 'ansvarlig',
    'gennemført', 'implementeret', 'koordineret', 'samarbejde', 'kunde',
    'resultat', 'mål', 'strategi', 'analyse', 'rapport', 'dansk', 'engelsk',
    'modersmål', 'flydende', 'år', 'måneder', 'nutid', 'tidligere',
    'faglige', 'professionel', 'erhvervserfaring', 'nøglekompetencer'
  ];
  const englishKeywords = [
    'experience', 'education', 'skills', 'responsibility', 'company', 'position',
    'work', 'tasks', 'projects', 'leadership', 'development', 'responsible',
    'completed', 'implemented', 'coordinated', 'collaboration', 'customer',
    'result', 'goal', 'strategy', 'analysis', 'report', 'danish', 'english',
    'native', 'fluent', 'years', 'months', 'present', 'previous',
    'professional', 'summary', 'achievements', 'key', 'qualifications'
  ];
  
  let danishCount = 0;
  let englishCount = 0;
  
  const lowerText = cvText.toLowerCase();
  
  danishKeywords.forEach(keyword => {
    // Count occurrences, not just presence
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) danishCount += matches.length;
  });
  
  englishKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) englishCount += matches.length;
  });
  
  // Log for debugging
  console.log(`Language detection: Danish=${danishCount}, English=${englishCount}`);
  
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
Dit job er at analysere kandidatens faktiske erfaring ærligt og præcist.
Vær realistisk - overdriv ikke, men undervurder heller ikke.

OPGAVE:
Lav en systematisk og ærlig analyse.

TRIN 1 - MATCH-PUNKTER (identificér kun DOKUMENTERET erfaring):
For hvert hovedkrav i jobbet, find bevis fra CV'et:
- Krav: [hvad jobbet kræver]
- Bevis: [specifik, dokumenteret erfaring - vær præcis om niveau og omfang]
- Styrke: [direkte match / indirekte match / overførbar]

VÆR PRÆCIS:
- "Vendor management" er IKKE det samme som "personalledelse"
- "Koordinering" er IKKE det samme som "linjeansvar"
- "Erfaring med systemer" er IKKE det samme som "omfattende erfaring"
- Brug de faktiske ord fra CV'et, ikke opskaleringer

TRIN 2 - GAPS/RISICI (vær ærlig):
Identificér krav hvor kandidaten mangler direkte erfaring:
- Krav: [hvad der mangler]
- Realitet: [hvad kandidaten faktisk har i stedet]
- Bro: [hvordan overførbar erfaring kan præsenteres ÆRLIGT]

TRIN 3 - ANBEFALET VINKEL:
Beskriv en ærlig og overbevisende framing:
- Hvad er kandidatens FAKTISKE styrkeposition?
- Hvilken erfaring bør IKKE overdrives?
- Hvordan kan gaps adresseres modent og selvsikkert (ikke defensivt)?
- Hvad er den overførbare værdi fra kandidatens baggrund?

RETURNER JSON:
{
  "matchPoints": [
    {"requirement": "...", "evidence": "...", "strength": "direct|indirect|transferable"}
  ],
  "gaps": [
    {"requirement": "...", "reality": "...", "bridge": "..."}
  ],
  "recommendedFraming": "..."
}`;

const APPLICATION_WRITING_PROMPT = `DU ER EN PROFESSIONEL ANSØGNINGSSKRIVER.

ALLERVIGTIGSTE REGEL - OPFIND ALDRIG:
❌ ALDRIG opfind virksomhedsnavne - brug KUN det navn der står i jobopslaget
❌ ALDRIG nævn specifikke virksomheder der IKKE er nævnt i jobopslaget
❌ Hvis virksomhedsnavn ikke er givet, skriv "virksomheden" eller "jer" - ALDRIG et specifikt navn
❌ ALDRIG opfind tal, procenter, eller resultater der ikke er i CV'et
❌ ALDRIG tilføj erfaring, projekter, eller roller der ikke er dokumenteret

KRITISKE PRINCIPPER:
1. PRÆCISION OVER OVERDRIVELSE - Brug nøjagtige formuleringer, ikke oppustede
2. ÆRLIG SELVSIKKERHED - Vis styrker uden at overdrive niveau
3. OVERFØRBARHED - Vis hvordan erfaring translater, ikke at den er identisk
4. MODENHED - Adressér gaps selvsikkert, ikke defensivt

ORDVALG DER SKAL UNDGÅS:
❌ "omfattende erfaring" → ✅ "solid erfaring" eller "målrettet erfaring"
❌ "stærk baggrund i" → ✅ "erfaring med" eller "dokumenteret arbejde med"  
❌ "ekspert i" → ✅ "kompetent inden for" eller "erfaren med"
❌ "Selvom jeg ikke har..." → ✅ "Min erfaring kommer primært fra X, hvilket giver..."
❌ "Jeg er overbevist om at..." → ✅ Vis det gennem konkrete eksempler i stedet

ORDVALG DER ER STÆRKE:
✅ "har haft ansvar for" - specifikt og faktuelt
✅ "i praksis" - viser hands-on erfaring
✅ "konkret erfaring med" - præcist
✅ "paralleller til" - viser overførbarhed uden at påstå identisk erfaring
✅ "direkte relevans for" - linker til jobkrav

HÅNDTERING AF GAPS:
- Skriv IKKE "Selvom jeg ikke har X..." (defensivt)
- Skriv I STEDET "Min erfaring fra Y giver direkte parallel til X, herunder..." (offensiv men ærlig)
- Hvis erfaring er fra anden branche: EJ det og vis hvorfor det er stærkere/anderledes

LEDELSE OG PEOPLE MANAGEMENT:
Hvis jobbet kræver ledelse/management, vær PRÆCIS om hvad kandidaten har:
- "Koordinering af leverandører" ≠ "personaleledelse" - sig det korrekt
- "Daglig opfølgning" kan beskrives, men lad være med at kalde det "linjeansvar" hvis det ikke er det
- Hvis der er team-koordinering uden formelt ansvar, beskriv det ærligt

ABSOLUTTE REGLER:
- Brug KUN information fra CV'et og analysen
- Opfind IKKE erfaring, resultater eller ansvar
- Naturligt, professionelt sprog
- Konkret og relevant for DENNE stilling
- Lad dokumenteret erfaring tale - ikke salgsretorik

FORMAT:
- Ren tekst (IKKE markdown)
- Start DIREKTE med brødtekst (ingen header)
- Første afsnit: Motivation for denne stilling - konkret og specifik
- 2-3 afsnit: Kobl dokumenteret erfaring til specifikke jobkrav
- Afslutning: Professionel interesse for dialog
- Almindelige linjeskift mellem afsnit
- Længde: 250-400 ord

TONE:
- Professionel, nøgtern, selvsikker
- Konkret og faktabaseret
- Ikke overdrevet eller underdrevet
- Moden og realistisk

SPROG:
- Skriv på det sprog som CV'et er skrevet på`;

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
      model: 'gpt-4.1',  // Better instruction following for precise analysis
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
    const languageInstruction = cvLanguage === 'en' 
      ? 'LANGUAGE: Write this application in ENGLISH - the CV is in English.'
      : 'SPROG: Skriv denne ansøgning på DANSK - CV\'et er på dansk.';

    const writingMessage = `${languageInstruction}

Skriv en professionel ansøgning baseret på denne analyse:

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

KRITISK: Brug KUN virksomhedsnavnet "${companyName || '[IKKE ANGIVET - brug "virksomheden" eller "jer"]'}" - opfind ALDRIG andre navne!

Skriv en fuld ansøgning som ren tekst. Brug KUN dokumenteret erfaring fra CV'et og analysen.`;

    const writingResponse = await getOpenAI().chat.completions.create({
      model: 'gpt-4.1',  // Better instruction following for precise, non-inflated writing
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
