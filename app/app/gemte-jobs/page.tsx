'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bookmark, 
  ArrowRight, 
  PackageOpen, 
  Search, 
  RefreshCw, 
  AlertCircle,
} from 'lucide-react';
import { useSavedJobs, SavedJob } from '@/contexts/saved-jobs-context';
import { EnhancedJobCard } from '@/components/enhanced-job-card';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
  SavedJobEnhanced, 
  SortOption, 
  filterSavedJobs, 
  sortSavedJobs,
} from '@/lib/saved-jobs-types';

// Transform context SavedJob to SavedJobEnhanced format
function transformToEnhanced(job: SavedJob): SavedJobEnhanced {
  const mapStatus = (status: 'NOT_STARTED' | 'DRAFT' | 'FINAL'): 'not_started' | 'in_progress' | 'done' => {
    switch (status) {
      case 'NOT_STARTED': return 'not_started';
      case 'DRAFT': return 'in_progress';
      case 'FINAL': return 'done';
      default: return 'not_started';
    }
  };

  // Generate analysis bullets from job data if available
  const generateBullets = (): string[] => {
    const bullets: string[] = [];
    if (job.fullData?.matchHighlights) {
      return job.fullData.matchHighlights.slice(0, 3);
    }
    // Fallback bullets based on job status
    if (job.cvStatus !== 'NOT_STARTED') {
      bullets.push('CV-tilpasning påbegyndt');
    }
    if (job.applicationStatus !== 'NOT_STARTED') {
      bullets.push('Ansøgning under udarbejdelse');
    }
    if (job.type) {
      bullets.push(`Jobtype: ${job.type}`);
    }
    if (bullets.length === 0) {
      bullets.push('Klik for at starte dit arbejde med dette job');
    }
    return bullets;
  };

  return {
    id: job.id,
    jobTitle: job.title,
    companyName: job.company || 'Ukendt virksomhed',
    location: job.location,
    savedAt: job.createdAt,
    source: (job.source as 'uploaded' | 'recommended_close' | 'recommended_far') || 'uploaded',
    analysisSummary: {
      bullets: generateBullets(),
    },
    stepProgress: {
      cv: { 
        status: mapStatus(job.cvStatus),
        updatedAt: job.updatedAt,
      },
      coverLetter: { 
        status: mapStatus(job.applicationStatus),
        updatedAt: job.updatedAt,
      },
      interview: { 
        status: 'not_started', // Interview status not in current context
      },
    },
    links: {
      analysisUrl: `/app/job/${job.id}/analysis`,
      cvUrl: `/app/job/${job.id}/cv`,
      coverLetterUrl: `/app/job/${job.id}/ansoegning`,
      interviewUrl: `/app/job/${job.id}/interview`,
    },
  };
}

function LoadingSkeletonCard() {
  return (
    <Card className="overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-3 w-1/3" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Skeleton className="h-9 w-full" />
      </div>
    </Card>
  );
}

export default function GemteJobsPage() {
  const { savedJobs, isLoaded, unsaveJob } = useSavedJobs();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transform savedJobs to enhanced format
  const enhancedJobs = useMemo(() => {
    return savedJobs.map(transformToEnhanced);
  }, [savedJobs]);

  // Apply filters and sorting
  const displayedJobs = useMemo(() => {
    const filtered = filterSavedJobs(enhancedJobs, searchQuery);
    return sortSavedJobs(filtered, sortOption);
  }, [enhancedJobs, searchQuery, sortOption]);

  const handleRemoveJob = (jobId: string) => {
    unsaveJob(jobId);
    toast.success('Job fjernet fra gemte jobs');
  };

  const handleStepClick = async (jobId: string, step: 'cv' | 'coverLetter' | 'interview') => {
    // Optimistically update to in_progress when navigating to a step
    try {
      await fetch(`/api/saved-jobs/${jobId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, status: 'in_progress' }),
      });
    } catch (error) {
      // Silently fail - the navigation will still work
      console.warn('Failed to update progress:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsRefreshing(false);
  };

  // Loading state
  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-6xl space-y-8 py-12 px-4 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1 max-w-md" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <LoadingSkeletonCard />
          <LoadingSkeletonCard />
          <LoadingSkeletonCard />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mx-auto max-w-6xl space-y-8 py-12 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gemte jobs</h1>
          <p className="mt-2 text-muted-foreground">
            Overblik over alle dine gemte jobs. Arbejd videre med CV, ansøgning og samtaleforberedelse.
          </p>
        </div>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Der opstod en fejl</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              {error}
            </p>
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Indlæser...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Prøv igen
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (savedJobs.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-8 py-12 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gemte jobs</h1>
          <p className="mt-2 text-muted-foreground">
            Overblik over alle dine gemte jobs. Arbejd videre med CV, ansøgning og samtaleforberedelse.
          </p>
        </div>
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
                Udforsk muligheder
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gemte jobs</h1>
        <p className="mt-2 text-muted-foreground">
          Overblik over alle dine gemte jobs. Arbejd videre med CV, ansøgning og samtaleforberedelse.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Søg efter jobtitel eller virksomhed..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sort */}
        <Select
          value={sortOption}
          onValueChange={(value) => setSortOption(value as SortOption)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sorter efter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Nyeste først</SelectItem>
            <SelectItem value="oldest">Ældste først</SelectItem>
            <SelectItem value="company_asc">Firma A-Å</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Bookmark className="h-4 w-4" />
        <span>
          {displayedJobs.length === savedJobs.length
            ? `${savedJobs.length} ${savedJobs.length === 1 ? 'gemt job' : 'gemte jobs'}`
            : `Viser ${displayedJobs.length} af ${savedJobs.length} jobs`}
        </span>
      </div>

      {/* No search results */}
      {displayedJobs.length === 0 && searchQuery && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ingen resultater</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Vi fandt ingen jobs der matcher "{searchQuery}"
            </p>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Ryd søgning
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Jobs grid */}
      {displayedJobs.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayedJobs.map((job) => (
            <EnhancedJobCard
              key={job.id}
              job={job}
              onRemove={handleRemoveJob}
              onStepClick={handleStepClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
