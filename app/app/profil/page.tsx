'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, AlertCircle } from 'lucide-react';
import {
  mockCVInterpretation,
  mockPersonProfilQuestions,
  mockPersonProfilAnalyse,
  mockSamletAnalyse,
} from '@/lib/mock-data';

export default function ProfilPage() {
  const [personProfilCompleted, setPersonProfilCompleted] = useState(true);
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
              <CardContent>
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {personAnalyse.arbejdsstil}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hvad motiverer dig</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {personAnalyse.motivation}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hvad dræner dig</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {personAnalyse.draenere}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sådan fungerer du i samarbejde</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {personAnalyse.samarbejde}
                </p>
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
            {samletAnalyse.observationer.map((obs, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{obs.titel}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed text-muted-foreground">{obs.beskrivelse}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {samletAnalyse.spoendinger && (
            <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="text-lg">Spændingsfelter</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-muted-foreground">
                  {samletAnalyse.spoendinger}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
