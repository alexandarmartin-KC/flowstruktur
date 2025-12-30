'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Loader2, Info } from 'lucide-react';
import { useSavedJobs } from '@/contexts/saved-jobs-context';
import ReactMarkdown from 'react-markdown';

export default function CVTilpasningPage() {
  const params = useParams();
  const router = useRouter();
  const { savedJobs } = useSavedJobs();
  const jobId = params.jobId as string;
  
  const job = savedJobs.find((j) => j.id === jobId);
  
  const [cvAnalysis, setCvAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (job && !cvAnalysis && !isAnalyzing) {
      handleAnalyzeCv();
    }
  }, [job]);

  const handleAnalyzeCv = async () => {
    if (!job) return;

    setIsAnalyzing(true);
    setError('');

    try {
      // Get data from localStorage or use mock data
      let cvAnalysisData = localStorage.getItem('flowstruktur_cv_analysis');
      let personalityData = localStorage.getItem('flowstruktur_personality_data');
      let combinedAnalysis = localStorage.getItem('flowstruktur_combined_analysis');

      // If data is missing, use mock data (for development/testing)
      if (!cvAnalysisData || !personalityData || !combinedAnalysis) {
        const { mockCVInterpretation, mockPersonProfilAnalyse, mockSamletAnalyse } = await import('@/lib/mock-data');
        
        cvAnalysisData = cvAnalysisData || JSON.stringify(mockCVInterpretation);
        personalityData = personalityData || JSON.stringify({
          responses: [3, 4, 3, 3, 4, 4, 4, 3, 4, 3],
          arbejdsstil: mockPersonProfilAnalyse.arbejdsstil,
          motivation: mockPersonProfilAnalyse.motivation,
          draenere: mockPersonProfilAnalyse.draenere,
          samarbejde: mockPersonProfilAnalyse.samarbejde,
        });
        combinedAnalysis = combinedAnalysis || JSON.stringify(mockSamletAnalyse);
      }

      const response = await fetch('/api/cv-tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: job.description || job.fullData?.description || job.title,
          cvAnalysis: cvAnalysisData,
          personalityData: JSON.parse(personalityData),
          combinedAnalysis,
        }),
      });

      if (!response.ok) {
        throw new Error('Kunne ikke analysere CV i forhold til jobbet');
      }

      const data = await response.json();
      setCvAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message || 'Der opstod en fejl ved CV-analysen');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!job) return null;

  return (
    <div className="space-y-8">
      {/* Explanatory text */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5" />
            Sådan arbejder du videre med dette job
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Når du arbejder videre med et job, sker det i to trin.
            Først ser vi på dit CV i forhold til jobbet – hvad der matcher, og hvad der mangler.
            Derefter kan du vælge at skrive en ansøgning, hvor du formidler din erfaring målrettet jobbet.
          </p>
          <p className="text-sm text-muted-foreground italic">
            Du binder dig ikke til at ansøge ved at starte med CV-tilpasning.
            Formålet er at skabe overblik, før du beslutter dig.
          </p>
        </CardContent>
      </Card>

      {/* CV Analysis */}
      {isAnalyzing && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Analyserer dit CV i forhold til jobbet...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {cvAnalysis && !isAnalyzing && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>CV-tilpasning</CardTitle>
              <CardDescription>
                En gennemgang af hvordan dit CV matcher dette specifikke job
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown
                  components={{
                    h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-6 mb-3 text-foreground" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground" {...props} />,
                    p: ({ node, ...props }) => <p className="mb-4 text-muted-foreground leading-relaxed" {...props} />,
                    ul: ({ node, ...props }) => <ul className="space-y-2 mb-4" {...props} />,
                    li: ({ node, ...props }) => <li className="text-muted-foreground" {...props} />,
                    hr: ({ node, ...props }) => <hr className="my-6 border-border" {...props} />,
                    em: ({ node, ...props }) => <em className="text-sm text-muted-foreground not-italic" {...props} />,
                  }}
                >
                  {cvAnalysis}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {/* Next step CTA */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Klar til næste trin?</h3>
                  <p className="text-sm text-muted-foreground">
                    Du kan nu fortsætte til ansøgningen, eller parkere jobbet indtil senere.
                  </p>
                </div>
                <Button onClick={() => router.push(`/app/job/${jobId}/ansøgning`)}>
                  Fortsæt til ansøgning
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
