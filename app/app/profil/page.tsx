'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, ThumbsUp, ThumbsDown, AlertCircle, CheckCircle2, ArrowRight, User, Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CVExtraction {
  summary: string;
  cvText: string;
}

interface DimensionScores {
  struktur: number;
  beslutning: number;
  forandring: number;
  selvstaendighed: number;
  sociale: number;
  ledelse: number;
  tempo: number;
  konflikt: number;
}

interface PersonalityProfile {
  profile: string;
  scores: DimensionScores;
}

// Spørgsmål til personlighedsprofil
const questions = [
  {
    id: 'struktur',
    dimension: 'Struktur & Rammer',
    question: 'Jeg foretrækker klare retningslinjer og forudsigelige opgaver',
    lowLabel: 'Foretrækker fleksibilitet',
    highLabel: 'Foretrækker klare rammer',
  },
  {
    id: 'beslutning',
    dimension: 'Beslutningsstil',
    question: 'Jeg analyserer grundigt alle muligheder før jeg træffer beslutninger',
    lowLabel: 'Handler hurtigt',
    highLabel: 'Analyserer grundigt',
  },
  {
    id: 'forandring',
    dimension: 'Forandring & Stabilitet',
    question: 'Jeg foretrækker stabilitet og kontinuitet i mit arbejde',
    lowLabel: 'Elsker forandring',
    highLabel: 'Foretrækker stabilitet',
  },
  {
    id: 'selvstaendighed',
    dimension: 'Selvstændighed & Sparring',
    question: 'Jeg arbejder bedst når jeg kan løse opgaver selvstændigt',
    lowLabel: 'Foretrækker samarbejde',
    highLabel: 'Foretrækker selvstændighed',
  },
  {
    id: 'sociale',
    dimension: 'Sociale præferencer',
    question: 'Jeg får energi af at arbejde sammen med andre mennesker',
    lowLabel: 'Foretrækker alene-tid',
    highLabel: 'Foretrækker social kontakt',
  },
  {
    id: 'ledelse',
    dimension: 'Ledelse & Autoritet',
    question: 'Jeg tager naturligt styringen i gruppesammenhænge',
    lowLabel: 'Følger andre',
    highLabel: 'Tager ledelse',
  },
  {
    id: 'tempo',
    dimension: 'Tempo & Belastning',
    question: 'Jeg trives med højt tempo og mange samtidige opgaver',
    lowLabel: 'Foretrækker roligt tempo',
    highLabel: 'Trives med højt tempo',
  },
  {
    id: 'konflikt',
    dimension: 'Konflikt & Feedback',
    question: 'Jeg er komfortabel med at give og modtage direkte feedback',
    lowLabel: 'Undgår konfrontation',
    highLabel: 'Håndterer direkte feedback',
  },
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
  const [scores, setScores] = useState<DimensionScores>({
    struktur: 0,
    beslutning: 0,
    forandring: 0,
    selvstaendighed: 0,
    sociale: 0,
    ledelse: 0,
    tempo: 0,
    konflikt: 0,
  });
  const [personalityProfile, setPersonalityProfile] = useState<PersonalityProfile | null>(null);
  const [analyzingPersonality, setAnalyzingPersonality] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const allQuestionsAnswered = Object.values(scores).every(score => score > 0);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Der opstod en fejl');
    } finally {
      setAnalyzingPersonality(false);
    }
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

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-12 px-4 sm:px-6 lg:px-8">
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
                {Object.values(scores).filter(s => s > 0).length}/{questions.length} besvaret
              </Badge>
            </div>
            <Progress 
              value={(Object.values(scores).filter(s => s > 0).length / questions.length) * 100} 
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
                <div className="flex justify-between text-sm text-muted-foreground px-2">
                  <span>{questions[currentQuestionIndex].lowLabel}</span>
                  <span>{questions[currentQuestionIndex].highLabel}</span>
                </div>
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      onClick={() => handleScoreSelect(questions[currentQuestionIndex].id, score)}
                      className={`w-14 h-14 rounded-xl text-lg font-semibold transition-all ${
                        scores[questions[currentQuestionIndex].id as keyof DimensionScores] === score
                          ? 'bg-blue-600 text-white scale-110 shadow-lg'
                          : 'bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:scale-105'
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <div className="flex justify-center gap-1 text-xs text-muted-foreground">
                  <span>1 = Slet ikke enig</span>
                  <span>•</span>
                  <span>5 = Helt enig</span>
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
                  disabled={scores[questions[currentQuestionIndex].id as keyof DimensionScores] === 0}
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
            <div className="flex justify-center gap-2 pt-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentQuestionIndex
                      ? 'bg-blue-600 scale-125'
                      : scores[questions[index].id as keyof DimensionScores] > 0
                      ? 'bg-green-500'
                      : 'bg-slate-300 dark:bg-slate-600'
                  }`}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {questions.map((q) => (
                    <div key={q.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{q.dimension}</span>
                        <span className="text-muted-foreground">{scores[q.id as keyof DimensionScores]}/5</span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all"
                          style={{ width: `${(scores[q.id as keyof DimensionScores] / 5) * 100}%` }}
                        />
                      </div>
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

          {/* CV Summary Card (collapsed) */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-muted-foreground">CV Analyse</CardTitle>
                <Badge variant="outline" className="text-green-600">✓ Bekræftet</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3">{summaryText}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
