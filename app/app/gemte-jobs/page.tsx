'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, ArrowRight, PackageOpen } from 'lucide-react';
import { useSavedJobs } from '@/contexts/saved-jobs-context';
import { JobCard } from '@/components/job-card';
import Link from 'next/link';
import { toast } from 'sonner';

export default function GemteJobsPage() {
  const { savedJobs, toggleApplied } = useSavedJobs();

  const handleUndo = (jobId: string, previousStatus: string) => {
    toast('Job markeret som ikke ansøgt', {
      action: {
        label: 'Fortryd',
        onClick: () => {
          // Toggle back to APPLIED status
          toggleApplied(jobId);
        },
      },
      duration: 5000,
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gemte jobs</h1>
        <p className="mt-2 text-muted-foreground">
          Overblik over alle dine gemte jobs. Administrer status og fortsæt arbejdet.
        </p>
      </div>

      {/* Empty state */}
      {savedJobs.length === 0 ? (
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
            <span>{savedJobs.length} {savedJobs.length === 1 ? 'gemt job' : 'gemte jobs'}</span>
          </div>

          {/* Jobs list */}
          <div className="space-y-4">
            {savedJobs.map((job) => (
              <JobCard key={job.id} job={job} onUndo={handleUndo} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
