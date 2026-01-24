'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import React from 'react';

interface CVRisk {
  title: string;
  description: string;
  example: string;
  severity: 'high' | 'medium' | 'low';
}

interface InterviewQuestion {
  question: string;
  context: string;
  suggestedApproach: string;
}

interface InterviewAnalysis {
  risks: CVRisk[];
  strengths: string[];
  expectedQuestions: InterviewQuestion[];
}

interface SimulationFeedback {
  feedback: string;
  strengths: string;
  improvement: string;
  cvReference: string;
  nextQuestion: string | null;
}

interface InterviewSimulationProps {
  job: any;
  cv: any;
  analysis: InterviewAnalysis;
  onExit: () => void;
}

export default function InterviewSimulation({
  job,
  cv,
  analysis,
  onExit,
}: InterviewSimulationProps) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<SimulationFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [answers, setAnswers] = useState<Array<{ question: string; answer: string; feedback: SimulationFeedback }>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get current question
  const questions = analysis.expectedQuestions.slice(0, 8); // Use first 8 expected questions
  const currentQuestion = questions[currentQuestionIdx];

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      setError('Venligst skriv et svar');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/interview-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.question,
          userAnswer: userAnswer.trim(),
          jobPosting: job.description || '',
          resolvedCv: cv.text,
          previousFeedback: feedback,
          questionIndex: currentQuestionIdx,
          totalQuestions: questions.length,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kunne ikke få feedback');
      }

      const data = await response.json();
      setFeedback(data.feedback);
      setAnswers([
        ...answers,
        {
          question: currentQuestion.question,
          answer: userAnswer,
          feedback: data.feedback,
        },
      ]);
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError(err instanceof Error ? err.message : 'En fejl opstod');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setUserAnswer('');
      setFeedback(null);
      setError('');
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Show completion screen
      setFeedback(null);
      setCurrentQuestionIdx(questions.length);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIdx > 0) {
      const prevAnswer = answers[currentQuestionIdx - 1];
      setCurrentQuestionIdx(currentQuestionIdx - 1);
      setUserAnswer(prevAnswer.answer);
      setFeedback(prevAnswer.feedback);
      setError('');
    }
  };

  // Show completion screen
  if (currentQuestionIdx >= questions.length) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Tillykke! 🎉</h2>
          <p className="text-muted-foreground">
            Du har gennemgået interview-træningen for {job.title}
          </p>
        </div>

        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="text-green-900 dark:text-green-100">
              Trænings-opsummering
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {answers.length}
                </div>
                <div className="text-sm text-muted-foreground">Spørgsmål besvaret</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round((answers.filter(a => a.feedback.strengths).length / answers.length) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Styrker identificeret</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Vigtige takeaways:</h4>
              <ul className="space-y-2 text-sm">
                {answers
                  .filter((a) => a.feedback.improvement)
                  .slice(0, 3)
                  .map((a, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-green-600 dark:text-green-400 font-bold">•</span>
                      <span>{a.feedback.improvement}</span>
                    </li>
                  ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Husk: Den bedste forberedelse er at være autentisk og holde dig til dine egne erfaringer.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              // Reset simulation
              setCurrentQuestionIdx(0);
              setUserAnswer('');
              setFeedback(null);
              setAnswers([]);
            }}
          >
            Start forfra
          </Button>
          <Button
            onClick={onExit}
            className="flex-1"
          >
            Tilbage til forberedelse
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Interview-træning</h2>
          <Badge variant="secondary">
            Spørgsmål {currentQuestionIdx + 1} af {questions.length}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Besvar spørgsmålene, som hvis det var en rigtig jobsamtale
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
          <CardDescription className="space-y-2 mt-2">
            <p>{currentQuestion.context}</p>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Tilgang: {currentQuestion.suggestedApproach}
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            ref={textareaRef}
            placeholder="Skriv dit svar her..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={isLoading || !!feedback}
            rows={6}
            className="resize-none"
          />

          {!feedback ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={isLoading || !userAnswer.trim()}
              className="w-full gap-2"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyserer svar...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Indsend svar
                </>
              )}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {/* Feedback section */}
      {feedback && (
        <div className="space-y-4">
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-blue-900 dark:text-blue-100">
                Feedback på dit svar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100">Hvad var godt:</p>
                <p className="text-blue-800 dark:text-blue-200 mt-1">{feedback.strengths}</p>
              </div>

              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  Forbedring:
                </p>
                <p className="text-blue-800 dark:text-blue-200 mt-1">{feedback.improvement}</p>
              </div>

              {feedback.cvReference && (
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    Fra dit CV:
                  </p>
                  <p className="text-blue-800 dark:text-blue-200 mt-1">
                    {feedback.cvReference}
                  </p>
                </div>
              )}

              <p className="text-blue-700 dark:text-blue-300 italic pt-2">
                "{feedback.feedback}"
              </p>
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIdx === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Forrige
            </Button>

            <Button
              onClick={handleNextQuestion}
              className="flex-1 gap-2"
            >
              {currentQuestionIdx === questions.length - 1 ? 'Afslut træning' : 'Næste spørgsmål'}
              {currentQuestionIdx < questions.length - 1 && (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Exit button */}
      {!feedback && (
        <Button
          variant="ghost"
          onClick={onExit}
          className="w-full"
        >
          Afbryd træning
        </Button>
      )}
    </div>
  );
}
