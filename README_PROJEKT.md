# FlowStruktur - Digital Karrierecoach

En professionel SaaS-prototype (kun frontend) for en digital karrierecoach bygget med Next.js, TypeScript og shadcn/ui.

## 🎯 Projektbeskrivelse

FlowStruktur er en karrierecoach-applikation der hjælper brugere med at:
- Forstå deres kompetencer, arbejdsstil og motivation
- Udforske relevante karrieremuligheder
- Finde matchende job
- Lave en konkret handlingsplan (PRO)

## 🏗️ Teknisk Stack

- **Framework**: Next.js 16 (App Router)
- **Sprog**: TypeScript
- **Styling**: Tailwind CSS
- **UI Komponenter**: shadcn/ui
- **Ikoner**: lucide-react
- **State Management**: React Context API

## 📁 Projektstruktur

```
app/
├── (landing)/          # Landing pages
│   ├── page.tsx        # Forside
│   ├── om/             # Om os
│   └── pris/           # Priser
├── app/                # Applikation (kræver login i produktion)
│   ├── page.tsx        # Overblik - Hovedside
│   ├── profil/         # Min profil (kompetencer, arbejdsstil, motivation)
│   ├── muligheder/     # Karrierespor
│   ├── job/            # Jobmuligheder
│   ├── plan/           # 30-dages plan (PRO)
│   └── indstillinger/  # Brugerindstillinger
components/
├── ui/                 # shadcn/ui komponenter
├── app-sidebar.tsx     # Global navigation
└── ...
contexts/
├── plan-context.tsx    # Plan state (Light/PRO)
└── onboarding-context.tsx
lib/
└── mock-data.ts        # Alle mock data
```

## 🎨 Designprincipper

### Global Navigation
1. **Overblik** - Orientering + indsigter + næste skridt
2. **Min profil** - Fuld analyse (tabs: Kompetencer, Arbejdsstil, Motivation, Overførbarhed)
3. **Muligheder** - Karrierespor der matcher profilen
4. **Job** - Konkrete jobmuligheder med match-scores
5. **Plan** - 30-dages handlingsplan (PRO feature)
6. **Indstillinger** - Brugerindstillinger og plan management

### Produktlogik
- **Overblik** er IKKE et dashboard med fuld analyse - det er orientering
- Al dyb analyse ligger under **Min profil**
- **Plan** er en separat, forpligtende side (kun PRO)
- Brugeren må aldrig føle sig presset til handling på Overblik
- Navigation følger brugerens mentale spørgsmål, ikke datastruktur

## 🚀 Kom i gang

### Installation

```bash
# Klon repository
git clone <repository-url>
cd flowstruktur

# Installer dependencies
npm install

# Start development server
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000) i din browser.

### Demo funktionalitet

Applikationen har **ingen backend** og **ingen auth**. Det er en fuld-featured frontend prototype.

- **Toggle mellem Light og PRO**: Gå til Indstillinger og brug switchen øverst
- **Light plan**: Begrænset til 1 karrierespor og 5 jobs
- **PRO plan**: Fuld adgang til alle features inkl. Plan

## 📊 Mock Data

Al data er defineret i `/lib/mock-data.ts`:

- **Kompetencer**: 15 kompetencer med styrke, interesse og overførbarhed
- **Personlighedsprofil**: Arbejdsstil scores og tolkninger
- **Motivationsprofil**: Drivere, drænere og arbejdsmiljø-præferencer
- **Karrierespor**: 5 spor med match-scores og detaljer
- **Jobs**: 12 jobs med komplekse match-analyser
- **Plan**: 4-ugers temaer med handlinger

## 🎯 Features

### Overblik (Dashboard)
- Profilstatus med progress bar
- 3 kuraterede indsigter (teasers)
- Næste skridt med CTA'er
- PRO upgrade prompt

### Min Profil
**Tab 1: Kompetencer**
- Grupperet efter kategori (teknisk, soft, ledelse, sprog)
- Styrke vs. interesse visualisering
- "Sweet spot" highlighting (høj styrke + høj interesse)
- Krydsindsigt: energigivende vs. drænere

**Tab 2: Arbejdsstil**
- 4 dimensioner: Tempo, Struktur, Social energi, Fokus
- Progress bars med forklaringer
- Tolkninger af hver dimension

**Tab 3: Motivation**
- Drivere (hvad giver energi)
- Drænere (hvad tapper energi)
- Ideelt arbejdsmiljø

**Tab 4: Overførbarhed**
- Kompetencer grupperet efter overførbarhed (høj/medium/lav)
- Forklaring af betydning
- Strategi for karriereskift

### Muligheder (Karrierespor)
- 5 karrierespor (Light: 1, PRO: alle 5)
- Match-score baseret på profil
- "Hvorfor matcher det?" og "Potentielle udfordringer"
- Næste skridt anbefalinger
- Detail-view med fuld information

### Job
- 12 jobs (Light: 5, PRO: alle 12)
- Match breakdown: Kompetence, Arbejdsstil, Motivation
- "Hvorfor passer det?" og "Områder at styrke"
- Sheet/drawer med fuld jobdetaljer
- PRO features: AI-ansøgning, tilføj til plan

### Plan (PRO Only)
- 30-dages plan opdelt i 4 uger
- Hver uge har tema, beskrivelse og konkrete handlinger
- Progress tracking med checkboxes
- Forklaring af "hvorfor disse skridt"
- Rolig, struktureret præsentation

### Indstillinger
- Plan management (Light ↔ PRO toggle for demo)
- Profil information
- Demo-mode forklaring

## 🎨 Design System

### Farver
- Nordisk, roligt, professionelt
- Primary color for CTAs og highlights
- Muted tones for baggrunde
- Green for positive (styrker, matches)
- Orange for advarsler (gaps, udfordringer)
- Blue for info boxes

### Typografi
- Inter font family
- Klar hierarki med h1, h2, h3
- God line-height og spacing

### Komponenter
- Cards med hover states
- Badges for status og kategorier
- Progress bars for scores
- Tooltips for hjælp
- Modal/Sheet for detaljevisning

## 🔒 PRO Gating

PRO features er visuelt låst med:
- Lock icon
- Blurred/disabled state
- Upgrade prompt
- Clear værdi-kommunikation

Light brugere kan se at features eksisterer, men skal opgradere for adgang.

## 📝 Microcopy (Dansk)

Al tekst er på dansk med fokus på:
- Tryghed ("Dette er en hypotese om dig")
- Guidning ("Sådan bruger du planen")
- Forklaring ("Hvorfor disse skridt?")
- Motivation (positive framing)

## 🚧 Hvad er IKKE implementeret

Dette er en **frontend prototype**. Følgende er mock/simuleret:
- Auth/login
- Backend API
- Database
- Rigtige CV uploads
- AI-generering
- Betalingsintegration
- Email notifikationer
- Rigtige jobfeeds

## 📖 Næste skridt

For at gøre dette production-ready ville man tilføje:
1. Backend (Node.js/Python) med database
2. Auth (NextAuth.js eller lignende)
3. CV parsing med AI
4. Rigtig jobbørs integration
5. Stripe for betalinger
6. Email service (Resend/SendGrid)
7. Analytics (PostHog/Mixpanel)
8. A/B testing platform

## 🙏 Credits

- UI komponenter: [shadcn/ui](https://ui.shadcn.com/)
- Ikoner: [Lucide](https://lucide.dev/)
- Framework: [Next.js](https://nextjs.org/)

## 📄 Licens

Dette er et demo-projekt. For produktionsbrug, kontakt projektejeren.
