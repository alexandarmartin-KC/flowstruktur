'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePlan } from '@/contexts/plan-context';
import { mockKarrierespor } from '@/lib/mock-data';
import { TrendingUp, ArrowRight, Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function KarrieresporPage() {
  const { isProUser } = usePlan();
  const karrieresporToShow = isProUser ? mockKarrierespor : mockKarrierespor.slice(0, 1);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Karrierespor</h1>
          <p className="text-muted-foreground">
            {isProUser ? 'Op til 5 personlige karrierespor' : '1 karrierespor i Light planen'}
          </p>
        </div>
        {!isProUser && (
          <Badge variant="outline">
            <Lock className="mr-1 h-3 w-3" />
            Lås op med Pro
          </Badge>
        )}
      </div>

      <div className="space-y-6">
        {karrieresporToShow.map((spor, index) => (
          <Card key={spor.id} className="overflow-hidden">
            <CardHeader className="bg-primary/5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-2xl">{spor.titel}</CardTitle>
                    <Badge variant="secondary" className="text-base">
                      {spor.matchScore}% match
                    </Badge>
                  </div>
                  <CardDescription className="text-base">
                    {spor.beskrivelse}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Match visualization */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Match score</span>
                  <span className="text-sm text-muted-foreground">{spor.matchScore}%</span>
                </div>
                <Progress value={spor.matchScore} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Baseret på dine kompetencer, personlighed og interesser
                </p>
              </div>

              {/* Key kompetencer */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Vigtigste kompetencer for rollen
                </h3>
                <div className="flex flex-wrap gap-2">
                  {spor.topKompetencer.map((komp, i) => (
                    <Badge key={i} variant="outline">{komp}</Badge>
                  ))}
                </div>
              </div>

              {/* Grid info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 text-sm">💰 Lønspænd</h4>
                  <p className="text-sm text-muted-foreground">{spor.typiskeLoenSpan}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 text-sm">📈 Vækstpotentiale</h4>
                  <p className="text-sm text-muted-foreground">{spor.vaeekstpotentiale}</p>
                </div>
              </div>

              {/* Beskrivelse */}
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium mb-2">Hvorfor passer dette til dig?</h4>
                <p className="text-sm text-muted-foreground">
                  Dine stærke kompetencer inden for {spor.topKompetencer.slice(0, 2).join(' og ')} kombineret 
                  med din {spor.matchScore > 80 ? 'fremragende' : 'gode'} profil gør dig til en stærk kandidat. 
                  Din arbejdsstil matcher de typiske krav til denne rolle.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button asChild className="flex-1">
                  <Link href="/app/jobmatch">
                    Se relevante jobs
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                {isProUser && (
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/app/plan">Lav action plan</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Locked careers for Light users */}
        {!isProUser && (
          <div className="space-y-4">
            {mockKarrierespor.slice(1, 3).map((spor) => (
              <Card key={spor.id} className="relative overflow-hidden opacity-60">
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium mb-2">Låst i Light planen</p>
                    <Button size="sm" asChild>
                      <Link href="/pris">Opgrader til Pro</Link>
                    </Button>
                  </div>
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{spor.titel}</CardTitle>
                      <CardDescription>{spor.beskrivelse}</CardDescription>
                    </div>
                    <Badge variant="secondary">{spor.matchScore}% match</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {spor.topKompetencer.map((k, i) => (
                      <Badge key={i} variant="outline">{k}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
