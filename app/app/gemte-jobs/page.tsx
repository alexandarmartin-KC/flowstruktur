'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, Bookmark, ArrowRight, PackageOpen } from 'lucide-react';
import { useSavedJobs } from '@/contexts/saved-jobs-context';
import Link from 'next/link';

export default function GemteJobsPage() {
  const { savedJobs, unsaveJob } = useSavedJobs();

  // Filter only SAVED status jobs (not IN_PROGRESS or APPLIED)
  const savedOnlyJobs = savedJobs.filter((job) => job.status === 'SAVED');

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
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
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
