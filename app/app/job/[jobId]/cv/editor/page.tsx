'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSavedJobs } from '@/contexts/saved-jobs-context';
import { CVEditor } from '@/components/cv-editor';
import { ProfileSoftGate } from '@/components/profile-soft-gate';
import { CVRequiredGate } from '@/components/cv-required-gate';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CVEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { savedJobs, setCvStatus } = useSavedJobs();
  const jobId = params.jobId as string;
  
  const job = savedJobs.find((j) => j.id === jobId);
  
  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Job ikke fundet.</p>
        <Link href="/app/gemte-jobs">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbage til gemte jobs
          </Button>
        </Link>
      </div>
    );
  }
  
  return (
    <CVRequiredGate>
      <div className="cv-editor-page">
        {/* Profile completeness soft gate */}
        <div className="max-w-5xl mx-auto px-4 py-4">
          <ProfileSoftGate context="cv" />
        </div>
        
        {/* CV Editor */}
        <CVEditor jobId={jobId} />
        
        {/* Bottom navigation */}
        <div className="bg-white dark:bg-gray-950 border-t sticky bottom-0 z-40 print:hidden">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/app/gemte-jobs">
                <Button variant="ghost">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Gemte jobs
                </Button>
              </Link>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCvStatus(jobId, 'DRAFT');
                  }}
                >
                  Gem kladde
                </Button>
                
                <Button
                  onClick={() => {
                    setCvStatus(jobId, 'FINAL');
                    router.push(`/app/job/${jobId}/ansoegning`);
                  }}
                >
                  Fortsæt til ansøgning
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CVRequiredGate>
  );
}
