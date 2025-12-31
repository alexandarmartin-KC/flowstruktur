'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Download, Check } from 'lucide-react';
import { useSavedJobs } from '@/contexts/saved-jobs-context';
import { CVPreview } from '@/components/CVPreview/CVPreview';

interface CVSection {
  id: string;
  name: string;
  suggestedText: string;
  status: 'approved' | 'pending' | 'editing' | 'rejected';
}

export default function CVPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { savedJobs, setCvStatus } = useSavedJobs();
  const jobId = params.jobId as string;
  
  const job = savedJobs.find((j) => j.id === jobId);
  const [sections, setSections] = useState<CVSection[]>([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // Load sections from localStorage (same as CV page)
    const storedSections = localStorage.getItem(`cv_sections_${jobId}`);
    if (storedSections) {
      setSections(JSON.parse(storedSections));
    }

    // Load profile data
    const storedProfile = localStorage.getItem('flowstruktur_user_profile');
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    }
  }, [jobId]);

  const handleEditSection = (sectionId: string) => {
    // Navigate back to CV page with section query param
    router.push(`/app/job/${jobId}/cv?section=${sectionId}`);
  };

  const handleMarkAsFinal = () => {
    if (job) {
      setCvStatus(job.id, 'FINAL');
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleContinueToApplication = () => {
    router.push(`/app/job/${jobId}/ansøgning`);
  };

  if (!job) return null;

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
          sections={sections}
          profile={profile}
          jobTitle={job.title}
          onEditSection={handleEditSection}
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
                    variant={job.cvStatus === 'FINAL' ? 'outline' : 'default'}
                    onClick={handleMarkAsFinal}
                  >
                    {job.cvStatus === 'FINAL' ? (
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
          
          .cv-preview {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 1.5cm 2cm !important;
            box-shadow: none !important;
          }
          
          .cv-section {
            page-break-inside: avoid;
          }
          
          h2 {
            page-break-after: avoid;
          }
        }
      `}</style>
    </div>
  );
}
