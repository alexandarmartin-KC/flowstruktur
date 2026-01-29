'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSavedJobs } from '@/contexts/saved-jobs-context';
import { CVEditor } from '@/components/cv-editor';
import { ProfileSoftGate } from '@/components/profile-soft-gate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, ArrowRight, Info, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Validate CV data before proceeding
function validateCVData(jobId: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  try {
    const cvDataStr = localStorage.getItem(`cv_document_${jobId}`);
    if (!cvDataStr) {
      return { valid: true, errors: [] }; // No data yet, allow proceeding
    }
    
    const cvData = JSON.parse(cvDataStr);
    
    // Check languages have levels
    if (cvData.leftColumn?.languages) {
      const languagesWithoutLevel = cvData.leftColumn.languages.filter(
        (lang: { language: string; level: string }) => 
          lang.language && lang.language.trim() !== '' && (!lang.level || lang.level.trim() === '')
      );
      
      if (languagesWithoutLevel.length > 0) {
        const langNames = languagesWithoutLevel.map((l: { language: string }) => l.language).join(', ');
        errors.push(`Vælg niveau for: ${langNames}`);
      }
    }
  } catch (e) {
    console.error('Error validating CV data:', e);
  }
  
  return { valid: errors.length === 0, errors };
}

export default function CVPage() {
  const params = useParams();
  const router = useRouter();
  const { savedJobs, setCvStatus, isLoaded } = useSavedJobs();
  const jobId = params.jobId as string;
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Wait for context to load
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Indlæser...</div>
      </div>
    );
  }
  
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
    <div className="cv-page -mx-4 sm:-mx-6 lg:-mx-8 -my-8">
      {/* Intro card */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20 mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4" />
              CV Editor
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              Rediger dit CV direkte i editoren nedenfor. Dit CV gemmes automatisk.
              Brug AI-assistenten til at optimere individuelle sektioner.
            </p>
          </CardContent>
        </Card>
        
        {/* Profile completeness soft gate */}
        <ProfileSoftGate context="cv" />
      </div>
      
      {/* CV Editor - full width */}
      <CVEditor jobId={jobId} />
      
      {/* Bottom navigation */}
      <div className="bg-white dark:bg-gray-950 border-t sticky bottom-0 z-40 print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Udfyld venligst:</strong>
                <ul className="list-disc list-inside mt-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
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
                  const validation = validateCVData(jobId);
                  if (!validation.valid) {
                    setValidationErrors(validation.errors);
                    return;
                  }
                  setValidationErrors([]);
                  setCvStatus(jobId, 'DRAFT');
                }}
              >
                Gem kladde
              </Button>
              
              <Button
                onClick={() => {
                  const validation = validateCVData(jobId);
                  if (!validation.valid) {
                    setValidationErrors(validation.errors);
                    return;
                  }
                  setValidationErrors([]);
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
  );
}
