'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { usePlan } from '@/contexts/plan-context';
import { ProGate } from '@/components/pro-gate';
import { 
  ClipboardList, 
  Target, 
  TrendingUp, 
  BookOpen, 
  Users, 
  Briefcase,
  CheckCircle2,
  Lock
} from 'lucide-react';

export default function PlanPage() {
  const router = useRouter();
  const { isProUser } = usePlan();
  const [showProGate, setShowProGate] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isProUser) {
      setShowProGate(true);
    }
  }, [isProUser]);

  const toggleStep = (id: string) => {
    setCompletedSteps(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isProUser) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Action Plan</h1>
          <p className="text-muted-foreground">
            Din personlige vejledning til næste karriereskridt
          </p>
        </div>

        <Card className="border-primary/50">
          <CardContent className="pt-8">
            <div className="text-center space-y-4 py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Pro Feature</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Action Plan er kun tilgængelig i Pro planen. Få en trin-for-trin guide til at nå dine karrieremål.
                </p>
              </div>
              <div className="bg-muted rounded-lg p-6 max-w-md mx-auto text-left">
                <h3 className="font-semibold mb-3">Med Action Plan får du:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>Personlig udviklings-roadmap</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>Konkrete handlinger til hvert karrierespor</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>Netværks- og læringsstrategi</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>Timeline og milepæle</span>
                  </li>
                </ul>
              </div>
              <Button size="lg" onClick={() => router.push('/pris')}>
                Se Pro fordele
              </Button>
            </div>
          </CardContent>
        </Card>

        <ProGate
          isOpen={showProGate}
          onClose={() => router.push('/app')}
          feature="Action Plan"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <ClipboardList className="h-8 w-8" />
          Din Action Plan
        </h1>
        <p className="text-muted-foreground">
          En trin-for-trin guide til dit næste karriereskridt
        </p>
      </div>

      {/* Target role */}
      <Card>
        <CardHeader className="bg-primary/5">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">Dit mål: Projektleder</CardTitle>
              <CardDescription className="mt-2">
                Baseret på dit top karrierespor med 87% match
              </CardDescription>
            </div>
            <Badge variant="secondary">3-6 måneder</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Phase 1: Kompetenceudvikling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Fase 1: Styrk dine kompetencer
          </CardTitle>
          <CardDescription>0-2 måneder</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox
                id="step-1-1"
                checked={completedSteps['1-1']}
                onCheckedChange={() => toggleStep('1-1')}
              />
              <div className="flex-1">
                <label htmlFor="step-1-1" className="font-medium cursor-pointer">
                  Tag en PMI eller PRINCE2 certificering
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  Dette styrker din troværdighed som projektleder. Anbefalet: PMI-CAPM eller PRINCE2 Foundation.
                </p>
                <Badge variant="outline" className="mt-2">
                  Høj prioritet
                </Badge>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox
                id="step-1-2"
                checked={completedSteps['1-2']}
                onCheckedChange={() => toggleStep('1-2')}
              />
              <div className="flex-1">
                <label htmlFor="step-1-2" className="font-medium cursor-pointer">
                  Opgrader dine Agile/Scrum færdigheder
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  Mange projektleder-stillinger kræver Scrum Master erfaring. Overvej Scrum.org certificering.
                </p>
                <Badge variant="outline" className="mt-2">
                  Medium prioritet
                </Badge>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox
                id="step-1-3"
                checked={completedSteps['1-3']}
                onCheckedChange={() => toggleStep('1-3')}
              />
              <div className="flex-1">
                <label htmlFor="step-1-3" className="font-medium cursor-pointer">
                  Lær stakeholder management frameworks
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  Du er allerede stærk her, men formalisér din viden med RACI, stakeholder mapping, etc.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase 2: Netværk */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Fase 2: Udvid dit netværk
          </CardTitle>
          <CardDescription>1-3 måneder</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox
                id="step-2-1"
                checked={completedSteps['2-1']}
                onCheckedChange={() => toggleStep('2-1')}
              />
              <div className="flex-1">
                <label htmlFor="step-2-1" className="font-medium cursor-pointer">
                  Deltag i Project Management meetups
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  Find lokale PMI chapters eller meetup.com grupper i København.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox
                id="step-2-2"
                checked={completedSteps['2-2']}
                onCheckedChange={() => toggleStep('2-2')}
              />
              <div className="flex-1">
                <label htmlFor="step-2-2" className="font-medium cursor-pointer">
                  Kontakt 5 projektledere på LinkedIn
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  Book informational interviews. Spørg om deres karrierevej og råd.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox
                id="step-2-3"
                checked={completedSteps['2-3']}
                onCheckedChange={() => toggleStep('2-3')}
              />
              <div className="flex-1">
                <label htmlFor="step-2-3" className="font-medium cursor-pointer">
                  Opdater LinkedIn profil
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  Fremhæv projekterfaringer, ledelse og resultater. Brug nøgleord fra jobopslag.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase 3: Erfaring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Fase 3: Byg relevant erfaring
          </CardTitle>
          <CardDescription>2-4 måneder</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox
                id="step-3-1"
                checked={completedSteps['3-1']}
                onCheckedChange={() => toggleStep('3-1')}
              />
              <div className="flex-1">
                <label htmlFor="step-3-1" className="font-medium cursor-pointer">
                  Frivilligt projektlederansvar i nuværende rolle
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  Søg muligheder for at lede mindre projekter eller initiativer i din nuværende stilling.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox
                id="step-3-2"
                checked={completedSteps['3-2']}
                onCheckedChange={() => toggleStep('3-2')}
              />
              <div className="flex-1">
                <label htmlFor="step-3-2" className="font-medium cursor-pointer">
                  Byg portfolio med case studies
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  Dokumentér 2-3 projekter du har drevet med fokus på resultater og læring.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase 4: Jobsøgning */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Fase 4: Start jobsøgning
          </CardTitle>
          <CardDescription>3-6 måneder</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox
                id="step-4-1"
                checked={completedSteps['4-1']}
                onCheckedChange={() => toggleStep('4-1')}
              />
              <div className="flex-1">
                <label htmlFor="step-4-1" className="font-medium cursor-pointer">
                  Ansøg til 10 relevante stillinger
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  Fokusér på virksomheder der matcher din profil. Se vores jobmatch for forslag.
                </p>
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <a href="/app/jobmatch">Se jobmatch</a>
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox
                id="step-4-2"
                checked={completedSteps['4-2']}
                onCheckedChange={() => toggleStep('4-2')}
              />
              <div className="flex-1">
                <label htmlFor="step-4-2" className="font-medium cursor-pointer">
                  Forbered til interviews
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  Øv STAR-metoden, projekt-cases og brug din 360° analyse til at tale om styrker.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox
                id="step-4-3"
                checked={completedSteps['4-3']}
                onCheckedChange={() => toggleStep('4-3')}
              />
              <div className="flex-1">
                <label htmlFor="step-4-3" className="font-medium cursor-pointer">
                  Følg op proaktivt
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  Send follow-up efter 1 uge. Vis vedholdenhed og interesse.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Anbefalede ressourcer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium">Certificeringer:</p>
              <ul className="text-muted-foreground ml-4 mt-1 space-y-1">
                <li>• PMI CAPM (Certified Associate in Project Management)</li>
                <li>• PRINCE2 Foundation</li>
                <li>• Scrum.org Professional Scrum Master I</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Bøger:</p>
              <ul className="text-muted-foreground ml-4 mt-1 space-y-1">
                <li>• "Project Management Body of Knowledge" (PMBOK)</li>
                <li>• "The Lean Startup" - Eric Ries</li>
                <li>• "Crucial Conversations" - Kerry Patterson</li>
              </ul>
            </div>
            <div>
              <p className="font-medium">Online:</p>
              <ul className="text-muted-foreground ml-4 mt-1 space-y-1">
                <li>• LinkedIn Learning: Project Management kurser</li>
                <li>• Coursera: Google Project Management Certificate</li>
                <li>• PMI.org: Webinars og resources</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
