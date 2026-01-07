'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Loader2, 
  Compass, 
  TrendingUp, 
  Link2, 
  MessageCircle, 
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Eye,
  Search,
  Save,
  HelpCircle
} from 'lucide-react';

type DirectionChoice = 'A' | 'B' | 'C' | '';

// Coach question types
interface CoachQuestion {
  id: string;
  type: 'single_choice' | 'multi_choice' | 'short_text';
  prompt: string;
  options?: string[];
}

// Direction state from API
interface DirectionState {
  choice: 'A' | 'B' | 'C' | 'UNSET';
  priorities_top3: string[];
  non_negotiables: string[];
  negotiables: string[];
  cv_weighting_focus: string[];
  risk_notes: string[];
  next_step_ready_for_jobs: boolean;
}

// Job example structure
interface JobExample {
  id: string;
  title: string;
  description: string;
}

// API response
interface CareerCoachResponse {
  mode: 'ask_to_choose' | 'deepening' | 'job_examples' | 'spejling';
  coach_message: string;
  questions: CoachQuestion[];
  direction_state: DirectionState;
  job_examples?: JobExample[];
  // Spejling fields
  summary_paragraph?: string;
  patterns?: string[];
  unclear?: string[];
}

// User answer structure
interface UserAnswer {
  question_id: string;
  answer: string | string[];
}

// Local storage keys
const STORAGE_KEYS = {
  CV_ANALYSIS: 'flowstruktur_cv_analysis',
  PERSONALITY_DATA: 'flowstruktur_personality_data',
  COMBINED_ANALYSIS: 'flowstruktur_combined_analysis',
  DIRECTION_STATE: 'flowstruktur_direction_state',
};

function MulighederPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [selectedChoice, setSelectedChoice] = useState<DirectionChoice>('');
  const [jobAdText, setJobAdText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [coachResponse, setCoachResponse] = useState<CareerCoachResponse | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: string]: string | string[] }>({});
  const [directionState, setDirectionState] = useState<DirectionState | null>(null);
  const [hasProfileData, setHasProfileData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<UserAnswer[]>([]);
  const [showJobExamples, setShowJobExamples] = useState(false);
  const [jobExamplesFeedback, setJobExamplesFeedback] = useState<string>('');
  const [showSpejling, setShowSpejling] = useState(false);
  const [spejlingNextAction, setSpejlingNextAction] = useState<string>('');

  // Scroll to top when showing spejling
  useEffect(() => {
    if (showSpejling) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showSpejling]);

  // Load profile data on mount
  useEffect(() => {
    const cvAnalysis = localStorage.getItem(STORAGE_KEYS.CV_ANALYSIS);
    const personalityData = localStorage.getItem(STORAGE_KEYS.PERSONALITY_DATA);
    const combinedAnalysis = localStorage.getItem(STORAGE_KEYS.COMBINED_ANALYSIS);
    
    setHasProfileData(!!(cvAnalysis && personalityData && combinedAnalysis));
    
    // Load saved direction state if exists
    const savedDirectionState = localStorage.getItem(STORAGE_KEYS.DIRECTION_STATE);
    if (savedDirectionState) {
      try {
        const parsed = JSON.parse(savedDirectionState);
        setDirectionState(parsed);
        if (parsed.choice && parsed.choice !== 'UNSET') {
          setSelectedChoice(parsed.choice);
        }
      } catch (e) {
        console.error('Error parsing saved direction state:', e);
      }
    }
  }, []);

  // Initialize from query params
  useEffect(() => {
    const choice = searchParams.get('choice');
    if (choice === 'A' || choice === 'B' || choice === 'C') {
      setSelectedChoice(choice);
    }
  }, [searchParams]);

  // Build step data for API
  const buildStepData = useCallback(() => {
    const cvAnalysis = localStorage.getItem(STORAGE_KEYS.CV_ANALYSIS);
    const personalityData = localStorage.getItem(STORAGE_KEYS.PERSONALITY_DATA);
    const combinedAnalysis = localStorage.getItem(STORAGE_KEYS.COMBINED_ANALYSIS);

    if (!cvAnalysis || !personalityData || !combinedAnalysis) {
      return null;
    }

    let step1_json, step2_json, step3_json;
    
    try {
      // Parse CV analysis
      const cvData = JSON.parse(cvAnalysis);
      step1_json = {
        cv_summary: typeof cvData === 'string' ? cvData : cvData.text || cvData.summary || ''
      };

      // Parse personality data
      const personality = JSON.parse(personalityData);
      const dimensionScores: { [key: string]: { score: string; level: string } } = {};
      
      if (personality.scores) {
        // Calculate dimension scores from raw scores
        const dimensions = [
          'Struktur & Rammer',
          'Beslutningsstil',
          'Forandring & Stabilitet',
          'Selvstændighed & Sparring',
          'Sociale præferencer i arbejdet',
          'Ledelse & Autoritet',
          'Arbejdstempo & Pres',
          'Risiko & Sikkerhed'
        ];
        
        dimensions.forEach((dim, idx) => {
          const startQ = idx * 5 + 1;
          let sum = 0;
          let count = 0;
          for (let q = startQ; q < startQ + 5; q++) {
            const score = personality.scores[`Q${q}`];
            if (score !== undefined) {
              sum += score;
              count++;
            }
          }
          const avg = count > 0 ? sum / count : 3;
          const level = avg >= 3.7 ? 'høj' : avg >= 2.5 ? 'moderat' : 'lav';
          dimensionScores[dim] = { score: avg.toFixed(1), level };
        });
      } else if (personality.dimensionScores) {
        Object.entries(personality.dimensionScores).forEach(([dim, data]: [string, any]) => {
          dimensionScores[dim] = {
            score: data.average?.toFixed(1) || data.score?.toString() || '3.0',
            level: data.level || 'moderat'
          };
        });
      }

      step2_json = { dimension_scores: dimensionScores };

      // Parse combined analysis
      const combined = JSON.parse(combinedAnalysis);
      step3_json = {
        analysis_text: combined.analysis_text || combined.response?.analysis_text || '',
        clarification_answers: combined.clarifyingAnswers || combined.response?.clarifyingAnswers || null
      };

      return { step1_json, step2_json, step3_json };
    } catch (e) {
      console.error('Error building step data:', e);
      return null;
    }
  }, []);

  // Call career coach API
  const callCareerCoach = useCallback(async (
    choice: DirectionChoice,
    answers: UserAnswer[] = [],
    jobAd?: string,
    requestJobExamples: boolean = false
  ) => {
    setIsLoading(true);
    setError(null);

    const stepData = buildStepData();
    if (!stepData) {
      setError('Manglende profildata. Gå til Profil for at udfylde CV og præferencer.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/career-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...stepData,
          user_choice: choice || '',
          job_ad_text_or_url: choice === 'C' ? jobAd : undefined,
          user_answers: answers.length > 0 ? answers : undefined,
          request_job_examples: requestJobExamples,
        }),
      });

      if (!response.ok) {
        throw new Error('Fejl ved kald til karrierecoach');
      }

      const data: CareerCoachResponse = await response.json();
      setCoachResponse(data);
      setDirectionState(data.direction_state);
      
      // Auto-show spejling if API returns spejling mode
      if (data.mode === 'spejling' || data.summary_paragraph) {
        setShowSpejling(true);
      }
      
      // Save direction state
      localStorage.setItem(STORAGE_KEYS.DIRECTION_STATE, JSON.stringify(data.direction_state));
      
    } catch (e) {
      console.error('Error calling career coach:', e);
      setError('Der opstod en fejl. Prøv venligst igen.');
    } finally {
      setIsLoading(false);
    }
  }, [buildStepData]);

  // Handle choice selection
  const handleChoiceSelect = (choice: DirectionChoice) => {
    setSelectedChoice(choice);
    setUserAnswers({});
    setConversationHistory([]);
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('choice', choice);
    router.push(`/app/muligheder?${params.toString()}`, { scroll: false });
    
    // Call API with the new choice
    if (choice === 'C') {
      // For option C, wait for job ad input
      setCoachResponse(null);
    } else {
      callCareerCoach(choice);
    }
  };

  // Handle answering a question
  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Submit answers and continue conversation
  const handleSubmitAnswers = () => {
    const newAnswers: UserAnswer[] = Object.entries(userAnswers).map(([question_id, answer]) => ({
      question_id,
      answer
    }));
    
    const allAnswers = [...conversationHistory, ...newAnswers];
    setConversationHistory(allAnswers);
    setUserAnswers({});
    
    // API will auto-detect job example answers and return spejling
    callCareerCoach(selectedChoice, allAnswers, jobAdText);
  };

  // Continue to job examples (no new answers)
  const handleContinueToJobExamples = () => {
    setShowJobExamples(true);
    callCareerCoach(selectedChoice, conversationHistory, jobAdText, true);
    // Scroll to top to see job examples
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle feedback and proceed to spejling
  const handleJobExamplesFeedbackSubmit = async () => {
    if (!jobExamplesFeedback) return;
    
    setIsLoading(true);
    setError(null);
    
    const stepData = buildStepData();
    if (!stepData) {
      setError('Manglende profildata.');
      setIsLoading(false);
      return;
    }

    // Build feedback payload
    const feedbackPayload = {
      overall_feedback: jobExamplesFeedback,
      job_examples: coachResponse?.job_examples?.map((job, idx) => ({
        job_id: job.id,
        job_title: job.title,
        experience: jobExamplesFeedback === 'yes' ? 'giver_mening' : 
                   jobExamplesFeedback === 'adjust' ? 'delvist' : 'ikke_noget'
      })) || []
    };

    try {
      const response = await fetch('/api/career-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...stepData,
          user_choice: selectedChoice || '',
          request_spejling: true,
          job_examples_feedback: feedbackPayload,
          direction_state: directionState,
        }),
      });

      if (!response.ok) {
        throw new Error('Fejl ved kald til spejling');
      }

      const data: CareerCoachResponse = await response.json();
      setCoachResponse(data);
      setShowSpejling(true);
      
    } catch (e) {
      console.error('Error calling spejling:', e);
      setError('Der opstod en fejl. Prøv venligst igen.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle spejling next action
  const handleSpejlingAction = (action: string) => {
    setSpejlingNextAction(action);
    
    if (action === 'search') {
      // Navigate to job search with direction context
      router.push('/app/gemte-jobs');
    } else if (action === 'adjust') {
      // Reset to adjust direction
      setShowSpejling(false);
      setShowJobExamples(false);
      setJobExamplesFeedback('');
      setCoachResponse(null);
      callCareerCoach(selectedChoice, [], jobAdText);
    } else if (action === 'save') {
      // Save and stay
      localStorage.setItem(STORAGE_KEYS.DIRECTION_STATE, JSON.stringify(directionState));
      alert('Din afklaring er gemt.');
    }
  };

  // Handle job ad submission for option C
  const handleJobAdSubmit = () => {
    if (!jobAdText.trim()) return;
    callCareerCoach('C', [], jobAdText);
  };

  // Start initial conversation (without choice)
  const handleStartCoaching = () => {
    callCareerCoach('');
  };

  // Reset and start over
  const handleReset = () => {
    setSelectedChoice('');
    setJobAdText('');
    setCoachResponse(null);
    setUserAnswers({});
    setDirectionState(null);
    setConversationHistory([]);
    localStorage.removeItem(STORAGE_KEYS.DIRECTION_STATE);
    router.push('/app/muligheder', { scroll: false });
  };

  // Check if all current questions are answered
  const allQuestionsAnswered = coachResponse?.questions?.every(q => {
    const answer = userAnswers[q.id];
    if (q.type === 'multi_choice') {
      return Array.isArray(answer) && answer.length > 0;
    }
    return answer && (typeof answer === 'string' ? answer.trim() !== '' : true);
  }) ?? false;

  // Render question based on type
  const renderQuestion = (question: CoachQuestion) => {
    const currentAnswer = userAnswers[question.id];

    if (question.type === 'single_choice' && question.options) {
      return (
        <div key={question.id} className="space-y-3">
          <Label className="text-base font-medium">{question.prompt}</Label>
          <div className="grid gap-2">
            {question.options.map((option, idx) => (
              <Button
                key={idx}
                variant={currentAnswer === option ? 'default' : 'outline'}
                className="justify-start text-left h-auto py-3 px-4"
                onClick={() => handleAnswer(question.id, option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      );
    }

    if (question.type === 'multi_choice' && question.options) {
      const selectedOptions = Array.isArray(currentAnswer) ? currentAnswer : [];
      return (
        <div key={question.id} className="space-y-3">
          <Label className="text-base font-medium">{question.prompt}</Label>
          <p className="text-sm text-muted-foreground">Vælg alle der passer</p>
          <div className="grid gap-2">
            {question.options.map((option, idx) => {
              const isSelected = selectedOptions.includes(option);
              return (
                <Button
                  key={idx}
                  variant={isSelected ? 'default' : 'outline'}
                  className="justify-start text-left h-auto py-3 px-4"
                  onClick={() => {
                    const newSelection = isSelected
                      ? selectedOptions.filter(o => o !== option)
                      : [...selectedOptions, option];
                    handleAnswer(question.id, newSelection);
                  }}
                >
                  {isSelected && <CheckCircle2 className="mr-2 h-4 w-4" />}
                  {option}
                </Button>
              );
            })}
          </div>
        </div>
      );
    }

    // short_text
    return (
      <div key={question.id} className="space-y-3">
        <Label className="text-base font-medium">{question.prompt}</Label>
        <Textarea
          value={typeof currentAnswer === 'string' ? currentAnswer : ''}
          onChange={(e) => handleAnswer(question.id, e.target.value)}
          placeholder="Skriv dit svar her..."
          rows={3}
        />
      </div>
    );
  };

  // If no profile data, show message
  if (!hasProfileData) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 py-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Muligheder</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Afklar din retning med en coachende dialog
          </p>
        </div>

        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="flex items-start gap-4 pt-6">
            <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                Profil mangler
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                For at bruge karrierecoachen skal du først udfylde din profil med CV og arbejdspræferencer.
              </p>
              <Button 
                className="mt-4"
                onClick={() => router.push('/app/profil')}
              >
                Gå til Profil
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Muligheder</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Afklar din retning med en coachende dialog – ingen jobforslag endnu
        </p>
      </div>

      {/* Direction Choice Cards - always visible */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Card A: Related Direction */}
        <Card
          className={`cursor-pointer transition-all ${
            selectedChoice === 'A'
              ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2'
              : 'hover:border-primary/50 hover:bg-accent/50'
          }`}
          onClick={() => handleChoiceSelect('A')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Beslægtet retning</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Byg videre på din dokumenterede erfaring
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Card B: New Direction */}
        <Card
          className={`cursor-pointer transition-all ${
            selectedChoice === 'B'
              ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2'
              : 'hover:border-primary/50 hover:bg-accent/50'
          }`}
          onClick={() => handleChoiceSelect('B')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Ny retning</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Skift eller udvid din arbejdsform
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Card C: Specific Job Ad */}
        <Card
          className={`cursor-pointer transition-all ${
            selectedChoice === 'C'
              ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2'
              : 'hover:border-primary/50 hover:bg-accent/50'
          }`}
          onClick={() => handleChoiceSelect('C')}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Konkret jobannonce</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Sammenlign med et specifikt opslag
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Option C: Job Ad Input */}
      {selectedChoice === 'C' && !coachResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Indsæt jobannonce</CardTitle>
            <CardDescription>
              Kopiér teksten fra jobannoncen eller indsæt et link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={jobAdText}
              onChange={(e) => setJobAdText(e.target.value)}
              placeholder="Indsæt jobannoncentekst eller URL her..."
              rows={6}
            />
            <Button 
              onClick={handleJobAdSubmit} 
              disabled={!jobAdText.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyserer...
                </>
              ) : (
                <>
                  Fortsæt med denne annonce
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error message */}
      {error && (
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
          <CardContent className="flex items-start gap-4 pt-6">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-red-800 dark:text-red-200">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => setError(null)}
              >
                Luk
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Karrierecoachen tænker...</span>
          </CardContent>
        </Card>
      )}

      {/* Coach Response - hide when showing Spejling */}
      {coachResponse && !isLoading && !showSpejling && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">
                {coachResponse.mode === 'job_examples' ? 'Jobeksempler' : 'Karrierecoach'}
              </CardTitle>
            </div>
            {coachResponse.mode === 'ask_to_choose' && (
              <Badge variant="outline">Afklaring af retning</Badge>
            )}
            {coachResponse.mode === 'deepening' && (
              <Badge variant="outline">Uddybning af valgt retning</Badge>
            )}
            {coachResponse.mode === 'job_examples' && (
              <Badge variant="outline">Illustrative eksempler</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Coach message */}
            {coachResponse.coach_message && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {coachResponse.coach_message}
                </p>
              </div>
            )}

            {/* Job Examples */}
            {coachResponse.job_examples && coachResponse.job_examples.length > 0 && (
              <div className="space-y-6 border-t pt-6">
                <div className="space-y-4">
                  {coachResponse.job_examples.map((job, index) => (
                    <Card key={job.id} className="bg-muted/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">
                          {index + 1}. {job.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {job.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Feedback options after job examples */}
                {!showSpejling && (
                  <Card className="border-primary/50 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="text-base">Ud fra dine svar har vi samlet et par mulige måder at justere dit nuværende karrierespor på. Se dem som beskrivelser af retning – ikke som endelige valg.</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3">
                        <Button
                          variant={jobExamplesFeedback === 'yes' ? 'default' : 'outline'}
                          className="justify-start text-left h-auto py-4 px-4"
                          onClick={() => setJobExamplesFeedback('yes')}
                        >
                          <CheckCircle2 className={`mr-3 h-5 w-5 flex-shrink-0 ${jobExamplesFeedback === 'yes' ? '' : 'text-muted-foreground'}`} />
                          <span>Ja – det her rammer rigtigt</span>
                        </Button>
                        <Button
                          variant={jobExamplesFeedback === 'adjust' ? 'default' : 'outline'}
                          className="justify-start text-left h-auto py-4 px-4"
                          onClick={() => setJobExamplesFeedback('adjust')}
                        >
                          <RefreshCw className={`mr-3 h-5 w-5 flex-shrink-0 ${jobExamplesFeedback === 'adjust' ? '' : 'text-muted-foreground'}`} />
                          <span>Det er tæt på, men jeg vil gerne justere noget</span>
                        </Button>
                        <Button
                          variant={jobExamplesFeedback === 'no' ? 'default' : 'outline'}
                          className="justify-start text-left h-auto py-4 px-4"
                          onClick={() => setJobExamplesFeedback('no')}
                        >
                          <AlertCircle className={`mr-3 h-5 w-5 flex-shrink-0 ${jobExamplesFeedback === 'no' ? '' : 'text-muted-foreground'}`} />
                          <span>Nej – det er ikke den retning, jeg har i tankerne</span>
                        </Button>
                      </div>

                      <Button 
                        onClick={handleJobExamplesFeedbackSubmit}
                        disabled={!jobExamplesFeedback || isLoading}
                        className="w-full"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Behandler...
                          </>
                        ) : (
                          <>
                            Send svar og fortsæt
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Questions */}
            {coachResponse.questions && coachResponse.questions.length > 0 && (
              <div className="space-y-6 border-t pt-6">
                {coachResponse.questions.map(renderQuestion)}
                
                <Button 
                  onClick={handleSubmitAnswers}
                  disabled={!allQuestionsAnswered || isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Behandler...
                    </>
                  ) : (
                    <>
                      Send svar og fortsæt
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Continue button when no questions and not showing job examples */}
            {(!coachResponse.questions || coachResponse.questions.length === 0) && 
             (!coachResponse.job_examples || coachResponse.job_examples.length === 0) && (
              <div className="border-t pt-6 space-y-3">
                {directionState?.next_step_ready_for_jobs ? (
                  <>
                    <Button 
                      onClick={handleContinueToJobExamples}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Behandler...
                        </>
                      ) : (
                        <>
                          Se jobeksempler
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={handleReset}
                      className="w-full"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Start forfra
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={handleSubmitAnswers}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Behandler...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Fortsæt samtalen
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Spejling Section - Step 5B (separate card) */}
      {showSpejling && coachResponse && (coachResponse.mode === 'spejling' || coachResponse.summary_paragraph) && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Din karrierespejling</CardTitle>
            </div>
            <CardDescription>
              En samlet analyse baseret på dit CV og din arbejdsprofilanalyse
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Afsnit 1: Overordnet arbejdsmønster */}
            {coachResponse.summary_paragraph && (
              <div className="space-y-2">
                <h4 className="font-semibold text-base">Overordnet arbejdsmønster</h4>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-base leading-relaxed text-muted-foreground">
                    {coachResponse.summary_paragraph}
                  </p>
                </div>
              </div>
            )}

            {/* Afsnit 2-5 from patterns array */}
            {coachResponse.patterns && coachResponse.patterns.length > 0 && (
              <>
                {/* Afsnit 2: Sammenkobling af CV og profilanalyse */}
                {coachResponse.patterns[0] && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-base">Sammenkobling af CV og profilanalyse</h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-base leading-relaxed text-muted-foreground">
                        {coachResponse.patterns[0]}
                      </p>
                    </div>
                  </div>
                )}

                {/* Afsnit 3: Motivation og drivkræfter */}
                {coachResponse.patterns[1] && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-base">Motivation og drivkræfter</h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-base leading-relaxed text-muted-foreground">
                        {coachResponse.patterns[1]}
                      </p>
                    </div>
                  </div>
                )}

                {/* Afsnit 4: Spændinger, paradokser eller blinde vinkler */}
                {coachResponse.patterns[2] && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-base">Spændinger og blinde vinkler</h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-base leading-relaxed text-muted-foreground">
                        {coachResponse.patterns[2]}
                      </p>
                    </div>
                  </div>
                )}

                {/* Afsnit 5: Praktiske konsekvenser */}
                {coachResponse.patterns[3] && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-base">Praktiske konsekvenser for jobvalg</h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-base leading-relaxed text-muted-foreground">
                        {coachResponse.patterns[3]}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Afsnit 6: Refleksionsspørgsmål */}
            {coachResponse.unclear && coachResponse.unclear.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-semibold text-base">Refleksionsspørgsmål</h4>
                <p className="text-sm text-muted-foreground">Spørgsmål der kan hjælpe dig med at omsætte denne spejling til handling:</p>
                <ul className="space-y-3">
                  {coachResponse.unclear.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg">
                      <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next actions - "Hvad vil du gøre nu?" */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-semibold">Hvad vil du gøre nu?</h4>
              <div className="grid gap-3">
                <Button
                  variant={spejlingNextAction === 'search' ? 'default' : 'outline'}
                  className="justify-start text-left h-auto py-4 px-4"
                  onClick={() => handleSpejlingAction('search')}
                >
                  <Search className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span>Vis konkrete jobopslag, der ligner de jobtyper jeg bedst kunne se mig selv i</span>
                </Button>
                <Button
                  variant={spejlingNextAction === 'adjust' ? 'default' : 'outline'}
                  className="justify-start text-left h-auto py-4 px-4"
                  onClick={() => handleSpejlingAction('adjust')}
                >
                  <RefreshCw className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span>Justér retningen og se nye jobeksempler</span>
                </Button>
                <Button
                  variant={spejlingNextAction === 'save' ? 'default' : 'outline'}
                  className="justify-start text-left h-auto py-4 px-4"
                  onClick={() => handleSpejlingAction('save')}
                >
                  <Save className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span>Stop her og gem min afklaring</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Direction State Summary - only show when no questions are pending, NOT ready for jobs, and NOT showing job examples */}
      {directionState && directionState.choice !== 'UNSET' && !showSpejling && !showJobExamples &&
       (!coachResponse?.questions || coachResponse.questions.length === 0) && 
       !directionState.next_step_ready_for_jobs && (
        <Card className={directionState.next_step_ready_for_jobs 
          ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
          : ''
        }>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Retningsresumé</CardTitle>
              {directionState.next_step_ready_for_jobs && (
                <Badge className="bg-green-600">Klar til jobforslag</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show flowing narrative from coach_message if ready for jobs */}
            {directionState.next_step_ready_for_jobs && coachResponse?.coach_message ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {coachResponse.coach_message}
                </p>
              </div>
            ) : (
              <>
                {/* Choice */}
                <div>
                  <Label className="text-sm text-muted-foreground">Valgt retning</Label>
                  <p className="font-medium">
                    {directionState.choice === 'A' && 'Beslægtet retning (byg videre på erfaring)'}
                    {directionState.choice === 'B' && 'Ny retning (skift/udvid arbejdsform)'}
                    {directionState.choice === 'C' && 'Konkret jobannonce'}
                  </p>
                </div>

                {/* Priorities */}
                {directionState.priorities_top3.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Top prioriteringer</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {directionState.priorities_top3.map((p, i) => (
                        <Badge key={i} variant="secondary">{p}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Non-negotiables */}
                {directionState.non_negotiables.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Ufravigelige krav</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {directionState.non_negotiables.map((n, i) => (
                        <Badge key={i} variant="outline" className="border-red-300 text-red-700 dark:border-red-800 dark:text-red-300">
                          {n}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Negotiables */}
                {directionState.negotiables.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Fleksible områder</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {directionState.negotiables.map((n, i) => (
                        <Badge key={i} variant="outline">{n}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* CV Focus */}
                {directionState.cv_weighting_focus.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Fremhæv fra CV</Label>
                    <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                      {directionState.cv_weighting_focus.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risk notes */}
                {directionState.risk_notes.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground">At teste / afprøve</Label>
                    <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                      {directionState.risk_notes.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              {directionState.next_step_ready_for_jobs ? (
                <Button onClick={handleContinueToJobExamples} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Behandler...
                    </>
                  ) : (
                    <>
                      Se jobeksempler
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Besvar flere spørgsmål for at få jobforslag
                </p>
              )}
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Start forfra
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function MulighederPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-3xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded w-1/3"></div>
          <div className="h-6 bg-muted rounded w-2/3"></div>
          <div className="grid gap-4 md:grid-cols-3 mt-8">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    }>
      <MulighederPageContent />
    </Suspense>
  );
}
