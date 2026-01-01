'use client';

import { AlertCircle, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/contexts/user-profile-context';

interface ProfileSoftGateProps {
  context?: string; // 'cv' | 'application' | 'interview'
}

export function ProfileSoftGate({ context = 'general' }: ProfileSoftGateProps) {
  const router = useRouter();
  const { getCompleteness } = useUserProfile();
  const completeness = getCompleteness();

  // Don't show if profile is complete
  if (completeness.isComplete) {
    return null;
  }

  const contextMessages: Record<string, string> = {
    cv: 'Din profil er ikke fuldt udfyldt – udfyld kontaktoplysninger for at kunne eksportere CV.',
    application: 'Din profil er ikke fuldt udfyldt – udfyld kontaktoplysninger for at kunne eksportere ansøgninger.',
    interview: 'Din profil er ikke fuldt udfyldt – dette kan påvirke kvaliteten af interview-forberedelsen.',
    general: 'Din profil er ikke fuldt udfyldt – udfyld kontaktoplysninger for at få mest muligt ud af systemet.',
  };

  return (
    <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
      <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Profil {completeness.percentage}% udfyldt
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {contextMessages[context] || contextMessages.general}
          </p>
          {completeness.missingFields.length > 0 && (
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Mangler: {completeness.missingFields.join(', ')}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/app/profil')}
          className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300"
        >
          Udfyld profil
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}
