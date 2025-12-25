import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Check, Sparkles } from 'lucide-react';

export default function PrisPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">FlowStruktur</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/pris" className="text-sm font-medium hover:text-primary transition-colors">
              Priser
            </Link>
            <Link href="/om" className="text-sm font-medium hover:text-primary transition-colors">
              Om os
            </Link>
            <Button asChild variant="outline">
              <Link href="/app">Log ind (demo)</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Vælg den plan der passer til dig
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start gratis med Light planen, eller få fuld adgang med Pro
            </p>
          </div>

          {/* Pricing cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Light Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Light</CardTitle>
                <CardDescription>Perfekt til at komme i gang</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">0 kr</span>
                  <span className="text-muted-foreground">/måned</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full" variant="outline">
                  <Link href="/app/onboarding">
                    Start gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <div className="space-y-3 pt-4">
                  <div className="flex gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm">CV upload og analyse</span>
                  </div>
                  <div className="flex gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm">Personlighedsprofil</span>
                  </div>
                  <div className="flex gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm">360° kompetence overblik</span>
                  </div>
                  <div className="flex gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm">1 karrierespor forslag</span>
                  </div>
                  <div className="flex gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm">Op til 5 jobmatch</span>
                  </div>
                  <div className="flex gap-3 opacity-50">
                    <Check className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span className="text-sm line-through">Action plan</span>
                  </div>
                  <div className="flex gap-3 opacity-50">
                    <Check className="h-5 w-5 text-muted-foreground shrink-0" />
                    <span className="text-sm line-through">AI-genererede ansøgninger</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-primary relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold">
                POPULÆR
              </div>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  Pro
                  <Badge>Mest værdi</Badge>
                </CardTitle>
                <CardDescription>Fuld adgang til alle features</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">299 kr</span>
                  <span className="text-muted-foreground">/måned</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full">
                  <Link href="/app/onboarding">
                    Kom i gang med Pro
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <div className="space-y-3 pt-4">
                  <div className="flex gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm font-medium">Alt i Light, plus:</span>
                  </div>
                  <div className="flex gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm">Op til 5 karrierespor med dybdeanalyse</span>
                  </div>
                  <div className="flex gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm">Op til 12 jobmatch med fuld analyse</span>
                  </div>
                  <div className="flex gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm">Personlig action plan</span>
                  </div>
                  <div className="flex gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm">AI-genererede ansøgninger</span>
                  </div>
                  <div className="flex gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm">CV-optimering og tips</span>
                  </div>
                  <div className="flex gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm">Prioriteret support</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Ofte stillede spørgsmål</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Kan jeg skifte plan senere?</h3>
                <p className="text-muted-foreground">
                  Ja, du kan når som helst opgradere eller nedgradere din plan. Ændringer træder i kraft med det samme.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Er der binding?</h3>
                <p className="text-muted-foreground">
                  Nej, der er ingen binding. Du kan opsige når som helst, og du beholder adgang til udgangen af din betalingsperiode.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Hvad sker der med mine data hvis jeg opsiger?</h3>
                <p className="text-muted-foreground">
                  Dine data gemmes i 90 dage efter opsigelse, så du kan genaktivere din konto. Derefter slettes alt permanent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">FlowStruktur</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/pris" className="hover:text-foreground transition-colors">
                Priser
              </Link>
              <Link href="/om" className="hover:text-foreground transition-colors">
                Om os
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
