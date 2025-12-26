import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, ArrowRight, Eye, Bookmark, Send } from 'lucide-react';
import {
  mockUserProgress,
  mockSavedJobs,
} from '@/lib/mock-data';

export default function OverblikPage() {
  const progress = mockUserProgress;
  const savedJobs = mockSavedJobs;

  const statusItems = [
    { label: 'CV uploadet', completed: progress.cvUploaded },
    { label: 'Personprofil udfyldt', completed: progress.personProfilCompleted },
    { label: 'Analyse klar', completed: progress.analyseReady },
    { label: 'Muligheder udforsket', completed: progress.mulighederExplored },
  ];

  const seenJobs = savedJobs.filter((j) => j.status === 'seen');
  const savedJobsList = savedJobs.filter((j) => j.status === 'saved');
  const appliedJobs = savedJobs.filter((j) => j.status === 'applied');

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
        <CardHeader>
          <CardTitle>Din status</CardTitle>
          <CardDescription>
            Her kan du se, hvilke trin du har gennemført
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statusItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent/50"
              >
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-muted-foreground" />
                )}
                <span
                  className={
                    item.completed
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground'
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
        {/* Sete jobs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Set</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {seenJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Du har endnu ikke set nogen jobs
              </p>
            ) : (
              <div className="space-y-3">
                {seenJobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-lg border border-border p-3 text-sm"
                  >
                    <p className="font-medium">{job.titel}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.virksomhed}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
                {savedJobsList.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-lg border border-border p-3 text-sm"
                  >
                    <p className="font-medium">{job.titel}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.virksomhed}
                    </p>
                  </div>
                ))}
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
                {appliedJobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-lg border border-border p-3 text-sm"
                  >
                    <p className="font-medium">{job.titel}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.virksomhed}
                    </p>
                  </div>
                ))}
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

