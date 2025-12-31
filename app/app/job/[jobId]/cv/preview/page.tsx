'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Download, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useSavedJobs } from '@/contexts/saved-jobs-context';
import { CVPreview } from '@/components/CVPreview/CVPreview';
import { useResolvedCv } from '@/hooks/use-resolved-cv';

export default function CVPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const { savedJobs, setCvStatus } = useSavedJobs();
  const jobId = params.jobId as string;
  
  // Use centralized CV resolution hook
  const { cv, isLoading, error } = useResolvedCv(jobId);
  
  // Get the job to check cvStatus
  const job = savedJobs.find((j) => j.id === jobId);

  const handleMarkAsFinal = () => {
    if (cv) {
      setCvStatus(jobId, 'FINAL');
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleContinueToApplication = () => {
    router.push(`/app/job/${jobId}/ansøgning`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Indlæser CV...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !cv) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">CV ikke fundet</h2>
              <p className="text-gray-600 mb-6">
                {error || 'CV\'et for dette job kunne ikke findes. Gå til CV-siden for at oprette det.'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push('/app/gemte-jobs')}
                >
                  Gå til Gemte jobs
                </Button>
                <Button
                  onClick={() => router.push(`/app/job/${jobId}/cv`)}
                >
                  Opret CV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push(`/app/job/${jobId}/cv`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tilbage til CV
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="py-8 px-4">
        <CVPreview
          sections={cv.sections}
          profile={cv.profile}
          jobTitle={cv.jobTitle}
        />
      </div>

      {/* Bottom actions */}
      <div className="bg-white border-t sticky bottom-0 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Færdig med CV?</h3>
                  <p className="text-sm text-muted-foreground">
                    Markér dit CV som klar og fortsæt til ansøgningen
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={job?.cvStatus === 'FINAL' ? 'outline' : 'default'}
                    onClick={handleMarkAsFinal}
                  >
                    {job?.cvStatus === 'FINAL' ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        CV markeret som klar
                      </>
                    ) : (
                      'Markér CV som klar'
                    )}
                  </Button>

                  <Button
                    onClick={handleContinueToApplication}
                  >
                    Fortsæt til ansøgning
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          
          @page {
            size: A4;
            margin: 2cm;
          }
          
          .cv-preview {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          
          .cv-section {
            page-break-inside: avoid;
          }
          
          .experience-item {
            page-break-inside: avoid;
          }
          
          h1, h2, h3 {
            page-break-after: avoid;
          }
          
          /* Hide all interactive elements in print */
          button, .print\\:hidden {
            display: none !important;
          }
        }
        
        /* Ensure no contentEditable or inputs in preview */
        .cv-preview * {
          -webkit-user-modify: read-only !important;
          user-select: text;
        }
        
        .cv-preview [contenteditable] {
          contenteditable: false !important;
        }
      `}</style>
    </div>
  );
}
