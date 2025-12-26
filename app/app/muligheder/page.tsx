'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockKarrierespor } from '@/lib/mock-data';
import { usePlan } from '@/contexts/plan-context';
import { 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  Lock,
  DollarSign,
  Target,
  Lightbulb,
  Compass,
} from 'lucide-react';

export default function MuligHederPage() {
  const { isProUser } = usePlan();
  const [selectedSpor, setSelectedSpor] = useState<string | null>(null);

  // Light users see only 1 spor, PRO users see all
  const sporerToShow = isProUser ? mockKarrierespor : mockKarrierespor.slice(0, 1);
  const lockedSporer = isProUser ? [] : mockKarrierespor.slice(1);

  const selected = selectedSpor ? mockKarrierespor.find(s => s.id === selectedSpor) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dine karrieremuligheder</h1>
        <p className="text-muted-foreground mt-2">
          Baseret på din profil har vi identificeret {mockKarrierespor.length} karrierespor der passer til dig
        </p>
      </div>

      {/* Pro limitation notice */}
      {!isProUser && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Lock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Light plan: 1 karrierespor</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Opgrader til PRO for at se alle {mockKarrierespor.length} karrierespor der matcher din profil, 
                  inklusive detaljerede handlingsplaner og næste skridt.
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

      {/* Karrierespor Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: List of spor */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Karrierespor for dig</h2>
          
          {sporerToShow.map((spor) => (
            <Card 
              key={spor.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedSpor === spor.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedSpor(spor.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{spor.titel}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {spor.beskrivelse}
                    </CardDescription>
                  </div>
                  <Badge variant="default" className="ml-2">
                    {spor.matchScore}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Match score</span>
                    <span className="font-medium">{spor.matchScore}%</span>
                  </div>
                  <Progress value={spor.matchScore} className="h-2" />
                </div>
                <Button 
                  variant={selectedSpor === spor.id ? "default" : "ghost"} 
                  size="sm" 
                  className="w-full mt-4"
                >
                  {selectedSpor === spor.id ? 'Valgt' : 'Se detaljer'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}

          {/* Locked sporer */}
          {lockedSporer.map((spor) => (
            <Card 
              key={spor.id}
              className="opacity-60 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="text-center">
                  <Lock className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-semibold">PRO feature</p>
                </div>
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{spor.titel}</CardTitle>
                    <CardDescription className="mt-1">
                      {spor.beskrivelse}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{spor.matchScore}%</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Progress value={spor.matchScore} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right: Detail view */}
        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          {selected ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle>{selected.titel}</CardTitle>
                    <Badge variant="default" className="text-lg px-3 py-1">
                      {selected.matchScore}%
                    </Badge>
                  </div>
                  <CardDescription className="text-base mt-2">
                    {selected.beskrivelse}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Top kompetencer for rollen
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selected.topKompetencer.map((komp, i) => (
                        <Badge key={i} variant="secondary">{komp}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Vækstpotentiale</p>
                      <p className="text-sm flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        {selected.vaeekstpotentiale}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Lønspænd</p>
                      <p className="text-sm flex items-start gap-2">
                        <DollarSign className="h-4 w-4 shrink-0 mt-0.5" />
                        {selected.typiskeLoenSpan}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Hvorfor matcher det dig?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {selected.hvorforMatch.map((match, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        {match}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Potentielle udfordringer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {selected.udfordringer.map((udfordring, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                        {udfordring}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {selected.naesteSkridt && selected.naesteSkridt.length > 0 && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      Anbefalede næste skridt
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selected.naesteSkridt.map((skridt, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          {skridt}
                        </li>
                      ))}
                    </ul>
                    {isProUser && (
                      <Button asChild className="w-full mt-4">
                        <Link href="/app/plan">
                          Lav en handlingsplan
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              <Button asChild variant="outline" className="w-full">
                <Link href="/app/job">
                  Se relevante jobs for {selected.titel}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground py-12">
                  <Compass className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Vælg et karrierespor for at se detaljer</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
