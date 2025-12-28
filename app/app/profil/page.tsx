'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';

interface CVExtraction {
  summary: string;
  cvText: string;
}

export default function ProfilPage() {
  const [file, setFile] = useState<File | null>(null);
  const [extraction, setExtraction] = useState<CVExtraction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [agreement, setAgreement] = useState<'agree' | 'disagree' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [revising, setRevising] = useState(false);
  const [revised, setRevised] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'docx', 'txt'].includes(fileType || '')) {
        setError('Kun PDF, DOCX eller TXT filer er tilladt');
        return;
      }
      setFile(selectedFile);
      setExtraction(null);
      setAgreement(null);
      setFeedback('');
      setRevised(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Kunne ikke udtrække CV');
      }

      const data = await res.json();
      setExtraction(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Der opstod en fejl');
    } finally {
      setLoading(false);
    }
  };

  const handleRevise = async () => {
    if (!extraction || agreement !== 'disagree' || !feedback.trim()) return;

    setRevising(true);
    setError(null);

    try {
      const res = await fetch('/api/revise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalSummary: extraction.summary,
          feedback: feedback,
          cvText: extraction.cvText,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Kunne ikke revidere udtræk');
      }

      const data = await res.json();
      setRevised(data.revised);
      setAgreement(null);
      setFeedback('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Der opstod en fejl ved revision');
    } finally {
      setRevising(false);
    }
  };

  const displaySummary = revised || extraction?.summary || '';

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">CV Analyse</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Upload dit CV og få en AI-baseret analyse af din erfaring og kompetencer
        </p>
      </div>

      {/* Upload sektion */}
      <Card>
        <CardHeader>
          <CardTitle>Upload CV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              <Upload className="mr-2 h-4 w-4" />
              Vælg fil
            </Button>
            
            {file && (
              <div className="flex-1">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}
          </div>

          {file && !extraction && (
            <Button onClick={handleUpload} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Analyserer CV...' : 'Analysér CV'}
            </Button>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Udtræk visning */}
      {extraction && (
        <Card>
          <CardHeader>
            <CardTitle>AI Analyse af dit CV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap rounded-lg bg-accent/30 p-4">
                {displaySummary}
              </div>
            </div>

            {revised && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  ✓ Analysen er blevet revideret baseret på din feedback
                </p>
              </div>
            )}

            {/* Feedback sektion */}
            {!revised && (
              <div className="space-y-4 pt-4 border-t">
                <Label>Er du enig i denne analyse?</Label>
                <div className="flex gap-3">
                  <Button
                    variant={agreement === 'agree' ? 'default' : 'outline'}
                    onClick={() => setAgreement('agree')}
                    className="flex-1"
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Enig
                  </Button>
                  <Button
                    variant={agreement === 'disagree' ? 'default' : 'outline'}
                    onClick={() => setAgreement('disagree')}
                    className="flex-1"
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    Ikke enig
                  </Button>
                </div>

                {agreement === 'agree' && (
                  <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                    <p className="text-sm text-green-700 dark:text-green-400">
                      Tak for din bekræftelse! Analysen er gemt.
                    </p>
                  </div>
                )}

                {agreement === 'disagree' && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="feedback">
                        Hvad skal ændres i analysen? (obligatorisk)
                      </Label>
                      <Textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Beskriv hvad der er forkert eller mangler i analysen..."
                        rows={4}
                        className="mt-2"
                      />
                    </div>
                    <Button
                      onClick={handleRevise}
                      disabled={!feedback.trim() || revising}
                      className="w-full"
                    >
                      {revising && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {revising ? 'Reviderer...' : 'Revider analyse'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
