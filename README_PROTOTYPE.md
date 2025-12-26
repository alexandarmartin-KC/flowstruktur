# FlowStruktur – Karriere-overblik Prototype

En enkel, professionel SaaS-prototype (kun frontend) for et digitalt karriere-overblik.

## 🎯 Formål

Demonstrere struktur, flow, tone og forklaringer for et karriereværktøj, hvor brugeren:
1. Bliver ført trygt gennem en refleksionsproces
2. Får deres CV og personprofil fortolket – ikke bare listet
3. Får jobeksempler med forklaring, ikke "match-scores"

## 🏗️ Struktur

Applikationen består af **3 hovedsider**:

### 1. **Overblik** (`/app`)
- Trinvis status-visning (CV uploadet, Personprofil udfyldt, etc.)
- Liste over jobs brugeren har set, gemt eller ansøgt
- Links videre til Min profil og Muligheder

### 2. **Min profil** (`/app/profil`)
Opdelt i 3 sektioner:
- **CV-fortolkning**: Beskrivelse af erfaringsniveau, typiske opgaver og kompetenceområder
- **Personprofil**: Spørgeskema + coachende beskrivelse af arbejdsstil, motivation, dræner og samarbejde
- **Samlet analyse**: Centrale observationer og spændingsfelter mellem erfaring og præferencer

### 3. **Muligheder** (`/app/muligheder`)
- Vælg mellem to retninger:
  - A) Job inden for nuværende karrierespor
  - B) Job i ny branche
- Vis 3-4 jobeksempler med:
  - Hvorfor jobbet kan være relevant
  - Hvad der kan være udfordrende
  - Hvad jobbet kan bruges til i afklaringen
- Ingen match-scores, ingen rangering

## 🛠️ Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** komponenter
- **Mock data** (ingen backend)

## 🚀 Kom i gang

```bash
# Installer dependencies
npm install

# Start development server
npm run dev
```

Åbn [http://localhost:3000](http://localhost:3000) i din browser.

## 📁 Filstruktur

```
app/
├── app/                    # App-sektionen
│   ├── page.tsx           # Overblik
│   ├── profil/
│   │   └── page.tsx       # Min profil
│   ├── muligheder/
│   │   └── page.tsx       # Muligheder
│   └── indstillinger/
│       └── page.tsx       # Indstillinger
├── page.tsx               # Landing page
├── om/                    # Om os
└── pris/                  # Priser

components/
├── app-sidebar.tsx        # Global navigation
├── app-layout.tsx         # App layout wrapper
└── ui/                    # shadcn/ui komponenter

lib/
└── mock-data.ts          # Al mock data
```

## 📊 Mock Data

Al data er defineret i [`lib/mock-data.ts`](lib/mock-data.ts) inklusiv:
- User progress
- Saved/applied jobs
- CV interpretation
- Person profil questions & analyse
- Samlet analyse
- Job eksempler (current track & new direction)

## 🎨 Design Principper

- **Roligt og nordisk**: Ingen flashy farver eller overdrevne effekter
- **Coachende tone**: Menneskeligt sprog, ikke corporate HR-speak
- **Alting forklares**: Ingen features uden kontekst
- **Tillid og tryghed**: Disclaimers og ærlig kommunikation

## ⚠️ Vigtige Bemærkninger

- Dette er KUN en frontend-prototype
- Ingen backend, ingen AI, ingen rigtige jobfeeds
- Ingen gratis/betalt-opdeling implementeret
- Mock data bruges til alt
- Fokus er på struktur, flow og tone

## 📝 Næste Skridt (hvis projektet skulle udvikles videre)

1. Implementer rigtig backend
2. Tilføj autentificering
3. Integrér med jobfeeds
4. Byg AI-fortolkningsmotor
5. Implementer betalingsflow
6. Tilføj analytics

## 📄 Licens

Dette er en prototype til demonstrationsformål.
