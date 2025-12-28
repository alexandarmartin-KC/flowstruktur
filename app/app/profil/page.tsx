'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

  // Parse summary til forskellige sektioner med farver
  const parseSummary = (summary: string) => {
    const lines = summary.split('\n');
    let text = '';
    const positiveBullets: string[] = [];
    const negativeBullets: string[] = [];
    let currentSection = 'text';

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detekter overskrifter (skal ikke inkluderes i output)
      if (trimmed === 'OVERORDNET UDLEDNING' ||
          trimmed === 'HVAD CV\'ET TYDELIGT DOKUMENTERER (HARD FACTS)' ||
          trimmed === 'Rolle og erfaring' ||
          trimmed === 'Teknisk og systemmæssig tyngde' ||
          trimmed === 'SAMLET, NEUTRAL KONKLUSION') {
        currentSection = 'text';
        continue;
      }
      
      // Detekter positive sektioner
      if (trimmed.includes('STYRKER') || trimmed === 'Konkrete ansvarsområder') {
        currentSection = 'positive';
        continue;
      }
      
      // Detekter negative sektioner
      if (trimmed.includes('BEGRÆNSNINGER') || trimmed.includes('IKKE DOKUMENTERER')) {
        currentSection = 'negative';
        continue;
      }
      
      // Parse positive bullets
      if (currentSection === 'positive' && (trimmed.startsWith('- ') || trimmed.startsWith('→'))) {
        const bulletText = trimmed.startsWith('- ') ? trimmed.substring(2) : trimmed.substring(1).trim();
        positiveBullets.push(bulletText);
      } 
      // Parse negative bullets
      else if (currentSection === 'negative' && (trimmed.startsWith('- ') || trimmed.startsWith('→'))) {
        const bulletText = trimmed.startsWith('- ') ? trimmed.substring(2) : trimmed.substring(1).trim();
        negativeBullets.push(bulletText);
      }
      // Parse tekst (inkluder alt andet indhold)
      else if (currentSection === 'text' && trimmed && 
               !trimmed.includes('STYRKER') && 
               !trimmed.includes('BEGRÆNSNINGER') && 
               trimmed !== 'Konkrete ansvarsområder') {
        text += line + '\n';
      }
    }

    return { text: text.trim(), positiveBullets, negativeBullets };
  };

  const { text: summaryText, positiveBullets, negativeBullets } = displaySummary ? parseSummary(displaySummary) : { text: '', positiveBullets: [], negativeBullets: [] };

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
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20">
          <CardTitle>Upload CV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
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
              className="h-10"
            >
              <Upload className="mr-2 h-4 w-4" />
              Vælg fil
            </Button>
            
            {file && (
              <div className="flex-1 rounded-lg bg-accent/50 px-4 py-2">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}
          </div>

          {file && !extraction && (
            <Button onClick={handleUpload} disabled={loading} className="w-full h-11">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Analyserer CV...' : 'Analysér CV'}
            </Button>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Udtræk visning */}
      {extraction && (
        <div className="space-y-6">
          {/* Analyse resultat card */}
          <Card className="border-2">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardTitle className="text-2xl">AI Analyse af dit CV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              {/* Tekst sektion - Overordnet udledning og konklusion */}
              {summaryText && (
                <div className="space-y-4">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap leading-relaxed text-base">
                      {summaryText}
                    </div>
                  </div>
                </div>
              )}

              {/* Positive bullets - Styrker */}
              {positiveBullets.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-green-500"></div>
                    <h3 className="text-base font-semibold text-foreground">Styrker & Dokumenterede Kompetencer</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {positiveBullets.map((bullet, index) => (
                      <Badge 
                        key={index}
                        className="px-4 py-2 text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800"
                      >
                        {bullet}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Negative bullets - Begrænsninger */}
              {negativeBullets.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-amber-500"></div>
                    <h3 className="text-base font-semibold text-foreground">Begrænsninger & Ikke Dokumenteret</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {negativeBullets.map((bullet, index) => (
                      <Badge 
                        key={index}
                        className="px-4 py-2 text-sm font-medium bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800"
                      >
                        {bullet}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {revised && (
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                    <span className="text-lg">✓</span>
                    Analysen er blevet revideret baseret på din feedback
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feedback sektion som separat card */}
          {!revised && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Din Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Label className="text-base">Er du enig i denne analyse?</Label>
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
                  <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                    <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                      <span className="text-lg">✓</span>
                      Tak for din bekræftelse! Analysen er gemt.
                    </p>
                  </div>
                )}

                {agreement === 'disagree' && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="feedback" className="text-base">
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
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
