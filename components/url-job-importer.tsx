'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Loader2, Check, X, ExternalLink } from 'lucide-react';
import { useSavedJobs } from '@/contexts/saved-jobs-context';

type ImportStep = 'input' | 'review' | 'fallback' | 'saved';

interface ImportedJobData {
  sourceUrl: string;
  sourceDomain: string;
  fetchedAt: string;
  title: string;
  company: string;
  location: string;
  description: string;
}

export function UrlJobImporter() {
  const [step, setStep] = useState<ImportStep>('input');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedData, setImportedData] = useState<ImportedJobData | null>(null);
  const [savedJobId, setSavedJobId] = useState<string | null>(null);
  
  const { saveJob, removeJob, findBySourceUrl } = useSavedJobs();

  const handleImport = async () => {
    if (!url.trim()) {
      setError('Indtast venligst en URL');
      return;
    }

    setIsLoading(true);
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

      if (data.parseFailed) {
        // Go to fallback step
        setImportedData({
          sourceUrl: data.sourceUrl,
          sourceDomain: data.sourceDomain,
          fetchedAt: data.fetchedAt,
          title: data.title || '',
          company: data.company || '',
          location: data.location || '',
          description: '',
        });
        setStep('fallback');
      } else {
        // Go to review step
        setImportedData({
          sourceUrl: data.sourceUrl,
          sourceDomain: data.sourceDomain,
          fetchedAt: data.fetchedAt,
          title: data.title || '',
          company: data.company || '',
          location: data.location || '',
          description: data.descriptionClean || '',
        });
        setStep('review');
      }
    } catch (err: any) {
      setError(err.message || 'Noget gik galt. Prøv igen.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!importedData) return;

    // Check for duplicate
    const existingJob = findBySourceUrl(importedData.sourceUrl);
    if (existingJob) {
      alert('Dette job er allerede gemt under "Gemte jobs"');
      return;
    }

    // Create unique ID
    const jobId = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Save job
    saveJob({
      id: jobId,
      title: importedData.title || 'Uden titel',
      company: importedData.company,
      description: importedData.description,
      location: importedData.location,
      source: 'url-import',
      fullData: {
        sourceUrl: importedData.sourceUrl,
        sourceDomain: importedData.sourceDomain,
        fetchedAt: importedData.fetchedAt,
      },
    });

    setSavedJobId(jobId);
    setStep('saved');
  };

  const handleRemove = () => {
    if (savedJobId) {
      removeJob(savedJobId);
      setSavedJobId(null);
      setStep('input');
      setUrl('');
      setImportedData(null);
      setError(null);
    }
  };

  const handleCancel = () => {
    setStep('input');
    setUrl('');
    setImportedData(null);
    setError(null);
  };

  const handleReset = () => {
    setStep('input');
    setUrl('');
    setImportedData(null);
    setError(null);
    setSavedJobId(null);
  };

  return (
    <div className="space-y-6">
      {/* Input Step */}
      {step === 'input' && (
        <Card>
          <CardHeader>
            <CardTitle>Importér job fra URL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job-url">Job URL</Label>
              <Input
                id="job-url"
                type="url"
                placeholder="Indsæt link til jobopslag (fx virksomhedsside, Jobindex, LinkedIn…)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button onClick={handleImport} disabled={isLoading || !url.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Importerer...' : 'Importér job'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Review Step */}
      {step === 'review' && importedData && (
        <Card>
          <CardHeader>
            <CardTitle>Gennemse og rediger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="review-title">Jobtitel</Label>
              <Input
                id="review-title"
                value={importedData.title}
                onChange={(e) =>
                  setImportedData({ ...importedData, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-company">Virksomhed</Label>
              <Input
                id="review-company"
                value={importedData.company}
                onChange={(e) =>
                  setImportedData({ ...importedData, company: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-location">Lokation (valgfrit)</Label>
              <Input
                id="review-location"
                value={importedData.location}
                onChange={(e) =>
                  setImportedData({ ...importedData, location: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-description">Jobbeskrivelse</Label>
              <Textarea
                id="review-description"
                value={importedData.description}
                onChange={(e) =>
                  setImportedData({ ...importedData, description: e.target.value })
                }
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ExternalLink className="h-4 w-4" />
              <span className="break-all">{importedData.sourceUrl}</span>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave}>Gem job</Button>
              <Button variant="outline" onClick={handleCancel}>
                Annullér
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fallback Step */}
      {step === 'fallback' && importedData && (
        <Card>
          <CardHeader>
            <CardTitle>Manuel indtastning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Vi kunne ikke hente jobteksten automatisk. Kopiér jobteksten ind her.
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fallback-title">Jobtitel</Label>
              <Input
                id="fallback-title"
                value={importedData.title}
                onChange={(e) =>
                  setImportedData({ ...importedData, title: e.target.value })
                }
                placeholder="Indtast jobtitel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fallback-company">Virksomhed</Label>
              <Input
                id="fallback-company"
                value={importedData.company}
                onChange={(e) =>
                  setImportedData({ ...importedData, company: e.target.value })
                }
                placeholder="Indtast virksomhedsnavn"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fallback-location">Lokation (valgfrit)</Label>
              <Input
                id="fallback-location"
                value={importedData.location}
                onChange={(e) =>
                  setImportedData({ ...importedData, location: e.target.value })
                }
                placeholder="Indtast lokation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fallback-description">Jobbeskrivelse</Label>
              <Textarea
                id="fallback-description"
                value={importedData.description}
                onChange={(e) =>
                  setImportedData({ ...importedData, description: e.target.value })
                }
                placeholder="Kopiér jobbeskrivelsen her..."
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ExternalLink className="h-4 w-4" />
              <span className="break-all">{importedData.sourceUrl}</span>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave}>Gem job</Button>
              <Button variant="outline" onClick={handleCancel}>
                Annullér
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Step */}
      {step === 'saved' && importedData && (
        <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Job gemt
                  </h3>
                  <p className="mt-1 text-sm text-green-800 dark:text-green-200">
                    <strong>{importedData.title}</strong> er blevet gemt under "Gemte jobs".
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRemove}>
                  <X className="mr-2 h-4 w-4" />
                  Fjern job
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Importér nyt job
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
