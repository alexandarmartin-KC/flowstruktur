'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, AlertCircle, Bookmark, X, Check } from 'lucide-react';
import {
  mockJobsForCurrentTrack,
  mockJobsForNewDirection,
} from '@/lib/mock-data';

type Direction = 'current' | 'new' | null;

export default function MulighederPage() {
  const [selectedDirection, setSelectedDirection] = useState<Direction>(null);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [dismissedJobs, setDismissedJobs] = useState<Set<string>>(new Set());

  const jobs =
    selectedDirection === 'current'
      ? mockJobsForCurrentTrack
      : selectedDirection === 'new'
      ? mockJobsForNewDirection
      : [];

  const visibleJobs = jobs.filter((job) => !dismissedJobs.has(job.id));

  const toggleSaved = (jobId: string) => {
    const newSaved = new Set(savedJobs);
    if (newSaved.has(jobId)) {
      newSaved.delete(jobId);
    } else {
      newSaved.add(jobId);
    }
    setSavedJobs(newSaved);
  };

  const toggleApplied = (jobId: string) => {
    const newApplied = new Set(appliedJobs);
    if (newApplied.has(jobId)) {
      newApplied.delete(jobId);
    } else {
      newApplied.add(jobId);
    }
    setAppliedJobs(newApplied);
  };

  const dismissJob = (jobId: string) => {
    const newDismissed = new Set(dismissedJobs);
    newDismissed.add(jobId);
    setDismissedJobs(newDismissed);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Muligheder</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Udforsk forskellige retninger baseret på din profil
        </p>
      </div>

      {/* Intro */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            Der findes flere måder at arbejde videre med din profil. Vælg den vinkel, du er mest
            nysgerrig på lige nu.
          </p>
        </CardContent>
      </Card>

      {/* Direction selection */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card
          className={`cursor-pointer transition-all ${
            selectedDirection === 'current'
              ? 'border-primary ring-2 ring-primary ring-offset-2'
              : 'hover:border-primary/50'
          }`}
          onClick={() =>
            setSelectedDirection(selectedDirection === 'current' ? null : 'current')
          }
        >
          <CardHeader>
            <CardTitle>Mulighed A</CardTitle>
            <CardDescription>
              Udforske job inden for dit nuværende karrierespor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Byg videre på det, du allerede kan og har erfaring med. Se jobs, der ligger tæt på
              din nuværende profil.
            </p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            selectedDirection === 'new'
              ? 'border-primary ring-2 ring-primary ring-offset-2'
              : 'hover:border-primary/50'
          }`}
          onClick={() => setSelectedDirection(selectedDirection === 'new' ? null : 'new')}
        >
          <CardHeader>
            <CardTitle>Mulighed B</CardTitle>
            <CardDescription>
              Se hvordan din erfaring kan bruges i en ny branche
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Udforsk, hvordan dine kompetencer kan oversættes til helt nye typer roller eller
              brancher.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Jobs display */}
      {selectedDirection && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Jobeksempler</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Her er {visibleJobs.length} eksempler på jobs, der kunne være relevante
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedDirection(null)}>
              Nulstil valg
            </Button>
          </div>

          <div className="space-y-6">
            {visibleJobs.map((job) => (
              <Card key={job.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{job.titel}</CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {job.virksomhed}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.lokation}
                        </div>
                        <Badge variant="outline">{job.type}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Beskrivelse */}
                  <div>
                    <p className="text-sm text-muted-foreground">{job.beskrivelse}</p>
                  </div>

                  {/* Hvorfor relevant */}
                  <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 dark:border-green-900 dark:bg-green-950/20">
                    <h4 className="mb-2 font-semibold text-green-900 dark:text-green-100">
                      Hvorfor dette job kan være relevant for dig
                    </h4>
                    <p className="text-sm leading-relaxed text-green-800 dark:text-green-200">
                      {job.hvorforRelevant}
                    </p>
                  </div>

                  {/* Udfordringer */}
                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                    <h4 className="mb-2 font-semibold text-amber-900 dark:text-amber-100">
                      Hvad der kan være en udfordring i rollen
                    </h4>
                    <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                      {job.udfordringer}
                    </p>
                  </div>

                  {/* Afklaring */}
                  <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
                    <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
                      Hvad dette job kan bruges til i din afklaring
                    </h4>
                    <p className="text-sm leading-relaxed text-blue-800 dark:text-blue-200">
                      {job.afklaring}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                    <Button
                      variant={savedJobs.has(job.id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleSaved(job.id)}
                    >
                      <Bookmark className="mr-2 h-4 w-4" />
                      {savedJobs.has(job.id) ? 'Gemt' : 'Gem job'}
                    </Button>

                    <Button
                      variant={appliedJobs.has(job.id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleApplied(job.id)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {appliedJobs.has(job.id) ? 'Markeret som ansøgt' : 'Har ansøgt'}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissJob(job.id)}
                      className="ml-auto"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Ikke relevant
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {visibleJobs.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-center text-muted-foreground">
                  Du har markeret alle jobs som ikke relevante.
                  <br />
                  Vælg et andet karrierespor for at se flere muligheder.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Info box */}
      {!selectedDirection && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Vigtigt at vide:</strong> Disse jobs er eksempler og kommer ikke fra et
                rigtigt jobfeed. Formålet er at give dig inspiration og afklaring om, hvilke
                retninger du kunne udforske videre.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
