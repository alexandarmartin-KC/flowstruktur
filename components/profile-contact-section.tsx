'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, MapPin, Link as LinkIcon, CheckCircle2, AlertCircle, Check } from 'lucide-react';
import { useUserProfile } from '@/contexts/user-profile-context';
import { useRouter } from 'next/navigation';

export function ProfileContactSection() {
  const router = useRouter();
  const { profile, updateProfile, getCompleteness, canExport } = useUserProfile();
  const [localProfile, setLocalProfile] = useState(profile);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const completeness = getCompleteness();
  const exportReqs = canExport();

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  useEffect(() => {
    const isDifferent = JSON.stringify(localProfile) !== JSON.stringify(profile);
    setHasChanges(isDifferent);
  }, [localProfile, profile]);

  // Auto-save with debounce
  const autoSave = useCallback(() => {
    if (hasChanges) {
      setIsSaving(true);
      updateProfile(localProfile);
      
      // Show "Gemt" feedback
      setTimeout(() => {
        setIsSaving(false);
        setShowSaved(true);
        setHasChanges(false);
        
        // Hide "Gemt" after 2 seconds
        setTimeout(() => {
          setShowSaved(false);
        }, 2000);
      }, 300);
    }
  }, [localProfile, hasChanges, updateProfile]);

  const handleSave = () => {
    updateProfile(localProfile);
    setHasChanges(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
    
    // Check if user came from a return path
    const returnPath = sessionStorage.getItem('profile_return_path');
    if (returnPath) {
      sessionStorage.removeItem('profile_return_path');
      router.push(returnPath);
    }
  };

  const handleChange = (field: keyof typeof localProfile, value: string) => {
    setLocalProfile(prev => ({ ...prev, [field]: value }));
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save (1 second after last change)
    saveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 1000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">Kontaktoplysninger</CardTitle>
            <CardDescription>
              Disse oplysninger bruges i CV og ansøgninger
            </CardDescription>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-2">
              <Progress value={completeness.percentage} className="w-24 h-2" />
              <span className="text-sm font-medium">{completeness.percentage}%</span>
            </div>
            {exportReqs.canExport ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Klar til eksport
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Mangler påkrævet info
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Required fields */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Påkrævet for eksport</h3>
            <Badge variant="outline" className="text-xs">Obligatorisk</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Fulde navn *
              </Label>
              <Input
                id="name"
                value={localProfile.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Fx. Anders Andersen"
                className={!localProfile.name ? 'border-orange-300' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={localProfile.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="din@email.dk"
                className={!localProfile.email ? 'border-orange-300' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefon *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={localProfile.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+45 12 34 56 78"
                className={!localProfile.phone ? 'border-orange-300' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Jobtitel
              </Label>
              <Input
                id="title"
                value={localProfile.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Fx. Senior Udvikler"
              />
            </div>
          </div>
        </div>

        {/* Optional fields */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Valgfrit</h3>
            <Badge variant="outline" className="text-xs">Anbefalet</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Adresse
              </Label>
              <Input
                id="location"
                value={localProfile.location || ''}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Buddingevej 72D 1tv"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                By
              </Label>
              <Input
                id="city"
                value={localProfile.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="København"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Land
              </Label>
              <Input
                id="country"
                value={localProfile.country || ''}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="Danmark"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                LinkedIn
              </Label>
              <Input
                id="linkedin"
                value={localProfile.linkedin || ''}
                onChange={(e) => handleChange('linkedin', e.target.value)}
                placeholder="linkedin.com/in/ditbrugernavn"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="portfolio" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Portfolio / Hjemmeside
              </Label>
              <Input
                id="portfolio"
                value={localProfile.portfolio || ''}
                onChange={(e) => handleChange('portfolio', e.target.value)}
                placeholder="www.dinhjemmeside.dk"
              />
            </div>
          </div>
        </div>

        {/* Missing required fields warning */}
        {!exportReqs.canExport && (
          <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900 dark:bg-orange-950/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  Mangler påkrævet information for eksport
                </p>
                <p className="text-xs text-orange-800 dark:text-orange-200">
                  Udfyld følgende felter for at kunne eksportere CV og ansøgninger: {exportReqs.missingRequiredFields.join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end gap-2 pt-4">
          {hasChanges && !isSaving && !showSaved && (
            <Badge variant="secondary" className="mr-auto">
              Gemmer...
            </Badge>
          )}
          {showSaved && (
            <Badge variant="default" className="mr-auto gap-1 bg-green-500">
              <Check className="h-3 w-3" />
              Gemt
            </Badge>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges && !showSaved}
            variant={showSaved ? "default" : "default"}
            className={showSaved ? "gap-2" : ""}
          >
            {showSaved && <Check className="h-4 w-4" />}
            {showSaved ? 'Gemt' : hasChanges ? 'Gem nu' : 'Gem'}
          </Button>
        </div>

        {/* Info about usage */}
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            💡 <strong>Hvorfor er disse oplysninger vigtige?</strong> Dine kontaktoplysninger 
            vises i CV og ansøgninger, så virksomheder kan kontakte dig. Uden navn, email og 
            telefon kan vi ikke generere komplette dokumenter der kan sendes til arbejdsgivere.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
