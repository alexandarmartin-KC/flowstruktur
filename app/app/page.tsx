'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, ArrowRight, Bookmark, Send, FileText } from 'lucide-react';
import { useSavedJobs } from '@/contexts/saved-jobs-context';
import {
  mockUserProgress,
} from '@/lib/mock-data';

export default function OverblikPage() {
  const progress = mockUserProgress;
  const { savedJobs } = useSavedJobs();

  const statusItems = [
    { label: 'CV uploadet', completed: progress.cvUploaded },
    { label: 'Personprofil udfyldt', completed: progress.personProfilCompleted },
    { label: 'Analyse klar', completed: progress.analyseReady },
    { label: 'Muligheder udforsket', completed: progress.mulighederExplored },
  ];

  const savedJobsList = savedJobs.filter((j) => j.jobStatus === 'SAVED');
  const inProgressJobs = savedJobs.filter((j) => j.jobStatus === 'IN_PROGRESS');
  const appliedJobs = savedJobs.filter((j) => j.jobStatus === 'APPLIED');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overblik</h1>
        <p className="mt-2 text-muted-foreground">
          Denne side giver dig overblik over, hvor du er i processen.
        </p>
      </div>

      {/* Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Din status</CardTitle>
          <CardDescription>
            Her kan du se, hvilke trin du har gennemført
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {statusItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-accent/50"
              >
                {item.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span
                  className={
                    item.completed
                      ? 'font-medium text-foreground text-sm whitespace-nowrap'
                      : 'text-muted-foreground text-sm whitespace-nowrap'
                  }
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Jobs oversigt */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Gemte jobs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Gemt</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {savedJobsList.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Du har endnu ikke gemt nogen jobs
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-2xl font-bold">{savedJobsList.length}</p>
                <p className="text-xs text-muted-foreground">
                  {savedJobsList.length === 1 ? 'gemt job' : 'gemte jobs'}
                </p>
                <Link href="/app/gemte-jobs">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Se alle
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Under arbejde */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Under arbejde</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {inProgressJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ingen jobs under arbejde endnu
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-2xl font-bold">{inProgressJobs.length}</p>
                <p className="text-xs text-muted-foreground">
                  {inProgressJobs.length === 1 ? 'job under arbejde' : 'jobs under arbejde'}
                </p>
                <Link href="/app/gemte-jobs">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Se alle
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ansøgt */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Ansøgt</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {appliedJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Du har endnu ikke ansøgt nogen jobs
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-2xl font-bold">{appliedJobs.length}</p>
                <p className="text-xs text-muted-foreground">
                  {appliedJobs.length === 1 ? 'ansøgt job' : 'ansøgte jobs'}
                </p>
                <Link href="/app/gemte-jobs">
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Se alle
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Næste skridt */}
      <Card>
        <CardHeader>
          <CardTitle>Næste skridt</CardTitle>
          <CardDescription>
            Fortsæt din rejse gennem værktøjet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/app/profil">
            <Button className="w-full justify-between" variant="outline">
              Se din profil
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/app/muligheder">
            <Button className="w-full justify-between" variant="outline">
              Udforsk muligheder
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

