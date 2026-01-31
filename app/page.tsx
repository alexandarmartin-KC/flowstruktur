import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowRight, 
  Target, 
  TrendingUp, 
  Briefcase, 
  CheckCircle2,
  Compass,
  FileText,
  PenLine,
  Shield,
} from 'lucide-react';
import { JobmoraLogo } from '@/components/jobmora-logo';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header - Clean, minimal */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-6xl">
          <Link href="/" className="flex items-center gap-2">
            <JobmoraLogo size={28} />
            <span className="text-lg font-semibold text-foreground">
              Jobmora
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Funktioner
            </Link>
            <Link href="/pris" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Priser
            </Link>
            <Link href="/om" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Om
            </Link>
            <Button asChild size="sm">
              <Link href="/app">
                Log ind
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero - Understated, trust-building */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center">
            <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight mb-6 text-foreground leading-tight">
              Strukturerede værktøjer til din jobsøgning
            </h1>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Jobmora hjælper dig med at organisere dit CV, tilpasse ansøgninger og forberede dig til samtaler. 
              Alt samlet ét sted.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button asChild size="lg">
                <Link href="/app">
                  Kom i gang
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#features">Læs mere</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Gratis at prøve · Ingen kreditkort påkrævet
            </p>
          </div>
        </div>
      </section>

      {/* Features - Clean grid, no hype */}
      <section id="features" className="py-20 lg:py-24 border-t">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-2xl lg:text-3xl font-semibold mb-4 text-foreground">
              Hvad du kan gøre med Jobmora
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Tre værktøjer der hjælper dig med at præsentere dig professionelt
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">CV-værktøj</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Strukturer og rediger dit CV med en professionel skabelon. Eksporter som PDF.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
                <PenLine className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">Ansøgningshjælp</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Få forslag til formuleringer baseret på dit CV og jobopslaget. Du bestemmer altid det endelige indhold.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
                <Target className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">Job-match</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Se hvordan dine erfaringer matcher jobopslagets krav. Identificer områder du kan fremhæve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - Simple steps */}
      <section className="py-20 lg:py-24 bg-muted/50 border-t">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-2xl lg:text-3xl font-semibold mb-4 text-foreground">
              Sådan fungerer det
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center mx-auto mb-4 text-sm font-medium">
                1
              </div>
              <h3 className="font-medium mb-1 text-sm">Upload CV</h3>
              <p className="text-xs text-muted-foreground">
                PDF eller billede
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center mx-auto mb-4 text-sm font-medium">
                2
              </div>
              <h3 className="font-medium mb-1 text-sm">Tilføj job</h3>
              <p className="text-xs text-muted-foreground">
                Kopier jobopslag
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center mx-auto mb-4 text-sm font-medium">
                3
              </div>
              <h3 className="font-medium mb-1 text-sm">Tilpas materiale</h3>
              <p className="text-xs text-muted-foreground">
                CV og ansøgning
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center mx-auto mb-4 text-sm font-medium">
                4
              </div>
              <h3 className="font-medium mb-1 text-sm">Eksporter</h3>
              <p className="text-xs text-muted-foreground">
                PDF klar til afsendelse
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Value props - Understated */}
      <section className="py-20 lg:py-24 border-t">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-foreground">
                Designet til professionelle
              </h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground">Professionelle skabeloner</p>
                    <p className="text-xs text-muted-foreground">Rent layout der fungerer i alle brancher</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground">Du har kontrollen</p>
                    <p className="text-xs text-muted-foreground">AI giver forslag – du tager beslutningerne</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground">Privat og sikkert</p>
                    <p className="text-xs text-muted-foreground">Dine data gemmes lokalt i din browser</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-6 text-foreground">
                Hvad Jobmora ikke er
              </h2>
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Jobmora er ikke en "magisk" løsning der skriver dit CV for dig. 
                  Det er et værktøj der hjælper dig med at strukturere og præsentere 
                  dine egne erfaringer.
                </p>
                <p>
                  AI-assistenten giver forslag baseret på dit indhold. Du godkender 
                  eller redigerer alt før det bruges.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Simple, not pushy */}
      <section className="py-20 lg:py-24 bg-muted/50 border-t">
        <div className="container mx-auto px-6 max-w-2xl text-center">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Klar til at komme i gang?
          </h2>
          <p className="text-muted-foreground mb-8">
            Prøv Jobmora gratis og se om det passer til din arbejdsproces.
          </p>
          <Button asChild size="lg">
            <Link href="/app">
              Start nu
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <JobmoraLogo size={24} />
                <span className="font-semibold">Jobmora</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Værktøjer til jobsøgning
              </p>
            </div>
            <div className="flex gap-12">
              <div>
                <h3 className="text-sm font-medium mb-3">Produkt</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="#features" className="hover:text-foreground transition-colors">Funktioner</Link></li>
                  <li><Link href="/pris" className="hover:text-foreground transition-colors">Priser</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-3">Om</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/om" className="hover:text-foreground transition-colors">Om Jobmora</Link></li>
                  <li><Link href="#" className="hover:text-foreground transition-colors">Privatlivspolitik</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t pt-8 text-sm text-muted-foreground">
            © 2025 Jobmora
          </div>
        </div>
      </footer>
    </div>
  );
}
