'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Upload, X, User, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { useUserProfile } from '@/contexts/user-profile-context';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export function ProfilePhotoSection() {
  const { profile, updateProfile } = useUserProfile();
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasPhoto = !!profile.profilePhoto?.dataUrl;
  const showOnCV = profile.cvPreferences?.showProfilePhoto ?? false;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Kun billedfiler (JPG/PNG/WebP) er tilladt.');
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`Billedet er for stort. Vælg et billede under ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      // Read file as data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        
        updateProfile({
          profilePhoto: {
            dataUrl,
            fileName: file.name,
            updatedAt: new Date().toISOString(),
          },
        });

        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };

      reader.onerror = () => {
        setError('Kunne ikke læse billedet. Prøv venligst igen.');
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError('Der opstod en fejl ved upload. Prøv venligst igen.');
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    updateProfile({
      profilePhoto: undefined,
      cvPreferences: {
        ...profile.cvPreferences,
        showProfilePhoto: false,
      },
    });
    setError(null);
  };

  const handleToggleShowOnCV = (checked: boolean) => {
    updateProfile({
      cvPreferences: {
        ...profile.cvPreferences,
        showProfilePhoto: checked,
      },
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    if (!profile.name) return 'U';
    const parts = profile.name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">Profilbillede</CardTitle>
            <CardDescription>
              Valgfrit. Kan vises på CV'et, hvis du ønsker det.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">Valgfrit</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Photo Preview and Upload */}
        <div className="flex items-start gap-6">
          {/* Avatar Preview */}
          <Avatar className="h-24 w-24 border-2 border-gray-200">
            {hasPhoto ? (
              <AvatarImage 
                src={profile.profilePhoto?.dataUrl} 
                alt={profile.name || 'Profilbillede'}
                className="object-cover"
              />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl">
                {getInitials()}
              </AvatarFallback>
            )}
          </Avatar>

          {/* Upload/Remove Controls */}
          <div className="flex-1 space-y-3">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Button
                onClick={handleUploadClick}
                disabled={isUploading}
                variant={hasPhoto ? 'outline' : 'default'}
                className="gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Uploader...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    {hasPhoto ? 'Skift billede' : 'Upload billede'}
                  </>
                )}
              </Button>

              {hasPhoto && (
                <Button
                  onClick={handleRemovePhoto}
                  variant="outline"
                  className="gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <X className="h-4 w-4" />
                  Fjern billede
                </Button>
              )}
            </div>

            <p className="text-xs text-gray-600">
              JPG, PNG eller WebP · Max {MAX_FILE_SIZE / 1024 / 1024}MB
            </p>

            {hasPhoto && profile.profilePhoto?.fileName && (
              <p className="text-xs text-gray-500">
                Nuværende: {profile.profilePhoto.fileName}
              </p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* CV Display Toggle */}
        <div className="pt-4 border-t space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label 
                htmlFor="show-photo-cv" 
                className="text-sm font-medium cursor-pointer"
              >
                Vis profilbillede på CV
              </Label>
              <p className="text-xs text-gray-600">
                Når aktiveret vises dit billede i toppen af CV'et
              </p>
            </div>
            <Switch
              id="show-photo-cv"
              checked={showOnCV}
              onCheckedChange={handleToggleShowOnCV}
              disabled={!hasPhoto}
            />
          </div>

          {!hasPhoto && showOnCV && (
            <Alert>
              <ImageIcon className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Upload et billede for at aktivere visning på CV
              </AlertDescription>
            </Alert>
          )}

          {hasPhoto && showOnCV && (
            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
              <ImageIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                Dit profilbillede vil blive vist i toppen af alle CV'er
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Info Box */}
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            💡 <strong>Om profilbillede:</strong> Profilbillede er helt valgfrit. 
            Nogle brancher og virksomheder foretrækker CV uden billede, andre med. 
            Du kan til enhver tid slå visningen til eller fra.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
