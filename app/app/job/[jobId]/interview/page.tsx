'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, AlertCircle, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { useSavedJobs } from '@/contexts/saved-jobs-context';
import { useResolvedCv } from '@/hooks/use-resolved-cv';
import InterviewSimulation from '@/components/interview-simulation';
import { ProfileSoftGate } from '@/components/profile-soft-gate';

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
  expectedQuestions: InterviewQuestion[];
  strengths: string[];
}

export default function InterviewPreparationPage() {
  const params = useParams();
  const { savedJobs } = useSavedJobs();
  const jobId = params.jobId as string;
  
  const job = savedJobs.find((j) => j.id === jobId);
  const { cv, isLoading: cvLoading } = useResolvedCv(jobId);

  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>('');
  const [expandedRisk, setExpandedRisk] = useState<number | null>(0);
  const [isTraining, setIsTraining] = useState(false);

  useEffect(() => {
    if (cv && job && !analysis && !isAnalyzing) {
      handleAnalyzeInterview();
    }
  }, [cv, job, analysis, isAnalyzing]);

  const handleAnalyzeInterview = async () => {
    if (!job || !cv) return;

    setIsAnalyzing(true);
    setError('');

    try {
      // Get job description from localStorage or use job description
      const jobDescription = localStorage.getItem(`job_posting_${jobId}`) || job.description || '';
      
      // Get tailored CV or use resolved CV
      const tailoredCv = localStorage.getItem('flowstruktur_tailored_cv') || '';
      
      // Get application if available
      const application = localStorage.getItem(`job_application_${jobId}`) || '';

      // Get dimension scores if available
      let dimensionScores = {};
      const personalityData = localStorage.getItem('flowstruktur_personality_data');
      if (personalityData) {
        try {
          const parsed = JSON.parse(personalityData);
          dimensionScores = parsed.dimensionScores || {};
        } catch (e) {
          console.error('Error parsing personality data:', e);
        }
      }

      // Format CV for the API
      const cvText = cv.sections
        .map(s => `${s.name}:\n${s.suggestedText || ''}`)
        .join('\n\n');

      const response = await fetch('/api/interview-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobPosting: jobDescription,
          resolvedCv: cvText,
          tailoredCv,
          application,
          userProfile: cv.profile,
          dimensionScores,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kunne ikke analysere interviewforberedelse');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      console.error('Error analyzing interview:', err);
      setError(err instanceof Error ? err.message : 'En fejl opstod under analysen');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (cvLoading || !cv) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-muted-foreground">Indlæser CV data...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Job ikke fundet</AlertDescription>
      </Alert>
    );
  }

  if (isTraining && analysis) {
    return (
      <InterviewSimulation
        job={job}
        cv={cv}
        analysis={analysis}
        onExit={() => setIsTraining(false)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile completeness soft gate */}
      <ProfileSoftGate context="interview" />

      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">
          Forberedelse til jobsamtale – {job.title}
        </h2>
        <p className="text-muted-foreground">
          Bliv forberedt på jobsamtalen baseret på dit CV, jobopslaget og din ansøgning
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isAnalyzing ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div>
              <p className="font-medium">Analyserer din profil</p>
              <p className="text-sm text-muted-foreground">
                Vi finder kritiske punkter og forventede spørgsmål...
              </p>
            </div>
          </div>
        </Card>
      ) : analysis ? (
        <>
          {/* CV Risks Section */}
          {analysis.risks.length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <CardTitle>Det skal du være særligt forberedt på</CardTitle>
                    <CardDescription>
                      Potentielle områder hvor en interviewer kan stille opfølgende spørgsmål
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.risks.map((risk, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <button
                      onClick={() => setExpandedRisk(expandedRisk === idx ? null : idx)}
                      className="w-full text-left flex items-center justify-between hover:bg-muted/50 transition-colors -m-4 p-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              risk.severity === 'high' ? 'destructive' :
                              risk.severity === 'medium' ? 'secondary' : 'outline'
                            }
                          >
                            {risk.severity === 'high' ? 'Vigtig' : 
                             risk.severity === 'medium' ? 'Moderat' : 'Lav'}
                          </Badge>
                          <h4 className="font-semibold">{risk.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {risk.description}
                        </p>
                      </div>
                      {expandedRisk === idx ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                      )}
                    </button>
                    {expandedRisk === idx && (
                      <div className="mt-4 pl-4 pt-4 border-t space-y-2">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Eksempel på spørgsmål:</p>
                          <p className="text-sm mt-1">"{risk.example}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Strengths Section */}
          {analysis.strengths.length > 0 && (
            <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-green-900 dark:text-green-100">
                  ✓ Dine styrker
                </CardTitle>
                <CardDescription className="text-green-800 dark:text-green-200">
                  Områder hvor du matcher jobbet særligt godt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.strengths.map((strength, idx) => (
                    <li key={idx} className="flex gap-3 text-sm">
                      <span className="text-green-600 dark:text-green-400 font-bold">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Expected Questions Section */}
          {analysis.expectedQuestions.length > 0 && (
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Sandsynlige interviewspørgsmål</CardTitle>
                <CardDescription>
                  Disse spørgsmål er sandsynlige baseret på jobopslaget og dit CV
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.expectedQuestions.slice(0, 6).map((q, idx) => (
                  <div key={idx} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <h4 className="font-medium mb-2">{q.question}</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><span className="font-semibold">Kontekst:</span> {q.context}</p>
                      <p><span className="font-semibold">Tilgang:</span> {q.suggestedApproach}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Training CTA */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Sparkles className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold">Start interviewtræning med AI</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Træn dine svar gennem en simuleret jobsamtale. 
                      AI stiller spørgsmål og giver feedback på dine svar.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsTraining(true)}
                    size="lg"
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Start træning
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
