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
      
      // Skip empty lines
      if (!trimmed) {
        continue;
      }
      
      // Skip decorative lines - lines with only dashes, underscores, equals signs, or spaces
      if (/^[-_=\s]+$/.test(trimmed)) {
        continue;
      }
      
      // Skip lines that are mostly decorative characters (80% or more)
      const decorativeChars = (trimmed.match(/[-_=]/g) || []).length;
      if (decorativeChars / trimmed.length >= 0.8) {
        continue;
      }
      
      // Detekter overskrifter (skal ikke inkluderes i output)
      if (trimmed === 'OVERORDNET UDLEDNING' ||
          trimmed === 'HVAD CV\'ET TYDELIGT DOKUMENTERER (HARD FACTS)' ||
          trimmed === 'Rolle og erfaring' ||
          trimmed === 'Teknisk og systemmæssig tyngde' ||
          trimmed === 'SAMLET, NEUTRAL KONKLUSION' ||
          trimmed === 'TRIN 2 — SENIOR KONSULENT & REDAKTØR' ||
          trimmed.startsWith('TRIN')) {
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
    <div className="mx-auto max-w-5xl space-y-8 py-12 px-4 sm:px-6 lg:px-8">
      {/* Premium Header Section */}
      <div className="space-y-3 mb-12">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Upload className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
            CV Analyse
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Upload dit CV og få en AI-drevet analyse af dine kompetencer, erfaring og potentiale
        </p>
      </div>

      {/* Upload sektion */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Upload dit CV</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">Understøtter PDF, DOCX og TXT filer</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drag and drop area */}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">Træk din CV her eller klik for at vælge</p>
                  <p className="text-sm text-muted-foreground mt-1">PDF, DOCX eller TXT</p>
                </div>
              </div>
            </button>
          </div>

          {/* Selected file info */}
          {file && (
            <div className="flex items-center gap-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {file.name.split('.').pop()?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setExtraction(null);
                  setAgreement(null);
                }}
                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
              >
                Fjern
              </Button>
            </div>
          )}

          {/* Upload button */}
          {file && !extraction && (
            <Button 
              onClick={handleUpload} 
              disabled={loading} 
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Analyserer CV...' : 'Analysér CV'}
            </Button>
          )}

          {/* Error state */}
          {error && (
            <div className="flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-950/20 p-4 border border-red-200 dark:border-red-800">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">Fejl</p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Udtræk visning */}
      {extraction && (
        <div className="space-y-8">
          {/* Analyse resultat card */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-lg">
            <CardHeader className="pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    Din AI Analyse
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">Baseret på indholdet af dit CV</p>
                </div>
                <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  ✓ Færdiggjort
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-8">
              {/* Tekst sektion - Overordnet udledning og konklusion */}
              {summaryText && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-foreground">Analyse Sammenfatning</h3>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 p-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert text-base leading-relaxed">
                      <div className="whitespace-pre-wrap text-foreground">
                        {summaryText}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Positive bullets - Styrker */}
              {positiveBullets.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <span className="text-lg">✓</span>
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">Styrker & Dokumenterede Kompetencer</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {positiveBullets.map((bullet, index) => (
                      <div 
                        key={index}
                        className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 hover:shadow-md transition-shadow"
                      >
                        <p className="text-sm font-medium text-green-900 dark:text-green-300">{bullet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Negative bullets - Begrænsninger */}
              {negativeBullets.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <span className="text-lg">⚠</span>
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">Områder at Udvikle</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {negativeBullets.map((bullet, index) => (
                      <div 
                        key={index}
                        className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 hover:shadow-md transition-shadow"
                      >
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-300">{bullet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {revised && (
                <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-300 dark:border-green-800 p-5 flex items-start gap-3">
                  <span className="text-2xl">✓</span>
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-300">Analyse Revideret</p>
                    <p className="text-sm text-green-800 dark:text-green-400 mt-1">Din feedback blev indarbejdet. Se den opdaterede analyse ovenfor.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feedback sektion som separat card */}
          {!revised && (
            <Card className="border border-slate-200 dark:border-slate-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Din Feedback</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">Hjælp os med at forbedre analysen</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-4 block">Stemmer analysen overens med din CV?</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={agreement === 'agree' ? 'default' : 'outline'}
                      onClick={() => setAgreement('agree')}
                      className={`h-12 text-base font-medium transition-all ${
                        agreement === 'agree'
                          ? 'bg-green-600 hover:bg-green-700 border-green-600'
                          : 'border-slate-300 dark:border-slate-600 hover:border-green-500'
                      }`}
                    >
                      <ThumbsUp className="mr-2 h-5 w-5" />
                      Ja, helt enig
                    </Button>
                    <Button
                      variant={agreement === 'disagree' ? 'default' : 'outline'}
                      onClick={() => setAgreement('disagree')}
                      className={`h-12 text-base font-medium transition-all ${
                        agreement === 'disagree'
                          ? 'bg-orange-600 hover:bg-orange-700 border-orange-600'
                          : 'border-slate-300 dark:border-slate-600 hover:border-orange-500'
                      }`}
                    >
                      <ThumbsDown className="mr-2 h-5 w-5" />
                      Nej, ændringer nødvendige
                    </Button>
                  </div>
                </div>

                {agreement === 'agree' && (
                  <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-300 dark:border-green-800 p-5 flex items-start gap-3">
                    <span className="text-2xl">✓</span>
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-300">Tak for din bekræftelse!</p>
                      <p className="text-sm text-green-800 dark:text-green-400 mt-1">Analysen er nu gemmes til dine optegnelser.</p>
                    </div>
                  </div>
                )}

                {agreement === 'disagree' && (
                  <div className="space-y-5 rounded-lg bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 p-6">
                    <div>
                      <Label htmlFor="feedback" className="text-base font-semibold mb-3 block">
                        Hvad skal ændres? (obligatorisk)
                      </Label>
                      <Textarea
                        id="feedback"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Fortæl os hvad der var unøjagtigt eller mangler i analysen..."
                        rows={5}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Jo mere detaljeret feedback, desto bedre kan vi forbedre analysen
                      </p>
                    </div>
                    <Button
                      onClick={handleRevise}
                      disabled={!feedback.trim() || revising}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold disabled:opacity-50"
                    >
                      {revising && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {revising ? 'Reviderer analysen...' : 'Revider Analyse'}
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
