'use client';

// Job detail layout with sticky navigation
import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSavedJobs } from '@/contexts/saved-jobs-context';

export default function JobLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const { savedJobs } = useSavedJobs();
  const jobId = params.jobId as string;
  
  const job = savedJobs.find((j) => j.id === jobId);

  if (!job) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 py-12 px-4 sm:px-6 lg:px-8">
        <p className="text-muted-foreground">Job ikke fundet.</p>
        <Link href="/app/gemte-jobs">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbage til gemte jobs
          </Button>
        </Link>
      </div>
    );
  }

  const isOnCvPage = pathname.endsWith('/cv');
  const isOnAnsøgningPage = pathname.endsWith('/ansoegning');
  const isOnInterviewPage = pathname.endsWith('/interview');

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-12 px-4 sm:px-6 lg:px-8">
      {/* Back button */}
      <div>
        <Link href="/app/gemte-jobs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbage til gemte jobs
          </Button>
        </Link>
      </div>

      {/* Job context card */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 border-primary/20">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <h1 className="text-2xl font-bold">{job.title}</h1>
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
        </div>
      </Card>

      {/* Process steps - sticky navigation */}
      <Card className="sticky top-4 z-40 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-primary/30 shadow-lg">
        <nav className="flex gap-2 sm:gap-4">
          <Link
            href={`/app/job/${jobId}/cv`}
            className={`flex-1 py-3 px-3 sm:px-4 text-sm font-medium transition-all rounded-lg border-2 text-center ${
              isOnCvPage
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            1. CV-tilpasning
          </Link>
          <Link
            href={`/app/job/${jobId}/ansoegning`}
            className={`flex-1 py-3 px-3 sm:px-4 text-sm font-medium transition-all rounded-lg border-2 text-center ${
              isOnAnsøgningPage
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            2. Ansøgning
          </Link>
          <Link
            href={`/app/job/${jobId}/interview`}
            className={`flex-1 py-3 px-3 sm:px-4 text-sm font-medium transition-all rounded-lg border-2 text-center ${
              isOnInterviewPage
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            3. Interview-forberedelse
          </Link>
        </nav>
      </Card>

      {/* Page content */}
      {children}
    </div>
  );
}
