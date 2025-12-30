'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2, Info, Check, Pencil, X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useSavedJobs } from '@/contexts/saved-jobs-context';

interface CVSection {
  id: string;
  name: string;
  originalText: string;
  suggestedText: string;
  matchNote: string;
  status: 'pending' | 'approved' | 'editing' | 'rejected';
  editedText?: string;
}

export default function CVTilpasningPage() {
  const params = useParams();
  const router = useRouter();
  const { savedJobs, updateJobStatus } = useSavedJobs();
  const jobId = params.jobId as string;
  
  const job = savedJobs.find((j) => j.id === jobId);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>('');
  const [sections, setSections] = useState<CVSection[]>([]);
  const [uncoveredRequirements, setUncoveredRequirements] = useState<string[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    if (job && sections.length === 0 && !isAnalyzing) {
      handleAnalyzeCv();
    }
  }, [job]);

  const handleAnalyzeCv = async () => {
    if (!job) return;

    setIsAnalyzing(true);
    setError('');

    try {
      // Get data from localStorage or use mock data
      let cvAnalysisData = localStorage.getItem('flowstruktur_cv_analysis');
      let personalityData = localStorage.getItem('flowstruktur_personality_data');
      let combinedAnalysis = localStorage.getItem('flowstruktur_combined_analysis');
      let originalCv = localStorage.getItem('flowstruktur_original_cv');

      // If data is missing, use mock data (for development/testing)
      if (!cvAnalysisData || !personalityData || !combinedAnalysis) {
        const { mockCVInterpretation, mockPersonProfilAnalyse, mockSamletAnalyse } = await import('@/lib/mock-data');
        
        cvAnalysisData = cvAnalysisData || JSON.stringify(mockCVInterpretation);
        personalityData = personalityData || JSON.stringify({
          responses: [3, 4, 3, 3, 4, 4, 4, 3, 4, 3],
          arbejdsstil: mockPersonProfilAnalyse.arbejdsstil,
          motivation: mockPersonProfilAnalyse.motivation,
          draenere: mockPersonProfilAnalyse.draenere,
          samarbejde: mockPersonProfilAnalyse.samarbejde,
        });
        combinedAnalysis = combinedAnalysis || JSON.stringify(mockSamletAnalyse);
      }

      // Use mock original CV for development if not available
      if (!originalCv) {
        originalCv = `PROFIL
Erfaren projektkoordinator med 8+ års erfaring inden for koordinering af tværfaglige projekter og stakeholder management. Stærk til at skabe overblik, facilitere samarbejde og sikre fremdrift i komplekse forløb.

ERFARING

Projektkoordinator | Novo Nordisk | 2020 - nu
• Koordinerer tværfaglige projekter mellem R&D, produktion og kvalitet
• Faciliterer ugentlige statusmøder med 15+ stakeholders
• Udarbejder projektrapporter til ledelsen
• Implementeret nyt projektstyringsværktøj (Jira)

Senior Koordinator | Danske Bank | 2017 - 2020
• Koordinerede compliance-projekter på tværs af afdelinger
• Ansvarlig for dokumentation og procesoptimering
• Trænede nye medarbejdere i interne systemer

Administrativ Koordinator | Ørsted | 2014 - 2017
• Understøttede projektledere med planlægning og opfølgning
• Håndterede mødekoordinering og rejseplanlægning
• Vedligeholdt SharePoint-site med projektdokumentation

UDDANNELSE
Cand.merc. i Strategi og Organisation | CBS | 2014
Bachelor i Erhvervsøkonomi | CBS | 2012

KOMPETENCER
• Projektkoordinering og -styring
• Stakeholder management
• Facilitering af møder og workshops
• MS Office, Jira, SharePoint
• Dansk (modersmål), Engelsk (flydende)`;
      }

      const response = await fetch('/api/cv-tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: job.description || job.fullData?.description || job.title,
          cvAnalysis: cvAnalysisData,
          personalityData: JSON.parse(personalityData),
          combinedAnalysis,
          originalCv,
          mode: 'sections',
        }),
      });

      if (!response.ok) {
        throw new Error('Kunne ikke analysere CV i forhold til jobbet');
      }

      const data = await response.json();
      
      if (data.sections) {
        setSections(data.sections);
        setUncoveredRequirements(data.uncoveredRequirements || []);
      } else {
        // Fallback: use mock sections for development
        const mockSections: CVSection[] = [
          {
            id: 'profil',
            name: 'Profil',
            originalText: 'Erfaren projektkoordinator med 8+ års erfaring inden for koordinering af tværfaglige projekter og stakeholder management. Stærk til at skabe overblik, facilitere samarbejde og sikre fremdrift i komplekse forløb.',
            suggestedText: 'Erfaren projektkoordinator med 8+ års erfaring inden for koordinering af tværfaglige projekter, stakeholder management og digital transformation. Dokumenteret evne til at skabe overblik og sikre fremdrift i komplekse forløb.',
            matchNote: 'Profilens fokus på koordinering og stakeholder management relaterer til jobbets krav om tværfaglig koordinering.',
            status: 'pending',
          },
          {
            id: 'erfaring-novo-nordisk',
            name: 'Erfaring: Novo Nordisk',
            originalText: 'Projektkoordinator | 2020 - nu\n• Koordinerer tværfaglige projekter mellem R&D, produktion og kvalitet\n• Faciliterer ugentlige statusmøder med 15+ stakeholders\n• Udarbejder projektrapporter til ledelsen\n• Implementeret nyt projektstyringsværktøj (Jira)',
            suggestedText: 'Projektkoordinator | 2020 - nu\n• Koordinerer tværfaglige projekter mellem R&D, produktion og kvalitet med fokus på digital understøttelse\n• Faciliterer ugentlige statusmøder med 15+ stakeholders på tværs af organisationen\n• Udarbejder projektrapporter og beslutningsoplæg til ledelsen\n• Implementeret nyt projektstyringsværktøj (Jira) – fra behovsanalyse til udrulning',
            matchNote: 'Erfaringen med tværfaglig koordinering og Jira-implementering er direkte relevant for jobbet.',
            status: 'pending',
          },
          {
            id: 'erfaring-danske-bank',
            name: 'Erfaring: Danske Bank',
            originalText: 'Senior Koordinator | 2017 - 2020\n• Koordinerede compliance-projekter på tværs af afdelinger\n• Ansvarlig for dokumentation og procesoptimering\n• Trænede nye medarbejdere i interne systemer',
            suggestedText: 'Senior Koordinator | 2017 - 2020\n• Koordinerede compliance-projekter på tværs af afdelinger i reguleret miljø\n• Drev procesoptimering med fokus på effektivisering af arbejdsgange\n• Trænede og onboardede nye medarbejdere i systemer og processer',
            matchNote: 'Compliance-erfaring og procesoptimering kan være relevant afhængigt af jobbets kontekst.',
            status: 'pending',
          },
          {
            id: 'erfaring-orsted',
            name: 'Erfaring: Ørsted',
            originalText: 'Administrativ Koordinator | 2014 - 2017\n• Understøttede projektledere med planlægning og opfølgning\n• Håndterede mødekoordinering og rejseplanlægning\n• Vedligeholdt SharePoint-site med projektdokumentation',
            suggestedText: 'Administrativ Koordinator | 2014 - 2017\n• Understøttede projektledere med planlægning og opfølgning\n• Håndterede mødekoordinering og rejseplanlægning\n• Vedligeholdt SharePoint-site med projektdokumentation',
            matchNote: 'Tidlig erfaring med projektunderstøttelse. Mindre direkte relevant, men viser progression.',
            status: 'pending',
          },
          {
            id: 'kompetencer',
            name: 'Kompetencer',
            originalText: '• Projektkoordinering og -styring\n• Stakeholder management\n• Facilitering af møder og workshops\n• MS Office, Jira, SharePoint\n• Dansk (modersmål), Engelsk (flydende)',
            suggestedText: '• Projektkoordinering og -styring\n• Stakeholder management og kommunikation\n• Facilitering af møder, workshops og beslutningsprocesser\n• Digital projektledelse: Jira, SharePoint, MS Office\n• Dansk (modersmål), Engelsk (flydende)',
            matchNote: 'Kompetencer omstruktureret for bedre læsbarhed. Ingen nye kompetencer tilføjet.',
            status: 'pending',
          },
          {
            id: 'uddannelse',
            name: 'Uddannelse',
            originalText: 'Cand.merc. i Strategi og Organisation | CBS | 2014\nBachelor i Erhvervsøkonomi | CBS | 2012',
            suggestedText: 'Cand.merc. i Strategi og Organisation | CBS | 2014\nBachelor i Erhvervsøkonomi | CBS | 2012',
            matchNote: 'Uddannelse er relevant baggrund. Ingen ændringer foreslået.',
            status: 'pending',
          },
        ];
        setSections(mockSections);
        setUncoveredRequirements([
          'Erfaring med budgetansvar er ikke dokumenteret i CV\'et',
          'Specifik erfaring med agile metoder (Scrum/SAFe) fremgår ikke tydeligt',
          'Direkte ledelseserfaring med personaleansvar er ikke dokumenteret',
        ]);
      }
      
      // Update job status
      updateJobStatus(job.id, 'IN_PROGRESS');
    } catch (err: any) {
      setError(err.message || 'Der opstod en fejl ved CV-analysen');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApproveSection = (sectionId: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, status: 'approved' as const } : s
    ));
  };

  const handleEditSection = (sectionId: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, status: 'editing' as const, editedText: s.suggestedText } : s
    ));
    setExpandedSection(sectionId);
  };

  const handleSaveEdit = (sectionId: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, status: 'approved' as const, suggestedText: s.editedText || s.suggestedText } : s
    ));
  };

  const handleRejectSection = (sectionId: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, status: 'rejected' as const } : s
    ));
  };

  const handleUseOriginal = (sectionId: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, status: 'approved' as const, suggestedText: s.originalText } : s
    ));
  };

  const handleUpdateEditText = (sectionId: string, text: string) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId ? { ...s, editedText: text } : s
    ));
  };

  const allSectionsHandled = sections.length > 0 && sections.every(s => s.status === 'approved' || s.status === 'rejected');
  const approvedSectionsCount = sections.filter(s => s.status === 'approved').length;

  const getFinalCV = () => {
    return sections
      .filter(s => s.status === 'approved')
      .map(s => `${s.name.toUpperCase()}\n${s.suggestedText}`)
      .join('\n\n');
  };

  const handleContinueToApplication = () => {
    // Store the tailored CV for use in application
    const finalCV = getFinalCV();
    localStorage.setItem('flowstruktur_tailored_cv', finalCV);
    router.push(`/app/job/${jobId}/ansøgning`);
  };

  if (!job) return null;

  return (
    <div className="space-y-8">
      {/* Explanatory text */}
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5" />
            Sådan arbejder du videre med dette job
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Når du arbejder videre med et job, sker det i to trin.
            Først ser vi på dit CV i forhold til jobbet – hvad der matcher, og hvad der mangler.
            Derefter kan du vælge at skrive en ansøgning, hvor du formidler din erfaring målrettet jobbet.
          </p>
          <p className="text-sm text-muted-foreground italic">
            Du binder dig ikke til at ansøge ved at starte med CV-tilpasning.
            Formålet er at skabe overblik, før du beslutter dig.
          </p>
        </CardContent>
      </Card>

      {/* Loading state */}
      {isAnalyzing && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Analyserer dit CV i forhold til jobbet...</p>
              <p className="text-xs text-muted-foreground mt-2">Vi gennemgår hver sektion og foreslår tilpasninger</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Section by section review */}
      {sections.length > 0 && !isAnalyzing && (
        <>
          {/* Progress indicator */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Gennemgå CV-sektioner</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Godkend, rediger eller afvis hver sektion
              </p>
            </div>
            <Badge variant="outline" className="text-sm">
              {approvedSectionsCount} af {sections.length} godkendt
            </Badge>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {sections.map((section) => (
              <Card 
                key={section.id} 
                className={`transition-all ${
                  section.status === 'approved' ? 'border-green-300 bg-green-50/30 dark:border-green-800 dark:bg-green-950/20' :
                  section.status === 'rejected' ? 'border-red-300 bg-red-50/30 dark:border-red-800 dark:bg-red-950/20' :
                  section.status === 'editing' ? 'border-blue-300 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-950/20' :
                  ''
                }`}
              >
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{section.name}</CardTitle>
                      {section.status === 'approved' && (
                        <Badge className="bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Godkendt
                        </Badge>
                      )}
                      {section.status === 'rejected' && (
                        <Badge variant="destructive">
                          <X className="h-3 w-3 mr-1" />
                          Afvist
                        </Badge>
                      )}
                      {section.status === 'editing' && (
                        <Badge className="bg-blue-600">
                          <Pencil className="h-3 w-3 mr-1" />
                          Redigerer
                        </Badge>
                      )}
                    </div>
                    {expandedSection === section.id ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>

                {expandedSection === section.id && (
                  <CardContent className="space-y-4">
                    {/* Match note */}
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Match i forhold til job:</strong> {section.matchNote}
                      </p>
                    </div>

                    {section.status === 'editing' ? (
                      /* Editing mode */
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Rediger tekst:</label>
                          <Textarea
                            value={section.editedText || section.suggestedText}
                            onChange={(e) => handleUpdateEditText(section.id, e.target.value)}
                            className="min-h-[150px] font-mono text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSaveEdit(section.id)}>
                            <Check className="h-4 w-4 mr-1" />
                            Gem ændringer
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSections(prev => prev.map(s => 
                              s.id === section.id ? { ...s, status: 'pending' as const } : s
                            ))}
                          >
                            Annuller
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* View mode */
                      <>
                        {/* Original vs Suggested comparison */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Original tekst:</h4>
                            <div className="p-3 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap">
                              {section.originalText}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Foreslået tekst:</h4>
                            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm whitespace-pre-wrap">
                              {section.suggestedText}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        {section.status === 'pending' && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t">
                            <Button size="sm" onClick={() => handleApproveSection(section.id)}>
                              <Check className="h-4 w-4 mr-1" />
                              Godkend forslag
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEditSection(section.id)}>
                              <Pencil className="h-4 w-4 mr-1" />
                              Rediger
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleUseOriginal(section.id)}>
                              Behold original
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleRejectSection(section.id)}>
                              <X className="h-4 w-4 mr-1" />
                              Udelad sektion
                            </Button>
                          </div>
                        )}

                        {(section.status === 'approved' || section.status === 'rejected') && (
                          <div className="flex gap-2 pt-2 border-t">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSections(prev => prev.map(s => 
                                s.id === section.id ? { ...s, status: 'pending' as const } : s
                              ))}
                            >
                              Gennemgå igen
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {/* Uncovered requirements */}
          {uncoveredRequirements.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  Ikke dækkede krav i jobopslaget
                </CardTitle>
                <CardDescription>
                  Disse krav fra jobopslaget er ikke tydeligt dokumenteret i dit CV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {uncoveredRequirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-amber-600 mt-0.5">•</span>
                      {req}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground mt-4 pt-4 border-t italic">
                  Disse mangler er ikke forsøgt skjult og kan, hvis relevant, italesættes i ansøgningen.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Final note and CTA */}
          <Card className={`${allSectionsHandled ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20' : 'border-primary/20 bg-primary/5'}`}>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  {allSectionsHandled ? (
                    <>
                      <h3 className="font-semibold mb-1 flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        CV-tilpasning færdig
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Dette CV er baseret på din dokumenterede erfaring.<br />
                        Eventuelle mangler er ikke forsøgt skjult og kan, hvis relevant, italesættes i ansøgningen.
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="font-semibold mb-1">Gennemgå alle sektioner</h3>
                      <p className="text-sm text-muted-foreground">
                        Godkend eller rediger de resterende {sections.length - approvedSectionsCount - sections.filter(s => s.status === 'rejected').length} sektioner for at fortsætte.
                      </p>
                    </>
                  )}
                </div>
                <Button 
                  onClick={handleContinueToApplication}
                  disabled={!allSectionsHandled}
                >
                  Fortsæt til ansøgning
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
