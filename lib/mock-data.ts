// Mock data for karriere-overblik

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface UserProgress {
  cvUploaded: boolean;
  personProfilCompleted: boolean;
  analyseReady: boolean;
  mulighederExplored: boolean;
}

export interface SavedJob {
  id: string;
  titel: string;
  virksomhed: string;
  status: 'seen' | 'saved' | 'applied';
  savedDate: string;
}

export interface PersonProfilQuestion {
  id: string;
  question: string;
  type: 'scale' | 'multiple' | 'text';
  options?: string[];
}

export interface CVInterpretation {
  erfaringsniveau: string;
  typiskOpgaver: string[];
  kompetenceomraader: string[];
  fortolkning: string;
}

export interface PersonProfilAnalyse {
  arbejdsstil: string;
  motivation: string;
  draenere: string;
  samarbejde: string;
}

export interface SamletAnalyse {
  observationer: Array<{
    titel: string;
    beskrivelse: string;
  }>;
  spoendinger?: string;
}

export interface Job {
  id: string;
  titel: string;
  virksomhed: string;
  lokation: string;
  type: 'remote' | 'hybrid' | 'onsite';
  beskrivelse: string;
  hvorforRelevant: string;
  udfordringer: string;
  afklaring: string;
}

// Legacy interfaces (for compatibility with old context files)
export interface PersonlighedsResultat {
  dimension: string;
  score: number;
  beskrivelse: string;
  interpretation: string;
}

export interface ArbejdsstilProfil {
  tempo: { score: number; label: string };
  struktur: { score: number; label: string };
  socialEnergi: { score: number; label: string };
  fokus: { score: number; label: string };
}

export interface MotivationsProfil {
  drivere: string[];
  draenere: string[];
  arbejdsmiljoePraeeferencer: string[];
}

export interface Indsigt {
  id: string;
  type: 'kompetence' | 'personlighed' | 'karriere';
  overskrift: string;
  beskrivelse: string;
  cta?: { text: string; href: string };
}

export interface ProfilStatus {
  kompleteret: number;
  steps: {
    cv: boolean;
    kompetencer: boolean;
    personprofil: boolean;
  };
}

export interface PlanTema {
  uge: number;
  tema: string;
  beskrivelse: string;
  handlinger: string[];
  completed?: boolean;
}

// ==========================================
// MOCK DATA
// ==========================================

export const mockUserProgress: UserProgress = {
  cvUploaded: true,
  personProfilCompleted: true,
  analyseReady: true,
  mulighederExplored: false,
};

export const mockSavedJobs: SavedJob[] = [
  {
    id: '1',
    titel: 'Projektleder, Digital Udvikling',
    virksomhed: 'Novartis Danmark',
    status: 'saved',
    savedDate: '2025-12-20',
  },
  {
    id: '2',
    titel: 'Produktmanager',
    virksomhed: 'Ørsted',
    status: 'seen',
    savedDate: '2025-12-18',
  },
  {
    id: '3',
    titel: 'Senior Koordinator, Compliance',
    virksomhed: 'Novo Nordisk',
    status: 'applied',
    savedDate: '2025-12-15',
  },
];

export const mockPersonProfilQuestions: PersonProfilQuestion[] = [
  {
    id: '1',
    question: 'Jeg foretrækker at arbejde i et højt tempo med mange bolde i luften',
    type: 'scale',
  },
  {
    id: '2',
    question: 'Jeg har brug for klare strukturer og processer for at arbejde effektivt',
    type: 'scale',
  },
  {
    id: '3',
    question: 'Jeg får energi af at være sammen med andre mennesker i løbet af arbejdsdagen',
    type: 'scale',
  },
  {
    id: '4',
    question: 'Jeg foretrækker opgaver, hvor jeg kan gå i dybden frem for at få overblik',
    type: 'scale',
  },
  {
    id: '5',
    question: 'Det er vigtigt for mig at kunne se, at mit arbejde skaber konkret værdi',
    type: 'scale',
  },
  {
    id: '6',
    question: 'Jeg trives bedst, når jeg kan arbejde selvstændigt uden meget oversight',
    type: 'scale',
  },
  {
    id: '7',
    question: 'Jeg kan godt lide at være involveret i strategiske beslutninger',
    type: 'scale',
  },
  {
    id: '8',
    question: 'Jeg foretrækker klare deadlines og målbare resultater',
    type: 'scale',
  },
  {
    id: '9',
    question: 'Det er vigtigt for mig at have faglig udvikling som en del af min hverdag',
    type: 'scale',
  },
  {
    id: '10',
    question: 'Jeg har det bedst med roller, hvor jeg ved præcis, hvad der forventes',
    type: 'scale',
  },
];

export const mockCVInterpretation: CVInterpretation = {
  erfaringsniveau: 'Senior med 8+ års erfaring',
  typiskOpgaver: [
    'Koordinering af tværfaglige projekter',
    'Stakeholder kommunikation og alignment',
    'Procesoptimering og effektivisering',
    'Rapportering til ledelse',
    'Teamfacilitering og workshops',
  ],
  kompetenceomraader: [
    'Projektledelse og koordinering',
    'Analyse og databehandling',
    'Strategisk planlægning',
    'Kommunikation på alle niveauer',
  ],
  fortolkning: `Baseret på dit CV har du opbygget en stærk profil inden for projektkoordinering og stakeholder management. Din erfaring spænder bredt – fra operationelle opgaver til mere strategisk arbejde. 

Du har bevæget dig fra mere udførende roller mod koordinering og ledelse, hvilket tyder på en naturlig progression mod ansvar og overblik. Der er et tydeligt mønster af, at du trives i grænsefladen mellem forskellige teams og interessenter.

Din baggrund viser også, at du har haft fingrene i mange forskellige typer af opgaver – fra konkret databehandling til facilitering af møder og processer. Det gør dig bred og anvendelig, men kan også betyde, at dit kernefokus ikke altid har været helt tydeligt.`,
};

export const mockPersonProfilAnalyse: PersonProfilAnalyse = {
  arbejdsstil: `Du arbejder bedst, når der er en klar struktur og et defineret flow. Du kan godt lide at vide, hvad der forventes, og hvornår tingene skal være færdige. Det betyder ikke, at du er rigid – men du har brug for rammer at arbejde inden for.

Du får energi af samarbejde og har nemt ved at engagere andre. Du foretrækker ikke at sidde alene i et hjørne – du trives, når du er en del af et team eller et flow med andre mennesker. Det sociale aspekt er en drivkraft for dig.

Dit tempo er afbalanceret. Du kan levere under pres, men du brænder ikke for et konstant højt tempo. Du foretrækker kvalitet og grundighed over hastværk.`,
  
  motivation: `Du bliver motiveret af at se, at tingene faktisk virker. Det er vigtigt for dig, at det, du bruger tid på, fører til noget konkret – en beslutning, et resultat, en synlig forandring.

Du kan lide at lære, men ikke bare for at lære. Du vil gerne forstå ting i en kontekst, så du kan bruge dem. Det er vigtigt for dig at føle, at du udvikler dig fagligt, men det skal ske i praksis – ikke bare i teorien.

Du trives også med en vis grad af indflydelse. Du vil gerne have en stemme og blive hørt, når beslutninger træffes. Du er ikke den, der skal bestemme alt – men du vil gerne være med ved bordet.`,
  
  draenere: `Uklarhed og kaos dræner dig. Når du ikke ved, hvad der forventes, eller når tingene konstant ændrer sig uden forklaring, så tapper det dig for energi. Du har brug for forudsigelighed i en vis grad.

Du kan også blive træt af meget politisk navigation. Hvis du oplever, at beslutninger træffes ud fra personlige agendaer snarere end faglige argumenter, så kan det slide på dig.

Meget ensformigt, rutinepræget arbejde kan også blive en udfordring over tid. Du har brug for variation – men gerne inden for en struktur.`,
  
  samarbejde: `Du fungerer godt i teams, hvor der er gensidig respekt ogklarhed om roller. Du bidrager aktivt og engagerer dig, men du er ikke den, der skal være i centrum hele tiden.

Du er god til at lytte og forstå andres perspektiver, og du kan ofte se sammenhænge, som andre måske ikke lægger mærke til. Det gør dig til en god brobygger i teams.

Du foretrækker åbenhed og direkte kommunikation. Hvis der er spændinger eller problemer, så vil du helst have dem på bordet, så de kan løses – frem for at de ulmer under overfladen.`,
};

export const mockSamletAnalyse: SamletAnalyse = {
  observationer: [
    {
      titel: 'Du er en naturlig koordinator',
      beskrivelse: 'Både din erfaring og din personprofil peger på, at du trives i roller, hvor du skal skabe overblik, forbinde prikker og få ting til at hænge sammen. Du er ikke nødvendigvis den, der udfører opgaverne – men du er god til at sikre, at de bliver gjort, og at alle ved, hvorfor.',
    },
    {
      titel: 'Du har brug for struktur, men også indflydelse',
      beskrivelse: 'Du trives i organiserede miljøer med klare processer, men du ønsker ikke bare at udføre. Du vil gerne have en stemme, og du vil gerne forstå, hvorfor tingene gøres, som de gør. Det gør dig særligt velegnet til roller, hvor der er plads til både struktur og påvirkning.',
    },
    {
      titel: 'Din brede erfaring kan være både en styrke og en udfordring',
      beskrivelse: 'Du har været involveret i mange typer opgaver, hvilket gør dig alsidig. Men det kan også gøre det sværere at definere dig selv skarpt. Når du søger job, skal du være opmærksom på at fortælle en tydelig historie – ellers kan du komme til at virke generisk.',
    },
  ],
  spoendinger: 'Der er en spænding mellem din præference for struktur og din ønske om indflydelse. I meget hierarkiske organisationer kan du føle dig låst, mens du i meget kaotiske organisationer kan føle dig overvældet. Dit ideelle miljø er sandsynligvis et sted, hvor der er klare rammer, men også plads til dialog og justering.',
};

export const mockJobsForCurrentTrack: Job[] = [
  {
    id: 'ct1',
    titel: 'Senior Projektkoordinator',
    virksomhed: 'Novo Nordisk',
    lokation: 'Bagsværd',
    type: 'hybrid',
    beskrivelse: 'Koordiner strategiske projekter på tværs af vores globale organisation. Arbejd tæt sammen med projektledere og sikre alignment mellem teams.',
    hvorforRelevant: `Dette job er en naturlig forlængelse af din nuværende erfaring. Du får mulighed for at bygge videre på dine koordinerings- og kommunikationskompetencer, men i et større og mere komplekst miljø. Rollen ligger tæt på det, du allerede kan – hvilket betyder, at du kan gå ind og skabe værdi hurtigt.`,
    udfordringer: `Den globale koordinering kan være krævende – forskellige tidszoner, kulturer og måder at arbejde på. Du skal være komfortabel med at navigere i en stor organisation, hvor beslutninger kan tage tid. Der vil også være perioder med høj arbejdsbyrde, især omkring projektdeadlines.`,
    afklaring: `Dette job kan hjælpe dig med at afklare, om du vil bevæge dig videre mod mere strategisk projektledelse, eller om du foretrækker at blive specialist i koordinering og processer. Det vil også teste, hvor godt du trives i en stor, international organisation versus mindre, mere agile virksomheder.`,
  },
  {
    id: 'ct2',
    titel: 'Projektleder, Digital Innovation',
    virksomhed: 'Ørsted',
    lokation: 'Fredericia',
    type: 'hybrid',
    beskrivelse: 'Led digitale projekter, der understøtter vores grønne omstilling. Fra ide til implementering.',
    hvorforRelevant: `Dette job repræsenterer et næste skridt – fra koordinering til egentlig projektledelse. Du har mange af de kompetencer, der kræves, og din erfaring med stakeholder management vil være central. Det er en mulighed for at tage mere ansvar og få dit eget mandat.`,
    udfordringer: `Du skal være klar til at træffe beslutninger og stå ved dem – også når der ikke er fuld konsensus. Projektledelse betyder, at du får budgetansvar, og at du i højere grad bliver målt på konkrete resultater. Du skal også kunne håndtere, når projekter ikke går som planlagt.`,
    afklaring: `Dette job vil hurtigt vise dig, om du er klar til at stå i front som projektleder, eller om du faktisk trives bedst som den stærke koordinator i baggrunden. Det vil også afklare, om en stor, purpose-driven virksomhed som Ørsted giver mening for dig.`,
  },
  {
    id: 'ct3',
    titel: 'Business Analyst',
    virksomhed: 'Danske Bank',
    lokation: 'København',
    type: 'hybrid',
    beskrivelse: 'Analyser forretningsprocesser og bridge mellem tech og business. Identificer inefficiencies og forbedringsmuligheder.',
    hvorforRelevant: `Din erfaring med procesoptimering og din evne til at forstå komplekse sammenhænge gør dig relevant. Som business analyst får du mulighed for at gå dybere ned i analyse-delen, som du måske har berørt i dine tidligere roller, men ikke haft som kernefokus.`,
    udfordringer: `Rollen kræver en mere teknisk forståelse, end du måske har i dag. Du skal kunne tale med IT-folk og forstå systemlandskaber. Det kan også være udfordrende at navigere mellem forskellige interesser – tech vil have én ting, business en anden. Du skal kunne forblive neutral.`,
    afklaring: `Dette job kan afklare, om du faktisk brænder for analyse og optimering, eller om det bare er noget, du er okay til. Det vil også vise, om du trives i grænsefladen mellem IT og forretning – det kræver en særlig tålmodighed og oversættelsesevne.`,
  },
  {
    id: 'ct4',
    titel: 'Scrum Master',
    virksomhed: 'Lego',
    lokation: 'Billund',
    type: 'hybrid',
    beskrivelse: 'Faciliter agile teams, fjern impediments og drive continuous improvement.',
    hvorforRelevant: `Du har erfaring med facilitering og teamwork, og du trives, når du kan hjælpe andre med at levere. Som Scrum Master er du ikke den, der bestemmer – men du er den, der sikrer, at teamet har de bedste betingelser for at lykkes. Det matcher din profil godt.`,
    udfordringer: `Du skal være komfortabel med ikke at have direkte autoritet. Som Scrum Master leder du gennem indflydelse, ikke gennem kommando. Det kræver også, at du er tålmodig – nogle gange går ting langsomt, og du skal hjælpe teamet med at finde deres egen vej.`,
    afklaring: `Dette job vil afklare, om du faktisk kan lide at være facilitator på fuld tid, eller om du har brug for mere direkte ansvar og indflydelse. Det vil også teste, hvor godt du trives i et rent agile miljø, hvor forandring er konstant.`,
  },
];

export const mockJobsForNewDirection: Job[] = [
  {
    id: 'nd1',
    titel: 'Customer Success Manager',
    virksomhed: 'Zendesk',
    lokation: 'København',
    type: 'remote',
    beskrivelse: 'Sikr at vores kunder får maksimal værdi af platformen. Drive adoption, retention og identificere upsell muligheder.',
    hvorforRelevant: `Selvom du ikke har direkte CS-erfaring, så har du mange af de kompetencer, der kræves: kommunikation, forståelse for processer, og evnen til at se tingene fra kundens perspektiv. Dette job giver dig mulighed for at bruge din erfaring i en helt ny kontekst – og det kan være befriende.`,
    udfordringer: `Du skal lære en helt ny discipline, og du skal være komfortabel med at starte et sted, hvor du ikke er eksperten. CS kan også være emotionelt krævende – du skal håndtere frustrerede kunder og samtidig repræsentere virksomhedens interesser. Der er også ofte et salgselement, som kan være nyt for dig.`,
    afklaring: `Dette job vil afklare, om du faktisk trives med kundekontakt på fuld tid, eller om det er noget, du foretrækker i mindre doser. Det vil også vise, om en SaaS-virksomhed med et hurtigt tempo passer til dig, eller om du foretrækker mere traditionelle organisationer.`,
  },
  {
    id: 'nd2',
    titel: 'Operations Manager',
    virksomhed: 'Mærsk',
    lokation: 'København',
    type: 'hybrid',
    beskrivelse: 'Optimer daglig drift, styrke processer og led et team på 12 personer.',
    hvorforRelevant: `Din erfaring med procesoptimering og koordinering kan oversættes direkte til operations. Du forstår, hvordan man får ting til at køre, og du er god til at se, hvor der er flaskehalse. Operations handler i bund og grund om at sikre, at tingene glider – og det er du god til.`,
    udfordringer: `Operations kan være en "brandslukkende" rolle, hvor du konstant skal håndtere akutte problemer. Det kræver, at du kan bevare roen under pres og prioritere hurtigt. Du får også direkte personaleansvar, hvilket kan være nyt for dig.`,
    afklaring: `Dette job vil afklare, om du faktisk har lyst til at lede mennesker direkte, eller om du foretrækker at påvirke gennem projekter og processer. Det vil også teste, om du trives med den operationelle side, eller om du faktisk foretrækker mere strategisk arbejde.`,
  },
  {
    id: 'nd3',
    titel: 'Change Manager',
    virksomhed: 'IKEA',
    lokation: 'Høje-Taastrup',
    type: 'hybrid',
    beskrivelse: 'Led organisationsforandringer, kommuniker change og understøt medarbejdere gennem transitioner.',
    hvorforRelevant: `Du har erfaring med at være i grænsefladen mellem forskellige parter, og du forstår, hvordan man kommunikerer på forskellige niveauer. Change management handler meget om at skabe forståelse og tryghed – og det er kompetencer, du har. Det er også en rolle, hvor din brede erfaring bliver en styrke.`,
    udfordringer: `Change management kan være følelsesmæssigt krævende – du skal ofte håndtere modstand, frygt og usikkerhed. Du skal også være komfortabel med at være budbringer af beslutninger, du ikke selv har truffet. Det kræver en særlig grad af empati kombineret med fasthed.`,
    afklaring: `Dette job vil afklare, om du trives med at arbejde med "det menneskelige lag" af forandring, eller om du faktisk foretrækker de mere tekniske og strukturelle aspekter. Det vil også vise, om du kan håndtere at være i en rolle, hvor du ikke altid er populær.`,
  },
  {
    id: 'nd4',
    titel: 'Product Owner',
    virksomhed: 'Unity Technologies',
    lokation: 'København',
    type: 'hybrid',
    beskrivelse: 'Definer product vision og roadmap for vores creator tools. Prioriter features baseret på kundeværdi.',
    hvorforRelevant: `Din strategiske tænkning og din evne til at forstå forskellige interessenters behov gør dig interessant som Product Owner. Du er god til at se sammenhænge og prioritere. Product ownership handler også om at facilitere mellem forskellige behov – noget du har erfaring med.`,
    udfordringer: `Du skal være klar til at træffe beslutninger uden at have alle facts. Du skal også kunne sige nej – ofte – og forklare hvorfor. Rollen kræver også en vis teknisk forståelse og en evne til at tænke i produkttermer, hvilket kan være nyt. Du vil også blive udfordret på at tænke mere visionært.`,
    afklaring: `Dette job vil afklare, om du trives med at definere retning og vision, eller om du foretrækker at arbejde inden for en allerede fastlagt ramme. Det vil også teste, om du faktisk brænder for produktudvikling, eller om det bare lyder interessant i teorien.`,
  },
];
