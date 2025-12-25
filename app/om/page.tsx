import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Target, Users, Heart } from 'lucide-react';

export default function OmPage() {
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
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Vi hjælper dig med at finde <span className="text-primary">klarhed</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              FlowStruktur er en karrierecoaching platform, der kombinerer AI med menneskeligt fokus 
              for at hjælpe dig med at træffe bedre karrierevalg.
            </p>
          </div>

          {/* Mission */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Vores mission</h3>
                <p className="text-muted-foreground">
                  At gøre professionel karrierevejledning tilgængelig for alle gennem teknologi og design.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Vores tilgang</h3>
                <p className="text-muted-foreground">
                  Vi kombinerer dataanalyse, psykologi og AI for at give dig objektive og handlingsorienterede indsigter.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Vores værdier</h3>
                <p className="text-muted-foreground">
                  Ærlighed, enkelhed og empowerment. Vi tror på, at du skal have kontrol over din karriere.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Story */}
          <div className="prose prose-lg max-w-none mb-20">
            <h2 className="text-3xl font-bold mb-6">Hvorfor FlowStruktur?</h2>
            <p className="text-muted-foreground mb-4">
              Vi startede FlowStruktur fordi vi selv har oplevet hvor svært det kan være at navigere i karrierevalg. 
              Traditionel karrierevejledning er ofte dyr, tidskrævende og baseret på subjektive vurderinger.
            </p>
            <p className="text-muted-foreground mb-4">
              Med FlowStruktur får du adgang til professionelle værktøjer og analyser der normalt kun er tilgængelige 
              gennem dyre konsulenter. Vi bruger AI til at identificere mønstre og muligheder, men holder altid 
              mennesket i centrum.
            </p>
            <p className="text-muted-foreground">
              Vores mål er ikke at træffe beslutninger for dig, men at give dig de indsigter og det overblik 
              du har brug for til at træffe bedre beslutninger selv.
            </p>
          </div>

          {/* CTA */}
          <div className="text-center bg-primary text-primary-foreground rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-4">Klar til at komme i gang?</h2>
            <p className="text-lg mb-8 opacity-90">
              Start din karriererejse med FlowStruktur i dag
            </p>
            <Button asChild size="lg" variant="secondary" className="text-lg">
              <Link href="/app/onboarding">Opret din profil gratis</Link>
            </Button>
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
