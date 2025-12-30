'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { useSavedJobs } from '@/contexts/saved-jobs-context';
import ReactMarkdown from 'react-markdown';

export default function AnsøgningPage() {
  const params = useParams();
  const router = useRouter();
  const { savedJobs, updateJobStatus } = useSavedJobs();
  const jobId = params.jobId as string;
  
  const job = savedJobs.find((j) => j.id === jobId);
  
  const [application, setApplication] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerateApplication = async () => {
    if (!job) return;

    setIsGenerating(true);
    setError('');

    try {
      // Get the tailored CV from CV step
      const tailoredCv = localStorage.getItem('flowstruktur_tailored_cv');
      
      // Get other data from localStorage or use mock data
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

      const response = await fetch('/api/application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: job.description || job.fullData?.description || job.title,
          tailoredCv: tailoredCv || cvAnalysisData,
          cvAnalysis: cvAnalysisData,
          personalityData: JSON.parse(personalityData),
          combinedAnalysis,
        }),
      });

      if (!response.ok) {
        throw new Error('Kunne ikke generere ansøgning');
      }

      const data = await response.json();
      setApplication(data.application);
      
      // Update job status to APPLIED
      updateJobStatus(job.id, 'APPLIED');
    } catch (err: any) {
      setError(err.message || 'Der opstod en fejl ved generering af ansøgning');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(application);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!job) return null;

  return (
    <div className="space-y-8">
      {/* Explanatory text - only show if no application yet */}
      {!application && !isGenerating && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="text-lg">Ansøgning til dette job</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Her kan du få hjælp til at skrive en målrettet ansøgning baseret på dit CV og jobopslaget.
              Ansøgningen bruger kun dokumenteret erfaring fra dit CV og formidler den i forhold til jobbets krav.
            </p>
            <p className="text-sm text-muted-foreground italic">
              Du kan redigere teksten frit, før du sender den videre til virksomheden.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Generate button */}
      {!application && !isGenerating && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Klik på knappen nedenfor for at generere et udkast til din ansøgning
              </p>
              <Button size="lg" onClick={handleGenerateApplication}>
                <Sparkles className="mr-2 h-4 w-4" />
                Generer ansøgning
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {isGenerating && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Genererer din ansøgning...</p>
              <p className="text-xs text-muted-foreground mt-2">Dette kan tage op til 30 sekunder</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Generated application */}
      {application && !isGenerating && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Din ansøgning</CardTitle>
                  <CardDescription>
                    Et udkast baseret på dit CV og jobopslaget
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToClipboard}
                >
                  {isCopied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Kopieret
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Kopier tekst
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={application}
                onChange={(e) => setApplication(e.target.value)}
                className="min-h-[400px] font-sans text-sm leading-relaxed"
                placeholder="Din ansøgning..."
              />
              
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  💡 Du kan redigere teksten direkte i feltet ovenfor. Husk at læse igennem og tilpasse til din egen stemme, før du sender ansøgningen.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Klar til at ansøge?</h3>
                  <p className="text-sm text-muted-foreground">
                    Kopier teksten og send din ansøgning direkte til virksomheden.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => router.push('/app/gemte-jobs')}>
                    Tilbage til gemte jobs
                  </Button>
                  <Button variant="outline" onClick={handleGenerateApplication}>
                    Generer igen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
