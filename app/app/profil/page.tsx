'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  mockKompetencer, 
  mockPersonlighedsResultater, 
  mockArbejdsstilProfil, 
  mockMotivationsProfil 
} from '@/lib/mock-data';
import { 
  Target, 
  Brain, 
  Clock, 
  Users, 
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Heart,
  Zap,
} from 'lucide-react';

export default function ProfilPage() {
  const [activeTab, setActiveTab] = useState('kompetencer');

  // Group kompetencer by kategori
  const kompetencerByKategori = mockKompetencer.reduce((acc, komp) => {
    if (!acc[komp.kategori]) {
      acc[komp.kategori] = [];
    }
    acc[komp.kategori].push(komp);
    return acc;
  }, {} as Record<string, typeof mockKompetencer>);

  const kategoriLabels = {
    'teknisk': 'Tekniske kompetencer',
    'soft': 'Sociale kompetencer',
    'ledelses': 'Ledelseskompetencer',
    'sprog': 'Sprog',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Min profil</h1>
        <p className="text-muted-foreground mt-2">
          Her er den fulde analyse af dine kompetencer, arbejdsstil og motivation
        </p>
      </div>

      {/* Info box */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Dette er en hypotese om dig
              </p>
              <p className="text-blue-800 dark:text-blue-200">
                Din profil er baseret på dit CV og dine svar. Brug den som udgangspunkt for refleksion – 
                ikke som facit. Kun du ved, hvad der føles rigtigt.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="kompetencer">Kompetencer</TabsTrigger>
          <TabsTrigger value="arbejdsstil">Arbejdsstil</TabsTrigger>
          <TabsTrigger value="motivation">Motivation</TabsTrigger>
          <TabsTrigger value="overfoerbarhed">Overførbarhed</TabsTrigger>
        </TabsList>

        {/* Kompetencer Tab */}
        <TabsContent value="kompetencer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Sådan læser du dine kompetencer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Styrke:</strong> Hvor god du er til det (1-5). 
                Baseret på erfaring og resultater i dit CV.
              </p>
              <p>
                <strong className="text-foreground">Interesse:</strong> Hvor meget du nyder at bruge kompetencen (1-5). 
                Vigtig for langsigtet motivation.
              </p>
              <p className="text-xs pt-2">
                💡 <strong>Tip:</strong> De bedste karrierevalg ligger ofte hvor høj styrke møder høj interesse.
              </p>
            </CardContent>
          </Card>

          {Object.entries(kompetencerByKategori).map(([kategori, kompetencer]) => (
            <Card key={kategori}>
              <CardHeader>
                <CardTitle>{kategoriLabels[kategori as keyof typeof kategoriLabels]}</CardTitle>
                <CardDescription>
                  {kompetencer.length} kompetencer identificeret
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {kompetencer.map((komp) => (
                  <div key={komp.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{komp.navn}</span>
                        {komp.styrke && komp.styrke >= 4 && komp.interesse && komp.interesse >= 4 && (
                          <Badge variant="default" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            Sweet spot
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Styrke</span>
                          <span className="font-medium">{komp.styrke}/5</span>
                        </div>
                        <Progress value={(komp.styrke || 0) * 20} className="h-2" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Interesse</span>
                          <span className="font-medium">{komp.interesse}/5</span>
                        </div>
                        <Progress value={(komp.interesse || 0) * 20} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Krydsindsigt */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Krydsindsigt: Styrke vs. dræn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">✅ Energigivende kompetencer (høj styrke + høj interesse)</h4>
                <div className="flex flex-wrap gap-2">
                  {mockKompetencer
                    .filter(k => (k.styrke || 0) >= 4 && (k.interesse || 0) >= 4)
                    .map(k => (
                      <Badge key={k.id} variant="default">
                        {k.navn}
                      </Badge>
                    ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">⚠️ Potentielle drænere (høj styrke + lav interesse)</h4>
                <div className="flex flex-wrap gap-2">
                  {mockKompetencer
                    .filter(k => (k.styrke || 0) >= 4 && (k.interesse || 0) <= 2)
                    .map(k => (
                      <Badge key={k.id} variant="secondary">
                        {k.navn}
                      </Badge>
                    ))}
                  {mockKompetencer.filter(k => (k.styrke || 0) >= 4 && (k.interesse || 0) <= 2).length === 0 && (
                    <span className="text-sm text-muted-foreground">Ingen identificeret – det er godt!</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Kompetencer du er god til, men ikke nyder. Overvej roller hvor disse ikke er i fokus.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Arbejdsstil Tab */}
        <TabsContent value="arbejdsstil" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Din arbejdsstil
              </CardTitle>
              <CardDescription>
                Baseret på dine personlighedssvar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Tempo</span>
                    </div>
                    <span className="text-sm font-medium">{mockArbejdsstilProfil.tempo.score}/5</span>
                  </div>
                  <Progress value={mockArbejdsstilProfil.tempo.score * 20} className="h-2 mb-2" />
                  <p className="text-sm text-muted-foreground">{mockArbejdsstilProfil.tempo.label}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Struktur</span>
                    </div>
                    <span className="text-sm font-medium">{mockArbejdsstilProfil.struktur.score}/5</span>
                  </div>
                  <Progress value={mockArbejdsstilProfil.struktur.score * 20} className="h-2 mb-2" />
                  <p className="text-sm text-muted-foreground">{mockArbejdsstilProfil.struktur.label}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Social energi</span>
                    </div>
                    <span className="text-sm font-medium">{mockArbejdsstilProfil.socialEnergi.score}/5</span>
                  </div>
                  <Progress value={mockArbejdsstilProfil.socialEnergi.score * 20} className="h-2 mb-2" />
                  <p className="text-sm text-muted-foreground">{mockArbejdsstilProfil.socialEnergi.label}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Fokus</span>
                    </div>
                    <span className="text-sm font-medium">{mockArbejdsstilProfil.fokus.score}/5</span>
                  </div>
                  <Progress value={mockArbejdsstilProfil.fokus.score * 20} className="h-2 mb-2" />
                  <p className="text-sm text-muted-foreground">{mockArbejdsstilProfil.fokus.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hvad betyder det for dig?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockPersonlighedsResultater.map((resultat) => (
                <div key={resultat.dimension} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">{resultat.score}/5</Badge>
                    <div>
                      <h4 className="font-semibold text-sm">{resultat.dimension}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{resultat.interpretation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Motivation Tab */}
        <TabsContent value="motivation" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Dine drivere
                </CardTitle>
                <CardDescription>
                  Hvad giver dig energi og motivation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {mockMotivationsProfil.drivere.map((driver, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Zap className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm">{driver}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Dine drænere
                </CardTitle>
                <CardDescription>
                  Hvad tapper dig for energi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {mockMotivationsProfil.draenere.map((draener, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                      <span className="text-sm">{draener}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Dit ideelle arbejdsmiljø
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {mockMotivationsProfil.arbejdsmiljoePraeeferencer.map((pref, index) => (
                  <Badge key={index} variant="secondary">
                    {pref}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                💡 <strong>Brug dette aktivt:</strong> Når du vurderer jobmuligheder, 
                sammenlign med disse præferencer. De er vigtige for din trivsel på lang sigt.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overførbarhed Tab */}
        <TabsContent value="overfoerbarhed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sådan forstår du overførbarhed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Høj overførbarhed:</strong> Kompetencen er værdifuld på tværs af brancher og roller. 
                Eksempler: Kommunikation, Projektledelse, Dataanalyse.
              </p>
              <p>
                <strong className="text-foreground">Medium overførbarhed:</strong> Kompetencen er relevant i flere kontekster, 
                men kræver måske tilpasning. Eksempler: SQL, Agile/Scrum.
              </p>
              <p>
                <strong className="text-foreground">Lav overførbarhed:</strong> Kompetencen er specifik for en branche eller teknologi. 
                Værdifuld i den kontekst, men mindre bred anvendelighed.
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  <Badge variant="default" className="mb-2">Høj</Badge>
                </CardTitle>
                <CardDescription>Bred anvendelighed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockKompetencer
                    .filter(k => k.overfoerbarhed === 'hoej')
                    .map(k => (
                      <div key={k.id} className="text-sm">
                        {k.navn}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  <Badge variant="secondary" className="mb-2">Medium</Badge>
                </CardTitle>
                <CardDescription>Kontekst-afhængig</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockKompetencer
                    .filter(k => k.overfoerbarhed === 'medium')
                    .map(k => (
                      <div key={k.id} className="text-sm">
                        {k.navn}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  <Badge variant="outline" className="mb-2">Lav</Badge>
                </CardTitle>
                <CardDescription>Specialiseret</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockKompetencer
                    .filter(k => k.overfoerbarhed === 'lav')
                    .map(k => (
                      <div key={k.id} className="text-sm">
                        {k.navn}
                      </div>
                    ))}
                  {mockKompetencer.filter(k => k.overfoerbarhed === 'lav').length === 0 && (
                    <span className="text-sm text-muted-foreground">Ingen identificeret</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Strategi for karriereskift</p>
                  <p className="text-muted-foreground">
                    Fokuser på dine kompetencer med høj overførbarhed når du søger nye roller. 
                    De gør det nemmere at skifte branche eller retning, fordi arbejdsgivere 
                    nemt kan se værdien.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
