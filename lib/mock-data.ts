// Mock data for karrierecoach platform

export interface Kompetence {
  id: string;
  navn: string;
  kategori: 'teknisk' | 'soft' | 'ledelses' | 'sprog';
  niveau?: 'begynder' | 'erfaren' | 'ekspert';
  styrke?: number; // 1-5
  interesse?: number; // 1-5
  overfoerbarhed?: 'hoej' | 'medium' | 'lav';
}

export interface PersonlighedsSpoergsmaal {
  id: string;
  spoergsmaal: string;
  dimension: string;
}

export interface PersonlighedsResultat {
  dimension: string;
  score: number; // 1-5
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

export interface Karrierespor {
  id: string;
  titel: string;
  beskrivelse: string;
  matchScore: number;
  topKompetencer: string[];
  vaeekstpotentiale: string;
  typiskeLoenSpan: string;
  hvorforMatch: string[];
  udfordringer: string[];
  naesteSkridt?: string[];
}

export interface Job {
  id: string;
  titel: string;
  virksomhed: string;
  lokation: string;
  remote: 'remote' | 'hybrid' | 'onsite';
  senioritet: 'junior' | 'medior' | 'senior';
  matchScore: number;
  kompetenceMatch: number;
  arbejdsstilMatch: number;
  motivationMatch: number;
  hvorforPasser: string[];
  gaps: string[];
  beskrivelse: string;
  krav: string[];
  ansvarlig: string[];
}

export interface Indsigt {
  id: string;
  type: 'kompetence' | 'personlighed' | 'karriere';
  overskrift: string;
  beskrivelse: string;
  cta?: { text: string; href: string };
}

export interface ProfilStatus {
  kompleteret: number; // 0-100
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

// Mock kompetencer
export const mockKompetencer: Kompetence[] = [
  { id: '1', navn: 'Kommunikation', kategori: 'soft', styrke: 5, interesse: 5, overfoerbarhed: 'hoej' },
  { id: '2', navn: 'Dataanalyse', kategori: 'teknisk', styrke: 4, interesse: 4, overfoerbarhed: 'hoej' },
  { id: '3', navn: 'Projektledelse', kategori: 'ledelses', styrke: 5, interesse: 5, overfoerbarhed: 'hoej' },
  { id: '4', navn: 'Kundeservice', kategori: 'soft', styrke: 4, interesse: 3, overfoerbarhed: 'hoej' },
  { id: '5', navn: 'Strategisk tænkning', kategori: 'soft', styrke: 4, interesse: 5, overfoerbarhed: 'hoej' },
  { id: '6', navn: 'Excel & Google Sheets', kategori: 'teknisk', styrke: 5, interesse: 3, overfoerbarhed: 'hoej' },
  { id: '7', navn: 'SQL', kategori: 'teknisk', styrke: 3, interesse: 4, overfoerbarhed: 'medium' },
  { id: '8', navn: 'Teamledelse', kategori: 'ledelses', styrke: 4, interesse: 5, overfoerbarhed: 'hoej' },
  { id: '9', navn: 'Forhandling', kategori: 'soft', styrke: 4, interesse: 3, overfoerbarhed: 'hoej' },
  { id: '10', navn: 'Præsentation', kategori: 'soft', styrke: 5, interesse: 4, overfoerbarhed: 'hoej' },
  { id: '11', navn: 'Procesoptimering', kategori: 'teknisk', styrke: 4, interesse: 5, overfoerbarhed: 'hoej' },
  { id: '12', navn: 'Engelsk (flydende)', kategori: 'sprog', styrke: 5, interesse: 5, overfoerbarhed: 'hoej' },
  { id: '13', navn: 'Stakeholder management', kategori: 'soft', styrke: 5, interesse: 4, overfoerbarhed: 'hoej' },
  { id: '14', navn: 'Agile/Scrum', kategori: 'teknisk', styrke: 4, interesse: 4, overfoerbarhed: 'medium' },
  { id: '15', navn: 'Budgetstyring', kategori: 'ledelses', styrke: 3, interesse: 2, overfoerbarhed: 'medium' },
];

// Mock personlighedsspørgsmål
export const mockPersonlighedsSpoergsmaal: PersonlighedsSpoergsmaal[] = [
  { id: '1', spoergsmaal: 'Jeg foretrækker strukturerede planer frem for spontane beslutninger', dimension: 'Struktur vs. Fleksibilitet' },
  { id: '2', spoergsmaal: 'Jeg får energi af at være sammen med andre mennesker', dimension: 'Social energi' },
  { id: '3', spoergsmaal: 'Jeg trives med at arbejde i højt tempo', dimension: 'Tempo' },
  { id: '4', spoergsmaal: 'Jeg fokuserer helst på én opgave ad gangen', dimension: 'Fokus' },
  { id: '5', spoergsmaal: 'Jeg elsker at lære nye ting og skifte fokus', dimension: 'Læringsstil' },
  { id: '6', spoergsmaal: 'Jeg foretrækker at arbejde selvstændigt', dimension: 'Arbejdsstil' },
  { id: '7', spoergsmaal: 'Jeg kan godt lide at tage ansvar og træffe beslutninger', dimension: 'Initiativ' },
  { id: '8', spoergsmaal: 'Jeg nyder at hjælpe og støtte andre', dimension: 'Samarbejde' },
  { id: '9', spoergsmaal: 'Jeg er motiveret af at nå konkrete mål og resultater', dimension: 'Motivation' },
  { id: '10', spoergsmaal: 'Jeg trives med forandringer og nye udfordringer', dimension: 'Forandring' },
  { id: '11', spoergsmaal: 'Jeg foretrækker detaljeret information frem for det store billede', dimension: 'Detaljeniveau' },
  { id: '12', spoergsmaal: 'Jeg er komfortabel med at præsentere for større grupper', dimension: 'Kommunikation' },
];

// Mock karrierespor
export const mockKarrierespor: Karrierespor[] = [
  {
    id: '1',
    titel: 'Projektleder',
    beskrivelse: 'Leder og koordinerer tværfaglige projekter fra ide til levering. Ansvarlig for scope, tid og budget.',
    matchScore: 87,
    topKompetencer: ['Projektledelse', 'Kommunikation', 'Stakeholder management'],
    vaeekstpotentiale: 'Meget højt – efterspørgsel vokser med 15% årligt',
    typiskeLoenSpan: '550.000 - 750.000 kr.',
    hvorforMatch: [
      'Din projektledelseservaring er fremragende',
      'Du har stærke kommunikationsevner',
      'Stakeholder management er en kernekompetence',
    ],
    udfordringer: [
      'Kræver ofte certificering (PMP/PRINCE2)',
      'Kan være stressende i spidsbelastningsperioder',
    ],
    naesteSkridt: [
      'Overvej PMP certificering',
      'Byg netværk i PMI Danmark',
      'Læs om agile projektledelse',
    ],
  },
  {
    id: '2',
    titel: 'Business Analyst',
    beskrivelse: 'Analyserer forretningsprocesser, identificerer forbedringer og bygger bro mellem IT og forretning.',
    matchScore: 82,
    topKompetencer: ['Dataanalyse', 'Procesoptimering', 'Kommunikation'],
    vaeekstpotentiale: 'Højt – særligt inden for tech og finans',
    typiskeLoenSpan: '500.000 - 650.000 kr.',
    hvorforMatch: [
      'Dine analytiske evner er stærke',
      'Du har erfaring med procesoptimering',
      'Kommunikation på tværs er en styrke',
    ],
    udfordringer: [
      'Kræver ofte teknisk forståelse',
      'Kan være udfordrende at navigere mellem IT og business',
    ],
    naesteSkridt: [
      'Lær mere om business process modeling',
      'Styrk SQL kompetencer',
      'Udforsk agile analyse metoder',
    ],
  },
  {
    id: '3',
    titel: 'Customer Success Manager',
    beskrivelse: 'Sikrer kundernes succes og tilfredshed. Driver adoption, retention og upsell.',
    matchScore: 78,
    topKompetencer: ['Kundeservice', 'Kommunikation', 'Forhandling'],
    vaeekstpotentiale: 'Meget højt – nøglerolle i SaaS virksomheder',
    typiskeLoenSpan: '450.000 - 600.000 kr.',
    hvorforMatch: [
      'Dit kundefokus er fremragende',
      'Du har stærke relationelle kompetencer',
      'Kommunikation er en kernestyrke',
    ],
    udfordringer: [
      'Kan være emotionelt drænende',
      'Kræver høj tilgængelighed',
    ],
  },
  {
    id: '4',
    titel: 'Operations Manager',
    beskrivelse: 'Optimerer daglig drift, styrer processer og sikrer effektiv ressourceallokering.',
    matchScore: 75,
    topKompetencer: ['Procesoptimering', 'Teamledelse', 'Budgetstyring'],
    vaeekstpotentiale: 'Stabilt – central rolle i de fleste organisationer',
    typiskeLoenSpan: '520.000 - 680.000 kr.',
    hvorforMatch: [
      'Din erfaring med procesoptimering matcher',
      'Teamledelse er en styrke',
      'Du har operationelt mindset',
    ],
    udfordringer: [
      'Ofte mange leverandører at koordinere',
      'Kræver stærke prioriteringsevner',
    ],
  },
  {
    id: '5',
    titel: 'Product Owner',
    beskrivelse: 'Definerer produkt vision og roadmap. Prioriterer features baseret på kundeværdi.',
    matchScore: 72,
    topKompetencer: ['Strategisk tænkning', 'Agile/Scrum', 'Stakeholder management'],
    vaeekstpotentiale: 'Meget højt – kritisk i produktdrevne virksomheder',
    typiskeLoenSpan: '550.000 - 700.000 kr.',
    hvorforMatch: [
      'Strategisk tænkning er en styrke',
      'Du har erfaring med agile metoder',
      'Stakeholder management kompetencer matcher',
    ],
    udfordringer: [
      'Kræver teknisk forståelse',
      'Mange modstridende prioriteter',
    ],
  },
];

// Mock jobs
export const mockJobs: Job[] = [
  {
    id: '1',
    titel: 'Senior Projektleder',
    virksomhed: 'Danske Bank',
    lokation: 'København',
    remote: 'hybrid',
    senioritet: 'senior',
    matchScore: 91,
    kompetenceMatch: 93,
    arbejdsstilMatch: 90,
    motivationMatch: 89,
    hvorforPasser: [
      'Din projektledelseservaring matcher perfekt',
      'Dine stakeholder management skills er stærke',
      'Du har erfaring med finanssektoren',
    ],
    gaps: [
      'PMI-certificering ville styrke din profil',
    ],
    beskrivelse: 'Vi søger en erfaren projektleder til at lede digitale transformationsprojekter.',
    krav: ['5+ års erfaring', 'Projektledelse', 'Agile', 'Stakeholder management'],
    ansvarlig: ['Lede 3-5 projekter samtidigt', 'Styre budgetter op til 10M kr', 'Rapportere til ledelsen'],
  },
  {
    id: '2',
    titel: 'Business Analyst',
    virksomhed: 'Novo Nordisk',
    lokation: 'Bagsværd',
    remote: 'hybrid',
    senioritet: 'medior',
    matchScore: 88,
    kompetenceMatch: 90,
    arbejdsstilMatch: 88,
    motivationMatch: 86,
    hvorforPasser: [
      'Dine dataanalyse kompetencer passer til rollen',
      'Din erfaring med procesoptimering er relevant',
      'Kommunikationsevner matcher kravene',
    ],
    gaps: [
      'Erfaring med pharma ville være en fordel',
      'Power BI kendskab efterspørges',
    ],
    beskrivelse: 'Som Business Analyst bliver du en central del af vores digitale transformation.',
    krav: ['3+ års erfaring', 'SQL', 'Excel', 'Procesforbedring'],
    ansvarlig: ['Analysere forretningsprocesser', 'Dokumentere krav', 'Facilitere workshops'],
  },
  {
    id: '3',
    titel: 'Customer Success Manager',
    virksomhed: 'Zendesk',
    lokation: 'København',
    remote: 'remote',
    senioritet: 'medior',
    matchScore: 85,
    kompetenceMatch: 87,
    arbejdsstilMatch: 85,
    motivationMatch: 83,
    hvorforPasser: [
      'Dit kundefokus er fremragende',
      'Dine kommunikationsevner matcher rollen',
      'Erfaring med SaaS er en fordel',
    ],
    gaps: [
      'Erfaring med enterprise kunder ville styrke profilen',
    ],
    beskrivelse: 'Hjælp vores kunder med at få maksimal værdi af vores platform.',
    krav: ['2+ års CS erfaring', 'SaaS kendskab', 'Engelsk flydende'],
    ansvarlig: ['Onboarde nye kunder', 'Drive retention', 'Identificere upsell muligheder'],
  },
  {
    id: '4',
    titel: 'Operations Manager',
    virksomhed: 'Mærsk',
    lokation: 'Esbjerg',
    remote: 'onsite',
    senioritet: 'senior',
    matchScore: 82,
    kompetenceMatch: 84,
    arbejdsstilMatch: 82,
    motivationMatch: 80,
    hvorforPasser: [
      'Din erfaring med procesoptimering matcher',
      'Teamledelse er en kernekompetence hos dig',
      'Du har erfaring med komplekse operationer',
    ],
    gaps: [
      'Logistics baggrund ville være ideelt',
      'Lean Six Sigma certificering ønskes',
    ],
    beskrivelse: 'Led vores operations team og optimer daglig drift i havneområdet.',
    krav: ['5+ års operations erfaring', 'Ledelse', 'Procesoptimering'],
    ansvarlig: ['Optimere operations', 'Lede team på 15 personer', 'Reducere costs'],
  },
  {
    id: '5',
    titel: 'Projektkoordinator',
    virksomhed: 'Copenhagen Capacity',
    lokation: 'København',
    remote: 'hybrid',
    senioritet: 'junior',
    matchScore: 79,
    kompetenceMatch: 80,
    arbejdsstilMatch: 79,
    motivationMatch: 78,
    hvorforPasser: [
      'God match på kommunikationsevner',
      'Din organisatoriske tilgang passer',
      'Interesse for projektarbejde',
    ],
    gaps: [
      'Mere projekterfaring ville styrke ansøgningen',
    ],
    beskrivelse: 'Støt vores projektledere i at levere impactfulde projekter.',
    krav: ['1+ års erfaring', 'Organisering', 'Kommunikation', 'Engelsk'],
    ansvarlig: ['Koordinere projektaktiviteter', 'Opdatere projektplaner', 'Kommunikere med stakeholders'],
  },
  {
    id: '6',
    titel: 'Product Owner',
    virksomhed: 'Unity Technologies',
    lokation: 'København',
    remote: 'hybrid',
    senioritet: 'medior',
    matchScore: 77,
    kompetenceMatch: 78,
    arbejdsstilMatch: 77,
    motivationMatch: 76,
    hvorforPasser: [
      'Strategisk tænkning er en styrke hos dig',
      'Du har erfaring med agile metoder',
      'Stakeholder management kompetencer matcher',
    ],
    gaps: [
      'Tech produkterfaring ville være en fordel',
      'Certified Scrum Product Owner ønskes',
    ],
    beskrivelse: 'Shape the future of our creator tools product.',
    krav: ['3+ års produkterfaring', 'Agile/Scrum', 'User stories'],
    ansvarlig: ['Definere product vision', 'Prioritere backlog', 'Arbejde tæt med development team'],
  },
  {
    id: '7',
    titel: 'Data Analyst',
    virksomhed: 'Trustpilot',
    lokation: 'København',
    remote: 'remote',
    senioritet: 'junior',
    matchScore: 75,
    kompetenceMatch: 78,
    arbejdsstilMatch: 74,
    motivationMatch: 73,
    hvorforPasser: [
      'Dataanalyse er en kernekompetence',
      'SQL skills matcher kravene',
      'Du har analytisk tilgang',
    ],
    gaps: [
      'Python kendskab ville styrke profilen',
      'Mere erfaring med BI tools',
    ],
    beskrivelse: 'Join our data team and turn data into insights.',
    krav: ['SQL', 'Excel/Google Sheets', 'Analytisk mindset'],
    ansvarlig: ['Analysere data', 'Lave rapporter', 'Understøtte beslutningstagning'],
  },
  {
    id: '8',
    titel: 'Scrum Master',
    virksomhed: 'Lego',
    lokation: 'Billund',
    remote: 'hybrid',
    senioritet: 'medior',
    matchScore: 73,
    kompetenceMatch: 75,
    arbejdsstilMatch: 73,
    motivationMatch: 71,
    hvorforPasser: [
      'Agile erfaring er relevant',
      'Kommunikationsevner matcher rollen',
      'Du har teamfacilitator mindset',
    ],
    gaps: [
      'Certified Scrum Master anbefales',
      'Mere erfaring med agile coaching',
    ],
    beskrivelse: 'Facilitate agile teams and drive continuous improvement.',
    krav: ['2+ års Scrum erfaring', 'Agile certificering', 'Coaching skills'],
    ansvarlig: ['Facilitere scrum events', 'Fjerne impediments', 'Coache teamet'],
  },
  {
    id: '9',
    titel: 'Account Manager',
    virksomhed: 'Google',
    lokation: 'København',
    remote: 'hybrid',
    senioritet: 'medior',
    matchScore: 71,
    kompetenceMatch: 73,
    arbejdsstilMatch: 71,
    motivationMatch: 69,
    hvorforPasser: [
      'Forhandlingsevner er stærke',
      'Kundefokus matcher rollen',
      'Kommunikation på højt niveau',
    ],
    gaps: [
      'Digital advertising erfaring ønskes',
      'Tech sales baggrund ville være ideelt',
    ],
    beskrivelse: 'Drive growth with our largest advertising clients.',
    krav: ['3+ års sales erfaring', 'Engelsk flydende', 'Forhandling'],
    ansvarlig: ['Administrere key accounts', 'Drive revenue growth', 'Forhandle kontrakter'],
  },
  {
    id: '10',
    titel: 'Change Manager',
    virksomhed: 'Ørsted',
    lokation: 'Fredericia',
    remote: 'hybrid',
    senioritet: 'senior',
    matchScore: 69,
    kompetenceMatch: 70,
    arbejdsstilMatch: 69,
    motivationMatch: 68,
    hvorforPasser: [
      'Kommunikationsevner er fremragende',
      'Du har erfaring med forandringsledelse',
      'Stakeholder management matcher',
    ],
    gaps: [
      'Change management certificering ønskes',
      'Erfaring med store transformationer',
    ],
    beskrivelse: 'Lead organizational change in our green transformation.',
    krav: ['5+ års change management', 'Kommunikation', 'Projektledelse'],
    ansvarlig: ['Designe change strategy', 'Lede change initiativer', 'Understøtte medarbejdere'],
  },
  {
    id: '11',
    titel: 'Process Consultant',
    virksomhed: 'Deloitte',
    lokation: 'København',
    remote: 'hybrid',
    senioritet: 'medior',
    matchScore: 67,
    kompetenceMatch: 69,
    arbejdsstilMatch: 67,
    motivationMatch: 65,
    hvorforPasser: [
      'Procesoptimering er en styrke',
      'Analytisk tilgang matcher kravene',
      'Kommunikation på konsulent niveau',
    ],
    gaps: [
      'Consulting erfaring ville styrke profilen',
      'Lean Six Sigma Green Belt ønskes',
    ],
    beskrivelse: 'Help our clients optimize and transform their processes.',
    krav: ['3+ års erfaring', 'Procesanalyse', 'Præsentation', 'Engelsk'],
    ansvarlig: ['Analysere processer', 'Designe løsninger', 'Præsentere anbefalinger'],
  },
  {
    id: '12',
    titel: 'Team Lead',
    virksomhed: 'Saxo Bank',
    lokation: 'København',
    remote: 'hybrid',
    senioritet: 'senior',
    matchScore: 65,
    kompetenceMatch: 67,
    arbejdsstilMatch: 65,
    motivationMatch: 63,
    hvorforPasser: [
      'Teamledelse er en kernekompetence',
      'Du har erfaring med coaching',
      'Kommunikationsevner matcher',
    ],
    gaps: [
      'Fintech erfaring ville være ideelt',
      'Større ledelsesansvar efterspørges',
    ],
    beskrivelse: 'Lead a cross-functional team in our trading technology division.',
    krav: ['4+ års ledelseserfaring', 'Coaching', 'Performance management'],
    ansvarlig: ['Lede team på 8 personer', 'Performance reviews', 'Udvikle team capabilities'],
  },
];

// Mock personlighedsresultater
export const mockPersonlighedsResultater: PersonlighedsResultat[] = [
  {
    dimension: 'Struktur vs. Fleksibilitet',
    score: 4,
    beskrivelse: 'Du foretrækker klare strukturer og planer',
    interpretation: 'Du trives bedst i organiserede miljøer med klare forventninger. Overvejer at arbejde i stabile organisationer med tydelige processer.',
  },
  {
    dimension: 'Social energi',
    score: 4,
    beskrivelse: 'Du får energi af samarbejde',
    interpretation: 'Du foretrækker teamwork og tæt samarbejde. Undgå isolerede roller.',
  },
  {
    dimension: 'Tempo',
    score: 3,
    beskrivelse: 'Du trives med moderat tempo',
    interpretation: 'Du kan håndtere spidsbelastning, men foretrækker et bæredygtigt tempo over tid.',
  },
  {
    dimension: 'Fokus',
    score: 4,
    beskrivelse: 'Du foretrækker at fokusere på få ting ad gangen',
    interpretation: 'Du leverer bedst, når du kan dykke dybt ned i projekter. Mange samtidlige opgaver kan være udfordrende.',
  },
];

// Mock arbejdsstilprofil
export const mockArbejdsstilProfil: ArbejdsstilProfil = {
  tempo: { score: 3, label: 'Moderat tempo – balance mellem intensitet og bæredygtighed' },
  struktur: { score: 4, label: 'Høj struktur – trives med klare rammer og processer' },
  socialEnergi: { score: 4, label: 'Høj social energi – energi fra teamwork og samarbejde' },
  fokus: { score: 4, label: 'Dybt fokus – foretrækker at gå i dybden med få opgaver' },
};

// Mock motivationsprofil
export const mockMotivationsProfil: MotivationsProfil = {
  drivere: [
    'At løse konkrete problemer',
    'At se resultater af mit arbejde',
    'At samarbejde med dygtige mennesker',
    'At lære og udvikle mig',
  ],
  draenere: [
    'Uklare forventninger',
    'Manglende autonomi',
    'Politiske spil',
    'Meget ensformigt arbejde',
  ],
  arbejdsmiljoePraeeferencer: [
    'Hybrid arbejde (2-3 dage hjemme)',
    'Psykologisk tryghed',
    'Feedbackkultur',
    'Fleksible arbejdstider',
  ],
};

// Mock indsigter til Overblik
export const mockIndsigter: Indsigt[] = [
  {
    id: '1',
    type: 'kompetence',
    overskrift: 'Stærk kombination af ledelse og analyse',
    beskrivelse: 'Din blanding af projektledelse og dataanalyse gør dig særligt relevant for digitale transformationsroller.',
    cta: { text: 'Se din fulde profil', href: '/app/profil' },
  },
  {
    id: '2',
    type: 'personlighed',
    overskrift: 'Du trives i strukturerede teams',
    beskrivelse: 'Din arbejdsstil passer godt til roller med klare processer og tæt teamsamarbejde.',
    cta: { text: 'Udforsk arbejdsstil', href: '/app/profil?tab=arbejdsstil' },
  },
  {
    id: '3',
    type: 'karriere',
    overskrift: '3 spor matcher din profil meget højt',
    beskrivelse: 'Projektleder, Business Analyst og Customer Success Manager ligger alle over 78% match.',
    cta: { text: 'Se dine muligheder', href: '/app/muligheder' },
  },
];

// Mock profilstatus
export const mockProfilStatus: ProfilStatus = {
  kompleteret: 85,
  steps: {
    cv: true,
    kompetencer: true,
    personprofil: true,
  },
};

// Mock plan temaer
export const mockPlanTemaer: PlanTema[] = [
  {
    uge: 1,
    tema: 'Grundlæggende research',
    beskrivelse: 'Forstå rollen, markedet og dine konkurrencefordele',
    handlinger: [
      'Læs 5 jobopslag for din målrolle',
      'Identificer gaps i forhold til krav',
      'Research typiske karriereveje',
    ],
    completed: true,
  },
  {
    uge: 2,
    tema: 'Kompetenceudvikling',
    beskrivelse: 'Styrk dine kompetencer på kritiske områder',
    handlinger: [
      'Gennemfør online kursus i dit valgte område',
      'Øv dig på caseopgaver',
      'Få feedback fra mentor/netværk',
    ],
    completed: false,
  },
  {
    uge: 3,
    tema: 'CV og LinkedIn optimering',
    beskrivelse: 'Gør din profil synlig og relevant',
    handlinger: [
      'Opdater CV til målrollen',
      'Optimer LinkedIn profil',
      'Få feedback fra 2 personer',
    ],
    completed: false,
  },
  {
    uge: 4,
    tema: 'Netværk og synlighed',
    beskrivelse: 'Byg relationer i din målbranche',
    handlinger: [
      'Tag 3 netværksmøder',
      'Del relevant content på LinkedIn',
      'Deltag i event eller webinar',
    ],
    completed: false,
  },
];
