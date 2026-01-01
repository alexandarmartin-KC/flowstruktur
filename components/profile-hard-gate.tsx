'use client';

import { AlertCircle, ArrowRight, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/contexts/user-profile-context';

interface ProfileHardGateProps {
  isOpen: boolean;
  onClose: () => void;
  action: string; // e.g., "eksportere CV", "færdiggøre ansøgning"
  returnPath?: string; // Path to return to after completing profile
}

export function ProfileHardGate({ 
  isOpen, 
  onClose, 
  action,
  returnPath 
}: ProfileHardGateProps) {
  const router = useRouter();
  const { canExport } = useUserProfile();
  const exportRequirements = canExport();

  const handleGoToProfile = () => {
    // Store return path if provided
    if (returnPath) {
      sessionStorage.setItem('profile_return_path', returnPath);
    }
    router.push('/app/profil');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900/20">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-left">
                Kontaktoplysninger påkrævet
              </DialogTitle>
              <DialogDescription className="text-left mt-2">
                For at {action} skal du først udfylde dine kontaktoplysninger.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900 dark:bg-orange-950/20">
            <p className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-2">
              Du mangler følgende oplysninger:
            </p>
            <ul className="space-y-1">
              {exportRequirements.missingRequiredFields.map((field) => (
                <li
                  key={field}
                  className="text-sm text-orange-800 dark:text-orange-200 flex items-center gap-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  {field}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              💡 <strong>Hvorfor?</strong> Dine kontaktoplysninger vises i CV og ansøgninger, 
              så virksomheder kan kontakte dig. Uden disse kan vi ikke generere et komplet dokument.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Annuller
          </Button>
          <Button
            onClick={handleGoToProfile}
            className="w-full sm:w-auto"
          >
            Gå til profil
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
