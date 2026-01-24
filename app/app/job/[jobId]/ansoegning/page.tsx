'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Copy, Check, Wand2, AlertCircle, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { useSavedJobs } from '@/contexts/saved-jobs-context';
import { useResolvedCv } from '@/hooks/use-resolved-cv';
import { ProfileSoftGate } from '@/components/profile-soft-gate';
import { useUserProfile } from '@/contexts/user-profile-context';
import { ProfileHardGate } from '@/components/profile-hard-gate';

interface MatchPoint {
  requirement: string;
  evidence: string;
}

interface Gap {
  requirement: string;
  note: string;
}

interface ApplicationAnalysis {
  matchPoints: MatchPoint[];
  gaps: Gap[];
  recommendedFraming: string;
}

export default function AnsøgningPage() {
  const params = useParams();
  const router = useRouter();
  const { savedJobs, setApplicationStatus } = useSavedJobs();
  const { canExport } = useUserProfile();
  const jobId = params.jobId as string;
  const [showHardGate, setShowHardGate] = useState(false);
  
  const job = savedJobs.find((j) => j.id === jobId);
  const { cv, isLoading: cvLoading, error: cvError } = useResolvedCv(jobId);
  
  const [application, setApplication] = useState<string>('');
  const [originalApplication, setOriginalApplication] = useState<string>('');
  const [analysis, setAnalysis] = useState<ApplicationAnalysis | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [error, setError] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [hasEdited, setHasEdited] = useState(false);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(`application_draft_${jobId}`);
    const savedAnalysis = localStorage.getItem(`application_analysis_${jobId}`);
    
    if (savedDraft) {
      setApplication(savedDraft);
      setOriginalApplication(savedDraft);
    }
    
    if (savedAnalysis) {
      try {
        setAnalysis(JSON.parse(savedAnalysis));
      } catch (e) {
        console.error('Error parsing saved analysis:', e);
      }
    }
  }, [jobId]);

  // Save draft to localStorage when it changes
  useEffect(() => {
    if (application && application !== originalApplication) {
      setHasEdited(true);
      localStorage.setItem(`application_draft_${jobId}`, application);
    }
  }, [application, originalApplication, jobId]);

  const handleGenerateApplication = async () => {
    if (!job || !cv) return;

    setIsGenerating(true);
    setError('');
    setHasEdited(false);

    try {
      // Get job description
      const jobDescription = localStorage.getItem(`job_posting_${jobId}`) || job.description || '';
      
      // Format CV text - this is the JOB-SPECIFIC tailored CV
      const cvText = cv.sections
        .map(s => `${s.name}:\n${s.suggestedText || ''}`)
        .join('\n\n');

      // Get personality data
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

      const response = await fetch('/api/application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription,
          jobTitle: job.title,
          companyName: job.company,
          resolvedCv: cvText,
          userProfile: cv.profile,
          dimensionScores,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kunne ikke generere ansøgning');
      }

      const data = await response.json();
      
      setApplication(data.application);
      setOriginalApplication(data.application);
      
      if (data.analysis) {
        setAnalysis(data.analysis);
        localStorage.setItem(`application_analysis_${jobId}`, JSON.stringify(data.analysis));
      }
      
      localStorage.setItem(`application_draft_${jobId}`, data.application);
      
    } catch (err: any) {
      setError(err.message || 'Der opstod en fejl ved generering af ansøgning');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRewrite = async (instruction: string) => {
    if (!application) return;

    setIsRewriting(true);
    setError('');

    try {
      const response = await fetch('/api/application-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentApplication: application,
          instruction,
          jobDescription: job?.description || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Kunne ikke omskrive ansøgning');
      }

      const data = await response.json();
      setApplication(data.application);
      setHasEdited(true);
      localStorage.setItem(`application_draft_${jobId}`, data.application);
      
    } catch (err: any) {
      setError(err.message || 'Der opstod en fejl ved omskrivning');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleSaveDraft = () => {
    if (job && application) {
      localStorage.setItem(`application_draft_${jobId}`, application);
      setApplicationStatus(job.id, 'DRAFT');
    }
  };

  const handleMarkAsFinal = () => {
    if (job && application) {
      setApplicationStatus(job.id, 'FINAL');
      localStorage.setItem(`application_final_${jobId}`, application);
    }
  };

  const handleCopyToClipboard = async () => {
    const exportReqs = canExport();
    if (!exportReqs.canExport) {
      setShowHardGate(true);
      return;
    }
    try {
      await navigator.clipboard.writeText(application);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleApplicationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setApplication(e.target.value);
  };

  if (cvLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p className="text-muted-foreground">Indlæser CV data...</p>
      </div>
    );
  }

  if (cvError || !cv) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-3">
            <p className="font-medium">
              {cvError || 'Kunne ikke indlæse CV data'}
            </p>
            <p className="text-sm">
              Du skal først tilpasse dit CV til dette specifikke job, før du kan skrive en ansøgning.
            </p>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => router.push(`/app/job/${jobId}/cv`)}
              className="mt-2"
            >
              Gå til CV-tilpasning
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (!job) return null;

  return (
    <div className="space-y-8">
      {/* Profile completeness soft gate */}
      <ProfileSoftGate context="application" />

      {/* Guard: Warn if CV is not final */}
      {job && job.cvStatus !== 'FINAL' && (
        <Alert>
          <AlertDescription className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium mb-1">Anbefaling: Færdiggør dit CV først</p>
              <p className="text-sm">
                Før du skriver ansøgningen, anbefales det at gøre CV'et klar først.
                Det sikrer, at ansøgningen bygger på det bedste grundlag.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Analysis section - show before or alongside application */}
      {analysis && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardHeader className="pb-3">
            <button
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity"
            >
              <div>
                <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
                  📊 Analyse: CV ↔ Jobkrav
                </CardTitle>
                <CardDescription className="text-blue-800 dark:text-blue-200">
                  Sådan matcher din profil med jobbet
                </CardDescription>
              </div>
              {showAnalysis ? (
                <ChevronUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              )}
            </button>
          </CardHeader>
          {showAnalysis && (
            <CardContent className="space-y-4 text-sm">
              {/* Match Points */}
              {analysis.matchPoints.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    ✓ Styrker (Jobkrav → CV-bevis)
                  </h4>
                  <div className="space-y-2">
                    {analysis.matchPoints.map((point, idx) => (
                      <div key={idx} className="border-l-2 border-green-500 pl-3 py-1">
                        <p className="font-medium text-green-900 dark:text-green-100">
                          {point.requirement}
                        </p>
                        <p className="text-green-800 dark:text-green-200 text-xs mt-1">
                          → {point.evidence}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gaps */}
              {analysis.gaps.length > 0 && (
                <div>
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                    ⚠️ Områder at adressere
                  </h4>
                  <div className="space-y-2">
                    {analysis.gaps.map((gap, idx) => (
                      <div key={idx} className="border-l-2 border-orange-500 pl-3 py-1">
                        <p className="font-medium text-orange-900 dark:text-orange-100">
                          {gap.requirement}
                        </p>
                        <p className="text-orange-800 dark:text-orange-200 text-xs mt-1">
                          {gap.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Framing */}
              {analysis.recommendedFraming && (
                <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    💡 Anbefalet vinkel
                  </h4>
                  <p className="text-blue-800 dark:text-blue-200 text-xs leading-relaxed">
                    {analysis.recommendedFraming}
                  </p>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Explanatory text - only show if no application yet */}
      {!application && !isGenerating && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Ansøgning til dette job</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Her kan du få hjælp til at skrive en målrettet ansøgning baseret på dit CV og jobopslaget.
              Ansøgningen bruger kun dokumenteret erfaring fra dit CV og formidler den i forhold til jobbets krav.
            </p>
            <p className="text-sm text-muted-foreground italic">
              Du kan redigere teksten frit, og AI kan hjælpe med at omskrive specifikke dele.
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
                  <div className="flex items-center gap-2">
                    <CardTitle>Din ansøgning</CardTitle>
                    {hasEdited && (
                      <Badge variant="secondary" className="gap-1">
                        <Edit3 className="h-3 w-3" />
                        Redigeret
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {hasEdited 
                      ? 'Du har foretaget ændringer i udkastet'
                      : 'AI-genereret udkast baseret på dit CV'}
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
                      Kopier
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={application}
                onChange={handleApplicationChange}
                className="min-h-[400px] font-sans text-sm leading-relaxed"
                placeholder="Din ansøgning..."
              />
              
              {/* AI Rewrite Buttons */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">AI-hjælp til omskrivning</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRewrite('shorter')}
                    disabled={isRewriting}
                  >
                    Kortere
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRewrite('more_concrete')}
                    disabled={isRewriting}
                  >
                    Mere konkret
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRewrite('more_professional')}
                    disabled={isRewriting}
                  >
                    Mere professionel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRewrite('more_targeted')}
                    disabled={isRewriting}
                  >
                    Mere målrettet
                  </Button>
                  {isRewriting && (
                    <div className="flex items-center gap-2 ml-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-xs text-muted-foreground">Omskriver...</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 Klik på en knap for at få AI til at omskrive ansøgningen. Du kan redigere teksten frit før eller efter.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Klar til at ansøge?</h3>
                  <p className="text-sm text-muted-foreground">
                    Kopier teksten og send din ansøgning direkte til virksomheden.
                  </p>
                </div>

                {/* Application Status indicator */}
                {job && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Ansøgning-status:</span>
                    <Badge variant={job.applicationStatus === 'FINAL' ? 'default' : 'outline'}>
                      {job.applicationStatus === 'NOT_STARTED' && 'Ikke startet'}
                      {job.applicationStatus === 'DRAFT' && 'Kladde'}
                      {job.applicationStatus === 'FINAL' && 'Klar'}
                    </Badge>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline"
                    onClick={handleSaveDraft}
                  >
                    Gem kladde
                  </Button>
                  
                  <Button 
                    variant={application && job?.applicationStatus !== 'FINAL' ? 'default' : 'outline'}
                    onClick={handleMarkAsFinal}
                    disabled={!application}
                  >
                    {job?.applicationStatus === 'FINAL' ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Markeret som klar
                      </>
                    ) : (
                      'Markér som klar'
                    )}
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={handleGenerateApplication}
                  >
                    Generer igen
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => router.push(`/app/job/${jobId}/interview`)}
                    className="ml-auto"
                  >
                    Forbered interview →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Hard gate modal */}
      <ProfileHardGate
        isOpen={showHardGate}
        onClose={() => setShowHardGate(false)}
        action="kopiere og eksportere ansøgning"
        returnPath={`/app/job/${jobId}/ansoegning`}
      />
    </div>
  );
}
