'use client';

import Link from 'next/link';
import { ArrowRight, TrendingUp, User, Compass, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockIndsigter, mockProfilStatus } from '@/lib/mock-data';

export default function OverblikPage() {
  const { kompleteret, steps } = mockProfilStatus;

  const naesteSkridt = [
    {
      icon: User,
      titel: 'Gennemse din profil',
      beskrivelse: 'Se dine kompetencer, arbejdsstil og motivation i dybden',
      href: '/app/profil',
      completed: false,
    },
    {
      icon: Compass,
      titel: 'Udforsk karrierespor',
      beskrivelse: 'Se hvilke retninger der passer til din profil',
      href: '/app/muligheder',
      completed: false,
    },
    {
      icon: TrendingUp,
      titel: 'Find relevante jobs',
      beskrivelse: 'Konkrete jobmuligheder der matcher din profil',
      href: '/app/job',
      completed: false,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Velkommen tilbage</h1>
        <p className="text-muted-foreground mt-2">
          Her er dit overblik og forslag til næste skridt
        </p>
      </div>

      {/* Profilstatus */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Din profilstatus</CardTitle>
              <CardDescription>
                {kompleteret === 100 
                  ? 'Din profil er komplet!' 
                  : 'Du er godt på vej – endnu et par trin'}
              </CardDescription>
            </div>
            <div className="text-3xl font-bold text-primary">{kompleteret}%</div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={kompleteret} className="h-3" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 
                className={`h-5 w-5 ${steps.cv ? 'text-green-600' : 'text-muted-foreground'}`} 
              />
              <span className={steps.cv ? 'text-foreground' : 'text-muted-foreground'}>
                CV uploadet
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 
                className={`h-5 w-5 ${steps.kompetencer ? 'text-green-600' : 'text-muted-foreground'}`} 
              />
              <span className={steps.kompetencer ? 'text-foreground' : 'text-muted-foreground'}>
                Kompetencer bekræftet
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 
                className={`h-5 w-5 ${steps.personprofil ? 'text-green-600' : 'text-muted-foreground'}`} 
              />
              <span className={steps.personprofil ? 'text-foreground' : 'text-muted-foreground'}>
                Personprofil udfyldt
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indsigter */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Indsigter fra din profil</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {mockIndsigter.map((indsigt) => (
            <Card key={indsigt.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="capitalize">
                    {indsigt.type}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{indsigt.overskrift}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {indsigt.beskrivelse}
                </p>
                {indsigt.cta && (
                  <Button asChild variant="ghost" className="w-full group">
                    <Link href={indsigt.cta.href}>
                      {indsigt.cta.text}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Næste skridt */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">Hvad foreslår vi som næste skridt?</h2>
        <p className="text-muted-foreground mb-4">
          Disse trin hjælper dig med at komme videre i din karriererejse
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {naesteSkridt.map((skridt, index) => {
            const IconComponent = skridt.icon;
            return (
              <Card key={index} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {index + 1}/3
                    </span>
                  </div>
                  <CardTitle className="text-lg mt-4">{skridt.titel}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {skridt.beskrivelse}
                  </p>
                  <Button asChild className="w-full">
                    <Link href={skridt.href}>
                      Kom i gang
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Info box */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Klar til at tage næste skridt?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Med en PRO-konto får du adgang til din personlige 30-dages handlingsplan, 
                ubegrænset jobmatch og AI-assisteret ansøgningshjælp.
              </p>
              <Button asChild>
                <Link href="/pris">
                  Se PRO fordele
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

