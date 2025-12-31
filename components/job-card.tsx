'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MapPin, Briefcase, ArrowRight, MoreVertical, Check, Undo2 } from 'lucide-react';
import { SavedJob, useSavedJobs } from '@/contexts/saved-jobs-context';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface JobCardProps {
  job: SavedJob;
  onUndo?: (jobId: string, previousStatus: string) => void;
}

const STATUS_CONFIG = {
  SAVED: {
    label: 'Gemt',
    variant: 'secondary' as const,
    ctaText: 'Arbejd videre',
  },
  IN_PROGRESS: {
    label: 'Under arbejde',
    variant: 'default' as const,
    ctaText: 'Fortsæt arbejdet',
  },
  APPLIED: {
    label: 'Ansøgt',
    variant: 'outline' as const,
    ctaText: 'Se detaljer',
  },
};

const SUBSTATUS_LABELS = {
  NOT_STARTED: '',
  DRAFT: 'Kladde',
  FINAL: 'Klar',
};

export function JobCard({ job, onUndo }: JobCardProps) {
  const { toggleApplied, unsaveJob } = useSavedJobs();
  const [isProcessing, setIsProcessing] = useState(false);

  const statusConfig = STATUS_CONFIG[job.jobStatus];

  const handleToggleApplied = async () => {
    setIsProcessing(true);
    const wasApplied = job.jobStatus === 'APPLIED';
    const previousStatus = job.jobStatus;
    
    toggleApplied(job.id);
    
    // If we're unmarking as applied, trigger undo callback
    if (wasApplied && onUndo) {
      onUndo(job.id, previousStatus);
    }
    
    setIsProcessing(false);
  };

  const getCvStatusText = () => {
    if (job.cvStatus === 'NOT_STARTED') return null;
    return `CV: ${SUBSTATUS_LABELS[job.cvStatus]}`;
  };

  const getApplicationStatusText = () => {
    if (job.applicationStatus === 'NOT_STARTED') return null;
    return `Ansøgning: ${SUBSTATUS_LABELS[job.applicationStatus]}`;
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
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
          
          <div className="flex items-center gap-2">
            {/* Status chip (not clickable) */}
            <Badge 
              variant={statusConfig.variant}
              className={cn(
                "whitespace-nowrap pointer-events-none",
                job.jobStatus === 'APPLIED' && "border-green-600 text-green-700"
              )}
            >
              {statusConfig.label}
            </Badge>

            {/* Overflow menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={isProcessing}
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Handlinger</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {job.jobStatus === 'APPLIED' ? (
                  <DropdownMenuItem onClick={handleToggleApplied}>
                    <Undo2 className="mr-2 h-4 w-4" />
                    Markér som ikke ansøgt
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleToggleApplied}>
                    <Check className="mr-2 h-4 w-4" />
                    Markér som ansøgt
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => unsaveJob(job.id)}
                  className="text-destructive focus:text-destructive"
                >
                  Fjern job
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {job.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {job.description}
          </p>
        )}

        {/* Secondary status indicators (info only, not clickable) */}
        {(getCvStatusText() || getApplicationStatusText()) && (
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {getCvStatusText() && <span>{getCvStatusText()}</span>}
            {getApplicationStatusText() && <span>{getApplicationStatusText()}</span>}
          </div>
        )}

        {/* Saved date */}
        <p className="text-xs text-muted-foreground">
          Gemt {new Date(job.savedAt).toLocaleDateString('da-DK', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>

        {/* Primary CTA */}
        <div className="border-t border-border pt-4">
          <Link href={`/app/job/${job.id}/cv`}>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700"
            >
              {statusConfig.ctaText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
