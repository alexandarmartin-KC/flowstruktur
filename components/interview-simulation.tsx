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
  whyAsked: string;
  whatAnswerShows: string;
  unclearPoints: string[];
  howToStrengthen: string;
  whatToAvoid: string[];
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
      setError('Please write an answer');
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
        throw new Error(errorData.error || 'Could not get feedback');
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
      setError(err instanceof Error ? err.message : 'An error occurred');
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
          <h2 className="text-3xl font-bold">Congratulations! 🎉</h2>
          <p className="text-muted-foreground">
            You have completed the interview training for {job.title}
          </p>
        </div>

        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="text-green-900 dark:text-green-100">
              Training Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {answers.length}
                </div>
                <div className="text-sm text-muted-foreground">Questions answered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {answers.filter(a => a.feedback.unclearPoints && a.feedback.unclearPoints.length > 0).length}
                </div>
                <div className="text-sm text-muted-foreground">Areas to clarify</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Key takeaways:</h4>
              <ul className="space-y-2 text-sm">
                {answers
                  .filter((a) => a.feedback.howToStrengthen)
                  .slice(0, 3)
                  .map((a, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-green-600 dark:text-green-400 font-bold">•</span>
                      <span>{a.feedback.howToStrengthen}</span>
                    </li>
                  ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Remember: The best preparation is to be authentic and stick to your own experiences.
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
            Start over
          </Button>
          <Button
            onClick={onExit}
            className="flex-1"
          >
            Back to preparation
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
          <h2 className="text-2xl font-bold">Interview Training</h2>
          <Badge variant="secondary">
            Question {currentQuestionIdx + 1} of {questions.length}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Answer the questions as if it were a real job interview
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
              💡 Approach: {currentQuestion.suggestedApproach}
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            ref={textareaRef}
            placeholder="Write your answer here..."
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
                  Analyzing answer...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit answer
                </>
              )}
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {/* Feedback section */}
      {feedback && (
        <div className="space-y-4">
          <Card className="border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Feedback on your answer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {/* Why this question is asked */}
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">Why this question is asked:</p>
                <p className="text-slate-700 dark:text-slate-300 mt-1">{feedback.whyAsked}</p>
              </div>

              {/* What your answer shows */}
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">What your answer currently shows:</p>
                <p className="text-slate-700 dark:text-slate-300 mt-1">{feedback.whatAnswerShows}</p>
              </div>

              {/* Unclear points */}
              {feedback.unclearPoints && feedback.unclearPoints.length > 0 && (
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">What may still be unclear:</p>
                  <ul className="mt-1 space-y-1">
                    {feedback.unclearPoints.map((point, idx) => (
                      <li key={idx} className="text-slate-700 dark:text-slate-300 flex gap-2">
                        <span className="text-slate-500">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* How to strengthen */}
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">How to strengthen your answer:</p>
                <p className="text-slate-700 dark:text-slate-300 mt-1">{feedback.howToStrengthen}</p>
              </div>

              {/* What to avoid */}
              {feedback.whatToAvoid && feedback.whatToAvoid.length > 0 && (
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">What to avoid:</p>
                  <ul className="mt-1 space-y-1">
                    {feedback.whatToAvoid.map((point, idx) => (
                      <li key={idx} className="text-slate-700 dark:text-slate-300 flex gap-2">
                        <span className="text-slate-500">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
              Previous
            </Button>

            <Button
              onClick={handleNextQuestion}
              className="flex-1 gap-2"
            >
              {currentQuestionIdx === questions.length - 1 ? 'Finish training' : 'Next question'}
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
          Exit training
        </Button>
      )}
    </div>
  );
}
