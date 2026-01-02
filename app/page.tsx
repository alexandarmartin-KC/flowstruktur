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
  BarChart3,
  Compass,
  Brain,
  LineChart,
  Lightbulb,
  Shield,
  Zap
} from 'lucide-react';
import { JobmoraLogo } from '@/components/jobmora-logo';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <JobmoraLogo size={32} />
            <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Jobmora
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="/pris" className="text-sm font-medium hover:text-primary transition-colors">
              Priser
            </Link>
            <Link href="/om" className="text-sm font-medium hover:text-primary transition-colors">
              Om os
            </Link>
            <Button asChild size="sm">
              <Link href="/app">
                Kom i gang
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-6 px-4 py-2" variant="secondary">
                <Sparkles className="h-4 w-4 mr-2" />
                AI-drevet karrierevejledning
              </Badge>
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
                Find klarhed i din
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  karriererejse
                </span>
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
                Jobmora analyserer dit CV, din personlighed og dine drømme – og viser dig præcis hvilke karriereveje der passer til dig
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button asChild size="lg" className="text-lg px-8 h-12 shadow-lg shadow-primary/20">
                  <Link href="/app">
                    Start gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg px-8 h-12">
                  <Link href="#features">Se hvordan</Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-6 flex items-center justify-center gap-2">
                <Shield className="h-4 w-4" />
                Ingen kreditkort påkrævet · Frontend demo
              </p>
            </div>

            {/* Visual Preview Card */}
            <div className="mt-16 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
              <Card className="overflow-hidden border-2 shadow-2xl">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-card rounded-lg p-4 border">
                      <div className="h-3 w-3 rounded-full bg-primary mb-3" />
                      <div className="h-2 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-2 bg-muted rounded w-1/2" />
                    </div>
                    <div className="bg-card rounded-lg p-4 border">
                      <div className="h-3 w-3 rounded-full bg-primary mb-3" />
                      <div className="h-2 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-2 bg-muted rounded w-1/2" />
                    </div>
                    <div className="bg-card rounded-lg p-4 border">
                      <div className="h-3 w-3 rounded-full bg-primary mb-3" />
                      <div className="h-2 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-2 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">2.500+</div>
              <div className="text-sm text-muted-foreground">Aktive brugere</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">420+</div>
              <div className="text-sm text-muted-foreground">Jobskift gennemført</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">32%</div>
              <div className="text-sm text-muted-foreground">Gns. lønstigning</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">4.8★</div>
              <div className="text-sm text-muted-foreground">Bruger rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">Sådan virker det</Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Din personlige karriereassistent
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tre kraftfulde moduler giver dig det komplette overblik
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardContent className="pt-8 pb-8">
                <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 w-14 h-14 flex items-center justify-center mb-6">
                  <Compass className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Profil & Overblik</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Upload dit CV og få en dyb analyse af dine kompetencer, erfaringer og potentiale.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>360° kompetenceanalyse</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Personlighedsprofil</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Arbejdsstil & præferencer</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardContent className="pt-8 pb-8">
                <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 w-14 h-14 flex items-center justify-center mb-6">
                  <TrendingUp className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Karrierespor</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Få personlige forslag til karriereveje baseret på din unikke profil og ambitioner.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Match score & begrundelse</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Lønspænd & vækstpotentiale</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Udviklingsvej beskrevet</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardContent className="pt-8 pb-8">
                <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 w-14 h-14 flex items-center justify-center mb-6">
                  <Target className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Jobmatch</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Se præcist hvorfor jobs passer til dig, og hvad du skal udvikle for at lykkes.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Personlig match-analyse</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Gap analyse & læring</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>AI-genereret ansøgning</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">Proces</Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Fra profil til drømmejob
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Fire enkle trin til klarhed over din karriere
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 w-16 h-16 flex items-center justify-center mb-4 shadow-lg">
                    <span className="text-2xl font-bold text-primary-foreground">1</span>
                  </div>
                  <h3 className="font-bold mb-2 text-lg">Upload CV</h3>
                  <p className="text-sm text-muted-foreground">
                    Del din erfaring og baggrund
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 w-16 h-16 flex items-center justify-center mb-4 shadow-lg">
                    <span className="text-2xl font-bold text-primary-foreground">2</span>
                  </div>
                  <h3 className="font-bold mb-2 text-lg">Profil analyse</h3>
                  <p className="text-sm text-muted-foreground">
                    AI analyserer dine styrker
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 w-16 h-16 flex items-center justify-center mb-4 shadow-lg">
                    <span className="text-2xl font-bold text-primary-foreground">3</span>
                  </div>
                  <h3 className="font-bold mb-2 text-lg">Find veje</h3>
                  <p className="text-sm text-muted-foreground">
                    Udforsk karrieremuligheder
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 w-16 h-16 flex items-center justify-center mb-4 shadow-lg">
                    <span className="text-2xl font-bold text-primary-foreground">4</span>
                  </div>
                  <h3 className="font-bold mb-2 text-lg">Søg job</h3>
                  <p className="text-sm text-muted-foreground">
                    Ansøg med skræddersyet materiale
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Different */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4">Hvorfor Jobmora</Badge>
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">
                Mere end bare jobsøgning
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                En coachende tilgang til karriereudvikling
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-2">
                <CardContent className="pt-6 pb-6">
                  <div className="rounded-xl bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">Dyb forståelse</h3>
                  <p className="text-sm text-muted-foreground">
                    Ikke bare lister – vi fortolker din profil og forklarer sammenhænge
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6 pb-6">
                  <div className="rounded-xl bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <Lightbulb className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">Ærlig vejledning</h3>
                  <p className="text-sm text-muted-foreground">
                    Vi viser både muligheder og udfordringer – så du kan træffe informerede valg
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6 pb-6">
                  <div className="rounded-xl bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <LineChart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">Personlig vækst</h3>
                  <p className="text-sm text-muted-foreground">
                    Se præcist hvilke kompetencer du skal udvikle for at nå dine mål
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6 pb-6">
                  <div className="rounded-xl bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">AI-assisteret</h3>
                  <p className="text-sm text-muted-foreground">
                    Avanceret AI giver dig indsigter, du ikke kan få andre steder
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6 pb-6">
                  <div className="rounded-xl bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">Præcise match</h3>
                  <p className="text-sm text-muted-foreground">
                    Hver jobanbefaling kommer med en detaljeret forklaring på hvorfor
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6 pb-6">
                  <div className="rounded-xl bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">Privat & sikkert</h3>
                  <p className="text-sm text-muted-foreground">
                    Dine data er beskyttet og bruges kun til at hjælpe dig
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">Historier</Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              De fandt deres vej
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Hvad andre siger om Jobmora
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10" />
                  <div>
                    <div className="font-semibold">Marie K.</div>
                    <div className="text-sm text-muted-foreground">UX Designer</div>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  "Jobmora hjalp mig med at se kompetencer, jeg ikke vidste var værdifulde. Jeg skiftede karriere og er meget gladere nu."
                </p>
                <div className="mt-4 text-primary font-semibold text-sm">
                  Lønstigning: +28%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10" />
                  <div>
                    <div className="font-semibold">Thomas P.</div>
                    <div className="text-sm text-muted-foreground">Product Manager</div>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  "Den dybe analyse gav mig indsigter om min arbejdsstil, som jeg har brugt til at finde den perfekte rolle."
                </p>
                <div className="mt-4 text-primary font-semibold text-sm">
                  Fandt drømmejob på 3 uger
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10" />
                  <div>
                    <div className="font-semibold">Sarah L.</div>
                    <div className="text-sm text-muted-foreground">Data Analyst</div>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  "AI-assistenten hjalp mig med ansøgninger, der virkelig ramte plet. Fik svar på 8 ud af 10 jobs."
                </p>
                <div className="mt-4 text-primary font-semibold text-sm">
                  80% callback rate
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
              <CardContent className="relative pt-16 pb-16 text-center">
                <Badge className="mb-6">Start i dag</Badge>
                <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                  Klar til at finde klarhed?
                </h2>
                <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                  Det tager kun 10 minutter at komme i gang. Ingen kreditkort påkrævet.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="text-lg px-8 h-12">
                    <Link href="/app">
                      Kom i gang gratis
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-lg px-8 h-12">
                    <Link href="/pris">Se priser</Link>
                  </Button>
                </div>
                <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Gratis at starte</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Ingen binding</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Opsig når som helst</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <JobmoraLogo size={24} />
                <span className="font-bold text-lg">Jobmora</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Din personlige AI karriereassistent
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Produkt</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="/pris" className="hover:text-foreground transition-colors">Priser</Link></li>
                <li><Link href="/app" className="hover:text-foreground transition-colors">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Virksomhed</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/om" className="hover:text-foreground transition-colors">Om os</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Kontakt</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Karriere</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Privatlivspolitik</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Vilkår</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div>
              © 2025 Jobmora. Alle rettigheder forbeholdes.
            </div>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-foreground transition-colors">LinkedIn</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Twitter</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Facebook</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
