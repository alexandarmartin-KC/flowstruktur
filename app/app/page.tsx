'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowRight, 
  Sparkles, 
  FileText, 
  Mail, 
  MessageSquare,
  CheckCircle2,
  Circle,
  User,
  Briefcase,
  Lightbulb,
  Target,
  Clock,
  Plus,
  ChevronRight
} from 'lucide-react';
import { useSavedJobs, SavedJob, SubStatus } from '@/contexts/saved-jobs-context';
import { useUserProfile } from '@/contexts/user-profile-context';
import { cn } from '@/lib/utils';

// =====================================================
// NEXT BEST ACTION LOGIC
// =====================================================

interface NextAction {
  type: 'complete-profile' | 'start-job' | 'continue-job' | 'add-job' | 'explore';
  title: string;
  subtitle: string;
  ctaText: string;
  href: string;
  priority: number;
  job?: SavedJob;
  icon: React.ReactNode;
}

function getNextBestAction(
  jobs: SavedJob[],
  profileComplete: boolean,
  profilePercentage: number,
  canExport: boolean
): NextAction {
  // Priority 1: Profile missing required fields (hard gate blocker)
  if (!canExport) {
    return {
      type: 'complete-profile',
      title: 'Udfyld dine kontaktoplysninger',
      subtitle: 'Du kan ikke eksportere CV eller ansøgning uden navn, email og telefon.',
      ctaText: 'Gå til profil',
      href: '/app/profil',
      priority: 1,
      icon: <User className="h-6 w-6" />,
    };
  }

  // Priority 2: Jobs that are IN_PROGRESS (continue work)
  const inProgressJobs = jobs.filter(j => j.jobStatus === 'IN_PROGRESS');
  if (inProgressJobs.length > 0) {
    // Find the job with most progress (prioritize by stage)
    const sorted = [...inProgressJobs].sort((a, b) => {
      const scoreA = getJobProgressScore(a);
      const scoreB = getJobProgressScore(b);
      // Higher score = more progress = prioritize continuing
      return scoreB - scoreA;
    });
    
    const job = sorted[0];
    const nextStep = getJobNextStep(job);
    
    return {
      type: 'continue-job',
      title: nextStep.title,
      subtitle: `${job.title} hos ${job.company || 'Ukendt virksomhed'}`,
      ctaText: nextStep.ctaText,
      href: nextStep.href,
      priority: 2,
      job,
      icon: nextStep.icon,
    };
  }

  // Priority 3: Saved jobs that haven't been started
  const savedJobs = jobs.filter(j => j.jobStatus === 'SAVED');
  if (savedJobs.length > 0) {
    // Pick the most recent one
    const sorted = [...savedJobs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const job = sorted[0];
    
    return {
      type: 'start-job',
      title: 'Start din ansøgningsproces',
      subtitle: `${job.title} hos ${job.company || 'Ukendt virksomhed'}`,
      ctaText: 'Tilpas dit CV',
      href: `/app/job/${job.id}/cv`,
      priority: 3,
      job,
      icon: <FileText className="h-6 w-6" />,
    };
  }

  // Priority 4: No jobs saved yet
  if (jobs.length === 0) {
    return {
      type: 'add-job',
      title: 'Gem dit første job',
      subtitle: 'Start med at finde et spændende jobopslag du vil søge.',
      ctaText: 'Find jobs',
      href: '/app/muligheder',
      priority: 4,
      icon: <Plus className="h-6 w-6" />,
    };
  }

  // Priority 5: All jobs are APPLIED - explore more
  return {
    type: 'explore',
    title: 'Fortsæt jobsøgningen',
    subtitle: `Du har ansøgt ${jobs.filter(j => j.jobStatus === 'APPLIED').length} jobs. Find flere muligheder!`,
    ctaText: 'Udforsk muligheder',
    href: '/app/muligheder',
    priority: 5,
    icon: <Target className="h-6 w-6" />,
  };
}

function getJobProgressScore(job: SavedJob): number {
  let score = 0;
  if (job.cvStatus === 'DRAFT') score += 1;
  if (job.cvStatus === 'FINAL') score += 2;
  if (job.applicationStatus === 'DRAFT') score += 3;
  if (job.applicationStatus === 'FINAL') score += 4;
  return score;
}

interface JobStep {
  title: string;
  ctaText: string;
  href: string;
  icon: React.ReactNode;
}

function getJobNextStep(job: SavedJob): JobStep {
  // CV not started or in draft
  if (job.cvStatus === 'NOT_STARTED') {
    return {
      title: 'Tilpas dit CV',
      ctaText: 'Start CV',
      href: `/app/job/${job.id}/cv`,
      icon: <FileText className="h-6 w-6" />,
    };
  }
  
  if (job.cvStatus === 'DRAFT') {
    return {
      title: 'Færdiggør dit CV',
      ctaText: 'Fortsæt CV',
      href: `/app/job/${job.id}/cv`,
      icon: <FileText className="h-6 w-6" />,
    };
  }
  
  // CV is done, check application
  if (job.applicationStatus === 'NOT_STARTED') {
    return {
      title: 'Skriv din ansøgning',
      ctaText: 'Start ansøgning',
      href: `/app/job/${job.id}/ansoegning`,
      icon: <Mail className="h-6 w-6" />,
    };
  }
  
  if (job.applicationStatus === 'DRAFT') {
    return {
      title: 'Færdiggør din ansøgning',
      ctaText: 'Fortsæt ansøgning',
      href: `/app/job/${job.id}/ansoegning`,
      icon: <Mail className="h-6 w-6" />,
    };
  }
  
  // Both CV and application done - suggest interview prep
  return {
    title: 'Forbered dig til samtalen',
    ctaText: 'Start forberedelse',
    href: `/app/job/${job.id}/interview`,
    icon: <MessageSquare className="h-6 w-6" />,
  };
}

// =====================================================
// COACHING SUGGESTIONS
// =====================================================

interface CoachingSuggestion {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  href: string;
  icon: React.ReactNode;
}

function getCoachingSuggestions(
  jobs: SavedJob[],
  profilePercentage: number
): CoachingSuggestion[] {
  const suggestions: CoachingSuggestion[] = [];
  
  // Suggestion: Profile not complete
  if (profilePercentage < 100) {
    suggestions.push({
      id: 'profile',
      title: 'Udfyld din profil',
      description: `Din profil er ${profilePercentage}% komplet. Fyld resten ud for bedre CV\'er.`,
      ctaText: 'Udfyld profil',
      href: '/app/profil',
      icon: <User className="h-5 w-5 text-blue-600" />,
    });
  }
  
  // Suggestion: Jobs stuck in draft
  const draftCvJobs = jobs.filter(j => j.cvStatus === 'DRAFT');
  if (draftCvJobs.length > 0) {
    suggestions.push({
      id: 'draft-cv',
      title: 'Færdiggør CV-kladder',
      description: `Du har ${draftCvJobs.length} CV${draftCvJobs.length > 1 ? '\'er' : ''} i kladde. Finish line er tæt på!`,
      ctaText: 'Se kladder',
      href: '/app/gemte-jobs',
      icon: <FileText className="h-5 w-5 text-amber-600" />,
    });
  }
  
  // Suggestion: CV done but no application
  const noApplicationJobs = jobs.filter(
    j => j.cvStatus === 'FINAL' && j.applicationStatus === 'NOT_STARTED'
  );
  if (noApplicationJobs.length > 0) {
    const job = noApplicationJobs[0];
    suggestions.push({
      id: 'start-application',
      title: 'Start din ansøgning',
      description: `Dit CV til ${job.company || job.title} er klar – skriv ansøgningen nu.`,
      ctaText: 'Skriv ansøgning',
      href: `/app/job/${job.id}/ansoegning`,
      icon: <Mail className="h-5 w-5 text-green-600" />,
    });
  }
  
  // Suggestion: Everything ready but not applied
  const readyToApply = jobs.filter(
    j => j.cvStatus === 'FINAL' && j.applicationStatus === 'FINAL' && j.jobStatus !== 'APPLIED'
  );
  if (readyToApply.length > 0) {
    suggestions.push({
      id: 'ready-to-apply',
      title: 'Klar til at sende!',
      description: `${readyToApply.length} ansøgning${readyToApply.length > 1 ? 'er' : ''} er klar til at blive sendt.`,
      ctaText: 'Se klar-jobs',
      href: '/app/gemte-jobs',
      icon: <Sparkles className="h-5 w-5 text-purple-600" />,
    });
  }
  
  return suggestions.slice(0, 3); // Max 3 suggestions
}

// =====================================================
// STEP PROGRESS COMPONENT
// =====================================================

interface StepIndicatorProps {
  cvStatus: SubStatus;
  applicationStatus: SubStatus;
  jobStatus: string;
}

function StepIndicator({ cvStatus, applicationStatus, jobStatus }: StepIndicatorProps) {
  const steps = [
    { label: 'CV', status: cvStatus, key: 'cv' },
    { label: 'Ansøgning', status: applicationStatus, key: 'app' },
    { label: 'Interview', status: jobStatus === 'APPLIED' ? 'READY' : 'NOT_STARTED', key: 'int' },
  ];
  
  return (
    <div className="flex items-center gap-1">
      {steps.map((step, index) => {
        const isComplete = step.status === 'FINAL' || step.status === 'READY';
        const isInProgress = step.status === 'DRAFT';
        
        return (
          <div key={step.key} className="flex items-center">
            <div 
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                isComplete && "bg-green-100 text-green-700",
                isInProgress && "bg-amber-100 text-amber-700",
                !isComplete && !isInProgress && "bg-muted text-muted-foreground"
              )}
            >
              {isComplete ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : isInProgress ? (
                <Clock className="h-3 w-3" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
              {step.label}
            </div>
            {index < steps.length - 1 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground mx-0.5" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// =====================================================
// ACTIVE JOB CARD COMPONENT
// =====================================================

interface ActiveJobCardProps {
  job: SavedJob;
}

function ActiveJobCard({ job }: ActiveJobCardProps) {
  const nextStep = getJobNextStep(job);
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Job info */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate">{job.title}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {job.company || 'Ukendt virksomhed'}
              </p>
            </div>
            {job.jobStatus === 'APPLIED' && (
              <Badge variant="outline" className="border-green-600 text-green-700 shrink-0">
                Ansøgt
              </Badge>
            )}
          </div>
          
          {/* Step progress */}
          <StepIndicator 
            cvStatus={job.cvStatus}
            applicationStatus={job.applicationStatus}
            jobStatus={job.jobStatus}
          />
          
          {/* CTA */}
          {job.jobStatus !== 'APPLIED' && (
            <Link href={nextStep.href}>
              <Button size="sm" variant="outline" className="w-full justify-between">
                {nextStep.ctaText}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// MAIN PAGE COMPONENT
// =====================================================

export default function OverblikPage() {
  const { savedJobs, isLoaded } = useSavedJobs();
  const { profile, getCompleteness, canExport, isLoaded: profileLoaded } = useUserProfile();
  
  // Loading state
  if (!isLoaded || !profileLoaded) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-32 bg-muted rounded-lg" />
        <div className="h-64 bg-muted rounded-lg" />
      </div>
    );
  }
  
  const completeness = getCompleteness();
  const exportRequirements = canExport();
  const nextAction = getNextBestAction(
    savedJobs, 
    completeness.isComplete, 
    completeness.percentage,
    exportRequirements.canExport
  );
  const suggestions = getCoachingSuggestions(savedJobs, completeness.percentage);
  
  // Filter active jobs (IN_PROGRESS or recently SAVED)
  const activeJobs = savedJobs
    .filter(j => j.jobStatus === 'IN_PROGRESS' || j.jobStatus === 'SAVED')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);
  
  const appliedCount = savedJobs.filter(j => j.jobStatus === 'APPLIED').length;
  const inProgressCount = savedJobs.filter(j => j.jobStatus === 'IN_PROGRESS').length;
  
  return (
    <div className="space-y-8 max-w-4xl">
      {/* =====================================================
          HERO: Next Best Action
          ===================================================== */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-700 dark:text-blue-300">
              {nextAction.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                Dit næste skridt
              </p>
              <h1 className="text-xl font-bold text-foreground mb-1">
                {nextAction.title}
              </h1>
              <p className="text-sm text-muted-foreground mb-4">
                {nextAction.subtitle}
              </p>
              <Link href={nextAction.href}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  {nextAction.ctaText}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* =====================================================
          ACTIVE JOBS with Step Progress
          ===================================================== */}
      {activeJobs.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Aktive jobs</h2>
              {inProgressCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {inProgressCount} i gang
                </Badge>
              )}
            </div>
            <Link href="/app/gemte-jobs">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Se alle
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeJobs.map(job => (
              <ActiveJobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}
      
      {/* Empty state for no jobs */}
      {savedJobs.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Briefcase className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Ingen gemte jobs endnu</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start med at udforske jobmuligheder og gem dem, du vil søge.
            </p>
            <Link href="/app/muligheder">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Find jobs
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* =====================================================
          COACHING SUGGESTIONS (Quick Improvements)
          ===================================================== */}
      {suggestions.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Hurtige forbedringer</h2>
          </div>
          
          <div className="grid gap-3">
            {suggestions.map(suggestion => (
              <Card key={suggestion.id} className="hover:bg-accent/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-lg shrink-0">
                      {suggestion.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm">{suggestion.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {suggestion.description}
                      </p>
                    </div>
                    <Link href={suggestion.href}>
                      <Button variant="ghost" size="sm">
                        {suggestion.ctaText}
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* =====================================================
          PROFILE STATUS
          ===================================================== */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Din profil</h2>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Profil-komplethed</span>
                  <span className="text-sm text-muted-foreground">
                    {completeness.percentage}%
                  </span>
                </div>
                <Progress value={completeness.percentage} className="h-2" />
                {completeness.missingFields.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Mangler: {completeness.missingFields.slice(0, 3).join(', ')}
                    {completeness.missingFields.length > 3 && ` +${completeness.missingFields.length - 3} mere`}
                  </p>
                )}
              </div>
              <Link href="/app/profil">
                <Button variant="outline" size="sm">
                  {completeness.isComplete ? 'Se profil' : 'Udfyld'}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* =====================================================
          STATS SUMMARY (Optional - shows if user has applied)
          ===================================================== */}
      {appliedCount > 0 && (
        <section>
          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    {appliedCount} {appliedCount === 1 ? 'ansøgning' : 'ansøgninger'} sendt
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Godt arbejde! Fortsæt momentum.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
