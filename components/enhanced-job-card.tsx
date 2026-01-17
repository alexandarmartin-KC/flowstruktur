'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MapPin,
  Briefcase,
  ArrowRight,
  MoreVertical,
  FileText,
  FileEdit,
  MessageSquare,
  Check,
  Circle,
  Loader2,
  Trash2,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SavedJobEnhanced, StepStatus, getNextAction } from '@/lib/saved-jobs-types';

interface EnhancedJobCardProps {
  job: SavedJobEnhanced;
  onRemove?: (jobId: string) => void;
  onStepClick?: (jobId: string, step: 'cv' | 'coverLetter' | 'interview') => void;
}

const STEP_CONFIG = {
  cv: {
    label: 'CV',
    shortLabel: 'CV',
    icon: FileText,
    url: 'cv',
  },
  coverLetter: {
    label: 'Ansøgning',
    shortLabel: 'Ansøgning',
    icon: FileEdit,
    url: 'ansoegning',
  },
  interview: {
    label: 'Samtale',
    shortLabel: 'Samtale',
    icon: MessageSquare,
    url: 'interview',
  },
};

function StepStatusIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case 'done':
      return (
        <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </div>
      );
    case 'in_progress':
      return (
        <div className="h-5 w-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
          <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
        </div>
      );
    case 'not_started':
    default:
      return (
        <Circle className="h-5 w-5 text-muted-foreground/40" />
      );
  }
}

function StepBadge({ status }: { status: StepStatus }) {
  switch (status) {
    case 'done':
      return <Badge variant="default" className="bg-green-600 text-xs">Færdig</Badge>;
    case 'in_progress':
      return <Badge variant="default" className="bg-blue-600 text-xs">I gang</Badge>;
    case 'not_started':
    default:
      return <Badge variant="secondary" className="text-xs">Ikke startet</Badge>;
  }
}

export function EnhancedJobCard({ job, onRemove, onStepClick }: EnhancedJobCardProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const nextAction = getNextAction(job.stepProgress);
  const primaryCtaUrl = nextAction ? `/app/job/${job.id}/${nextAction.url}` : `/app/job/${job.id}/cv`;
  const primaryCtaLabel = nextAction?.label ?? 'Åbn job workspace';

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      // In production, call API
      await fetch(`/api/saved-jobs/${job.id}`, { method: 'DELETE' });
      onRemove?.(job.id);
    } catch (error) {
      console.error('Error removing job:', error);
    } finally {
      setIsRemoving(false);
      setShowRemoveDialog(false);
    }
  };

  const handleStepNavigation = (step: 'cv' | 'coverLetter' | 'interview') => {
    onStepClick?.(job.id, step);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold leading-tight line-clamp-2">
                {job.jobTitle}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{job.companyName}</span>
                </div>
                {job.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{job.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Overflow menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Handlinger</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/app/job/${job.id}/cv`}>
                    <FileText className="mr-2 h-4 w-4" />
                    Åbn CV
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/app/job/${job.id}/ansoegning`}>
                    <FileEdit className="mr-2 h-4 w-4" />
                    Åbn ansøgning
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/app/job/${job.id}/interview`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Åbn samtaleforberedelse
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowRemoveDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Fjern fra gemte
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Saved date */}
          <p className="text-xs text-muted-foreground">
            Gemt d. {formatDate(job.savedAt)}
          </p>

          {/* Key insights */}
          {job.analysisSummary.bullets.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Nøgleindsigter
              </p>
              <ul className="space-y-1">
                {job.analysisSummary.bullets.slice(0, 3).map((bullet, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-foreground/80 flex items-start gap-2"
                  >
                    <span className="text-primary mt-1.5 text-xs">•</span>
                    <span className="line-clamp-2">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Step progress */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Fremdrift
            </p>
            <div className="flex items-center gap-1">
              {/* Steps with connecting lines */}
              {(['cv', 'coverLetter', 'interview'] as const).map((step, idx) => {
                const config = STEP_CONFIG[step];
                const status = job.stepProgress[step].status;
                const Icon = config.icon;

                return (
                  <div key={step} className="flex items-center flex-1">
                    <Link
                      href={`/app/job/${job.id}/${config.url}`}
                      onClick={() => handleStepNavigation(step)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors flex-1',
                        'hover:bg-muted/50',
                        status === 'in_progress' && 'bg-blue-50 dark:bg-blue-950/30'
                      )}
                    >
                      <StepStatusIcon status={status} />
                      <span className="text-xs font-medium text-center">
                        {config.shortLabel}
                      </span>
                    </Link>
                    {idx < 2 && (
                      <div
                        className={cn(
                          'h-0.5 w-4 flex-shrink-0',
                          job.stepProgress[step].status === 'done'
                            ? 'bg-green-500'
                            : 'bg-muted-foreground/20'
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            {/* Primary CTA */}
            <Link href={primaryCtaUrl} className="flex-1">
              <Button className="w-full bg-primary hover:bg-primary/90" size="sm">
                {primaryCtaLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            {/* Secondary: View analysis */}
            <Link href={`/app/job/${job.id}/cv`}>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4" />
                <span className="sr-only">Se analyse</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Remove confirmation dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fjern job fra gemte?</DialogTitle>
            <DialogDescription>
              Er du sikker på, at du vil fjerne "{job.jobTitle}" hos {job.companyName} fra dine gemte jobs? 
              Dit arbejde med CV, ansøgning og samtaleforberedelse vil blive slettet.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRemoveDialog(false)}
              disabled={isRemoving}
            >
              Annuller
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fjerner...
                </>
              ) : (
                'Fjern job'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
