import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Target, 
  TrendingUp, 
  Briefcase, 
  Sparkles,
  CheckCircle2,
  Users,
  BarChart3
} from 'lucide-react';

export default function HomePage() {
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

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="h-3 w-3 mr-1" />
            Digitalt karriere-overblik
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
            Forstå din <span className="text-primary">karriereprofil</span> i dybden
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Et roligt og reflekterende værktøj, der hjælper dig med at forstå din erfaring, dine præferencer og dine muligheder.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg">
              <Link href="/app">
                Prøv demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg">
              <Link href="/om">Læs mere</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Dette er en frontend-prototype uden rigtig backend
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Sådan virker det</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tre simple sider giver dig indsigt i din karriereprofil
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Overblik</h3>
              <p className="text-muted-foreground">
                Se din status og hvilke jobs du har gemt, set eller ansøgt.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Min profil</h3>
              <p className="text-muted-foreground">
                En dyb fortolkning af dit CV og din personprofil – ikke bare lister.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Muligheder</h3>
              <p className="text-muted-foreground">
                Udforsk jobeksempler med forklaringer – hvorfor de passer, hvad der kan være svært, og hvad de kan bruges til i din afklaring.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <Badge className="mb-4">Værdier</Badge>
              <h2 className="text-3xl font-bold mb-6">
                Ro, refleksion og forståelse
              </h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Coachende tilgang</h3>
                    <p className="text-muted-foreground">
                      Ingen overfladiske "matches". Vi forklarer, hvorfor noget kan være relevant – og hvad der kan være udfordrende.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Personlige karrierespor</h3>
                    <p className="text-muted-foreground">
                      Få forslag til realistiske karriereveje baseret på din unikke profil.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Målrettede jobmatch</h3>
                    <p className="text-muted-foreground">
                      Se præcist hvorfor du passer til hvert job – og hvad du skal udvikle.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Konkret action plan</h3>
                    <p className="text-muted-foreground">
                      Gå fra indsigt til handling med en trin-for-trin guide. (Pro)
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg p-8 border">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">2.500+</div>
                    <div className="text-muted-foreground">Brugere har fundet klarhed</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center">
                    <Briefcase className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">420+</div>
                    <div className="text-muted-foreground">Succesfulde jobskift</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">32%</div>
                    <div className="text-muted-foreground">Gennemsnitlig lønstigning</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center bg-primary text-primary-foreground rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Klar til at tage næste skridt?</h2>
          <p className="text-lg mb-8 opacity-90">
            Start din karriererejse i dag – det tager kun 10 minutter
          </p>
          <Button asChild size="lg" variant="secondary" className="text-lg">
            <Link href="/app/onboarding">
              Kom i gang nu
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
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
              <Link href="#" className="hover:text-foreground transition-colors">
                Privatliv
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 FlowStruktur. Alle rettigheder forbeholdes.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
