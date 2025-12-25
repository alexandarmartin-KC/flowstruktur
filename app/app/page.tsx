'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePlan } from '@/contexts/plan-context';
import { useOnboarding } from '@/contexts/onboarding-context';
import { ProGate } from '@/components/pro-gate';
import { mockKarrierespor, mockJobs } from '@/lib/mock-data';
import {
  Target,
  TrendingUp,
  Briefcase,
  ArrowRight,
  Sparkles,
  FileText,
  User,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { isProUser } = usePlan();
  const { data: onboardingData } = useOnboarding();
  const [showProGate, setShowProGate] = useState(false);
  const [gateFeature, setGateFeature] = useState('');

  const handleProFeatureClick = (feature: string) => {
    if (!isProUser) {
      setGateFeature(feature);
      setShowProGate(true);
      return false;
    }
    return true;
  };

  // Calculate profile completion
  const profileCompletion = () => {
    let score = 0;
    if (onboardingData.cvUploaded) score += 33;
    if (onboardingData.kompetencer.length > 0) score += 33;
    if (onboardingData.personlighedsResultater.length > 0) score += 34;
    return score;
  };

  const completion = profileCompletion();
  const isComplete = completion === 100;

  // Get relevant data
  const karrieresporToShow = isProUser ? mockKarrierespor : mockKarrierespor.slice(0, 1);
  const jobsToShow = isProUser ? mockJobs.slice(0, 12) : mockJobs.slice(0, 5);
  const topKompetencer = onboardingData.kompetencer.filter(k => k.interesse).slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Velkommen tilbage! Her er dit overblik.
        </p>
      </div>

      {/* Onboarding Alert */}
      {!isComplete && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Kompletér din profil</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Du har ikke gennemført onboarding endnu. Kompletér din profil for at se personlige anbefalinger.
                </p>
                <Button asChild size="sm">
                  <Link href="/app/onboarding">
                    Start onboarding
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Din profilstatus
          </CardTitle>
          <CardDescription>
            {completion}% komplet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={completion} />
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              {onboardingData.cvUploaded ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2" />
              )}
              <span>CV uploadet og analyseret</span>
            </div>
            <div className="flex items-center gap-2">
              {onboardingData.kompetencer.length > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2" />
              )}
              <span>Kompetencer bekræftet</span>
            </div>
            <div className="flex items-center gap-2">
              {onboardingData.personlighedsResultater.length > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2" />
              )}
              <span>Personlighedsprofil udfyldt</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Styrker */}
      {topKompetencer.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Dine top styrker
            </CardTitle>
            <CardDescription>
              Kompetencer du brænder for og mestrer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topKompetencer.map(komp => (
                <Badge key={komp.id} variant="secondary" className="text-sm">
                  {komp.navn}
                  {komp.niveau && ` (${komp.niveau})`}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Arbejdsstil Summary */}
      {onboardingData.personlighedsResultater.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Din arbejdsstil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Baseret på din personlighedsprofil trives du med struktur, samarbejde og målrettet arbejde. 
              Du får energi af at arbejde med andre og levere konkrete resultater.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/app/360">Se fuld analyse</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Karrierespor */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Forslag til karrierespor
            </h2>
            {!isProUser && (
              <p className="text-sm text-muted-foreground mt-1">
                Light plan: 1 karrierespor • Pro: Op til 5 karrierespor
              </p>
            )}
          </div>
          {!isProUser && (
            <Button size="sm" onClick={() => handleProFeatureClick('Flere karrierespor')}>
              <Lock className="mr-2 h-4 w-4" />
              Lås op
            </Button>
          )}
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {karrieresporToShow.map(spor => (
            <Card key={spor.id} className="hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{spor.titel}</CardTitle>
                    <CardDescription>{spor.beskrivelse}</CardDescription>
                  </div>
                  <Badge variant="secondary">{spor.matchScore}% match</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Top kompetencer:</p>
                  <div className="flex flex-wrap gap-1">
                    {spor.topKompetencer.map((k, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{k}</Badge>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>💰 {spor.typiskeLoenSpan}</p>
                  <p>📈 {spor.vaeekstpotentiale}</p>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/app/karrierespor">Se detaljer</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Job Match Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Briefcase className="h-6 w-6" />
              Jobmatch for dig
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isProUser ? 'Viser op til 12 matches' : 'Light plan: Op til 5 matches'}
            </p>
          </div>
          {!isProUser && (
            <Button size="sm" onClick={() => handleProFeatureClick('Flere jobmatch')}>
              <Lock className="mr-2 h-4 w-4" />
              Se flere
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobsToShow.map(job => (
            <Card key={job.id} className="hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary">{job.matchScore}%</Badge>
                  <Badge variant="outline">{job.remote}</Badge>
                </div>
                <CardTitle className="text-lg">{job.titel}</CardTitle>
                <CardDescription>
                  {job.virksomhed} • {job.lokation}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm mb-3">
                  <div>
                    <p className="font-medium text-primary mb-1">Hvorfor passer det:</p>
                    <p className="text-muted-foreground line-clamp-2">{job.hvorforPasser[0]}</p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/app/jobmatch">Se job</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Næste skridt */}
      <Card>
        <CardHeader>
          <CardTitle>Næste skridt</CardTitle>
          <CardDescription>Anbefalede handlinger baseret på din profil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild variant="outline" className="w-full justify-start">
            <Link href="/app/360">
              <Target className="mr-2 h-4 w-4" />
              Udforsk dit 360° overblik
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start">
            <Link href="/app/karrierespor">
              <TrendingUp className="mr-2 h-4 w-4" />
              Se detaljerede karrierespor
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full justify-start">
            <Link href="/app/jobmatch">
              <Briefcase className="mr-2 h-4 w-4" />
              Gennemse alle jobmatch
            </Link>
          </Button>
          {isProUser && (
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/app/plan">
                <FileText className="mr-2 h-4 w-4" />
                Byg din action plan
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <ProGate
        isOpen={showProGate}
        onClose={() => setShowProGate(false)}
        feature={gateFeature}
      />
    </div>
  );
}
