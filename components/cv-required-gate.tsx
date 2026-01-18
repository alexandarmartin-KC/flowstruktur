'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileX, Upload, ArrowRight, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { hasCVData } from '@/lib/cv-normalizer';

interface CVRequiredGateProps {
  children: React.ReactNode;
}

/**
 * CV Required Gate
 * 
 * This component enforces the fundamental invariant of the CV refinement editor:
 * The editor must NEVER open with a blank CV.
 * 
 * If no CV has been uploaded, this gate blocks access to the editor
 * and redirects the user to upload their CV first.
 */
export function CVRequiredGate({ children }: CVRequiredGateProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasCV, setHasCV] = useState(false);

  useEffect(() => {
    // Check if CV data exists
    const cvExists = hasCVData();
    setHasCV(cvExists);
    setIsChecking(false);
  }, []);

  // Show loading while checking
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Kontrollerer CV data...</p>
        </div>
      </div>
    );
  }

  // If no CV exists, show gate message
  if (!hasCV) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/50">
                <FileX className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-amber-900 dark:text-amber-100">
                CV påkrævet
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-amber-800 dark:text-amber-200">
                For at bruge CV editoren skal du først uploade dit CV. 
                Editoren er designet til at forfine og tilpasse dit eksisterende CV 
                til specifikke jobopslag — ikke til at oprette et CV fra bunden.
              </p>
              
              <p className="text-amber-700 dark:text-amber-300 text-sm">
                Når du har uploadet dit CV, vil alle dine oplysninger automatisk 
                blive indlæst i editoren, så du kun skal fokusere på at forbedre 
                og målrette indholdet.
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 mb-3">
                Sådan kommer du i gang:
              </h4>
              <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs flex items-center justify-center font-medium">
                    1
                  </span>
                  <span>Gå til din profil og upload dit CV</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs flex items-center justify-center font-medium">
                    2
                  </span>
                  <span>Dit CV bliver analyseret og struktureret automatisk</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs flex items-center justify-center font-medium">
                    3
                  </span>
                  <span>Vend tilbage til editoren for at forfine dit CV til dette job</span>
                </li>
              </ol>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/app/profil" className="flex-1">
                <Button className="w-full" size="lg">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload CV
                </Button>
              </Link>
              <Link href="/app/gemte-jobs">
                <Button variant="outline" size="lg">
                  Tilbage til gemte jobs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Additional context */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            <FileText className="inline h-4 w-4 mr-1" />
            Vi understøtter PDF, DOCX og TXT filer
          </p>
        </div>
      </div>
    );
  }

  // CV exists, render children (the editor)
  return <>{children}</>;
}
