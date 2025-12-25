// Mock data for karrierecoach platform

export interface Kompetence {
  id: string;
  navn: string;
  kategori: 'teknisk' | 'soft' | 'ledelses' | 'sprog';
  niveau?: 'begynder' | 'erfaren' | 'ekspert';
  interesse?: boolean;
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
}

export interface Karrierespor {
  id: string;
  titel: string;
  beskrivelse: string;
  matchScore: number;
  topKompetencer: string[];
  vaeekstpotentiale: string;
  typiskeLoenSpan: string;
}

export interface Job {
  id: string;
  titel: string;
  virksomhed: string;
  lokation: string;
  remote: 'remote' | 'hybrid' | 'onsite';
  senioritet: 'junior' | 'medior' | 'senior';
  matchScore: number;
  hvorforPasser: string[];
  gaps: string[];
  beskrivelse: string;
  krav: string[];
}

// Mock kompetencer
export const mockKompetencer: Kompetence[] = [
  { id: '1', navn: 'Kommunikation', kategori: 'soft' },
  { id: '2', navn: 'Dataanalyse', kategori: 'teknisk' },
  { id: '3', navn: 'Projektledelse', kategori: 'ledelses' },
  { id: '4', navn: 'Kundeservice', kategori: 'soft' },
  { id: '5', navn: 'Strategisk tænkning', kategori: 'soft' },
  { id: '6', navn: 'Excel & Google Sheets', kategori: 'teknisk' },
  { id: '7', navn: 'SQL', kategori: 'teknisk' },
  { id: '8', navn: 'Teamledelse', kategori: 'ledelses' },
  { id: '9', navn: 'Forhandling', kategori: 'soft' },
  { id: '10', navn: 'Præsentation', kategori: 'soft' },
  { id: '11', navn: 'Procesoptimering', kategori: 'teknisk' },
  { id: '12', navn: 'Engelsk (flydende)', kategori: 'sprog' },
  { id: '13', navn: 'Stakeholder management', kategori: 'soft' },
  { id: '14', navn: 'Agile/Scrum', kategori: 'teknisk' },
  { id: '15', navn: 'Budgetstyring', kategori: 'ledelses' },
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
  },
  {
    id: '2',
    titel: 'Business Analyst',
    beskrivelse: 'Analyserer forretningsprocesser, identificerer forbedringer og bygger bro mellem IT og forretning.',
    matchScore: 82,
    topKompetencer: ['Dataanalyse', 'Procesoptimering', 'Kommunikation'],
    vaeekstpotentiale: 'Højt – særligt inden for tech og finans',
    typiskeLoenSpan: '500.000 - 650.000 kr.',
  },
  {
    id: '3',
    titel: 'Customer Success Manager',
    beskrivelse: 'Sikrer kundernes succes og tilfredshed. Driver adoption, retention og upsell.',
    matchScore: 78,
    topKompetencer: ['Kundeservice', 'Kommunikation', 'Forhandling'],
    vaeekstpotentiale: 'Meget højt – nøglerolle i SaaS virksomheder',
    typiskeLoenSpan: '450.000 - 600.000 kr.',
  },
  {
    id: '4',
    titel: 'Operations Manager',
    beskrivelse: 'Optimerer daglig drift, styrer processer og sikrer effektiv ressourceallokering.',
    matchScore: 75,
    topKompetencer: ['Procesoptimering', 'Teamledelse', 'Budgetstyring'],
    vaeekstpotentiale: 'Stabilt – central rolle i de fleste organisationer',
    typiskeLoenSpan: '520.000 - 680.000 kr.',
  },
  {
    id: '5',
    titel: 'Product Owner',
    beskrivelse: 'Definerer produkt vision og roadmap. Prioriterer features baseret på kundeværdi.',
    matchScore: 72,
    topKompetencer: ['Strategisk tænkning', 'Agile/Scrum', 'Stakeholder management'],
    vaeekstpotentiale: 'Meget højt – kritisk i produktdrevne virksomheder',
    typiskeLoenSpan: '550.000 - 700.000 kr.',
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
  },
  {
    id: '2',
    titel: 'Business Analyst',
    virksomhed: 'Novo Nordisk',
    lokation: 'Bagsværd',
    remote: 'hybrid',
    senioritet: 'medior',
    matchScore: 88,
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
  },
  {
    id: '3',
    titel: 'Customer Success Manager',
    virksomhed: 'Zendesk',
    lokation: 'København',
    remote: 'remote',
    senioritet: 'medior',
    matchScore: 85,
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
  },
  {
    id: '4',
    titel: 'Operations Manager',
    virksomhed: 'Mærsk',
    lokation: 'Esbjerg',
    remote: 'onsite',
    senioritet: 'senior',
    matchScore: 82,
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
  },
  {
    id: '5',
    titel: 'Projektkoordinator',
    virksomhed: 'Copenhagen Capacity',
    lokation: 'København',
    remote: 'hybrid',
    senioritet: 'junior',
    matchScore: 79,
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
  },
  {
    id: '6',
    titel: 'Product Owner',
    virksomhed: 'Unity Technologies',
    lokation: 'København',
    remote: 'hybrid',
    senioritet: 'medior',
    matchScore: 77,
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
  },
  {
    id: '7',
    titel: 'Data Analyst',
    virksomhed: 'Trustpilot',
    lokation: 'København',
    remote: 'remote',
    senioritet: 'junior',
    matchScore: 75,
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
  },
  {
    id: '8',
    titel: 'Scrum Master',
    virksomhed: 'Lego',
    lokation: 'Billund',
    remote: 'hybrid',
    senioritet: 'medior',
    matchScore: 73,
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
  },
  {
    id: '9',
    titel: 'Account Manager',
    virksomhed: 'Google',
    lokation: 'København',
    remote: 'hybrid',
    senioritet: 'medior',
    matchScore: 71,
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
  },
  {
    id: '10',
    titel: 'Change Manager',
    virksomhed: 'Ørsted',
    lokation: 'Fredericia',
    remote: 'hybrid',
    senioritet: 'senior',
    matchScore: 69,
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
  },
  {
    id: '11',
    titel: 'Process Consultant',
    virksomhed: 'Deloitte',
    lokation: 'København',
    remote: 'hybrid',
    senioritet: 'medior',
    matchScore: 67,
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
  },
  {
    id: '12',
    titel: 'Team Lead',
    virksomhed: 'Saxo Bank',
    lokation: 'København',
    remote: 'hybrid',
    senioritet: 'senior',
    matchScore: 65,
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
  },
];
