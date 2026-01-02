'use client';

import { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, ThumbsUp, ThumbsDown, AlertCircle, CheckCircle2, ArrowRight, User, Brain, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { calculateAllDimensionScores } from '@/lib/scoring';
import { getExplanation, getLevel, type DimensionKey } from '@/lib/dimensionExplanations';
import { ProfileContactSection } from '@/components/profile-contact-section';
import { ProfilePhotoSection } from '@/components/profile-photo-section';

interface CVExtraction {
  summary: string;
  cvText: string;
}

interface QuestionScores {
  [key: string]: number; // Q1-Q40
}

interface PersonalityProfile {
  profile: string;
  scores: QuestionScores;
  dimensionScores?: {
    [dimension: string]: {
      average: number;
      level: string;
    }
  };
}

interface CombinedAnalysis {
  analysis: string;
}

// Spørgsmål til personlighedsprofil (40 spørgsmål - 8 dimensioner × 5)
const questions = [
  // Struktur & Rammer (Q1-Q5)
  { id: 'Q1', dimension: 'Struktur & Rammer', question: 'Jeg foretrækker arbejdsopgaver med klare deadlines og faste rammer.' },
  { id: 'Q2', dimension: 'Struktur & Rammer', question: 'Jeg trives bedst når min arbejdsdag er planlagt i forvejen.' },
  { id: 'Q3', dimension: 'Struktur & Rammer', question: 'Jeg kan lide at følge etablerede procedurer og standarder i mit arbejde.' },
  { id: 'Q4', dimension: 'Struktur & Rammer', question: 'Jeg har brug for tydelige retningslinjer for at levere mit bedste arbejde.' },
  { id: 'Q5', dimension: 'Struktur & Rammer', question: 'Jeg foretrækker at vide præcis hvad der forventes af mig i en arbejdsopgave.' },
  
  // Beslutningsstil (Q6-Q10)
  { id: 'Q6', dimension: 'Beslutningsstil', question: 'Jeg træffer beslutninger hurtigt når der er brug for det.' },
  { id: 'Q7', dimension: 'Beslutningsstil', question: 'Jeg foretrækker at have alle relevante informationer før jeg beslutter noget.' },
  { id: 'Q8', dimension: 'Beslutningsstil', question: 'Jeg er tryg ved at tage beslutninger uden at konsultere andre først.' },
  { id: 'Q9', dimension: 'Beslutningsstil', question: 'Jeg stoler på min mavefornemmelse når jeg skal træffe valg i arbejdet.' },
  { id: 'Q10', dimension: 'Beslutningsstil', question: 'Jeg kan lide at have tid til at overveje forskellige løsninger før jeg beslutter.' },
  
  // Forandring & Stabilitet (Q11-Q15)
  { id: 'Q11', dimension: 'Forandring & Stabilitet', question: 'Jeg bliver motiveret af nye arbejdsmetoder og processer.' },
  { id: 'Q12', dimension: 'Forandring & Stabilitet', question: 'Jeg foretrækker at have faste rutiner i mit arbejde.' },
  { id: 'Q13', dimension: 'Forandring & Stabilitet', question: 'Jeg tilpasser mig let når arbejdsopgaver eller prioriteter ændrer sig.' },
  { id: 'Q14', dimension: 'Forandring & Stabilitet', question: 'Jeg trives i miljøer hvor tingene holder sig nogenlunde ens fra dag til dag.' },
  { id: 'Q15', dimension: 'Forandring & Stabilitet', question: 'Jeg kan lide at afprøve nye måder at løse opgaver på.' },
  
  // Selvstændighed & Sparring (Q16-Q20)
  { id: 'Q16', dimension: 'Selvstændighed & Sparring', question: 'Jeg foretrækker at arbejde selvstændigt med mine opgaver.' },
  { id: 'Q17', dimension: 'Selvstændighed & Sparring', question: 'Jeg får de bedste ideer når jeg tænker sammen med andre.' },
  { id: 'Q18', dimension: 'Selvstændighed & Sparring', question: 'Jeg har brug for få instruktioner for at komme i gang med nye opgaver.' },
  { id: 'Q19', dimension: 'Selvstændighed & Sparring', question: 'Jeg foretrækker at få løbende input fra kolleger eller ledere mens jeg arbejder.' },
  { id: 'Q20', dimension: 'Selvstændighed & Sparring', question: 'Jeg klarer mig bedst når jeg selv kan styre hvordan jeg løser mine opgaver.' },
  
  // Sociale præferencer i arbejdet (Q21-Q25)
  { id: 'Q21', dimension: 'Sociale præferencer i arbejdet', question: 'Jeg foretrækker at arbejde tæt sammen med andre i dagligdagen.' },
  { id: 'Q22', dimension: 'Sociale præferencer i arbejdet', question: 'Jeg får energi af at være sammen med kolleger i løbet af arbejdsdagen.' },
  { id: 'Q23', dimension: 'Sociale præferencer i arbejdet', question: 'Jeg foretrækker arbejdsopgaver hvor jeg kan koncentrere mig alene.' },
  { id: 'Q24', dimension: 'Sociale præferencer i arbejdet', question: 'Jeg synes det er vigtigt at have god social kontakt med mine kolleger.' },
  { id: 'Q25', dimension: 'Sociale præferencer i arbejdet', question: 'Jeg trives i arbejdsmiljøer hvor der er meget samarbejde og dialog.' },
  
  // Ledelse & Autoritet (Q26-Q30)
  { id: 'Q26', dimension: 'Ledelse & Autoritet', question: 'Jeg foretrækker at få klare instrukser fra min leder.' },
  { id: 'Q27', dimension: 'Ledelse & Autoritet', question: 'Jeg trives i roller hvor jeg har ansvar for at lede eller koordinere andre.' },
  { id: 'Q28', dimension: 'Ledelse & Autoritet', question: 'Jeg foretrækker at arbejde i teams uden tydelig hierarkisk struktur.' },
  { id: 'Q29', dimension: 'Ledelse & Autoritet', question: 'Jeg kan lide at have en leder der er tæt involveret i mit arbejde.' },
  { id: 'Q30', dimension: 'Ledelse & Autoritet', question: 'Jeg tager naturligt ansvar for at guide eller vejlede andre.' },
  
  // Tempo & Belastning (Q31-Q35)
  { id: 'Q31', dimension: 'Tempo & Belastning', question: 'Jeg præsterer bedst under tidspres.' },
  { id: 'Q32', dimension: 'Tempo & Belastning', question: 'Jeg foretrækker et roligt og jævnt arbejdstempo.' },
  { id: 'Q33', dimension: 'Tempo & Belastning', question: 'Jeg trives i perioder med høj aktivitet og mange opgaver på én gang.' },
  { id: 'Q34', dimension: 'Tempo & Belastning', question: 'Jeg har brug for tid til at arbejde grundigt med mine opgaver.' },
  { id: 'Q35', dimension: 'Tempo & Belastning', question: 'Jeg kan håndtere travle perioder med skiftende krav og deadlines.' },
  
  // Konflikt & Feedback (Q36-Q40)
  { id: 'Q36', dimension: 'Konflikt & Feedback', question: 'Jeg tager feedback konstruktivt og bruger det til at udvikle mig.' },
  { id: 'Q37', dimension: 'Konflikt & Feedback', question: 'Jeg tager hellere en vanskelig samtale end at lade problemer stå uløste.' },
  { id: 'Q38', dimension: 'Konflikt & Feedback', question: 'Jeg foretrækker at undgå konflikter på arbejdspladsen.' },
  { id: 'Q39', dimension: 'Konflikt & Feedback', question: 'Jeg er tryg ved at give andre feedback på deres arbejde.' },
  { id: 'Q40', dimension: 'Konflikt & Feedback', question: 'Jeg synes det er vigtigt at få regelmæssig feedback på mit arbejde.' },
];

export default function ProfilPage() {
  // CV Upload state
  const [file, setFile] = useState<File | null>(null);
  const [extraction, setExtraction] = useState<CVExtraction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [agreement, setAgreement] = useState<'agree' | 'disagree' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [revising, setRevising] = useState(false);
  const [revised, setRevised] = useState<string | null>(null);
  
  // Personality profile state
  const [currentStep, setCurrentStep] = useState<'cv' | 'questionnaire' | 'results'>('cv');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scores, setScores] = useState<QuestionScores>({});
  const [personalityProfile, setPersonalityProfile] = useState<PersonalityProfile | null>(null);
  const [analyzingPersonality, setAnalyzingPersonality] = useState(false);
  
  // Combined analysis state
  const [combinedAnalysis, setCombinedAnalysis] = useState<CombinedAnalysis | null>(null);
  const [analyzingCombined, setAnalyzingCombined] = useState(false);
  
  // Track which dimension explanations are expanded
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(new Set());
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============ TEST MODE - REMOVE BEFORE PRODUCTION ============
  const loadTestData = () => {
    // Mock CV extraction
    setExtraction({
      summary: 'Test CV Summary: 10 års erfaring med React, TypeScript, og Next.js udvikling. Specialiseret i brugervenlige interfaces og skalerbare webapplikationer. Arbejdet i både startups og større virksomheder med fokus på agile metoder og teamsamarbejde.',
      cvText: 'Mock CV text content...'
    });
    setAgreement('agree');
    
    // Mock questionnaire answers (varied scores for testing)
    const testScores: QuestionScores = {
      Q1: 4, Q2: 5, Q3: 4, Q4: 4, Q5: 5, // Struktur & Rammer: Høj (4.4)
      Q6: 3, Q7: 4, Q8: 3, Q9: 2, Q10: 3, // Beslutningsstil: Moderat (3.0)
      Q11: 4, Q12: 2, Q13: 4, Q14: 2, Q15: 5, // Forandring & Stabilitet: Moderat (3.4)
      Q16: 5, Q17: 2, Q18: 4, Q19: 2, Q20: 5, // Selvstændighed & Sparring: Moderat (3.6)
      Q21: 3, Q22: 4, Q23: 3, Q24: 4, Q25: 3, // Sociale præferencer: Moderat (3.4)
      Q26: 2, Q27: 4, Q28: 3, Q29: 2, Q30: 4, // Ledelse & Autoritet: Moderat (3.0)
      Q31: 2, Q32: 4, Q33: 2, Q34: 4, Q35: 2, // Tempo & Belastning: Moderat (2.8)
      Q36: 5, Q37: 4, Q38: 2, Q39: 4, Q40: 5, // Konflikt & Feedback: Høj (4.0)
    };
    setScores(testScores);
    
    // Mock personality profile result
    setPersonalityProfile({
      profile: `DIMENSIONSCORES
- Struktur & Rammer: 4.4 (Høj)
- Beslutningsstil: 3.0 (Moderat)
- Forandring & Stabilitet: 3.4 (Moderat)
- Selvstændighed & Sparring: 3.6 (Moderat)
- Sociale præferencer i arbejdet: 3.4 (Moderat)
- Ledelse & Autoritet: 3.0 (Moderat)
- Tempo & Belastning: 2.8 (Moderat)
- Konflikt & Feedback: 4.0 (Høj)

OVERORDNET ARBEJDSPROFIL
Profilen viser en person der trives med klare strukturer og åben feedback-kultur, samtidig med at der er fleksibilitet i forhold til arbejdsmetoder og samarbejdsformer. Der er præference for forudsigelighed kombineret med en vis grad af selvstændighed.

ARBEJDSMØNSTRE
- Foretrækker klare rammer og definerede arbejdsgange
- Kan både arbejde selvstændigt og i samarbejde, afhængigt af opgaven
- Trives bedst med regelmæssig feedback og åben dialog
- Værdsætter balance mellem stabilitet og mulighed for udvikling

POTENTIELLE STYRKER I ARBEJDSKONTEKST
- Struktureret tilgang til opgaveløsning sikrer overblik og kvalitet
- Åbenhed over for feedback fremmer løbende læring og udvikling
- Evne til at navigere i både strukturerede og mere fleksible miljøer
- Balanceret mellem selvstændighed og samarbejde giver god tilpasningsevne

POTENTIELLE FRIKTIONSPUNKTER
- Miljøer uden klare arbejdsgange kan opleves som frustrerende
- Meget højt tempo over længere tid kan påvirke kvalitet og trivsel
- Manglende feedback kan skabe usikkerhed om forventninger
- Hyppige, uforudsigelige ændringer kan være energikrævende

FORVENTNINGS-CHECK (JOBMATCH)
Matcher typisk godt med: Roller med definerede processer men også plads til udvikling. Organisationer der værdsætter struktur og samtidig har en åben feedback-kultur. Teams hvor der er både selvstændigt arbejde og samarbejde.

Kan opleve udfordringer i: Meget kaotiske miljøer uden klare rammer. Kulturer hvor feedback er sjælden eller ukonstruktiv. Højtempomiljøer med konstant brand-slukningspræg. Organisationer i vedvarende omstillingsproces uden stabil retning.

AFSLUTTENDE NOTE
Denne profil er baseret på selvrapporterede præferencer og skal ses som et supplement til CV, erfaring og kontekst. Profilen er vejledende og skal altid fortolkes i sammenhæng med den konkrete rolle og organisation.`,
      scores: testScores
    });
    
    // Mock combined analysis
    setCombinedAnalysis({
      analysis: `SAMLET PROFILFORSTÅELSE
Profilen viser en teknisk erfaren udvikler med stærke kompetencer inden for moderne webudvikling, kombineret med præference for strukturerede arbejdsgange og direkte kommunikation. Erfaringen med både startups og etablerede virksomheder indikerer evne til at navigere i forskellige organisatoriske kontekster.

HVOR CV OG ARBEJDSSTIL UNDERSTØTTER HINANDEN
- Erfaring med strukturerede frameworks (React, TypeScript) matcher præferencen for klare rammer og definerede processer
- Fokus på agile metoder understøtter både behovet for struktur og fleksibiliteten i forhold til forandring
- Erfaring med teamsamarbejde passer til balancen mellem selvstændighed og dialog i arbejdsstil

POTENTIELLE SPÆNDINGER MELLEM ERFARING OG ARBEJDSSTIL
- Startup-erfaring kan have indebåret arbejde under højt tempo og skiftende prioriteter, hvilket kan have været belastende set i lyset af moderat tolerance for tempo
- Arbejde med brugervenlige interfaces kræver ofte hurtig iteration og konstant feedback fra mange stakeholders, hvilket kan udfordre præferencen for rolige arbejdsgange

ARBEJDSKONTEKSTER DER TYPISK VIL UNDERSTØTTE PROFILEN
Profilen indikerer at arbejdssituationer med etablerede udviklingsprocesser, klare roller og regelmæssige feedback-loops typisk vil understøtte arbejdsstilen. Miljøer hvor der er balance mellem selvstændigt kodningsarbejde og struktureret teamsamarbejde, samt organisationer der har stabile rammer men plads til teknisk udvikling.

KONTEKSTER DER KAN KRÆVE BEVIDST TILPASNING
Situationer med meget korte deadlines, hyppige prioritetsskift eller konstant brand-slukningspræg kan kræve særlig opmærksomhed. Ligeledes miljøer med uklare ansvarsområder eller begrænset struktur i udviklingsprocessen. Roller hvor feedback primært er negativ eller sporadisk kan også kræve aktiv håndtering.

AFSLUTTENDE NOTE
Den samlede analyse er vejledende og bygger på mønstre i erfaring og arbejdspræferencer.
Den bør ses i sammenhæng med konkret rolleindhold og organisatorisk kontekst.`
    });
    
    setCurrentStep('results');
  };
  // ============ END TEST MODE ============

  // CV confirmed - move to questionnaire
  const cvConfirmed = agreement === 'agree' || revised !== null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'docx', 'txt'].includes(fileType || '')) {
        setError('Kun PDF, DOCX eller TXT filer er tilladt');
        return;
      }
      setFile(selectedFile);
      setExtraction(null);
      setAgreement(null);
      setFeedback('');
      setRevised(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Kunne ikke udtrække CV');
      }

      const data = await res.json();
      setExtraction(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Der opstod en fejl');
    } finally {
      setLoading(false);
    }
  };

  const handleRevise = async () => {
    if (!extraction || agreement !== 'disagree' || !feedback.trim()) return;

    setRevising(true);
    setError(null);

    try {
      const res = await fetch('/api/revise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalSummary: extraction.summary,
          feedback: feedback,
          cvText: extraction.cvText,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Kunne ikke revidere udtræk');
      }

      const data = await res.json();
      setRevised(data.revised);
      setAgreement(null);
      setFeedback('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Der opstod en fejl ved revision');
    } finally {
      setRevising(false);
    }
  };

  // Personality questionnaire handlers
  const handleScoreSelect = (questionId: string, score: number) => {
    setScores(prev => ({ ...prev, [questionId]: score }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const allQuestionsAnswered = questions.every(q => scores[q.id] && scores[q.id] > 0);

  const handleSubmitPersonality = async () => {
    if (!allQuestionsAnswered) return;

    setAnalyzingPersonality(true);
    setError(null);

    try {
      const res = await fetch('/api/personality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scores }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Kunne ikke analysere personlighedsprofil');
      }

      const data = await res.json();
      setPersonalityProfile(data);
      setCurrentStep('results');
      
      // Automatically generate combined analysis when both CV and personality are ready
      if (extraction) {
        generateCombinedAnalysis(extraction.summary, data.scores);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Der opstod en fejl');
    } finally {
      setAnalyzingPersonality(false);
    }
  };

  // Generate combined analysis
  const generateCombinedAnalysis = async (cvSummary: string, questionScores: QuestionScores) => {
    setAnalyzingCombined(true);
    setError(null);

    try {
      // Calculate dimension scores from question scores
      const dimensionScores = calculateAllDimensionScores(questionScores);
      const dimensionScoresMap: { [key: string]: number } = {};
      dimensionScores.forEach(dim => {
        dimensionScoresMap[dim.dimension] = dim.score;
      });

      const res = await fetch('/api/combined-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvAnalysis: cvSummary,
          dimensionScores: dimensionScoresMap,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Kunne ikke generere samlet analyse');
      }

      const data = await res.json();
      setCombinedAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Der opstod en fejl ved generering af samlet analyse');
    } finally {
      setAnalyzingCombined(false);
    }
  };

  // Toggle dimension explanation visibility
  const toggleDimensionExplanation = (dimensionName: string) => {
    setExpandedDimensions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dimensionName)) {
        newSet.delete(dimensionName);
      } else {
        newSet.add(dimensionName);
      }
      return newSet;
    });
  };

  // Parse combined analysis sections
  const parseCombinedAnalysis = (analysis: string) => {
    const sections: { title: string; content: string; bullets: string[] }[] = [];
    const lines = analysis.split('\n');
    let currentSection: { title: string; content: string; bullets: string[] } | null = null;

    const sectionTitles = [
      'SAMLET PROFILFORSTÅELSE',
      'HVOR CV OG ARBEJDSSTIL UNDERSTØTTER HINANDEN',
      'POTENTIELLE SPÆNDINGER MELLEM ERFARING OG ARBEJDSSTIL',
      'ARBEJDSKONTEKSTER DER TYPISK VIL UNDERSTØTTE PROFILEN',
      'KONTEKSTER DER KAN KRÆVE BEVIDST TILPASNING',
      'AFSLUTTENDE NOTE',
    ];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Skip decorative lines
      if (/^[─━═_\-–—=\s]+$/.test(trimmed)) continue;

      // Check if this is a section title
      const matchedTitle = sectionTitles.find(title => 
        trimmed.toUpperCase().includes(title) || trimmed.toUpperCase() === title
      );

      if (matchedTitle) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = { title: matchedTitle, content: '', bullets: [] };
        continue;
      }

      if (currentSection) {
        // Parse bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('→')) {
          const bulletText = trimmed.startsWith('- ') ? trimmed.substring(2) : trimmed.substring(1).trim();
          currentSection.bullets.push(bulletText);
        } else {
          currentSection.content += line + '\n';
        }
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections.map(section => ({
      ...section,
      content: section.content.trim()
    }));
  };

  // Parse personality profile sections
  const parsePersonalityProfile = (profile: string) => {
    const sections: { title: string; content: string; bullets: string[] }[] = [];
    const lines = profile.split('\n');
    let currentSection: { title: string; content: string; bullets: string[] } | null = null;

    const sectionTitles = [
      'OVERORDNET ARBEJDSPROFIL',
      'ARBEJDSMØNSTRE',
      'POTENTIELLE STYRKER I ARBEJDSKONTEKST',
      'POTENTIELLE FRIKTIONSPUNKTER',
      'RAMMER HVOR PROFILEN TYPISK TRIVES',
      'RAMMER HVOR DER KAN OPSTÅ UDFORDRINGER',
      'AFSLUTTENDE NOTE',
    ];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Skip decorative lines
      if (/^[─━═_\-–—=\s]+$/.test(trimmed)) continue;
      const decorativeCount = (trimmed.match(/[─━═_\-–—=]/g) || []).length;
      if (trimmed.length > 3 && decorativeCount / trimmed.length > 0.5) continue;

      // Check if this is a section title
      const matchedTitle = sectionTitles.find(title => 
        trimmed.toUpperCase().includes(title) || trimmed.toUpperCase() === title
      );

      if (matchedTitle) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = { title: matchedTitle, content: '', bullets: [] };
      } else if (currentSection) {
        if (trimmed.startsWith('→') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const bulletText = trimmed.replace(/^[→\-•]\s*/, '');
          currentSection.bullets.push(bulletText);
        } else {
          currentSection.content += trimmed + ' ';
        }
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  };

  const displaySummary = revised || extraction?.summary || '';

  // Parse summary til forskellige sektioner med farver
  const parseSummary = (summary: string) => {
    const lines = summary.split('\n');
    let text = '';
    const positiveBullets: string[] = [];
    const negativeBullets: string[] = [];
    let currentSection = 'text';

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) {
        continue;
      }
      
      // Skip decorative lines - lines with only dashes, underscores, equals signs, or spaces
      if (/^[-_=\s]+$/.test(trimmed)) {
        continue;
      }
      
      // Skip lines that are mostly decorative characters (80% or more)
      const decorativeChars = (trimmed.match(/[-_=]/g) || []).length;
      if (decorativeChars / trimmed.length >= 0.8) {
        continue;
      }
      
      // Detekter overskrifter (skal ikke inkluderes i output)
      if (trimmed === 'OVERORDNET UDLEDNING' ||
          trimmed === 'HVAD CV\'ET TYDELIGT DOKUMENTERER (HARD FACTS)' ||
          trimmed === 'Rolle og erfaring' ||
          trimmed === 'Teknisk og systemmæssig tyngde' ||
          trimmed === 'SAMLET, NEUTRAL KONKLUSION' ||
          trimmed === 'TRIN 2 — SENIOR KONSULENT & REDAKTØR' ||
          trimmed.startsWith('TRIN')) {
        currentSection = 'text';
        continue;
      }
      
      // Detekter positive sektioner
      if (trimmed.includes('STYRKER') || trimmed === 'Konkrete ansvarsområder') {
        currentSection = 'positive';
        continue;
      }
      
      // Detekter negative sektioner
      if (trimmed.includes('BEGRÆNSNINGER') || trimmed.includes('IKKE DOKUMENTERER')) {
        currentSection = 'negative';
        continue;
      }
      
      // Parse positive bullets
      if (currentSection === 'positive' && (trimmed.startsWith('- ') || trimmed.startsWith('→'))) {
        const bulletText = trimmed.startsWith('- ') ? trimmed.substring(2) : trimmed.substring(1).trim();
        positiveBullets.push(bulletText);
      } 
      // Parse negative bullets
      else if (currentSection === 'negative' && (trimmed.startsWith('- ') || trimmed.startsWith('→'))) {
        const bulletText = trimmed.startsWith('- ') ? trimmed.substring(2) : trimmed.substring(1).trim();
        negativeBullets.push(bulletText);
      }
      // Parse tekst (inkluder alt andet indhold)
      else if (currentSection === 'text' && trimmed && 
               !trimmed.includes('STYRKER') && 
               !trimmed.includes('BEGRÆNSNINGER') && 
               trimmed !== 'Konkrete ansvarsområder') {
        // Extra check: don't add lines that are mostly decorative
        const decorativeChars = (trimmed.match(/[-_=]/g) || []).length;
        if (decorativeChars / trimmed.length < 0.5) {
          text += line + '\n';
        }
      }
    }

    return { text: text.trim(), positiveBullets, negativeBullets };
  };

  // Clean text function to remove any remaining decorative lines
  const cleanText = (text: string): string => {
    return text
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        // Remove lines that are only decorative characters
        if (/^[─━═_\-–—=\s]+$/.test(trimmed)) return false;
        // Remove lines where more than 50% are decorative
        const decorativeCount = (trimmed.match(/[─━═_\-–—=]/g) || []).length;
        if (trimmed.length > 3 && decorativeCount / trimmed.length > 0.5) return false;
        return true;
      })
      .join('\n')
      .trim();
  };

  const { text: rawSummaryText, positiveBullets, negativeBullets } = displaySummary ? parseSummary(displaySummary) : { text: '', positiveBullets: [], negativeBullets: [] };
  const summaryText = cleanText(rawSummaryText);

  // Determine which step we're on
  const activeStep = personalityProfile ? 'results' : (cvConfirmed && currentStep === 'questionnaire') ? 'questionnaire' : 'cv';

  // Beregn dimensionsscorer når vi har scores
  const dimensionScores = useMemo(() => {
    if (Object.keys(scores).length === 0) return [];
    return calculateAllDimensionScores(scores);
  }, [scores]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-12 px-4 sm:px-6 lg:px-8">
      {/* Contact Information Section - Always visible at top */}
      <ProfileContactSection />

      {/* Profile Photo Section */}
      <ProfilePhotoSection />

      {/* Premium Header Section */}
      <div className="space-y-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            {activeStep === 'cv' && <Upload className="h-6 w-6 text-white" />}
            {activeStep === 'questionnaire' && <Brain className="h-6 w-6 text-white" />}
            {activeStep === 'results' && <User className="h-6 w-6 text-white" />}
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
            {activeStep === 'cv' && 'CV Analyse'}
            {activeStep === 'questionnaire' && 'Personlighedsprofil'}
            {activeStep === 'results' && 'Din Profil'}
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          {activeStep === 'cv' && 'Upload dit CV og få en AI-drevet analyse af dine kompetencer'}
          {activeStep === 'questionnaire' && 'Besvar spørgsmål om dine arbejdspræferencer'}
          {activeStep === 'results' && 'Se din komplette karriereprofil'}
        </p>
      </div>

      {/* ============ TEST MODE BUTTON - REMOVE BEFORE PRODUCTION ============ */}
      {!personalityProfile && (
        <div className="mb-6">
          <Button
            onClick={loadTestData}
            variant="outline"
            className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
          >
            ⚠️ Load Test Data (Dev Mode)
          </Button>
        </div>
      )}
      {/* ============ END TEST MODE ============ */}

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
          activeStep === 'cv' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 
          cvConfirmed ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 
          'bg-slate-100 dark:bg-slate-800 text-slate-500'
        }`}>
          {cvConfirmed ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-5 w-5 rounded-full bg-current/20 flex items-center justify-center text-xs">1</span>}
          CV Analyse
        </div>
        <div className="h-px w-8 bg-slate-300 dark:bg-slate-600" />
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
          activeStep === 'questionnaire' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 
          personalityProfile ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 
          'bg-slate-100 dark:bg-slate-800 text-slate-500'
        }`}>
          {personalityProfile ? <CheckCircle2 className="h-4 w-4" /> : <span className="h-5 w-5 rounded-full bg-current/20 flex items-center justify-center text-xs">2</span>}
          Personlighedsprofil
        </div>
        <div className="h-px w-8 bg-slate-300 dark:bg-slate-600" />
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
          activeStep === 'results' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 
          'bg-slate-100 dark:bg-slate-800 text-slate-500'
        }`}>
          <span className="h-5 w-5 rounded-full bg-current/20 flex items-center justify-center text-xs">3</span>
          Resultater
        </div>
      </div>

      {/* Upload sektion */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Upload dit CV</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">Understøtter PDF, DOCX og TXT filer</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drag and drop area */}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">Træk din CV her eller klik for at vælge</p>
                  <p className="text-sm text-muted-foreground mt-1">PDF, DOCX eller TXT</p>
                </div>
              </div>
            </button>
          </div>

          {/* Selected file info */}
          {file && (
            <div className="flex items-center gap-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {file.name.split('.').pop()?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setExtraction(null);
                  setAgreement(null);
                }}
                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
              >
                Fjern
              </Button>
            </div>
          )}

          {/* Upload button */}
          {file && !extraction && (
            <Button 
              onClick={handleUpload} 
              disabled={loading} 
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Analyserer CV...' : 'Analysér CV'}
            </Button>
          )}

          {/* Error state */}
          {error && (
            <div className="flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-950/20 p-4 border border-red-200 dark:border-red-800">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">Fejl</p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Udtræk visning */}
      {extraction && (
        <div className="space-y-8">
          {/* Analyse resultat card */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-lg">
            <CardHeader className="pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    Din AI Analyse
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">Baseret på indholdet af dit CV</p>
                </div>
                <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  ✓ Færdiggjort
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-8">
              {/* Tekst sektion - Overordnet udledning og konklusion */}
              {summaryText && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-foreground">Analyse Sammenfatning</h3>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 p-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert text-base leading-relaxed">
                      <div className="whitespace-pre-wrap text-foreground">
                        {summaryText}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Positive bullets - Styrker */}
              {positiveBullets.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <span className="text-lg">✓</span>
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">Styrker & Dokumenterede Kompetencer</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {positiveBullets.map((bullet, index) => (
                      <div 
                        key={index}
                        className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 hover:shadow-md transition-shadow"
                      >
                        <p className="text-sm font-medium text-green-900 dark:text-green-300">{bullet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Negative bullets - Begrænsninger */}
              {negativeBullets.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <span className="text-lg">⚠</span>
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">Områder at Udvikle</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {negativeBullets.map((bullet, index) => (
                      <div 
                        key={index}
                        className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 hover:shadow-md transition-shadow"
                      >
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-300">{bullet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {revised && (
                <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-300 dark:border-green-800 p-5 flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-300">Analyse Revideret</p>
                    <p className="text-sm text-green-800 dark:text-green-400 mt-1">Din feedback blev indarbejdet. Se den opdaterede analyse ovenfor.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feedback sektion som separat card */}
          {!revised && (
            <Card className="border border-slate-200 dark:border-slate-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Din Feedback</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">Hjælp os med at forbedre analysen</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-4 block">Stemmer analysen overens med din CV?</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={agreement === 'agree' ? 'default' : 'outline'}
                      onClick={() => setAgreement('agree')}
                      className={`h-12 text-base font-medium transition-all ${
                        agreement === 'agree'
                          ? 'bg-green-600 hover:bg-green-700 border-green-600'
                          : 'border-slate-300 dark:border-slate-600 hover:border-green-500'
                      }`}
                    >
                      <ThumbsUp className="mr-2 h-5 w-5" />
                      Ja, helt enig
                    </Button>
                    <Button
                      variant={agreement === 'disagree' ? 'default' : 'outline'}
                      onClick={() => setAgreement('disagree')}
                      className={`h-12 text-base font-medium transition-all ${
                        agreement === 'disagree'
                          ? 'bg-orange-600 hover:bg-orange-700 border-orange-600'
                          : 'border-slate-300 dark:border-slate-600 hover:border-orange-500'
                      }`}
                    >
                      <ThumbsDown className="mr-2 h-5 w-5" />
                      Nej, ændringer nødvendige
                    </Button>
                  </div>
                </div>

                {agreement === 'agree' && (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-300 dark:border-green-800 p-5 flex items-start gap-3">
                      <span className="text-2xl">✓</span>
                      <div>
                        <p className="font-semibold text-green-900 dark:text-green-300">Tak for din bekræftelse!</p>
                        <p className="text-sm text-green-800 dark:text-green-400 mt-1">Nu kan du fortsætte til personlighedsprofilen.</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setCurrentStep('questionnaire')}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
                    >
                      Fortsæt til Personlighedsprofil
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                )}

                {agreement === 'disagree' && (
                  <div className="space-y-5 rounded-lg bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 p-6">
                    <div>
                      <Label htmlFor="feedback" className="text-base font-semibold mb-3 block">
                        Hvad skal ændres? (obligatorisk)
                      </Label>
                      <Textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Fortæl os hvad der var unøjagtigt eller mangler i analysen..."
                        rows={5}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Jo mere detaljeret feedback, desto bedre kan vi forbedre analysen
                      </p>
                    </div>
                    <Button
                      onClick={handleRevise}
                      disabled={!feedback.trim() || revising}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold disabled:opacity-50"
                    >
                      {revising && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {revising ? 'Reviderer analysen...' : 'Revider Analyse'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Continue to questionnaire button after revision */}
          {revised && (
            <Button
              onClick={() => setCurrentStep('questionnaire')}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
            >
              Fortsæt til Personlighedsprofil
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      )}

      {/* STEP 2: Personality Questionnaire */}
      {currentStep === 'questionnaire' && cvConfirmed && !personalityProfile && (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-lg">
          <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Arbejdspræferencer</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Spørgsmål {currentQuestionIndex + 1} af {questions.length}
                </p>
              </div>
              <Badge variant="outline" className="text-sm">
                {Object.keys(scores).filter(k => scores[k] > 0).length}/{questions.length} besvaret
              </Badge>
            </div>
            <Progress 
              value={(Object.keys(scores).filter(k => scores[k] > 0).length / questions.length) * 100} 
              className="mt-4 h-2"
            />
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            {/* Current question */}
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Badge variant="secondary" className="mb-2">{questions[currentQuestionIndex].dimension}</Badge>
                <h3 className="text-xl font-semibold text-foreground">
                  {questions[currentQuestionIndex].question}
                </h3>
              </div>

              {/* Score selection */}
              <div className="space-y-4">
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      onClick={() => handleScoreSelect(questions[currentQuestionIndex].id, score)}
                      className={`w-14 h-14 rounded-xl text-lg font-semibold transition-all ${
                        scores[questions[currentQuestionIndex].id] === score
                          ? 'bg-blue-600 text-white scale-110 shadow-lg'
                          : 'bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:scale-105'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <div className="flex justify-center gap-1 text-xs text-muted-foreground">
                  <span>1 = Meget uenig</span>
                  <span>•</span>
                  <span>3 = Delvist enig</span>
                  <span>•</span>
                  <span>5 = Meget enig</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Forrige
              </Button>
              
              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  onClick={handleNextQuestion}
                  disabled={!scores[questions[currentQuestionIndex].id] || scores[questions[currentQuestionIndex].id] === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Næste
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitPersonality}
                  disabled={!allQuestionsAnswered || analyzingPersonality}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {analyzingPersonality && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {analyzingPersonality ? 'Analyserer...' : 'Se din profil'}
                </Button>
              )}
            </div>

            {/* Quick navigation dots */}
            <div className="flex justify-center gap-2 pt-2 flex-wrap">
              {questions.map((q, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentQuestionIndex
                      ? 'bg-blue-600 scale-125'
                      : scores[q.id] && scores[q.id] > 0
                      ? 'bg-green-500'
                      : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                  title={`Spørgsmål ${index + 1}`}
                />
              ))}
            </div>

            {/* Error state */}
            {error && (
              <div className="flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-950/20 p-4 border border-red-200 dark:border-red-800">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">Fejl</p>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Results */}
      {personalityProfile && (
        <div className="space-y-8">
          {/* Personality Profile Results */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-lg">
            <CardHeader className="pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                    Din Arbejdsprofil
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">Baseret på dine arbejdspræferencer</p>
                </div>
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  ✓ Færdiggjort
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-8 space-y-8">
              {/* Score visualization */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-foreground">Dine Dimensionsscorer</h3>
                <div className="grid grid-cols-1 gap-4">
                  {dimensionScores.map((dim) => (
                    <div key={dim.dimension} className="space-y-2 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-medium text-sm">{dim.dimension}</span>
                          <button
                            onClick={() => toggleDimensionExplanation(dim.dimension)}
                            className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                            aria-label={`Vis forklaring for ${dim.dimension}`}
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </div>
                        {dim.missingAnswers ? (
                          <span className="text-red-500 text-sm">Manglende svar</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {getLevel(dim.score)}
                            </Badge>
                            <span className="text-muted-foreground text-sm font-mono">{dim.score.toFixed(1)}/5.0</span>
                          </div>
                        )}
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all"
                          style={{ width: `${(dim.score / 5) * 100}%` }}
                        />
                      </div>
                      
                      {/* Explanation (toggleable) */}
                      {expandedDimensions.has(dim.dimension) && (
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                            {getExplanation(dim.dimension as DimensionKey, dim.score)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Parsed profile sections */}
              {parsePersonalityProfile(personalityProfile.profile).map((section, index) => (
                <div key={index} className="space-y-3">
                  <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                    {section.title === 'OVERORDNET ARBEJDSPROFIL' && '📋'}
                    {section.title === 'ARBEJDSMØNSTRE' && '⚙️'}
                    {section.title === 'POTENTIELLE STYRKER I ARBEJDSKONTEKST' && '💪'}
                    {section.title === 'POTENTIELLE FRIKTIONSPUNKTER' && '⚠️'}
                    {section.title === 'RAMMER HVOR PROFILEN TYPISK TRIVES' && '🌟'}
                    {section.title === 'RAMMER HVOR DER KAN OPSTÅ UDFORDRINGER' && '🔄'}
                    {section.title === 'AFSLUTTENDE NOTE' && 'ℹ️'}
                    {section.title.charAt(0) + section.title.slice(1).toLowerCase()}
                  </h3>
                  
                  {section.content && (
                    <div className={`rounded-lg p-5 ${
                      section.title === 'POTENTIELLE STYRKER I ARBEJDSKONTEKST' 
                        ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                        : section.title === 'POTENTIELLE FRIKTIONSPUNKTER'
                        ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800'
                        : section.title === 'AFSLUTTENDE NOTE'
                        ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800'
                        : 'bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800'
                    }`}>
                      <p className="text-base leading-relaxed">{section.content.trim()}</p>
                    </div>
                  )}
                  
                  {section.bullets.length > 0 && (
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${!section.content ? 'mt-0' : ''}`}>
                      {section.bullets.map((bullet, bulletIndex) => (
                        <div 
                          key={bulletIndex}
                          className={`rounded-lg p-4 ${
                            section.title === 'POTENTIELLE STYRKER I ARBEJDSKONTEKST'
                              ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                              : section.title === 'POTENTIELLE FRIKTIONSPUNKTER'
                              ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800'
                              : 'bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <p className="text-sm font-medium">{bullet}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Combined Analysis Card */}
          {combinedAnalysis ? (
            <Card className="border-2 border-indigo-200 dark:border-indigo-800 shadow-lg bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
              <CardHeader className="pb-6 border-b border-indigo-200 dark:border-indigo-800">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                      Samlet Profilforståelse
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">Sammenhæng mellem CV og arbejdspræferencer</p>
                  </div>
                  <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    🔗 Integreret
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-8 space-y-8">
                {parseCombinedAnalysis(combinedAnalysis.analysis).map((section, index) => (
                  <div key={index} className="space-y-3">
                    <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
                      {section.title === 'SAMLET PROFILFORSTÅELSE' && '🔍'}
                      {section.title === 'HVOR CV OG ARBEJDSSTIL UNDERSTØTTER HINANDEN' && '✓'}
                      {section.title === 'POTENTIELLE SPÆNDINGER MELLEM ERFARING OG ARBEJDSSTIL' && '⚡'}
                      {section.title === 'ARBEJDSKONTEKSTER DER TYPISK VIL UNDERSTØTTE PROFILEN' && '🎯'}
                      {section.title === 'KONTEKSTER DER KAN KRÆVE BEVIDST TILPASNING' && '⚙️'}
                      {section.title === 'AFSLUTTENDE NOTE' && 'ℹ️'}
                      {section.title.charAt(0) + section.title.slice(1).toLowerCase()}
                    </h3>
                    
                    {section.content && (
                      <div className={`rounded-lg p-5 ${
                        section.title === 'HVOR CV OG ARBEJDSSTIL UNDERSTØTTER HINANDEN'
                          ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                          : section.title === 'POTENTIELLE SPÆNDINGER MELLEM ERFARING OG ARBEJDSSTIL'
                          ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800'
                          : section.title === 'AFSLUTTENDE NOTE'
                          ? 'bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700'
                          : 'bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700'
                      }`}>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                          {section.content}
                        </p>
                      </div>
                    )}
                    
                    {section.bullets.length > 0 && (
                      <div className="space-y-2">
                        {section.bullets.map((bullet, bIndex) => (
                          <div
                            key={bIndex}
                            className={`flex items-start gap-3 rounded-lg p-4 ${
                              section.title === 'HVOR CV OG ARBEJDSSTIL UNDERSTØTTER HINANDEN'
                                ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
                                : 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            <span className="text-lg mt-0.5">
                              {section.title === 'HVOR CV OG ARBEJDSSTIL UNDERSTØTTER HINANDEN' ? '✓' : '⚡'}
                            </span>
                            <p className="text-sm font-medium flex-1">{bullet}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : analyzingCombined ? (
            <Card className="border border-slate-200 dark:border-slate-800 shadow-lg">
              <CardContent className="pt-8 pb-8">
                <div className="flex flex-col items-center justify-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                  <p className="text-sm text-muted-foreground">Genererer samlet analyse...</p>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
