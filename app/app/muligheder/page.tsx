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
  // New comprehensive analysis fields (5 sections)
  section1_arbejdsmoenster?: string;
  section2_drivkraft?: string;
  section3_spaendingsfelt?: string;
  section4_navigation?: {
    skal_vaere_til_stede: string[];
    advarselstegn: string[];
    nice_to_have: string[];
  };
  section5_hypotese?: string;
  // Legacy fields (for backwards compatibility)
  summary_paragraph?: string;
  patterns?: string[];
  unclear?: string[];
  next_step_explanation?: string;
}

// Lag 2 response structure (brugersprog version)
interface Lag2Question {
  id: string;
  text: string;
}

interface Lag2Response {
  mode: 'ny_retning_lag2';
  intro: {
    content: string;
  };
  questions: Lag2Question[];
  outro: {
    content: string;
  };
  choices: {
    title: string;
    options: { id: string; label: string }[];
  };
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
  
  // Post job examples coaching questions state
  const [postJobExamplesQuestions, setPostJobExamplesQuestions] = useState<CoachQuestion[]>([]);
  const [postJobExamplesAnswers, setPostJobExamplesAnswers] = useState<{ [questionId: string]: string | string[] }>({});
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  
  // Lag 2 state
  const [showLag2, setShowLag2] = useState(false);
  const [lag2Response, setLag2Response] = useState<Lag2Response | null>(null);
  const [lag2Answers, setLag2Answers] = useState<{ [questionId: string]: string }>({});
  const [lag2SelectedChoice, setLag2SelectedChoice] = useState<string>('');
  const [isLoadingLag2, setIsLoadingLag2] = useState(false);

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
    if (choice === 'A' || choice === 'B') {
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
      
      // Auto-show spejling if API returns spejling mode (check all possible section fields)
      if (data.mode === 'spejling' || data.section1_arbejdsmoenster || data.summary_paragraph) {
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

  // Auto-fetch job examples when ready (removes need for extra click)
  useEffect(() => {
    if (
      directionState?.next_step_ready_for_jobs &&
      coachResponse &&
      !coachResponse.job_examples?.length &&
      !coachResponse.questions?.length &&
      !showJobExamples &&
      !showSpejling &&
      !isLoading
    ) {
      setShowJobExamples(true);
      callCareerCoach(selectedChoice, conversationHistory, jobAdText, true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [directionState?.next_step_ready_for_jobs, coachResponse, showJobExamples, showSpejling, isLoading, selectedChoice, conversationHistory, jobAdText, callCareerCoach]);

  // Handle choice selection
  const handleChoiceSelect = (choice: DirectionChoice) => {
    setSelectedChoice(choice);
    setUserAnswers({});
    setConversationHistory([]);
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('choice', choice);
    router.push(`/app/muligheder?${params.toString()}`, { scroll: false });
    
    // Call API with the new choice (A or B)
    callCareerCoach(choice);
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

  // Semi-dynamic coaching questions based on job feedback patterns
  // Questions are selected from a controlled catalog based on user's responses
  const getCoachingQuestionsBasedOnFeedback = (): CoachQuestion[] => {
    const jobExamples = coachResponse?.job_examples || [];
    if (jobExamples.length === 0) return [];

    // Count feedback types
    const feedbackCounts = {
      giver_mening: 0,
      delvist: 0,
      ikke_noget: 0
    };
    
    jobExamples.forEach(job => {
      const feedback = postJobExamplesAnswers[`feedback_${job.id}`] as string;
      if (feedback && feedbackCounts.hasOwnProperty(feedback)) {
        feedbackCounts[feedback as keyof typeof feedbackCounts]++;
      }
    });

    const questions: CoachQuestion[] = [];
    const totalAnswered = feedbackCounts.giver_mening + feedbackCounts.delvist + feedbackCounts.ikke_noget;
    
    // Only show questions when all job examples have feedback
    if (totalAnswered < jobExamples.length) return [];

    // Pattern 1: Mostly "giver mening" → Need boundary/clarification questions
    if (feedbackCounts.giver_mening >= 2) {
      questions.push({
        id: 'what_must_be_true',
        type: 'short_text',
        prompt: 'Du reagerede positivt på flere af eksemplerne. Hvad skal være til stede i en rolle, for at den føles rigtig – og hvad kunne du undvære?'
      });
    }

    // Pattern 2: Has "delvist" → Need tension/ambivalence questions  
    if (feedbackCounts.delvist >= 1) {
      questions.push({
        id: 'what_pulls_back',
        type: 'short_text',
        prompt: 'Ved de eksempler hvor du var i tvivl – hvad var det der tiltalte dig, og hvad skabte tøven?'
      });
    }

    // Pattern 3: Has "ikke noget" → Need friction/boundary questions
    if (feedbackCounts.ikke_noget >= 1) {
      questions.push({
        id: 'what_doesnt_fit',
        type: 'short_text',
        prompt: 'Ved de eksempler der ikke passede – hvad var det konkret, der gjorde at de ikke føltes rigtige?'
      });
    }

    // Pattern 4: Mixed reactions → Need priority question
    if (feedbackCounts.giver_mening >= 1 && feedbackCounts.ikke_noget >= 1) {
      questions.push({
        id: 'priority_element',
        type: 'short_text',
        prompt: 'Når du sammenligner de roller du kunne se dig selv i med dem du afviste – hvad er den vigtigste forskel?'
      });
    }

    // Fallback: If somehow no pattern matched, ask a general clarifying question
    if (questions.length === 0) {
      questions.push({
        id: 'general_reflection',
        type: 'short_text',
        prompt: 'Hvad tager du med fra disse eksempler? Er der noget der overraskede dig?'
      });
    }

    // Limit to max 2 questions to avoid feeling like interrogation
    return questions.slice(0, 2);
  };

  // Get dynamic coaching questions
  const coachingQuestions = getCoachingQuestionsBasedOnFeedback();

  // Handle answering job example feedback
  const handleJobExampleFeedback = (jobId: string, feedback: string) => {
    setPostJobExamplesAnswers(prev => ({
      ...prev,
      [`feedback_${jobId}`]: feedback
    }));
  };

  // Handle answering coaching questions
  const handlePostJobExamplesAnswer = (questionId: string, answer: string | string[]) => {
    setPostJobExamplesAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Check if all questions are answered (job feedback + coaching questions)
  const allQuestionsComplete = () => {
    // Check job example feedback
    const jobExamples = coachResponse?.job_examples || [];
    const allJobFeedbackAnswered = jobExamples.every(job => 
      postJobExamplesAnswers[`feedback_${job.id}`]
    );
    
    // If not all jobs answered, return false (coaching questions not shown yet)
    if (!allJobFeedbackAnswered) return false;
    
    // Check coaching questions (now dynamic based on feedback)
    const dynamicQuestions = getCoachingQuestionsBasedOnFeedback();
    const allCoachingAnswered = dynamicQuestions.every(q => {
      const answer = postJobExamplesAnswers[q.id];
      return answer && (typeof answer === 'string' ? answer.trim() !== '' : true);
    });
    
    return allCoachingAnswered;
  };

  // Fetch spejling (analysis) with all collected data
  const fetchSpejling = async (feedbackPayload: any) => {
    setIsLoading(true);
    setError(null);
    
    const stepData = buildStepData();
    if (!stepData) {
      setError('Manglende profildata.');
      setIsLoading(false);
      return;
    }

    // Combine all answers
    const postFeedbackAnswers: UserAnswer[] = Object.entries(postJobExamplesAnswers).map(([question_id, answer]) => ({
      question_id,
      answer
    }));

    try {
      const response = await fetch('/api/career-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...stepData,
          user_choice: selectedChoice || '',
          request_spejling: true,
          job_examples_feedback: feedbackPayload,
          post_feedback_answers: postFeedbackAnswers,
          direction_state: directionState,
        }),
      });

      if (!response.ok) {
        throw new Error('Fejl ved kald til spejling');
      }

      const data: CareerCoachResponse = await response.json();
      console.log('Spejling response:', data);
      setCoachResponse(data);
      setShowSpejling(true);
      
    } catch (e) {
      console.error('Error calling spejling:', e);
      setError('Der opstod en fejl. Prøv venligst igen.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit all answers and proceed to spejling
  const handlePostJobExamplesSubmit = async () => {
    if (!allQuestionsComplete()) return;
    
    // Build feedback from individual job responses
    const feedbackPayload = {
      overall_feedback: 'from_individual',
      job_examples: coachResponse?.job_examples?.map((job) => ({
        job_id: job.id,
        job_title: job.title,
        experience: postJobExamplesAnswers[`feedback_${job.id}`] || 'unknown'
      })) || []
    };
    
    await fetchSpejling(feedbackPayload);
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
      setPostJobExamplesQuestions([]);
      setPostJobExamplesAnswers({});
      setFeedbackSubmitted(false);
      setCoachResponse(null);
      callCareerCoach(selectedChoice, [], jobAdText);
    } else if (action === 'save') {
      // Save and stay
      localStorage.setItem(STORAGE_KEYS.DIRECTION_STATE, JSON.stringify(directionState));
      alert('Din afklaring er gemt.');
    } else if (action === 'clarify') {
      // Go to Lag 2 - Coachende afklaring
      handleStartLag2();
    }
  };

  // Start Lag 2 - Coachende afklaring
  const handleStartLag2 = async () => {
    if (!coachResponse) return;
    
    setIsLoadingLag2(true);
    setError(null);
    
    const stepData = buildStepData();
    if (!stepData) {
      setError('Manglende profildata.');
      setIsLoadingLag2(false);
      return;
    }

    try {
      const response = await fetch('/api/job-directions-clarification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transfer_summary: {
            summary_paragraph: coachResponse.summary_paragraph || '',
            patterns: coachResponse.patterns || [],
          },
          step1_cv_abstract: stepData.step1_json?.cv_summary || '',
          step2_workstyle: stepData.step2_json || {},
        }),
      });

      if (!response.ok) {
        throw new Error('Fejl ved kald til afklaring');
      }

      const data: Lag2Response = await response.json();
      setLag2Response(data);
      setShowLag2(true);
      setShowSpejling(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (e) {
      console.error('Error calling Lag 2:', e);
      setError('Der opstod en fejl. Prøv venligst igen.');
    } finally {
      setIsLoadingLag2(false);
    }
  };

  // Handle Lag 2 choice selection
  const handleLag2Choice = async (choiceId: string) => {
    setLag2SelectedChoice(choiceId);
    
    if (choiceId === 'adjust') {
      // Reset and go back to adjust
      setShowLag2(false);
      setLag2Response(null);
      setLag2Answers({});
      setShowSpejling(true);
    } else if (choiceId === 'submit' || choiceId === 'explore') {
      // Save the clarification answers for next step
      const clarificationContext = {
        answers: lag2Answers,
      };
      localStorage.setItem('flowstruktur_lag2_clarification', JSON.stringify(clarificationContext));
      
      // Go to next step (Lag 3 - spejling af svar)
      setShowLag2(false);
      // TODO: Implement Lag 3 - for now go to job examples
      setShowJobExamples(true);
    } else if (choiceId === 'stop') {
      // Save and stop
      localStorage.setItem(STORAGE_KEYS.DIRECTION_STATE, JSON.stringify(directionState));
      alert('Din afklaring er gemt. Du kan vende tilbage når som helst.');
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
    setShowJobExamples(false);
    setJobExamplesFeedback('');
    setShowSpejling(false);
    setPostJobExamplesQuestions([]);
    setPostJobExamplesAnswers({});
    setFeedbackSubmitted(false);
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

      {/* Direction Choice Cards - 2 options */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Card A: Stay Close */}
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
              <CardTitle className="text-base">Tæt på nuværende</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Bliv i samme branche og byg videre på din erfaring
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Card B: Completely Different */}
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
              <CardTitle className="text-base">Helt anderledes</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Skift væk fra nuværende branche
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

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

            {/* SECTION 1: Job Examples with individual feedback */}
            {coachResponse.job_examples && coachResponse.job_examples.length > 0 && !showSpejling && (
              <div className="space-y-6 border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Jobeksempler</h3>
                </div>
                
                <div className="space-y-4">
                  {coachResponse.job_examples.map((job, index) => {
                    const feedbackKey = `feedback_${job.id}`;
                    const currentFeedback = postJobExamplesAnswers[feedbackKey] as string | undefined;
                    
                    return (
                      <Card key={job.id} className="bg-muted/30">
                        <CardHeader className="pb-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">
                              Jobeksempel {index + 1}
                            </p>
                            <CardTitle className="text-base font-semibold">
                              {job.title}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {job.description}
                          </p>
                          
                          {/* Feedback for this specific job */}
                          <div className="pt-3 border-t">
                            <p className="text-sm font-medium mb-2">Hvad synes du om dette eksempel?</p>
                            <div className="grid gap-2">
                              <Button
                                variant={currentFeedback === 'giver_mening' ? 'default' : 'outline'}
                                size="sm"
                                className="justify-start text-left h-auto py-2 px-3"
                                onClick={() => handleJobExampleFeedback(job.id, 'giver_mening')}
                              >
                                <CheckCircle2 className={`mr-2 h-4 w-4 flex-shrink-0 ${currentFeedback === 'giver_mening' ? '' : 'text-muted-foreground'}`} />
                                <span>Det giver mening for mig</span>
                              </Button>
                              <Button
                                variant={currentFeedback === 'delvist' ? 'default' : 'outline'}
                                size="sm"
                                className="justify-start text-left h-auto py-2 px-3"
                                onClick={() => handleJobExampleFeedback(job.id, 'delvist')}
                              >
                                <RefreshCw className={`mr-2 h-4 w-4 flex-shrink-0 ${currentFeedback === 'delvist' ? '' : 'text-muted-foreground'}`} />
                                <span>Det er delvist rigtigt</span>
                              </Button>
                              <Button
                                variant={currentFeedback === 'ikke_noget' ? 'default' : 'outline'}
                                size="sm"
                                className="justify-start text-left h-auto py-2 px-3"
                                onClick={() => handleJobExampleFeedback(job.id, 'ikke_noget')}
                              >
                                <AlertCircle className={`mr-2 h-4 w-4 flex-shrink-0 ${currentFeedback === 'ikke_noget' ? '' : 'text-muted-foreground'}`} />
                                <span>Det er ikke noget for mig</span>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dynamic Coaching Questions - shown AFTER all job examples have feedback */}
            {coachResponse.job_examples && coachResponse.job_examples.length > 0 && !showSpejling && (() => {
              const allJobsHaveFeedback = coachResponse.job_examples!.every(job => 
                postJobExamplesAnswers[`feedback_${job.id}`]
              );
              const dynamicQuestions = getCoachingQuestionsBasedOnFeedback();
              
              if (allJobsHaveFeedback && dynamicQuestions.length > 0) {
                return (
                  <div className="space-y-6 border-t pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Afklarende spørgsmål</h3>
                      <p className="text-sm text-muted-foreground ml-2">Baseret på dine svar</p>
                    </div>
                    {dynamicQuestions.map((q: CoachQuestion) => (
                      <div key={q.id} className="space-y-2">
                        <Label htmlFor={q.id} className="text-base font-medium">
                          {q.prompt}
                        </Label>
                        <Textarea
                          id={q.id}
                          placeholder="Skriv dit svar her..."
                          value={(postJobExamplesAnswers[q.id] as string) || ''}
                          onChange={(e) => handlePostJobExamplesAnswer(q.id, e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            })()}

            {/* Submit button for job examples feedback */}
            {coachResponse.job_examples && coachResponse.job_examples.length > 0 && !showSpejling && (
              <div className="border-t pt-6">
                <Button 
                  onClick={handlePostJobExamplesSubmit}
                  disabled={isLoading || !allQuestionsComplete()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Behandler...
                    </>
                  ) : (
                    <>
                      Send svar og se din analyse
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                {!allQuestionsComplete() && (
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    {(() => {
                      const allJobsHaveFeedback = coachResponse.job_examples!.every(job => 
                        postJobExamplesAnswers[`feedback_${job.id}`]
                      );
                      if (!allJobsHaveFeedback) {
                        return "Giv feedback på alle jobeksempler ovenfor for at fortsætte";
                      }
                      return "Besvar spørgsmålene ovenfor for at fortsætte";
                    })()}
                  </p>
                )}
              </div>
            )}

            {/* Coaching Questions - shown when NO job examples (early flow questions) */}
            {coachResponse.questions && coachResponse.questions.length > 0 && 
             (!coachResponse.job_examples || coachResponse.job_examples.length === 0) && (
              <div className="space-y-6 border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Afklarende spørgsmål</h3>
                </div>
                {coachResponse.questions.map(renderQuestion)}
              </div>
            )}

            {/* Submit button - only show when we have questions (without job examples) */}
            {coachResponse.questions && coachResponse.questions.length > 0 && 
             (!coachResponse.job_examples || coachResponse.job_examples.length === 0) && (
              <div className="border-t pt-6">
                <Button 
                  onClick={handleSubmitAnswers}
                  disabled={isLoading || !allQuestionsAnswered}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Behandler...
                    </>
                  ) : (
                    <>
                      Send svar og se din analyse
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                {!allQuestionsAnswered && (
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Besvar alle spørgsmål ovenfor for at fortsætte
                  </p>
                )}
              </div>
            )}

            {/* Continue button when no questions and not showing job examples */}
            {(!coachResponse.questions || coachResponse.questions.length === 0) && 
             (!coachResponse.job_examples || coachResponse.job_examples.length === 0) && (
              <div className="border-t pt-6 space-y-3">
                {directionState?.next_step_ready_for_jobs ? (
                  <>
                    {/* Job examples are auto-loaded - show loading or reset option */}
                    {isLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span className="text-muted-foreground">Henter jobeksempler...</span>
                      </div>
                    ) : null}
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

      {/* Comprehensive Career Analysis - Step 5B (separate card) */}
      {showSpejling && coachResponse && (coachResponse.mode === 'spejling' || coachResponse.section1_arbejdsmoenster || coachResponse.summary_paragraph) && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Din karriereanalyse</CardTitle>
            </div>
            <CardDescription>
              En samlet forståelse baseret på alt hvad du har delt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            
            {/* Section 1: Dit grundlæggende arbejdsmønster */}
            {(coachResponse.section1_arbejdsmoenster || coachResponse.summary_paragraph) && (
              <div className="space-y-3">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded">1</span>
                  Dit grundlæggende arbejdsmønster
                </h4>
                <div className="prose prose-sm dark:prose-invert max-w-none pl-8">
                  <p className="text-base leading-relaxed text-foreground">
                    {coachResponse.section1_arbejdsmoenster || coachResponse.summary_paragraph}
                  </p>
                </div>
              </div>
            )}

            {/* Section 2: Din reelle drivkraft */}
            {coachResponse.section2_drivkraft && (
              <div className="space-y-3">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded">2</span>
                  Din reelle drivkraft
                </h4>
                <div className="prose prose-sm dark:prose-invert max-w-none pl-8">
                  <p className="text-base leading-relaxed text-foreground">
                    {coachResponse.section2_drivkraft}
                  </p>
                </div>
              </div>
            )}

            {/* Section 3: Dit centrale spændingsfelt */}
            {coachResponse.section3_spaendingsfelt && (
              <div className="space-y-3 bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <span className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs font-bold px-2 py-1 rounded">3</span>
                  Dit centrale spændingsfelt
                </h4>
                <div className="prose prose-sm dark:prose-invert max-w-none pl-8">
                  <p className="text-base leading-relaxed text-foreground">
                    {coachResponse.section3_spaendingsfelt}
                  </p>
                </div>
              </div>
            )}

            {/* Section 4: Hvad du med fordel kan navigere efter */}
            {coachResponse.section4_navigation && (
              <div className="space-y-4">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded">4</span>
                  Hvad du med fordel kan navigere efter
                </h4>
                
                <div className="pl-8 space-y-4">
                  {/* Skal være til stede */}
                  {coachResponse.section4_navigation.skal_vaere_til_stede?.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Skal være til stede
                      </h5>
                      <ul className="space-y-1.5">
                        {coachResponse.section4_navigation.skal_vaere_til_stede.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm bg-green-50 dark:bg-green-950/30 p-2.5 rounded">
                            <span className="text-green-600 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Advarselstegn */}
                  {coachResponse.section4_navigation.advarselstegn?.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Advarselstegn
                      </h5>
                      <ul className="space-y-1.5">
                        {coachResponse.section4_navigation.advarselstegn.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm bg-red-50 dark:bg-red-950/30 p-2.5 rounded">
                            <span className="text-red-600 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Nice to have */}
                  {coachResponse.section4_navigation.nice_to_have?.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <span className="text-lg">○</span>
                        Nice to have
                      </h5>
                      <ul className="space-y-1.5">
                        {coachResponse.section4_navigation.nice_to_have.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm bg-gray-50 dark:bg-gray-950/30 p-2.5 rounded">
                            <span className="text-gray-500 mt-0.5">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fallback: Legacy patterns/unclear if new sections not available */}
            {!coachResponse.section4_navigation && coachResponse.patterns && coachResponse.patterns.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-base">Hvad det peger mod</h4>
                <ul className="space-y-2">
                  {coachResponse.patterns.map((pattern, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{pattern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!coachResponse.section4_navigation && coachResponse.unclear && coachResponse.unclear.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-base">Hvad der sandsynligvis skaber friktion</h4>
                <ul className="space-y-2">
                  {coachResponse.unclear.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Section 5: Din arbejdshypotese fremadrettet */}
            {(coachResponse.section5_hypotese || coachResponse.next_step_explanation) && (
              <div className="space-y-3 bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-base flex items-center gap-2">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded">5</span>
                  Din arbejdshypotese fremadrettet
                </h4>
                <div className="prose prose-sm dark:prose-invert max-w-none pl-8">
                  <p className="text-base leading-relaxed text-foreground italic">
                    {coachResponse.section5_hypotese || coachResponse.next_step_explanation}
                  </p>
                </div>
              </div>
            )}

            {/* Divider before actions */}
            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-muted-foreground text-center mb-6">
                Denne analyse er dit arbejdende ståsted – brug den som filter når du vurderer muligheder.
              </p>
              
              {/* Next actions */}
              <div className="space-y-3">
                <h4 className="font-semibold text-center">Hvad vil du gøre nu?</h4>
                <div className="grid gap-3">
                  <Button
                    variant={spejlingNextAction === 'search' ? 'default' : 'outline'}
                    className="justify-start text-left h-auto py-4 px-4"
                    onClick={() => handleSpejlingAction('search')}
                  >
                    <Search className="mr-3 h-5 w-5 flex-shrink-0" />
                    <span>Se konkrete jobopslag der matcher min retning</span>
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
                    <span>Gem min analyse og afslut</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* LAG 2: Coachende afklaring (brugersprog) */}
      {showLag2 && lag2Response && (
        <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Afklarende spørgsmål</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Intro */}
            {lag2Response.intro && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-base leading-relaxed text-muted-foreground">
                  {lag2Response.intro.content}
                </p>
              </div>
            )}

            {/* Spørgsmål */}
            <div className="space-y-6">
              {lag2Response.questions?.map((question, idx) => (
                <div key={question.id} className="space-y-2">
                  <Label className="text-sm font-medium leading-relaxed">
                    {idx + 1}. {question.text}
                  </Label>
                  <Textarea
                    placeholder="Skriv dit svar her..."
                    value={lag2Answers[question.id] || ''}
                    onChange={(e) => setLag2Answers(prev => ({
                      ...prev,
                      [question.id]: e.target.value
                    }))}
                    className="min-h-[100px]"
                  />
                </div>
              ))}
            </div>

            {/* Outro */}
            {lag2Response.outro && (
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {lag2Response.outro.content}
                </p>
              </div>
            )}

            {/* Valg */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-semibold">{lag2Response.choices?.title || 'Hvad vil du gøre nu?'}</h4>
              <div className="grid gap-3">
                {lag2Response.choices?.options?.map((option) => (
                  <Button
                    key={option.id}
                    variant={lag2SelectedChoice === option.id ? 'default' : 'outline'}
                    className="justify-start text-left h-auto py-4 px-4"
                    onClick={() => handleLag2Choice(option.id)}
                    disabled={option.id === 'submit' && Object.values(lag2Answers).every(a => !a?.trim())}
                  >
                    {option.id === 'submit' && <ArrowRight className="mr-3 h-5 w-5 flex-shrink-0" />}
                    {option.id === 'stop' && <Save className="mr-3 h-5 w-5 flex-shrink-0" />}
                    <span>{option.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Direction State Summary - only show when no questions are pending, NOT ready for jobs, and NOT showing job examples */}
      {directionState && directionState.choice !== 'UNSET' && !showSpejling && !showJobExamples && !showLag2 &&
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
                    {directionState.choice === 'A' && 'Tæt på nuværende (samme branche)'}
                    {directionState.choice === 'B' && 'Helt anderledes (ny branche)'}
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
                isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="text-muted-foreground">Henter jobeksempler...</span>
                  </div>
                ) : null
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
