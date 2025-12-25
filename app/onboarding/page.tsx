'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOnboarding } from '@/contexts/onboarding-context';
import { mockKompetencer, mockPersonlighedsSpoergsmaal, Kompetence, PersonlighedsResultat } from '@/lib/mock-data';
import { 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  Users, 
  Target,
  Upload,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const { updateCVStatus, updateKompetencer, updatePersonlighedsResultater, markCompleted } = useOnboarding();
  
  const [fileName, setFileName] = useState('');
  const [kompetencer, setKompetencer] = useState<Kompetence[]>([]);
  const [personlighedsSvar, setPersonlighedsSvar] = useState<Record<string, number>>({});

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step === 2 && fileName) {
      updateCVStatus(true);
    }
    if (step === 3 && kompetencer.length > 0) {
      updateKompetencer(kompetencer);
    }
    if (step === 4 && Object.keys(personlighedsSvar).length > 0) {
      const resultater: PersonlighedsResultat[] = mockPersonlighedsSpoergsmaal.map(spg => ({
        dimension: spg.dimension,
        score: personlighedsSvar[spg.id] || 3,
        beskrivelse: 'Baseret på dine svar'
      }));
      updatePersonlighedsResultater(resultater);
    }
    
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      markCompleted();
      router.push('/app');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      // Mock: simulate detecting skills
      setTimeout(() => {
        const detectedSkills = mockKompetencer.slice(0, 8).map(k => ({
          ...k,
          niveau: 'erfaren' as const,
          interesse: true
        }));
        setKompetencer(detectedSkills);
      }, 500);
    }
  };

  const toggleKompetenceInteresse = (id: string) => {
    setKompetencer(prev => 
      prev.map(k => k.id === id ? { ...k, interesse: !k.interesse } : k)
    );
  };

  const updateKompetenceNiveau = (id: string, niveau: 'begynder' | 'erfaren' | 'ekspert') => {
    setKompetencer(prev =>
      prev.map(k => k.id === id ? { ...k, niveau } : k)
    );
  };

  const handlePersonlighedsSvar = (id: string, value: number) => {
    setPersonlighedsSvar(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">FlowStruktur</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Byg din profil</h1>
          <p className="text-muted-foreground">Trin {step} af {totalSteps}</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps */}
        <Card>
          <CardContent className="pt-6">
            {/* Step 1: Welcome */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Velkommen til FlowStruktur!</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Vi guider dig gennem en proces der giver dig totalt overblik over dine kompetencer, 
                    arbejdsstil og karrieremuligheder. Det tager cirka 10 minutter.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4 py-6">
                  <div className="text-center space-y-2">
                    <FileText className="h-8 w-8 mx-auto text-primary" />
                    <h3 className="font-semibold">Upload CV</h3>
                    <p className="text-sm text-muted-foreground">Vi identificerer dine kompetencer</p>
                  </div>
                  <div className="text-center space-y-2">
                    <Users className="h-8 w-8 mx-auto text-primary" />
                    <h3 className="font-semibold">Personprofil</h3>
                    <p className="text-sm text-muted-foreground">Besvar få spørgsmål</p>
                  </div>
                  <div className="text-center space-y-2">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-primary" />
                    <h3 className="font-semibold">Få overblik</h3>
                    <p className="text-sm text-muted-foreground">Se dine muligheder</p>
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm">
                    <strong>Hvad du får:</strong> 360° overblik, personlige karrierespor, 
                    jobmatch med analyse, og en action plan (Pro).
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: CV Upload */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Upload dit CV</h2>
                  <p className="text-muted-foreground">
                    Vi analyserer dit CV for at identificere dine kompetencer og erfaringer
                  </p>
                </div>

                <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  {!fileName ? (
                    <>
                      <div>
                        <p className="font-medium mb-2">Vælg en fil eller træk den hertil</p>
                        <p className="text-sm text-muted-foreground">PDF, DOC, DOCX (maks 5MB)</p>
                      </div>
                      <div>
                        <Label htmlFor="cv-upload" className="cursor-pointer">
                          <div className="inline-block">
                            <Button type="button" asChild>
                              <span>Vælg fil</span>
                            </Button>
                          </div>
                          <Input
                            id="cv-upload"
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileUpload}
                          />
                        </Label>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <CheckCircle2 className="h-12 w-12 mx-auto text-primary" />
                      <div>
                        <p className="font-medium text-primary">CV uploadet!</p>
                        <p className="text-sm text-muted-foreground mt-1">{fileName}</p>
                      </div>
                      <div className="bg-muted rounded-lg p-4 text-left">
                        <p className="text-sm font-medium mb-2">Vi har fundet:</p>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          <li>✓ {kompetencer.length} kompetencer</li>
                          <li>✓ Flere års erhvervserfaring</li>
                          <li>✓ Tværfaglig baggrund</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Kompetencer */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Bekræft dine kompetencer</h2>
                  <p className="text-muted-foreground">
                    Vi har identificeret disse kompetencer. Juster niveau og marker dem du brænder for.
                  </p>
                </div>

                <div className="space-y-4">
                  {kompetencer.map((komp) => (
                    <Card key={komp.id} className={komp.interesse ? 'border-primary' : ''}>
                      <CardContent className="pt-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{komp.navn}</h3>
                              <Badge variant="outline">{komp.kategori}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select
                              value={komp.niveau}
                              onValueChange={(value: any) => updateKompetenceNiveau(komp.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="begynder">Begynder</SelectItem>
                                <SelectItem value="erfaren">Erfaren</SelectItem>
                                <SelectItem value="ekspert">Ekspert</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant={komp.interesse ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleKompetenceInteresse(komp.id)}
                            >
                              {komp.interesse ? '❤️ Interesse' : 'Marker'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Personlighedsprofil */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Din arbejdsstil</h2>
                  <p className="text-muted-foreground">
                    Besvar disse spørgsmål så ærligt som muligt. Der er ingen rigtige eller forkerte svar.
                  </p>
                </div>

                <div className="space-y-6">
                  {mockPersonlighedsSpoergsmaal.slice(0, 10).map((spg) => (
                    <div key={spg.id} className="space-y-3">
                      <div>
                        <p className="font-medium">{spg.spoergsmaal}</p>
                        <p className="text-sm text-muted-foreground">{spg.dimension}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground w-24">Uenig</span>
                        <div className="flex gap-2 flex-1 justify-center">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <Button
                              key={value}
                              variant={personlighedsSvar[spg.id] === value ? 'default' : 'outline'}
                              size="sm"
                              className="w-12"
                              onClick={() => handlePersonlighedsSvar(spg.id, value)}
                            >
                              {value}
                            </Button>
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground w-24 text-right">Enig</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Preview */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Din profil er klar!</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Vi har analyseret dine data og er klar til at vise dig dit 360° overblik
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 py-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top kompetencer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {kompetencer.filter(k => k.interesse).slice(0, 6).map(k => (
                          <Badge key={k.id} variant="secondary">{k.navn}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Arbejdsstil</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Struktureret • Samarbejdsorienteret • Målrettet
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Hvad venter dig:
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span>360° overblik over dine styrker og udviklingsområder</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span>Personlige karrierespor baseret på din profil</span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span>Jobmatch med detaljeret analyse af fit og gaps</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Tilbage
              </Button>
              <Button
                onClick={handleNext}
                disabled={
                  (step === 2 && !fileName) ||
                  (step === 3 && kompetencer.length === 0) ||
                  (step === 4 && Object.keys(personlighedsSvar).length < 5)
                }
              >
                {step === totalSteps ? 'Gå til dashboard' : 'Næste'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
