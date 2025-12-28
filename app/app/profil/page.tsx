'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, AlertCircle, MessageSquarePlus, ThumbsUp, ThumbsDown } from 'lucide-react';
import {
  mockCVInterpretation,
  mockPersonProfilQuestions,
  mockPersonProfilAnalyse,
  mockSamletAnalyse,
} from '@/lib/mock-data';

export default function ProfilPage() {
  const [personProfilCompleted, setPersonProfilCompleted] = useState(true);
  const [cvComments, setCvComments] = useState('');
  const [commentsSaved, setCommentsSaved] = useState(false);
  
  // Feedback state for personality analysis sections
  const [feedbackState, setFeedbackState] = useState<{
    [key: string]: { agreement: 'agree' | 'disagree' | null; comment: string; saved: boolean }
  }>({
    arbejdsstil: { agreement: null, comment: '', saved: false },
    motivation: { agreement: null, comment: '', saved: false },
    draenere: { agreement: null, comment: '', saved: false },
    samarbejde: { agreement: null, comment: '', saved: false },
  });
  
  // Feedback state for combined analysis observations
  const [analyseFeedback, setAnalyseFeedback] = useState<{
    [key: string]: { agreement: 'agree' | 'disagree' | null; comment: string; saved: boolean }
  }>({});
  
  // Initialize feedback state for observations
  const initObservationFeedback = (index: number) => {
    if (!analyseFeedback[`obs_${index}`]) {
      setAnalyseFeedback(prev => ({
        ...prev,
        [`obs_${index}`]: { agreement: null, comment: '', saved: false }
      }));
    }
  };
  
  // Feedback state for spændinger
  const [spaendingerFeedback, setSpaendingerFeedback] = useState<{
    agreement: 'agree' | 'disagree' | null; comment: string; saved: boolean
  }>({ agreement: null, comment: '', saved: false });
  
  const cvData = mockCVInterpretation;
  const questions = mockPersonProfilQuestions;
  const personAnalyse = mockPersonProfilAnalyse;
  const samletAnalyse = mockSamletAnalyse;

  return (
    <div className="mx-auto max-w-4xl space-y-12 py-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Min profil</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          En dybere forståelse af, hvordan din erfaring og dine præferencer hænger sammen
        </p>
      </div>

      {/* SEKTION 1: CV-fortolkning */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">CV-fortolkning</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Baseret på dit CV har vi forsøgt at forstå, hvilken type erfaring du har opbygget.
          </p>
        </div>

        {/* Upload komponent (mock) */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between rounded-lg border-2 border-dashed border-border bg-accent/20 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">CV_2024.pdf</p>
                  <p className="text-sm text-muted-foreground">Uploadet 15. december 2024</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Udskift
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Fortolkning */}
        <Card>
          <CardHeader>
            <CardTitle>Sådan læser vi dit CV</CardTitle>
          </CardHeader>
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
