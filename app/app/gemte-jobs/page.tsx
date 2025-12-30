'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, Bookmark, ArrowRight, PackageOpen, Loader2, ArrowLeft } from 'lucide-react';
import { useSavedJobs } from '@/contexts/saved-jobs-context';
import Link from 'next/link';

interface SavedJob {
  id: string;
  title: string;
  company?: string;
  description?: string;
  location?: string;
  type?: string;
  source?: string;
  status: 'SAVED' | 'IN_PROGRESS' | 'APPLIED';
  savedAt: string;
  fullData?: any;
}

export default function GemteJobsPage() {
  const { savedJobs, unsaveJob, updateJobStatus } = useSavedJobs();
  const [selectedJob, setSelectedJob] = useState<SavedJob | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>('');

  // Filter only SAVED status jobs (not IN_PROGRESS or APPLIED)
  const savedOnlyJobs = savedJobs.filter((job) => job.status === 'SAVED');

  const handleAnalyzeJob = async (job: SavedJob) => {
    setSelectedJob(job);
    setIsAnalyzing(true);
    setError('');
    setAnalysis('');

    try {
      // Get data from localStorage
      const cvAnalysis = localStorage.getItem('flowstruktur_cv_analysis');
      const personalityData = localStorage.getItem('flowstruktur_personality_data');
      const combinedAnalysis = localStorage.getItem('flowstruktur_combined_analysis');

      if (!cvAnalysis || !personalityData || !combinedAnalysis) {
        throw new Error('Manglende profil data. Udfyld venligst CV og personlighedsspørgeskema under "Min profil".');
      }

      const response = await fetch('/api/saved-job-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: job.description || job.fullData?.description || job.title,
          cvAnalysis,
          personalityData: JSON.parse(personalityData),
          combinedAnalysis,
        }),
      });

      if (!response.ok) {
        throw new Error('Kunne ikke analysere jobbet');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      
      // Update job status to IN_PROGRESS
      updateJobStatus(job.id, 'IN_PROGRESS');
    } catch (err: any) {
      setError(err.message || 'Der opstod en fejl ved analysen');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBackToList = () => {
    setSelectedJob(null);
    setAnalysis('');
    setError('');
  };

  // If a job is selected and being analyzed, show the analysis view
  if (selectedJob) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbage til gemte jobs
          </Button>
        </div>

        {/* Job info card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-xl">{selectedJob.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {selectedJob.company && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {selectedJob.company}
                    </div>
                  )}
                  {selectedJob.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {selectedJob.location}
                    </div>
                  )}
                  {selectedJob.type && <Badge variant="outline">{selectedJob.type}</Badge>}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Analysis or loading */}
        {isAnalyzing && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Analyserer jobbet i forhold til din profil...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-destructive">
            <CardContent className="py-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {analysis && !isAnalyzing && (
          <Card>
            <CardHeader>
              <CardTitle>Jobmatch Analyse</CardTitle>
              <CardDescription>
                En vurdering af hvordan dette job matcher din profil
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {analysis.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>

              {/* Next steps */}
              <div className="mt-8 pt-6 border-t border-border space-y-4">
                <h4 className="font-semibold">Hvad vil du gøre nu?</h4>
                <div className="flex flex-wrap gap-3">
                  <Button>
                    Tilpas CV til dette job
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline">
                    Skriv ansøgning
                  </Button>
                  <Button variant="ghost" onClick={handleBackToList}>
                    Parkér jobbet
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Default view: list of saved jobs
  return (
    <div className="mx-auto max-w-5xl space-y-8 py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gemte jobs</h1>
        <p className="mt-2 text-muted-foreground">
          Jobs du har gemt til senere. Klik "Arbejd videre" når du er klar til at tilpasse CV eller skrive ansøgning.
        </p>
      </div>

      {/* Empty state */}
      {savedOnlyJobs.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <PackageOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Du har endnu ikke gemt nogen jobs</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Gem jobs under Muligheder for at arbejde videre med dem senere.
              Du kan tilpasse dit CV, skrive ansøgning og forberede dig til samtale.
            </p>
            <Link href="/app/muligheder">
              <Button>
                Udforsk Muligheder
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bookmark className="h-4 w-4" />
            <span>{savedOnlyJobs.length} {savedOnlyJobs.length === 1 ? 'gemt job' : 'gemte jobs'}</span>
          </div>

          {/* Jobs list */}
          <div className="space-y-4">
            {savedOnlyJobs.map((job) => (
              <Card key={job.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        {job.company && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {job.company}
                          </div>
                        )}
                        {job.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </div>
                        )}
                        {job.type && <Badge variant="outline">{job.type}</Badge>}
                      </div>
                    </div>
                    <Badge variant="secondary" className="whitespace-nowrap">
                      <Bookmark className="h-3 w-3 mr-1" />
                      Gemt
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Description */}
                  {job.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {job.description}
                    </p>
                  )}

                  {/* Saved date */}
                  <p className="text-xs text-muted-foreground">
                    Gemt {new Date(job.savedAt).toLocaleDateString('da-DK', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleAnalyzeJob(job)}
                    >
                      Arbejd videre med dette job
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => unsaveJob(job.id)}
                    >
                      Fjern fra gemte
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
