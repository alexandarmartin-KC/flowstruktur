'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { mockJobs } from '@/lib/mock-data';
import { usePlan } from '@/contexts/plan-context';
import { 
  Briefcase, 
  MapPin, 
  Building2, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Lock,
  ExternalLink,
  TrendingUp,
  Users,
  Heart,
  Filter,
} from 'lucide-react';

export default function JobPage() {
  const { isProUser } = usePlan();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  // Light users see 5 jobs, PRO users see all
  const jobsToShow = isProUser ? mockJobs : mockJobs.slice(0, 5);
  const lockedJobs = isProUser ? [] : mockJobs.slice(5);

  const selected = selectedJob ? mockJobs.find(j => j.id === selectedJob) : null;

  const remoteLabels = {
    'remote': 'Fuld remote',
    'hybrid': 'Hybrid',
    'onsite': 'På kontoret',
  };

  const senioritetLabels = {
    'junior': 'Junior',
    'medior': 'Medior',
    'senior': 'Senior',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Jobmuligheder for dig</h1>
        <p className="text-muted-foreground mt-2">
          {mockJobs.length} jobs matcher din profil – sorteret efter relevans
        </p>
      </div>

      {/* Pro limitation notice */}
      {!isProUser && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Lock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Light plan: 5 jobs synlige</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Opgrader til PRO for at se alle {mockJobs.length} matchede jobs, 
                  plus avancerede match-analyser og ansøgningshjælp.
                </p>
                <Button asChild size="sm">
                  <Link href="/pris">
                    Se PRO fordele
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {jobsToShow.map((job) => (
          <Card 
            key={job.id}
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
            onClick={() => setSelectedJob(job.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <Badge variant="default" className="text-base px-2 py-1">
                  {job.matchScore}%
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {remoteLabels[job.remote]}
                </Badge>
              </div>
              <CardTitle className="text-lg">{job.titel}</CardTitle>
              <CardDescription className="space-y-1">
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {job.virksomhed}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.lokation}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Match score</span>
                  <span className="font-medium">{job.matchScore}%</span>
                </div>
                <Progress value={job.matchScore} className="h-2" />
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-1">Top match:</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {job.hvorforPasser[0]}
                </p>
              </div>

              <Button variant="outline" size="sm" className="w-full">
                Se detaljer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}

        {/* Locked jobs */}
        {lockedJobs.map((job) => (
          <Card 
            key={job.id}
            className="opacity-60 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="text-center">
                <Lock className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-semibold text-sm">PRO feature</p>
              </div>
            </div>
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <Badge variant="secondary">{job.matchScore}%</Badge>
                <Badge variant="outline">{remoteLabels[job.remote]}</Badge>
              </div>
              <CardTitle className="text-lg">{job.titel}</CardTitle>
              <CardDescription>
                {job.virksomhed} • {job.lokation}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={job.matchScore} className="h-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Job Detail Sheet */}
      <Sheet open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <Badge variant="default" className="text-lg px-3 py-1">
                      {selected.matchScore}% match
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {senioritetLabels[selected.senioritet]}
                    </Badge>
                  </div>
                  <SheetTitle className="text-2xl">{selected.titel}</SheetTitle>
                  <SheetDescription className="text-base space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {selected.virksomhed}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {selected.lokation}
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      {remoteLabels[selected.remote]}
                    </div>
                  </SheetDescription>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Match breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Match analyse</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Kompetence match
                        </span>
                        <span className="font-medium">{selected.kompetenceMatch}%</span>
                      </div>
                      <Progress value={selected.kompetenceMatch} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Arbejdsstil match
                        </span>
                        <span className="font-medium">{selected.arbejdsstilMatch}%</span>
                      </div>
                      <Progress value={selected.arbejdsstilMatch} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="flex items-center gap-2">
                          <Heart className="h-4 w-4" />
                          Motivation match
                        </span>
                        <span className="font-medium">{selected.motivationMatch}%</span>
                      </div>
                      <Progress value={selected.motivationMatch} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Beskrivelse */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Om jobbet</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{selected.beskrivelse}</p>
                  </CardContent>
                </Card>

                {/* Ansvar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Du kommer til at</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selected.ansvarlig.map((ansvar, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          {ansvar}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Hvorfor passer det */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Hvorfor det passer til dig
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selected.hvorforPasser.map((grund, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                          {grund}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Gaps */}
                {selected.gaps.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        Områder at styrke
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {selected.gaps.map((gap, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                            {gap}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-muted-foreground mt-3">
                        💡 Disse gaps behøver ikke at stoppe dig. De kan også være 
                        udviklingsmuligheder i rollen.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Krav */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Krav</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selected.krav.map((krav, i) => (
                        <Badge key={i} variant="secondary">{krav}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="space-y-3 pt-4 border-t">
                  <Button className="w-full" size="lg">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Gå til jobopslag
                  </Button>
                  {isProUser ? (
                    <>
                      <Button variant="outline" className="w-full">
                        Generer ansøgning (PRO)
                      </Button>
                      <Button variant="outline" className="w-full">
                        Tilføj til min plan (PRO)
                      </Button>
                    </>
                  ) : (
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <Lock className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <p className="text-sm font-medium mb-1">PRO features</p>
                          <p className="text-xs text-muted-foreground mb-3">
                            AI-assisteret ansøgning og handlingsplan
                          </p>
                          <Button asChild size="sm" className="w-full">
                            <Link href="/pris">
                              Opgrader til PRO
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
