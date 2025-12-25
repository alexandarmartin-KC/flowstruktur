'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useOnboarding } from '@/contexts/onboarding-context';
import { Target, Users, Repeat, Heart } from 'lucide-react';

export default function OverblikPage() {
  const { data: onboardingData } = useOnboarding();
  const kompetencer = onboardingData.kompetencer;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">360° Overblik</h1>
        <p className="text-muted-foreground">
          Et komplet billede af dine styrker, arbejdsstil og potentiale
        </p>
      </div>

      <Tabs defaultValue="kompetencer" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="kompetencer">Kompetencer</TabsTrigger>
          <TabsTrigger value="arbejdsstil">Arbejdsstil</TabsTrigger>
          <TabsTrigger value="overfoerbarhed">Overførbarhed</TabsTrigger>
          <TabsTrigger value="motivation">Motivation</TabsTrigger>
        </TabsList>

        <TabsContent value="kompetencer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Dine kompetencer
              </CardTitle>
              <CardDescription>
                Baseret på dit CV og dine angivelser
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Kompetence kategorier */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Soft skills</h3>
                    <Badge variant="secondary">
                      {kompetencer.filter(k => k.kategori === 'soft').length} kompetencer
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {kompetencer.filter(k => k.kategori === 'soft').map(k => (
                      <Badge key={k.id} variant="outline">
                        {k.navn}
                        {k.interesse && ' ❤️'}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Tekniske skills</h3>
                    <Badge variant="secondary">
                      {kompetencer.filter(k => k.kategori === 'teknisk').length} kompetencer
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {kompetencer.filter(k => k.kategori === 'teknisk').map(k => (
                      <Badge key={k.id} variant="outline">
                        {k.navn}
                        {k.interesse && ' ❤️'}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Ledelse</h3>
                    <Badge variant="secondary">
                      {kompetencer.filter(k => k.kategori === 'ledelses').length} kompetencer
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {kompetencer.filter(k => k.kategori === 'ledelses').map(k => (
                      <Badge key={k.id} variant="outline">
                        {k.navn}
                        {k.interesse && ' ❤️'}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm">
                  <strong>💡 Indsigt:</strong> Du har en stærk kombination af soft skills og tekniske færdigheder. 
                  Din kommunikationsevne kombineret med dataanalyse gør dig velegnet til roller der kræver både 
                  strategisk tænkning og hands-on execution.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arbejdsstil" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Din arbejdsstil
              </CardTitle>
              <CardDescription>
                Baseret på din personlighedsprofil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Struktur vs. Fleksibilitet</span>
                    <span className="text-sm text-muted-foreground">Struktureret</span>
                  </div>
                  <Progress value={70} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Du foretrækker klare planer og rammer
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Selvstændig vs. Samarbejde</span>
                    <span className="text-sm text-muted-foreground">Samarbejde</span>
                  </div>
                  <Progress value={65} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Du får energi af at arbejde med andre
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Detalje vs. Helhed</span>
                    <span className="text-sm text-muted-foreground">Balanceret</span>
                  </div>
                  <Progress value={50} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Du kan både zoome ind og ud efter behov
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Tempo</span>
                    <span className="text-sm text-muted-foreground">Højt tempo</span>
                  </div>
                  <Progress value={75} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Du trives med dynamik og flere bolde i luften
                  </p>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm">
                  <strong>💡 Indsigt:</strong> Din arbejdsstil passer godt til roller i projektledelse, 
                  operations eller customer success hvor du både kan arbejde struktureret og samarbejde 
                  tæt med andre i et dynamisk miljø.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overfoerbarhed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="h-5 w-5" />
                Overførbare kompetencer
              </CardTitle>
              <CardDescription>
                Skills der er værdifulde på tværs af brancher
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Kommunikation & Stakeholder management</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Efterspurgt i: Projektledelse, Consulting, Customer Success, Sales
                  </p>
                  <Badge variant="secondary">Høj overførbarhed</Badge>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Dataanalyse & Excel</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Efterspurgt i: Business Analyst, Data Analyst, Operations, Finance
                  </p>
                  <Badge variant="secondary">Høj overførbarhed</Badge>
                </div>

                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Projektledelse & Organisering</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Efterspurgt i: Alle brancher med komplekse projekter
                  </p>
                  <Badge variant="secondary">Meget høj overførbarhed</Badge>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm">
                  <strong>💡 Indsigt:</strong> Du har stærke transferable skills der gør dig attraktiv 
                  på tværs af mange forskellige brancher og roller. Dette giver dig fleksibilitet i din karriere.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="motivation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Din motivation
              </CardTitle>
              <CardDescription>
                Hvad driver dig i dit arbejde
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-lg">🎯</span>
                  </div>
                  <div>
                    <p className="font-medium">Målrettet og resultatorienteret</p>
                    <p className="text-sm text-muted-foreground">
                      Du motiveres af at nå konkrete mål og se resultater
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-lg">👥</span>
                  </div>
                  <div>
                    <p className="font-medium">Samarbejde og teamwork</p>
                    <p className="text-sm text-muted-foreground">
                      Du får energi af at arbejde med og hjælpe andre
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-lg">📚</span>
                  </div>
                  <div>
                    <p className="font-medium">Læring og udvikling</p>
                    <p className="text-sm text-muted-foreground">
                      Du søger konstant nye udfordringer og læring
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-lg">💡</span>
                  </div>
                  <div>
                    <p className="font-medium">Impact og mening</p>
                    <p className="text-sm text-muted-foreground">
                      Du vil gerne skabe værdi og se din indflydelse
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm">
                  <strong>💡 Indsigt:</strong> Din motivationsprofil passer godt til roller hvor du kan 
                  arbejde målrettet i teams, have direkte impact og konstant lære nyt. Undgå isolerede 
                  rutineopgaver uden synligt resultat.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
