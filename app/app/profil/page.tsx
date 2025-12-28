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
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-2 font-semibold text-foreground">Erfaringsniveau</h3>
              <p className="text-muted-foreground">{cvData.erfaringsniveau}</p>
            </div>

            <div>
              <h3 className="mb-2 font-semibold text-foreground">Typiske opgaver</h3>
              <ul className="space-y-2">
                {cvData.typiskOpgaver.map((opgave, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    <span className="text-muted-foreground">{opgave}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 font-semibold text-foreground">Kompetenceområder</h3>
              <div className="flex flex-wrap gap-2">
                {cvData.kompetenceomraader.map((omraade, index) => (
                  <Badge key={index} variant="secondary">
                    {omraade}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {cvData.fortolkning}
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-4 text-sm dark:bg-amber-950/20">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-500" />
              <p className="text-amber-900 dark:text-amber-200">
                <strong>Disclaimer:</strong> Dette er en fortolkning og kan justeres. Hvis noget ikke passer,
                er du velkommen til at give feedback.
              </p>
            </div>

            {/* CV Kommentarer */}
            <div className="space-y-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4">
              <div className="flex items-start gap-2">
                <MessageSquarePlus className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">Dine kommentarer til CV'et</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Er der noget i dit CV, der ikke fylder nok eller fylder for meget? Fortæl os om det her, 
                    så vi kan tage højde for det i din analyse.
                  </p>
                </div>
              </div>
              <Textarea
                placeholder="Eksempel: Mit CV fremhæver ikke mine ledelseskompetencer nok, selvom jeg har ledet teams i 3 år. Derudover fylder mine tidlige tekniske roller mere, end de bør..."
                value={cvComments}
                onChange={(e) => {
                  setCvComments(e.target.value);
                  setCommentsSaved(false);
                }}
                className="min-h-[120px] resize-none"
              />
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => {
                    setCommentsSaved(true);
                    // Her ville man gemme kommentarerne til backend
                  }}
                  disabled={!cvComments.trim() || commentsSaved}
                  size="sm"
                >
                  {commentsSaved ? 'Gemt ✓' : 'Gem kommentarer'}
                </Button>
                {commentsSaved && cvComments.trim() && (
                  <span className="text-sm text-green-600 dark:text-green-500">
                    Dine kommentarer vil blive inkluderet i den videre analyse
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEKTION 2: Personprofil */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">Personprofil</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Gennem disse spørgsmål får vi indsigt i, hvordan du bedst arbejder
          </p>
        </div>

        {!personProfilCompleted ? (
          <Card>
            <CardHeader>
              <CardTitle>Spørgeskema</CardTitle>
              <CardDescription>
                Besvar følgende spørgsmål på en skala fra 1-5
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((q, index) => (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm font-medium">
                    {index + 1}. {q.question}
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:bg-accent"
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <Button
                className="w-full"
                onClick={() => setPersonProfilCompleted(true)}
              >
                Gem svar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Din arbejdsstil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {personAnalyse.arbejdsstil}
                </p>
                
                {/* Feedback section */}
                <div className="space-y-3 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-4">
                  <Label className="text-sm font-semibold">Er denne beskrivelse træffende?</Label>
                  <div className="flex gap-3">
                    <Button
                      variant={feedbackState.arbejdsstil.agreement === 'agree' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFeedbackState(prev => ({
                        ...prev,
                        arbejdsstil: { ...prev.arbejdsstil, agreement: 'agree', saved: false }
                      }))}
                      className="flex items-center gap-2"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Enig
                    </Button>
                    <Button
                      variant={feedbackState.arbejdsstil.agreement === 'disagree' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFeedbackState(prev => ({
                        ...prev,
                        arbejdsstil: { ...prev.arbejdsstil, agreement: 'disagree', saved: false }
                      }))}
                      className="flex items-center gap-2"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Uenig
                    </Button>
                  </div>
                  
                  {feedbackState.arbejdsstil.agreement === 'disagree' && (
                    <div className="space-y-2 pt-2">
                      <Label className="text-sm">Hvad passer ikke?</Label>
                      <Textarea
                        placeholder="Fortæl os, hvad der ikke stemmer overens med din oplevelse..."
                        value={feedbackState.arbejdsstil.comment}
                        onChange={(e) => setFeedbackState(prev => ({
                          ...prev,
                          arbejdsstil: { ...prev.arbejdsstil, comment: e.target.value, saved: false }
                        }))}
                        className="min-h-[100px]"
                      />
                    </div>
                  )}
                  
                  {feedbackState.arbejdsstil.agreement && (
                    <Button
                      onClick={() => {
                        setFeedbackState(prev => ({
                          ...prev,
                          arbejdsstil: { ...prev.arbejdsstil, saved: true }
                        }));
                        // Her ville man gemme feedback til backend
                      }}
                      disabled={feedbackState.arbejdsstil.saved || 
                        (feedbackState.arbejdsstil.agreement === 'disagree' && !feedbackState.arbejdsstil.comment.trim())}
                      size="sm"
                    >
                      {feedbackState.arbejdsstil.saved ? 'Gemt ✓' : 'Gem feedback'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hvad motiverer dig</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {personAnalyse.motivation}
                </p>
                
                <div className="space-y-3 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-4">
                  <Label className="text-sm font-semibold">Er denne beskrivelse træffende?</Label>
                  <div className="flex gap-3">
                    <Button
                      variant={feedbackState.motivation.agreement === 'agree' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFeedbackState(prev => ({
                        ...prev,
                        motivation: { ...prev.motivation, agreement: 'agree', saved: false }
                      }))}
                      className="flex items-center gap-2"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Enig
                    </Button>
                    <Button
                      variant={feedbackState.motivation.agreement === 'disagree' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFeedbackState(prev => ({
                        ...prev,
                        motivation: { ...prev.motivation, agreement: 'disagree', saved: false }
                      }))}
                      className="flex items-center gap-2"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Uenig
                    </Button>
                  </div>
                  
                  {feedbackState.motivation.agreement === 'disagree' && (
                    <div className="space-y-2 pt-2">
                      <Label className="text-sm">Hvad passer ikke?</Label>
                      <Textarea
                        placeholder="Fortæl os, hvad der ikke stemmer overens med din oplevelse..."
                        value={feedbackState.motivation.comment}
                        onChange={(e) => setFeedbackState(prev => ({
                          ...prev,
                          motivation: { ...prev.motivation, comment: e.target.value, saved: false }
                        }))}
                        className="min-h-[100px]"
                      />
                    </div>
                  )}
                  
                  {feedbackState.motivation.agreement && (
                    <Button
                      onClick={() => {
                        setFeedbackState(prev => ({
                          ...prev,
                          motivation: { ...prev.motivation, saved: true }
                        }));
                      }}
                      disabled={feedbackState.motivation.saved || 
                        (feedbackState.motivation.agreement === 'disagree' && !feedbackState.motivation.comment.trim())}
                      size="sm"
                    >
                      {feedbackState.motivation.saved ? 'Gemt ✓' : 'Gem feedback'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hvad dræner dig</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {personAnalyse.draenere}
                </p>
                
                <div className="space-y-3 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-4">
                  <Label className="text-sm font-semibold">Er denne beskrivelse træffende?</Label>
                  <div className="flex gap-3">
                    <Button
                      variant={feedbackState.draenere.agreement === 'agree' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFeedbackState(prev => ({
                        ...prev,
                        draenere: { ...prev.draenere, agreement: 'agree', saved: false }
                      }))}
                      className="flex items-center gap-2"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Enig
                    </Button>
                    <Button
                      variant={feedbackState.draenere.agreement === 'disagree' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFeedbackState(prev => ({
                        ...prev,
                        draenere: { ...prev.draenere, agreement: 'disagree', saved: false }
                      }))}
                      className="flex items-center gap-2"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Uenig
                    </Button>
                  </div>
                  
                  {feedbackState.draenere.agreement === 'disagree' && (
                    <div className="space-y-2 pt-2">
                      <Label className="text-sm">Hvad passer ikke?</Label>
                      <Textarea
                        placeholder="Fortæl os, hvad der ikke stemmer overens med din oplevelse..."
                        value={feedbackState.draenere.comment}
                        onChange={(e) => setFeedbackState(prev => ({
                          ...prev,
                          draenere: { ...prev.draenere, comment: e.target.value, saved: false }
                        }))}
                        className="min-h-[100px]"
                      />
                    </div>
                  )}
                  
                  {feedbackState.draenere.agreement && (
                    <Button
                      onClick={() => {
                        setFeedbackState(prev => ({
                          ...prev,
                          draenere: { ...prev.draenere, saved: true }
                        }));
                      }}
                      disabled={feedbackState.draenere.saved || 
                        (feedbackState.draenere.agreement === 'disagree' && !feedbackState.draenere.comment.trim())}
                      size="sm"
                    >
                      {feedbackState.draenere.saved ? 'Gemt ✓' : 'Gem feedback'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sådan fungerer du i samarbejde</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {personAnalyse.samarbejde}
                </p>
                
                <div className="space-y-3 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-4">
                  <Label className="text-sm font-semibold">Er denne beskrivelse træffende?</Label>
                  <div className="flex gap-3">
                    <Button
                      variant={feedbackState.samarbejde.agreement === 'agree' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFeedbackState(prev => ({
                        ...prev,
                        samarbejde: { ...prev.samarbejde, agreement: 'agree', saved: false }
                      }))}
                      className="flex items-center gap-2"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Enig
                    </Button>
                    <Button
                      variant={feedbackState.samarbejde.agreement === 'disagree' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFeedbackState(prev => ({
                        ...prev,
                        samarbejde: { ...prev.samarbejde, agreement: 'disagree', saved: false }
                      }))}
                      className="flex items-center gap-2"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Uenig
                    </Button>
                  </div>
                  
                  {feedbackState.samarbejde.agreement === 'disagree' && (
                    <div className="space-y-2 pt-2">
                      <Label className="text-sm">Hvad passer ikke?</Label>
                      <Textarea
                        placeholder="Fortæl os, hvad der ikke stemmer overens med din oplevelse..."
                        value={feedbackState.samarbejde.comment}
                        onChange={(e) => setFeedbackState(prev => ({
                          ...prev,
                          samarbejde: { ...prev.samarbejde, comment: e.target.value, saved: false }
                        }))}
                        className="min-h-[100px]"
                      />
                    </div>
                  )}
                  
                  {feedbackState.samarbejde.agreement && (
                    <Button
                      onClick={() => {
                        setFeedbackState(prev => ({
                          ...prev,
                          samarbejde: { ...prev.samarbejde, saved: true }
                        }));
                      }}
                      disabled={feedbackState.samarbejde.saved || 
                        (feedbackState.samarbejde.agreement === 'disagree' && !feedbackState.samarbejde.comment.trim())}
                      size="sm"
                    >
                      {feedbackState.samarbejde.saved ? 'Gemt ✓' : 'Gem feedback'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* SEKTION 3: Samlet analyse */}
      {personProfilCompleted && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Samlet analyse</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Når vi ser på din erfaring og din personprofil samlet, tegner der sig nogle tydelige mønstre
            </p>
          </div>

          <div className="space-y-6">
            {samletAnalyse.observationer.map((obs, index) => {
              const feedbackKey = `obs_${index}`;
              const feedback = analyseFeedback[feedbackKey] || { agreement: null, comment: '', saved: false };
              
              return (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{obs.titel}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="leading-relaxed text-muted-foreground">{obs.beskrivelse}</p>
                    
                    <div className="space-y-3 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 p-4">
                      <Label className="text-sm font-semibold">Er denne observation træffende?</Label>
                      <div className="flex gap-3">
                        <Button
                          variant={feedback.agreement === 'agree' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            initObservationFeedback(index);
                            setAnalyseFeedback(prev => ({
                              ...prev,
                              [feedbackKey]: { ...prev[feedbackKey], agreement: 'agree', saved: false }
                            }));
                          }}
                          className="flex items-center gap-2"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          Enig
                        </Button>
                        <Button
                          variant={feedback.agreement === 'disagree' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            initObservationFeedback(index);
                            setAnalyseFeedback(prev => ({
                              ...prev,
                              [feedbackKey]: { ...prev[feedbackKey], agreement: 'disagree', saved: false }
                            }));
                          }}
                          className="flex items-center gap-2"
                        >
                          <ThumbsDown className="h-4 w-4" />
                          Uenig
                        </Button>
                      </div>
                      
                      {feedback.agreement === 'disagree' && (
                        <div className="space-y-2 pt-2">
                          <Label className="text-sm">Hvad passer ikke?</Label>
                          <Textarea
                            placeholder="Fortæl os, hvad der ikke stemmer overens med din oplevelse..."
                            value={feedback.comment}
                            onChange={(e) => setAnalyseFeedback(prev => ({
                              ...prev,
                              [feedbackKey]: { ...prev[feedbackKey], comment: e.target.value, saved: false }
                            }))}
                            className="min-h-[100px]"
                          />
                        </div>
                      )}
                      
                      {feedback.agreement && (
                        <Button
                          onClick={() => {
                            setAnalyseFeedback(prev => ({
                              ...prev,
                              [feedbackKey]: { ...prev[feedbackKey], saved: true }
                            }));
                            // Her ville man gemme feedback til backend
                          }}
                          disabled={feedback.saved || 
                            (feedback.agreement === 'disagree' && !feedback.comment.trim())}
                          size="sm"
                        >
                          {feedback.saved ? 'Gemt ✓' : 'Gem feedback'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {samletAnalyse.spoendinger && (
            <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="text-lg">Spændingsfelter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="leading-relaxed text-muted-foreground">
                  {samletAnalyse.spoendinger}
                </p>
                
                <div className="space-y-3 rounded-lg border-2 border-dashed border-amber-600/30 bg-amber-100/50 dark:bg-amber-950/50 p-4">
                  <Label className="text-sm font-semibold">Er denne analyse træffende?</Label>
                  <div className="flex gap-3">
                    <Button
                      variant={spaendingerFeedback.agreement === 'agree' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSpaendingerFeedback(prev => ({
                        ...prev,
                        agreement: 'agree',
                        saved: false
                      }))}
                      className="flex items-center gap-2"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Enig
                    </Button>
                    <Button
                      variant={spaendingerFeedback.agreement === 'disagree' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSpaendingerFeedback(prev => ({
                        ...prev,
                        agreement: 'disagree',
                        saved: false
                      }))}
                      className="flex items-center gap-2"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Uenig
                    </Button>
                  </div>
                  
                  {spaendingerFeedback.agreement === 'disagree' && (
                    <div className="space-y-2 pt-2">
                      <Label className="text-sm">Hvad passer ikke?</Label>
                      <Textarea
                        placeholder="Fortæl os, hvad der ikke stemmer overens med din oplevelse..."
                        value={spaendingerFeedback.comment}
                        onChange={(e) => setSpaendingerFeedback(prev => ({
                          ...prev,
                          comment: e.target.value,
                          saved: false
                        }))}
                        className="min-h-[100px]"
                      />
                    </div>
                  )}
                  
                  {spaendingerFeedback.agreement && (
                    <Button
                      onClick={() => {
                        setSpaendingerFeedback(prev => ({ ...prev, saved: true }));
                        // Her ville man gemme feedback til backend
                      }}
                      disabled={spaendingerFeedback.saved || 
                        (spaendingerFeedback.agreement === 'disagree' && !spaendingerFeedback.comment.trim())}
                      size="sm"
                    >
                      {spaendingerFeedback.saved ? 'Gemt ✓' : 'Gem feedback'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
