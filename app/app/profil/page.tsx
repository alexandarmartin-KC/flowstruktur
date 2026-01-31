'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
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
import { pdfToImages } from '@/lib/pdf-to-image';

// Storage keys - same as used by other pages (muligheder, job)
const STORAGE_KEYS = {
  CV_ANALYSIS: 'flowstruktur_cv_analysis',
  PERSONALITY_DATA: 'flowstruktur_personality_data',
  COMBINED_ANALYSIS: 'flowstruktur_combined_analysis',
  CV_EXTRACTION: 'flowstruktur_cv_extraction',
  QUESTIONNAIRE_SCORES: 'flowstruktur_questionnaire_scores',
};

// Structured CV data for editor
interface StructuredCVData {
  professionalIntro?: string;
  experience: {
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    keyMilestones?: string;
    bullets: string[];
  }[];
  education: {
    title: string;
    institution: string;
    year: string;
  }[];
  skills: string[];
  languages: {
    language: string;
    level: string;  // Exact level text from CV
  }[];
}

interface CVExtraction {
  summary: string;
  cvText: string;
  structured?: StructuredCVData; // AI-strukturerede CV data til editor
}

// Step 1 output interface - kun tekst
interface Step1Output {
  text: string;
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

// New API response format
interface ClarificationQuestion {
  id: string;
  title: string;
  type: 'single_choice' | 'short_text_optional';
  options: string[];
}

interface CombinedAnalysisResponse {
  needs_clarifications: boolean;
  clarifications: ClarificationQuestion[];
  analysis_text: string;
  ui_state: 'clarifications_only' | 'analysis_only';
}

interface CombinedAnalysis {
  response: CombinedAnalysisResponse;
  clarifyingAnswers?: { [key: string]: string | null };
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

// Helper function to format structured data for analysis
// Converts Vision API extraction to rich, narrative text that preserves all context
function formatStructuredDataForAnalysis(structured: any): string {
  const parts: string[] = [];
  
  // Professional intro - preserve exact wording
  if (structured.professionalIntro) {
    parts.push('═══════════════════════════════════════════════════════');
    parts.push('PROFESSIONEL PROFIL');
    parts.push('═══════════════════════════════════════════════════════');
    parts.push(structured.professionalIntro);
    parts.push('');
  }
  
  // Experience - rich narrative format with ALL details preserved
  if (structured.experience && structured.experience.length > 0) {
    parts.push('═══════════════════════════════════════════════════════');
    parts.push('ERHVERVSERFARING');
    parts.push('═══════════════════════════════════════════════════════\n');
    
    structured.experience.forEach((exp: any, index: number) => {
      // Position header
      parts.push(`Stilling ${index + 1}: ${exp.title}`);
      parts.push(`Virksomhed: ${exp.company}${exp.location ? ' · ' + exp.location : ''}`);
      parts.push(`Periode: ${exp.startDate} – ${exp.endDate || 'Nuværende stilling'}`);
      parts.push('');
      
      // Key milestones provide context about responsibilities
      if (exp.keyMilestones) {
        parts.push('Ansvarsområde og kontekst:');
        parts.push(exp.keyMilestones);
        parts.push('');
      }
      
      // Bullets show specific tasks, achievements, and working methods
      if (exp.bullets && exp.bullets.length > 0) {
        parts.push('Opgaver og resultater:');
        exp.bullets.forEach((bullet: string) => {
          parts.push(`  • ${bullet}`);
        });
        parts.push('');
      }
      
      // Add separator between positions
      if (index < structured.experience.length - 1) {
        parts.push('───────────────────────────────────────────────────────\n');
      }
    });
  }
  
  // Education - with context about institutions
  if (structured.education && structured.education.length > 0) {
    parts.push('\n═══════════════════════════════════════════════════════');
    parts.push('UDDANNELSE');
    parts.push('═══════════════════════════════════════════════════════\n');
    structured.education.forEach((edu: any) => {
      parts.push(`${edu.title}`);
      parts.push(`Institution: ${edu.institution}`);
      parts.push(`År: ${edu.year}`);
      parts.push('');
    });
  }
  
  // Skills - grouped and contextualized
  if (structured.skills && structured.skills.length > 0) {
    parts.push('═══════════════════════════════════════════════════════');
    parts.push('KOMPETENCER OG FÆRDIGHEDER');
    parts.push('═══════════════════════════════════════════════════════');
    parts.push('Dokumenterede kompetencer:');
    // Format skills in readable chunks (max 5 per line for readability)
    for (let i = 0; i < structured.skills.length; i += 5) {
      const chunk = structured.skills.slice(i, i + 5);
      parts.push(`  ${chunk.join(' · ')}`);
    }
    parts.push('');
  }
  
  // Languages - with proficiency levels
  if (structured.languages && structured.languages.length > 0) {
    parts.push('═══════════════════════════════════════════════════════');
    parts.push('SPROGKOMPETENCER');
    parts.push('═══════════════════════════════════════════════════════');
    structured.languages.forEach((lang: any) => {
      parts.push(`  ${lang.language}: ${lang.level}`);
    });
    parts.push('');
  }
  
  return parts.join('\n');
}

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
  
  // Step 1 state
  const [step1Data, setStep1Data] = useState<Step1Output | null>(null);
  const [loadingStep1, setLoadingStep1] = useState(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);
  
  // Personality profile state
  const [currentStep, setCurrentStep] = useState<'cv' | 'questionnaire' | 'results'>('cv');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scores, setScores] = useState<QuestionScores>({});
  const [personalityProfile, setPersonalityProfile] = useState<PersonalityProfile | null>(null);
  const [analyzingPersonality, setAnalyzingPersonality] = useState(false);
  
  // Combined analysis state
  const [combinedAnalysis, setCombinedAnalysis] = useState<CombinedAnalysis | null>(null);
  const [analyzingCombined, setAnalyzingCombined] = useState(false);
  
  // Clarifying questions state - dynamic based on API response
  const [clarifyingAnswers, setClarifyingAnswers] = useState<{ [key: string]: string | null }>({});
  const [updatingAnalysis, setUpdatingAnalysis] = useState(false);
  
  // Track which dimension explanations are expanded
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(new Set());
  
  // Debug state for viewing raw extracted text
  const [showDebug, setShowDebug] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved profile data from localStorage on mount
  useEffect(() => {
    const loadAndMigrateData = async () => {
      try {
        // Load CV extraction (raw upload data)
        const savedExtraction = localStorage.getItem(STORAGE_KEYS.CV_EXTRACTION);
        if (savedExtraction) {
          const parsedExtraction = JSON.parse(savedExtraction);
          
          // Check if we need to migrate - if cvText exists but structured doesn't
          if (parsedExtraction.cvText && !parsedExtraction.structured) {
            console.log('Migrating CV data: adding structured extraction...');
            try {
              const structureRes = await fetch('/api/cv/structure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cvText: parsedExtraction.cvText }),
              });
              
              if (structureRes.ok) {
                const structured = await structureRes.json();
                parsedExtraction.structured = structured;
                // Save migrated data
                localStorage.setItem(STORAGE_KEYS.CV_EXTRACTION, JSON.stringify(parsedExtraction));
                console.log('CV data migration complete:', structured);
              }
            } catch (structureErr) {
              console.error('Could not migrate CV data:', structureErr);
            }
          }
          
          setExtraction(parsedExtraction);
        }
        
        // Load CV analysis (step1 data)
        const savedCvAnalysis = localStorage.getItem(STORAGE_KEYS.CV_ANALYSIS);
        if (savedCvAnalysis) {
          const parsedCv = JSON.parse(savedCvAnalysis);
          setStep1Data(parsedCv);
          setCurrentStep('questionnaire'); // CV already done, go to questionnaire
        }
        
        // Load questionnaire scores (partial progress)
        const savedScores = localStorage.getItem(STORAGE_KEYS.QUESTIONNAIRE_SCORES);
        if (savedScores) {
          const parsedScores = JSON.parse(savedScores);
          setScores(parsedScores);
        }
      
      // Load personality data (completed questionnaire)
      const savedPersonalityData = localStorage.getItem(STORAGE_KEYS.PERSONALITY_DATA);
      if (savedPersonalityData) {
        const parsedPersonality = JSON.parse(savedPersonalityData);
        setPersonalityProfile(parsedPersonality);
        if (parsedPersonality.scores) {
          setScores(parsedPersonality.scores);
        }
        setCurrentStep('results'); // Both CV and personality done
      }
      
      // Load combined analysis
      const savedCombinedAnalysis = localStorage.getItem(STORAGE_KEYS.COMBINED_ANALYSIS);
      if (savedCombinedAnalysis) {
        const parsedCombined = JSON.parse(savedCombinedAnalysis);
        setCombinedAnalysis(parsedCombined);
        if (parsedCombined.clarifyingAnswers) {
          setClarifyingAnswers(parsedCombined.clarifyingAnswers);
        }
      }
    } catch (error) {
      console.error('Error loading saved profile data:', error);
    }
    };
    
    loadAndMigrateData();
  }, []);

  // Save extraction to localStorage when it changes
  useEffect(() => {
    if (extraction) {
      try {
        localStorage.setItem(STORAGE_KEYS.CV_EXTRACTION, JSON.stringify(extraction));
      } catch (error) {
        console.error('Error saving CV extraction:', error);
      }
    }
  }, [extraction]);

  // Save step1Data (CV analysis) to localStorage when it changes
  useEffect(() => {
    if (step1Data) {
      try {
        localStorage.setItem(STORAGE_KEYS.CV_ANALYSIS, JSON.stringify(step1Data));
      } catch (error) {
        console.error('Error saving CV analysis:', error);
      }
    }
  }, [step1Data]);

  // Save questionnaire scores to localStorage when they change (for partial progress)
  useEffect(() => {
    if (Object.keys(scores).length > 0) {
      try {
        localStorage.setItem(STORAGE_KEYS.QUESTIONNAIRE_SCORES, JSON.stringify(scores));
      } catch (error) {
        console.error('Error saving questionnaire scores:', error);
      }
    }
  }, [scores]);

  // Save personality profile to localStorage when it changes
  useEffect(() => {
    if (personalityProfile) {
      try {
        localStorage.setItem(STORAGE_KEYS.PERSONALITY_DATA, JSON.stringify(personalityProfile));
      } catch (error) {
        console.error('Error saving personality data:', error);
      }
    }
  }, [personalityProfile]);

  // Save combined analysis to localStorage when it changes
  useEffect(() => {
    if (combinedAnalysis) {
      try {
        localStorage.setItem(STORAGE_KEYS.COMBINED_ANALYSIS, JSON.stringify(combinedAnalysis));
      } catch (error) {
        console.error('Error saving combined analysis:', error);
      }
    }
  }, [combinedAnalysis]);

  // ============ TEST MODE - REMOVE BEFORE PRODUCTION ============
  const loadTestData = () => {
    // Mock CV extraction
    setExtraction({
      summary: 'Test CV Summary: 10 års erfaring med React, TypeScript, og Next.js udvikling. Specialiseret i brugervenlige interfaces og skalerbare webapplikationer. Arbejdet i både startups og større virksomheder med fokus på agile metoder og teamsamarbejde.',
      cvText: 'Mock CV text content...'
    });
    
    // Mock Step 1 data
    setStep1Data({
      text: `På baggrund af dit CV ser vi en erfaren og teknisk solid profil som senior softwareudvikler med særlig styrke inden for moderne webudvikling og frontend-arkitektur.

Dit CV viser særlig erfaring med:
- React, TypeScript og Next.js som primære teknologier gennem ca. 10 år
- Ledelse af mindre udviklingsteams og koordinering af projekter på tværs af afdelinger
- Brugercentreret design og agile udviklingsmetoder i praksis
- Arbejde i både hurtige startup-miljøer og større, etablerede tech-virksomheder

CV'et peger på en rolle som teknisk specialist med projektkoordinerende ansvar. Du har bevæget dig fra individuel udviklerrolle til en position med bredere ansvar for løsninger og samarbejde på tværs af teams. Der er en klar teknisk dybde kombineret med erfaring i at arbejde tæt med design, produkt og stakeholders.

Helhedsindtrykket er en struktureret karriereprogression med konsistent fokus på kvalitet i webudvikling. Erfaringen spænder fra hands-on kodning til teknisk sparring og teamkoordinering, hvilket giver en alsidig profil der kan bidrage på flere niveauer.

Hvis noget i ovenstående ikke stemmer overens med din oplevelse, kan du justere det i næste trin.`
    });
    
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
      response: {
        needs_clarifications: false,
        clarifications: [],
        analysis_text: `CV'et dokumenterer arbejde inden for webudvikling med fokus på React, TypeScript og Next.js. De angivne roller omfatter både startups og etablerede virksomheder.

Arbejdspræferencerne er angivet med moderate til høje niveauer for struktur og rammer samt behov for feedback. Niveauet for selvstændighed er moderat, og niveauet for tempo er ligeledes moderat.

Relationen mellem de dokumenterede arbejdsformer og de angivne præferenceniveauer er ikke entydig. Materialet giver ikke grundlag for at afgøre, hvordan præferencerne har påvirket de konkrete rollevalg, eller om arbejdsformerne har påvirket præferencerne over tid.`,
        ui_state: 'analysis_only'
      }
    });
    
    setCurrentStep('results');
  };
  // ============ END TEST MODE ============

  // CV confirmed - move to questionnaire
  const cvConfirmed = step1Data !== null;

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

    try {
      let data: any = null;
      
      // For PDFs, use OCR approach: render to images client-side, then send to Vision API
      if (file.name.toLowerCase().endsWith('.pdf')) {
        console.log('Converting PDF to images for OCR...');
        try {
          // Step 1: Render PDF pages to images client-side
          const pageImages = await pdfToImages(file, 3, 2.0); // max 3 pages, 2x scale for quality
          console.log('Converted PDF to', pageImages.length, 'images');
          
          // Step 2: Send images to Vision API
          const visionRes = await fetch('/api/cv/vision-extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              images: pageImages.map(img => ({ base64: img.base64 }))
            }),
          });
          
          if (visionRes.ok) {
            const visionData = await visionRes.json();
            
            // Convert structured data to readable text format for Step 1 analysis
            const formattedCvText = formatStructuredDataForAnalysis(visionData);
            
            data = {
              cvText: formattedCvText, // Formatted text from Vision extraction
              structured: visionData,
              usedVision: true,
            };
            console.log('Vision OCR extraction succeeded');
            console.log('Experience count:', visionData.experience?.length);
            console.log('Education count:', visionData.education?.length);
          } else {
            const errBody = await visionRes.json();
            console.log('Vision extraction failed:', errBody.error);
            throw new Error(errBody.error || 'Vision extraction failed');
          }
        } catch (visionErr) {
          console.error('Vision extraction error:', visionErr);
          // Don't silently fall back - let the user know
          throw visionErr;
        }
      } else {
        // Non-PDF files: use text extraction
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch('/api/extract', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Kunne ikke udtrække CV');
        }

        data = await res.json();
        
        // After extraction, get structured CV data for the editor
        if (data.cvText) {
          try {
            const structureRes = await fetch('/api/cv/structure', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cvText: data.cvText }),
            });
            
            if (structureRes.ok) {
              const structured = await structureRes.json();
              data.structured = structured;
            }
          } catch (structureErr) {
            console.error('Could not structure CV data:', structureErr);
          }
        }
      }
      
      setExtraction(data);
      
      // After extraction, automatically generate Step 1 data
      if (data.cvText || data.structured) {
        const cvText = data.cvText || JSON.stringify(data.structured);
        await generateStep1Data(cvText, data.structured);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Der opstod en fejl');
    } finally {
      setLoading(false);
    }
  };

  const generateStep1Data = async (cvText: string, extracted?: any) => {
    setLoadingStep1(true);
    setError(null);

    try {
      const res = await fetch('/api/cv/derive-step1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cvText,
          extracted,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Kunne ikke generere Step 1 data');
      }

      const data = await res.json();
      setStep1Data(data);
    } catch (err) {
      console.error('Step 1 generation error:', err);
      setError(err instanceof Error ? err.message : 'Der opstod en fejl ved Step 1 generering');
    } finally {
      setLoadingStep1(false);
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
      if (step1Data) {
        generateCombinedAnalysis(step1Data.text, data.scores);
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

      const data: CombinedAnalysisResponse = await res.json();
      setCombinedAnalysis({ response: data });
      
      // Initialize clarifying answers if needed
      if (data.needs_clarifications && data.clarifications.length > 0) {
        const initialAnswers: { [key: string]: string | null } = {};
        data.clarifications.forEach(q => {
          initialAnswers[q.id] = null;
        });
        setClarifyingAnswers(initialAnswers);
      }
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

    // Sektionstitler der matcher den nye prompt-struktur
    const sectionTitles = [
      // Aktuelle titler
      'OVERORDNET ARBEJDSPROFIL',
      'CENTRALE ARBEJDSMØNSTRE',
      'POTENTIELLE STYRKER I ARBEJDSKONTEKST',
      'POTENTIELLE FRIKTIONSPUNKTER',
      'SAMLET FORSTÅELSE',
      // Alternative formuleringer
      'KORT KONKLUSION',
      'SAMMENHÆNG MELLEM CV OG ARBEJDSPROFIL',
      'POTENTIELLE SPÆNDINGSFELTER',
      'AFSLUTTENDE KONTEKST',
      // Gamle titler (bagudkompatibilitet)
      'SAMLET PROFILFORSTÅELSE',
      'HVOR CV OG ARBEJDSSTIL UNDERSTØTTER HINANDEN',
      'POTENTIELLE SPÆNDINGER',
      'ARBEJDSKONTEKSTER',
      'KONTEKSTER DER KAN KRÆVE',
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
      } else {
        // Hvis ingen sektion er startet, opret en default sektion
        currentSection = { title: 'SAMLET ANALYSE', content: line + '\n', bullets: [] };
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    // Hvis ingen sektioner fundet, returner hele teksten som én sektion
    if (sections.length === 0 && analysis.trim()) {
      return [{ title: 'SAMLET ANALYSE', content: analysis.trim(), bullets: [] }];
    }

    return sections.map(section => ({
      ...section,
      content: section.content.trim()
    }));
  };

  // Update analysis with clarifying answers
  const updateAnalysisWithAnswers = async () => {
    if (!combinedAnalysis || !step1Data) return;
    
    // Check if any answers are provided
    const hasAnswers = Object.values(clarifyingAnswers).some(v => v && v !== '');
    
    if (!hasAnswers) return;
    
    setUpdatingAnalysis(true);
    
    try {
      // Calculate dimension scores
      const dimensionScores = calculateAllDimensionScores(scores);
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
          cvAnalysis: step1Data.text,
          dimensionScores: dimensionScoresMap,
          clarifyingAnswers: clarifyingAnswers
        }),
      });

      if (!res.ok) {
        throw new Error('Kunne ikke opdatere analyse');
      }

      const data: CombinedAnalysisResponse = await res.json();
      setCombinedAnalysis({
        response: data,
        clarifyingAnswers: clarifyingAnswers
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Der opstod en fejl ved opdatering af analyse');
    } finally {
      setUpdatingAnalysis(false);
    }
  };

  // Reset all profile data
  const resetProfile = () => {
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEYS.CV_ANALYSIS);
    localStorage.removeItem(STORAGE_KEYS.PERSONALITY_DATA);
    localStorage.removeItem(STORAGE_KEYS.COMBINED_ANALYSIS);
    localStorage.removeItem(STORAGE_KEYS.CV_EXTRACTION);
    localStorage.removeItem(STORAGE_KEYS.QUESTIONNAIRE_SCORES);
    
    // Reset all state
    setFile(null);
    setExtraction(null);
    setStep1Data(null);
    setCurrentStep('cv');
    setCurrentQuestionIndex(0);
    setScores({});
    setPersonalityProfile(null);
    setCombinedAnalysis(null);
    setClarifyingAnswers({});
    setError(null);
    setAgreement(null);
    setFeedback('');
    setRevised(null);
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

  // Determine which step we're on
  const activeStep = personalityProfile ? 'results' : (cvConfirmed && currentStep === 'questionnaire') ? 'questionnaire' : 'cv';

  // Beregn dimensionsscorer når vi har scores
  const dimensionScores = useMemo(() => {
    if (Object.keys(scores).length === 0) return [];
    return calculateAllDimensionScores(scores);
  }, [scores]);

  return (
    <div className="space-y-6">
      {/* Contact Information Section - Always visible at top */}
      <ProfileContactSection />

      {/* Profile Photo Section */}
      <ProfilePhotoSection />

      {/* Page Header - Clean, minimal */}
      <div className="space-y-1 mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          {activeStep === 'cv' && 'CV Analyse'}
          {activeStep === 'questionnaire' && 'Arbejdspræferencer'}
          {activeStep === 'results' && 'Din Profil'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {activeStep === 'cv' && 'Upload dit CV for at komme i gang'}
          {activeStep === 'questionnaire' && 'Besvar spørgsmål om dine arbejdspræferencer'}
          {activeStep === 'results' && 'Overblik over din profil'}
        </p>
      </div>

      {/* ============ TEST MODE BUTTON - REMOVE BEFORE PRODUCTION ============ */}
      {!personalityProfile && (
        <div className="mb-4">
          <Button
            onClick={loadTestData}
            variant="outline"
            size="sm"
          >
            Test data (dev)
          </Button>
        </div>
      )}
      {/* ============ END TEST MODE ============ */}

      {/* Reset Profile Button - shown when there's saved data */}
      {(step1Data || personalityProfile) && (
        <div className="mb-4">
          <Button
            onClick={resetProfile}
            variant="outline"
            size="sm"
          >
            Start forfra
          </Button>
        </div>
      )}

      {/* Step Indicator - Minimal */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded ${
          activeStep === 'cv' ? 'bg-muted text-foreground' : 
          cvConfirmed ? 'text-foreground' : 
          'text-muted-foreground'
        }`}>
          {cvConfirmed && <CheckCircle2 className="h-3.5 w-3.5" />}
          <span>1. CV</span>
        </div>
        <span className="text-muted-foreground">→</span>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded ${
          activeStep === 'questionnaire' ? 'bg-muted text-foreground' : 
          personalityProfile ? 'text-foreground' : 
          'text-muted-foreground'
        }`}>
          {personalityProfile && <CheckCircle2 className="h-3.5 w-3.5" />}
          <span>2. Præferencer</span>
        </div>
        <span className="text-muted-foreground">→</span>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded ${
          activeStep === 'results' ? 'bg-muted text-foreground' : 
          'text-muted-foreground'
        }`}>
          <span>3. Resultat</span>
        </div>
      </div>

      {/* Upload sektion */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Upload dit CV</CardTitle>
          <p className="text-sm text-muted-foreground">PDF, DOCX eller TXT</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show saved CV info if extraction exists but no file selected */}
          {extraction && !file && (
            <div className="flex items-center gap-3 rounded bg-muted p-3">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">CV uploadet</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDebug(!showDebug)}
                >
                  {showDebug ? 'Skjul' : 'Debug'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload nyt
                </Button>
              </div>
            </div>
          )}
          
          {/* Debug panel - show raw extracted text */}
          {showDebug && extraction && (
            <Card className="border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Debug: Ekstraheret tekst</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded p-3">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                    {extraction.cvText}
                  </pre>
                </div>
                <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
                  <p>Længde: {extraction.cvText.length} tegn</p>
                  {extraction.structured && (
                    <>
                      <p>Jobs: {extraction.structured.experience.length} · Uddannelser: {extraction.structured.education.length}</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Drag and drop area - only show if no extraction or user wants to upload new */}
          {!extraction && (
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
                className="w-full border border-dashed border-border rounded p-6 hover:border-foreground/50 hover:bg-muted/50 transition-colors disabled:opacity-50"
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm text-foreground">Vælg fil eller træk hertil</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Hidden file input for "Upload nyt CV" button */}
          {extraction && !file && (
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
          )}

          {/* Selected file info */}
          {file && (
            <div className="flex items-center gap-3 rounded bg-muted p-3">
              <div className="text-xs font-medium text-muted-foreground uppercase">
                {file.name.split('.').pop()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{file.name}</p>
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
                  setStep1Data(null);
                  setAgreement(null);
                }}
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
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Analyserer...' : 'Analysér CV'}
            </Button>
          )}

          {/* Error state */}
          {error && (
            <div className="flex items-start gap-2 rounded bg-destructive/10 p-3 text-sm">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <p className="text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 1: Hvad vi udleder af dit CV */}
      {step1Data && (
        <div className="space-y-4">
          {/* Step 1 Loading State */}
          {loadingStep1 && (
            <Card>
              <CardContent className="py-8">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Analyserer dit CV...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 1 Main Card */}
          {!loadingStep1 && (
            <>
              <Card>
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-medium">
                        CV-analyse
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Hvad vi udleder af dit CV</p>
                    </div>
                    <Badge variant="secondary">
                      Færdig
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {step1Data.text}
                  </div>
                </CardContent>
              </Card>

              {/* Continue to questionnaire button */}
              <Button
                onClick={() => setCurrentStep('questionnaire')}
                className="w-full"
              >
                Fortsæt til arbejdspræferencer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      )}

      {/* STEP 2: Personality Questionnaire */}
      {currentStep === 'questionnaire' && cvConfirmed && !personalityProfile && (
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium">Arbejdspræferencer</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Spørgsmål {currentQuestionIndex + 1} af {questions.length}
                </p>
              </div>
              <Badge variant="secondary">
                {Object.keys(scores).filter(k => scores[k] > 0).length}/{questions.length}
              </Badge>
            </div>
            <Progress 
              value={(Object.keys(scores).filter(k => scores[k] > 0).length / questions.length) * 100} 
              className="mt-3 h-1.5"
            />
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Current question */}
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <Badge variant="outline" className="text-xs">{questions[currentQuestionIndex].dimension}</Badge>
                <h3 className="text-base font-medium text-foreground">
                  {questions[currentQuestionIndex].question}
                </h3>
              </div>

              {/* Score selection */}
              <div className="space-y-3">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      onClick={() => handleScoreSelect(questions[currentQuestionIndex].id, score)}
                      className={`w-10 h-10 rounded text-sm font-medium transition-colors ${
                        scores[questions[currentQuestionIndex].id] === score
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground hover:bg-muted/80'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                  <span>1 = Uenig</span>
                  <span>5 = Enig</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Forrige
              </Button>
              
              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  size="sm"
                  onClick={handleNextQuestion}
                  disabled={!scores[questions[currentQuestionIndex].id] || scores[questions[currentQuestionIndex].id] === 0}
                >
                  Næste
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleSubmitPersonality}
                  disabled={!allQuestionsAnswered || analyzingPersonality}
                >
                  {analyzingPersonality && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  {analyzingPersonality ? 'Analyserer...' : 'Se profil'}
                </Button>
              )}
            </div>

            {/* Quick navigation dots */}
            <div className="flex justify-center gap-1.5 pt-2 flex-wrap">
              {questions.map((q, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentQuestionIndex
                      ? 'bg-foreground'
                      : scores[q.id] && scores[q.id] > 0
                      ? 'bg-foreground/40'
                      : 'bg-muted-foreground/30'
                  }`}
                  title={`Spørgsmål ${index + 1}`}
                />
              ))}
            </div>

            {/* Error state */}
            {error && (
              <div className="flex items-start gap-2 rounded bg-destructive/10 p-3 text-sm">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <p className="text-destructive">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Results */}
      {personalityProfile && (
        <div className="space-y-4">
          {/* Personality Profile Results */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base font-medium">
                    Din arbejdsprofil
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Baseret på dine præferencer</p>
                </div>
                <Badge variant="secondary">
                  Færdig
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              {/* Score visualization */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Dimensionsscorer</h3>
                <div className="space-y-3">
                  {dimensionScores.map((dim) => (
                    <div key={dim.dimension} className="space-y-1.5 p-3 rounded bg-muted/50">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1">
                          <span className="text-sm">{dim.dimension}</span>
                          <button
                            onClick={() => toggleDimensionExplanation(dim.dimension)}
                            className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                            aria-label={`Vis forklaring for ${dim.dimension}`}
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {dim.missingAnswers ? (
                          <span className="text-destructive text-xs">Mangler svar</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {getLevel(dim.score)}
                            </span>
                            <span className="text-xs font-mono text-muted-foreground">{dim.score.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-foreground/60 rounded-full transition-all"
                          style={{ width: `${(dim.score / 5) * 100}%` }}
                        />
                      </div>
                      
                      {/* Explanation (toggleable) */}
                      {expandedDimensions.has(dim.dimension) && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
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
                <div key={index} className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground">
                    {section.title.charAt(0) + section.title.slice(1).toLowerCase()}
                  </h3>
                  
                  {section.content && (
                    <div className="rounded bg-muted/50 p-3">
                      <p className="text-sm leading-relaxed">{section.content.trim()}</p>
                    </div>
                  )}
                  
                  {section.bullets.length > 0 && (
                    <div className="space-y-1.5">
                      {section.bullets.map((bullet, bulletIndex) => (
                        <div 
                          key={bulletIndex}
                          className="rounded bg-muted/30 p-2.5"
                        >
                          <p className="text-sm">{bullet}</p>
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
            <Card>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-medium">
                      Samlet analyse
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">CV og arbejdspræferencer samlet</p>
                  </div>
                  <Badge variant="secondary">
                    {combinedAnalysis.response.ui_state === 'analysis_only' ? 'Færdig' : 'Afventer'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Show analysis text if ui_state is analysis_only */}
                {combinedAnalysis.response.ui_state === 'analysis_only' && combinedAnalysis.response.analysis_text && (
                  <div className="rounded bg-muted/50 p-3">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {combinedAnalysis.response.analysis_text}
                    </p>
                  </div>
                )}

                {/* Show clarifying questions if ui_state is clarifications_only */}
                {combinedAnalysis.response.ui_state === 'clarifications_only' && 
                 combinedAnalysis.response.clarifications.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Tillægsspørgsmål</h3>
                    <p className="text-xs text-muted-foreground">
                      For en mere præcis analyse har vi brug for afklaringer:
                    </p>
                    
                    <div className="space-y-2">
                      {combinedAnalysis.response.clarifications.map((question) => (
                        <div key={question.id} className="flex flex-col gap-1.5 p-2.5 rounded bg-muted/50">
                          <span className="text-sm">{question.title}</span>
                          {question.type === 'single_choice' ? (
                            <div className="flex flex-wrap gap-1">
                              {question.options.map(option => (
                                <Button
                                  key={option}
                                  type="button"
                                  variant={clarifyingAnswers[question.id] === option ? 'default' : 'outline'}
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => setClarifyingAnswers(prev => ({
                                    ...prev,
                                    [question.id]: option
                                  }))}
                                >
                                  {option}
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <Textarea
                              placeholder="Kommentar (valgfrit)..."
                              value={clarifyingAnswers[question.id] || ''}
                              onChange={(e) => setClarifyingAnswers(prev => ({
                                ...prev,
                                [question.id]: e.target.value || null
                              }))}
                              className="min-h-[40px] text-sm"
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Update button */}
                    <Button
                      onClick={updateAnalysisWithAnswers}
                      disabled={updatingAnalysis || !Object.values(clarifyingAnswers).some(v => v && v !== '')}
                      className="w-full"
                      size="sm"
                    >
                      {updatingAnalysis ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Opdaterer...
                        </>
                      ) : (
                        'Opdater analyse'
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : analyzingCombined ? (
            <Card>
              <CardContent className="py-6">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Genererer analyse...</p>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
