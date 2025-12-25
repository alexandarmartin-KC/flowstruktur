'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useOnboarding } from '@/contexts/onboarding-context';
import { mockPersonlighedsSpoergsmaal } from '@/lib/mock-data';
import { User, BarChart3 } from 'lucide-react';

export default function PersonprofilPage() {
  const { data: onboardingData } = useOnboarding();
  const [svar, setSvar] = useState<Record<string, number>>({});

  const handleSvar = (id: string, value: number) => {
    setSvar(prev => ({ ...prev, [id]: value }));
  };

  const hasResults = onboardingData.personlighedsResultater.length > 0;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Personlighedsprofil</h1>
        <p className="text-muted-foreground">
          {hasResults ? 'Din arbejdsstil og præferencer' : 'Besvar spørgsmål om din arbejdsstil'}
        </p>
      </div>

      {hasResults ? (
        <>
          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Din profil
              </CardTitle>
              <CardDescription>
                Baseret på dine svar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Struktur vs. Fleksibilitet</span>
                    <Badge variant="secondary">Struktureret</Badge>
                  </div>
                  <Progress value={70} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Du foretrækker klare planer og definerede rammer
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Social energi</span>
                    <Badge variant="secondary">Ekstravert</Badge>
                  </div>
                  <Progress value={75} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Du får energi af at være sammen med andre
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Tempo</span>
                    <Badge variant="secondary">Højt tempo</Badge>
                  </div>
                  <Progress value={80} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Du trives med høj aktivitet og mange opgaver
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Fokus</span>
                    <Badge variant="secondary">Multitasking</Badge>
                  </div>
                  <Progress value={60} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Du kan håndtere flere opgaver samtidig
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Læringsstil</span>
                    <Badge variant="secondary">Eksperimenterende</Badge>
                  </div>
                  <Progress value={85} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Du lærer ved at prøve nye ting
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Din arbejdsstil summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Du er en <strong>struktureret og samarbejdsorienteret</strong> person der trives i dynamiske miljøer. 
                Du får energi af at arbejde med andre, foretrækker klare mål og rammer, og er komfortabel med 
                høj aktivitet og flere projekter samtidig.
              </p>
              
              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-semibold mb-2">💡 Ideelle arbejdsmiljøer for dig:</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Teambaserede projekter med klare deadlines</li>
                  <li>• Roller med høj stakeholder-interaktion</li>
                  <li>• Dynamiske virksomheder i vækst</li>
                  <li>• Positioner med både strategisk og operationelt ansvar</li>
                </ul>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-semibold mb-2">⚠️ Miljøer at være opmærksom på:</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Meget isolerede roller uden teamwork</li>
                  <li>• Ustrukturerede miljøer uden klare processer</li>
                  <li>• Meget langsomt tempo og få udfordringer</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Questionnaire */}
          <Card>
            <CardHeader>
              <CardTitle>Personlighedsspørgsmål</CardTitle>
              <CardDescription>
                Besvar disse spørgsmål for at få din profil. Der er ingen rigtige eller forkerte svar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {mockPersonlighedsSpoergsmaal.map((spg) => (
                <div key={spg.id} className="space-y-3 pb-6 border-b last:border-0">
                  <div>
                    <p className="font-medium mb-1">{spg.spoergsmaal}</p>
                    <p className="text-sm text-muted-foreground">{spg.dimension}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20">Meget uenig</span>
                    <div className="flex gap-2 flex-1 justify-center">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Button
                          key={value}
                          variant={svar[spg.id] === value ? 'default' : 'outline'}
                          size="sm"
                          className="w-12"
                          onClick={() => handleSvar(spg.id, value)}
                        >
                          {value}
                        </Button>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground w-20 text-right">Meget enig</span>
                  </div>
                </div>
              ))}

              <div className="pt-4">
                <Button className="w-full" size="lg" disabled={Object.keys(svar).length < 10}>
                  Gem og se resultater
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  {Object.keys(svar).length} / {mockPersonlighedsSpoergsmaal.length} spørgsmål besvaret
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
