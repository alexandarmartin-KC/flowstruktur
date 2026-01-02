'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Download, Loader2, ExternalLink } from 'lucide-react';
import { useSavedJobs } from '@/contexts/saved-jobs-context';
import { useRouter } from 'next/navigation';

type ImportStep = 'input' | 'review' | 'manual';

interface ImportedJobData {
  sourceUrl: string;
  sourceDomain: string;
  fetchedAt: string;
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  parseFailed?: boolean;
}

export function JobImporter() {
  const [step, setStep] = useState<ImportStep>('input');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedData, setImportedData] = useState<ImportedJobData | null>(null);
  
  // Editable fields for review step
  const [editTitle, setEditTitle] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  const { saveJob, isJobSaved, getJobById } = useSavedJobs();
  const router = useRouter();
  
  const handleImport = async () => {
    if (!url.trim()) {
      setError('Indtast venligst en URL');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/job/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import fejlede');
      }
      
      const data = await response.json();
      
      // Check if job already exists by URL
      // We need to check all saved jobs for matching sourceUrl
      const existingJob = Array.from({ length: 1000 }, (_, i) => i.toString())
        .map(id => getJobById(id))
        .find(job => job?.fullData?.sourceUrl === data.sourceUrl);
      
      if (existingJob) {
        setError(`Dette job er allerede importeret som "${existingJob.title}"`);
        setLoading(false);
        return;
      }
      
      setImportedData({
        sourceUrl: data.sourceUrl,
        sourceDomain: data.sourceDomain,
        fetchedAt: data.fetchedAt,
        title: data.title,
        company: data.company,
        location: data.location,
        description: data.descriptionClean,
        parseFailed: data.parseFailed,
      });
      
      // Populate editable fields
      setEditTitle(data.title || '');
      setEditCompany(data.company || '');
      setEditLocation(data.location || '');
      setEditDescription(data.descriptionClean || '');
      
      // If parsing failed, go to manual step
      if (data.parseFailed) {
        setStep('manual');
      } else {
        setStep('review');
      }
      
    } catch (err: any) {
      setError(err.message || 'Kunne ikke importere jobbet. Prøv igen.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveJob = () => {
    if (!importedData) return;
    
    // Validate required fields
    if (!editTitle.trim()) {
      setError('Jobtitel er påkrævet');
      return;
    }
    
    if (!editDescription.trim() || editDescription.trim().length < 50) {
      setError('Jobtekst skal være mindst 50 tegn');
      return;
    }
    
    // Generate job ID
    const jobId = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Save to jobs store
    saveJob({
      id: jobId,
      title: editTitle.trim(),
      company: editCompany.trim() || undefined,
      location: editLocation.trim() || undefined,
      description: editDescription.trim(),
      source: 'imported',
      fullData: {
        ...importedData,
        importMethod: importedData.parseFailed ? 'paste' : 'auto',
      },
    });
    
    // Navigate to job flow
    router.push(`/app/job/${jobId}/cv`);
  };
  
  const handleCancel = () => {
    setStep('input');
    setUrl('');
    setError(null);
    setImportedData(null);
    setEditTitle('');
    setEditCompany('');
    setEditLocation('');
    setEditDescription('');
  };
  
  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Importér job via URL
        </CardTitle>
        <CardDescription>
          Indsæt et link til et jobopslag fra nettet, og arbejd videre med det her i app&apos;en
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {step === 'input' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="job-url">Job-URL</Label>
              <div className="flex gap-2">
                <Input
                  id="job-url"
                  type="url"
                  placeholder="Indsæt link til jobopslag (fx fra virksomhedsside, Jobindex, LinkedIn…)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading) {
                      handleImport();
                    }
                  }}
                  disabled={loading}
                  className="flex-1"
                />
                <Button onClick={handleImport} disabled={loading || !url.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importerer...
                    </>
                  ) : (
                    'Importér job'
                  )}
                </Button>
              </div>
            </div>
            
            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="rounded-md border border-blue-200 bg-blue-50/50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-100">
              <p className="font-medium mb-1">Sådan virker det:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Indsæt URL&apos;en til et jobopslag</li>
                <li>Vi henter og udtrækker jobteksten automatisk</li>
                <li>Du kan redigere og justere informationen</li>
                <li>Gem jobbet og gå i gang med CV/ansøgning</li>
              </ol>
            </div>
          </>
        )}
        
        {step === 'review' && importedData && (
          <>
            <div className="space-y-4">
              <div className="rounded-md border border-green-200 bg-green-50/50 p-3 text-sm text-green-900 dark:border-green-900 dark:bg-green-950/20 dark:text-green-100">
                <p className="font-medium mb-1">✓ Job importeret</p>
                <p className="text-xs">Tjek informationen nedenfor og ret hvis nødvendigt</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-title">Jobtitel *</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Indtast jobtitel"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-company">Virksomhed</Label>
                <Input
                  id="edit-company"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  placeholder="Indtast virksomhedsnavn"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-location">Lokation</Label>
                <Input
                  id="edit-location"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="fx København, Remote, etc."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Jobtekst *</Label>
                <Textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Indtast eller redigér jobteksten"
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {editDescription.length} tegn
                </p>
              </div>
              
              <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                <p className="font-medium mb-1">Kilde:</p>
                <a 
                  href={importedData.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline break-all"
                >
                  {importedData.sourceUrl}
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
                <p className="mt-1">Hentet: {new Date(importedData.fetchedAt).toLocaleString('da-DK')}</p>
              </div>
            </div>
            
            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={handleSaveJob} className="flex-1">
                Gem job og fortsæt
              </Button>
              <Button onClick={handleCancel} variant="outline">
                Annullér
              </Button>
            </div>
          </>
        )}
        
        {step === 'manual' && importedData && (
          <>
            <div className="space-y-4">
              <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
                <p className="font-medium mb-1">⚠ Jobtekst kunne ikke hentes automatisk</p>
                <p className="text-xs">
                  Dette kan ske hvis siden bruger JavaScript til at vise indholdet, eller hvis der er anti-bot beskyttelse.
                  Kopiér venligst jobteksten ind manuelt nedenfor.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="manual-title">Jobtitel *</Label>
                <Input
                  id="manual-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Indtast jobtitel"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="manual-company">Virksomhed</Label>
                <Input
                  id="manual-company"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  placeholder="Indtast virksomhedsnavn"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="manual-location">Lokation</Label>
                <Input
                  id="manual-location"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="fx København, Remote, etc."
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="manual-description">Jobtekst * (kopiér fra hjemmesiden)</Label>
                <Textarea
                  id="manual-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Kopiér hele jobteksten fra jobopslagets hjemmeside og indsæt her..."
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {editDescription.length} tegn (minimum 50)
                </p>
              </div>
              
              <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                <p className="font-medium mb-1">Kilde:</p>
                <a 
                  href={importedData.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline break-all"
                >
                  {importedData.sourceUrl}
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              </div>
            </div>
            
            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={handleSaveJob} className="flex-1">
                Gem job og fortsæt
              </Button>
              <Button onClick={handleCancel} variant="outline">
                Annullér
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
