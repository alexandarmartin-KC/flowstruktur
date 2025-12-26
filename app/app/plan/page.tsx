'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { usePlan } from '@/contexts/plan-context';
import { mockPlanTemaer } from '@/lib/mock-data';
import { 
  ClipboardList, 
  Target, 
  CheckCircle2,
  Lock,
  ArrowRight,
  Calendar,
  Lightbulb,
} from 'lucide-react';

export default function PlanPage() {
  const router = useRouter();
  const { isProUser } = usePlan();
  const [completedWeeks, setCompletedWeeks] = useState<Record<number, boolean>>({
    1: true, // Week 1 completed by default
  });

  useEffect(() => {
    if (!isProUser) {
      // Allow to view but show upgrade prompts
    }
  }, [isProUser]);

  const toggleWeek = (uge: number) => {
    if (isProUser) {
      setCompletedWeeks(prev => ({ ...prev, [uge]: !prev[uge] }));
    }
  };

  const completedCount = Object.values(completedWeeks).filter(Boolean).length;
  const totalWeeks = mockPlanTemaer.length;
  const progressPercent = (completedCount / totalWeeks) * 100;

  if (!isProUser) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Din 30-dages plan</h1>
          <p className="text-muted-foreground">
            En struktureret vej til din næste karrieremulighed
          </p>
        </div>

        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-8">
            <div className="text-center space-y-4 py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Dette er en PRO feature</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Din personlige 30-dages handlingsplan er kun tilgængelig i PRO. 
                  Få en trin-for-trin guide til at nå dine karrieremål.
                </p>
              </div>
              <div className="bg-card rounded-lg p-6 max-w-md mx-auto text-left border">
                <h3 className="font-semibold mb-3">Med din handlingsplan får du:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>Ugentlige temaer og fokusområder</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>Konkrete handlinger for hver uge</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>Progress tracking</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>Forklaring af hvorfor hvert skridt</span>
                  </li>
                </ul>
              </div>
              <Button size="lg" asChild>
                <Link href="/pris">
                  Se PRO fordele
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <ClipboardList className="h-8 w-8" />
          Din 30-dages plan
        </h1>
        <p className="text-muted-foreground">
          En struktureret vej til din næste karrieremulighed
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Din fremgang</CardTitle>
              <CardDescription>
                {completedCount} af {totalWeeks} uger gennemført
              </CardDescription>
            </div>
            <div className="text-3xl font-bold text-primary">{Math.round(progressPercent)}%</div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercent} className="h-3" />
        </CardContent>
      </Card>

      {/* Target */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">Dit mål: Projektleder</CardTitle>
              <CardDescription className="mt-2">
                Baseret på dit top karrierespor med 87% match
              </CardDescription>
            </div>
            <Badge variant="default" className="text-sm">
              <Calendar className="h-3 w-3 mr-1" />
              4 uger
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Info */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Sådan bruger du planen
              </p>
              <p className="text-blue-800 dark:text-blue-200">
                Dette er en anbefalet rækkefølge, men du bestemmer tempoet. Vigtigst er at du tager ét skridt ad gangen. 
                Markér uger som gennemført, når du har gjort handlingerne.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly plan */}
      <div className="space-y-4">
        {mockPlanTemaer.map((tema) => {
          const isCompleted = completedWeeks[tema.uge];
          const isCurrent = tema.uge === completedCount + 1;

          return (
            <Card 
              key={tema.uge}
              className={`${
                isCompleted ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900' : 
                isCurrent ? 'border-primary' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={isCurrent ? 'default' : 'secondary'}>
                        Uge {tema.uge}
                      </Badge>
                      {isCompleted && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-100">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Gennemført
                        </Badge>
                      )}
                      {isCurrent && !isCompleted && (
                        <Badge variant="outline">Aktuelt</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{tema.tema}</CardTitle>
                    <CardDescription className="mt-2">
                      {tema.beskrivelse}
                    </CardDescription>
                  </div>
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={() => toggleWeek(tema.uge)}
                    className="mt-1"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium mb-2">Handlinger:</p>
                  <ul className="space-y-2">
                    {tema.handlinger.map((handling, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {handling}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Next steps */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>Efter de 4 uger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Når du har gennemført planen, er du klar til at søge jobs aktivt. 
            Du har styrket dine kompetencer, optimeret din profil og bygget et stærkt netværk.
          </p>
          <div className="flex gap-2 pt-2">
            <Button asChild>
              <Link href="/app/job">
                Se relevante jobs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/app/profil">
                Gennemse din profil
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

