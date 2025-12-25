'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';
import { usePlan } from '@/contexts/plan-context';

interface ProGateProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
}

export function ProGate({ isOpen, onClose, feature }: ProGateProps) {
  const { setPlan } = usePlan();

  const handleUpgrade = () => {
    setPlan('pro');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Lås op med Pro</DialogTitle>
          <DialogDescription className="text-center">
            {feature} er kun tilgængelig i Pro planen.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Pro Plan fordele:
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Flere karrierespor og detaljerede analyser</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Op til 12 jobmatch (Light: 5)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Personlig action plan med trin-for-trin guide</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>AI-genererede ansøgninger og CV-tips</span>
              </li>
            </ul>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Måske senere
          </Button>
          <Button onClick={handleUpgrade} className="w-full sm:w-auto">
            Opgrader til Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
