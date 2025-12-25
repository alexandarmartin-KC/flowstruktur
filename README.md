# FlowStruktur - Karrierecoach Platform

En professionel SaaS-prototype for karrierecoaching bygget med Next.js, TypeScript, og Tailwind CSS.

## 🚀 Features

### Offentlige sider
- **Landing page** - Moderne hero, features, benefits og CTA
- **Pris side** - Light og Pro planer med feature comparison
- **Om os** - Mission, vision og værdier

### App funktioner
- **Onboarding wizard** - 5-trins guidet flow:
  1. Velkomst og forventningsafstemning
  2. CV upload (mock)
  3. Kompetence-bekræftelse med niveau og interesse
  4. Personlighedsprofil (12 spørgsmål, Likert skala)
  5. Preview af 360° overblik

- **Dashboard** - Samlet overblik med:
  - Profilstatus og fremskridt
  - Top styrker
  - Arbejdsstil summary
  - Karrierespor forslag (1 i Light, 5 i Pro)
  - Jobmatch preview (5 i Light, 12 i Pro)
  - Næste skridt actions

- **Mit CV** - Upload og administrér CV + kompetencer
- **Personprofil** - Personlighedstest og resultater
- **360° Overblik** - 4 tabs:
  - Kompetencer (kategoriseret)
  - Arbejdsstil (dimensioner med progress bars)
  - Overførbarhed (transferable skills)
  - Motivation (drivkræfter)

- **Karrierespor** - Detaljerede karriereveje med:
  - Match score
  - Top kompetencer
  - Lønspænd
  - Vækstpotentiale
  - Pro gating for flere spor

- **Jobmatch** - Personlige jobkort med:
  - Match score
  - Hvorfor det passer
  - Gaps at arbejde på
  - Filtre (remote, senioritet, lokation)
  - Detaljeret job modal
  - Pro gating for AI ansøgning

- **Action Plan** (Pro only) - Trin-for-trin guide med:
  - 4 faser (kompetence, netværk, erfaring, jobsøgning)
  - Checkable actions
  - Timeline og prioritering
  - Anbefalede ressourcer

- **Indstillinger** - Plan toggle, profil, notifikationer

### Design & UX
- ✅ Nordisk, minimal, professionel design
- ✅ Fuldt responsivt layout
- ✅ Sidebar navigation med ikoner
- ✅ Light/Pro plan toggle i header
- ✅ Pro gating med modal dialogs
- ✅ Progress bars og status indicators
- ✅ Empty states og loading states
- ✅ Tooltips og hjælpetekster
- ✅ Badge system (kompetencer, senioritet, remote, etc.)
- ✅ Cards, tabs, dialogs fra shadcn/ui
- ✅ Lucide React ikoner

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Språg**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Ikoner**: Lucide React
- **Forms**: React Hook Form + Zod (ready to use)
- **State**: React Context (PlanContext, OnboardingContext)
- **Data**: Mock JSON data (ingen backend/database)

## 📦 Installation

```bash
# Installer dependencies
npm install

# Start udviklings server
npm run dev

# Byg til produktion
npm run build

# Start produktion server
npm start
```

Åbn [http://localhost:3000](http://localhost:3000) i din browser.

## 🗂️ Projekt struktur

```
flowstruktur/
├── app/
│   ├── layout.tsx              # Root layout med providers
│   ├── page.tsx                # Landing page
│   ├── pris/
│   │   └── page.tsx            # Pris page
│   ├── om/
│   │   └── page.tsx            # Om os page
│   ├── onboarding/
│   │   └── page.tsx            # 5-trins wizard
│   └── app/
│       ├── layout.tsx          # App layout med sidebar
│       ├── page.tsx            # Dashboard
│       ├── cv/
│       ├── personprofil/
│       ├── 360/
│       ├── karrierespor/
│       ├── jobmatch/
│       ├── plan/
│       └── indstillinger/
├── components/
│   ├── app-header.tsx          # Header med plan toggle
│   ├── app-sidebar.tsx         # Sidebar navigation
│   ├── app-layout.tsx          # Layout wrapper
│   ├── pro-gate.tsx            # Pro feature gate modal
│   └── ui/                     # shadcn/ui komponenter
├── contexts/
│   ├── plan-context.tsx        # Light/Pro state
│   └── onboarding-context.tsx  # Onboarding state
├── lib/
│   ├── mock-data.ts            # Mock data (jobs, kompetencer, etc.)
│   └── utils.ts                # Utility functions
└── public/
```

## 🎯 Brugerflow

1. **Landing** → Klik "Kom i gang gratis"
2. **Onboarding** → Gennemfør 5 trin (CV, kompetencer, personprofil)
3. **Dashboard** → Se overblik og anbefalinger
4. **Udforsk** → Gå til 360°, karrierespor, eller jobmatch
5. **Opgrader** → Toggle til Pro for flere features
6. **Action Plan** → (Pro) Få trin-for-trin guide

## 🔐 Plan Features

### Light Plan (Gratis)
- ✅ CV upload og analyse
- ✅ Personlighedsprofil
- ✅ 360° kompetence overblik
- ✅ 1 karrierespor forslag
- ✅ Op til 5 jobmatch

### Pro Plan (299 kr/måned)
- ✅ Alt i Light
- ✅ Op til 5 karrierespor med dybdeanalyse
- ✅ Op til 12 jobmatch
- ✅ Personlig action plan
- ✅ AI-genererede ansøgninger (UI mock)
- ✅ CV-optimering og tips

## 🧪 Test funktionalitet

### Plan Toggle
- Klik på "Opgrader til Pro" eller "Skift til Light" i headeren
- Eller gå til Indstillinger og toggle plan switch
- Observér hvordan features låses/åbnes

### Onboarding
- Gå til `/onboarding` eller klik "Kom i gang" på landing
- Upload en fil (mock - ingen parsing)
- Juster kompetencer
- Besvar personlighedsspørgsmål
- Se preview og gå til dashboard

### Navigation
- Sidebar er altid synlig på desktop
- Mobile: burger menu
- Pro features viser lock icon i Light mode

## 🎨 Design principper

- **Nordisk minimalisme**: Clean, luftigt, god spacing
- **Professionel**: SaaS-kvalitet, troværdig
- **Guidet**: Brugeren ved altid hvor de er
- **Transparent**: Klar forskel mellem Light og Pro
- **Dansk microcopy**: Alt UI på dansk

## 📝 Microcopy eksempler

- "Lås op med Pro" (ikke "Upgrade")
- "Hvorfor passer det" (ikke "Why it matches")
- "Næste skridt" (ikke "Next steps")
- "Din arbejdsstil" (ikke "Your work style")

## 🚧 Bemærk

Dette er en **frontend-prototype**:
- ✅ Ingen backend/API integration
- ✅ Ingen database
- ✅ Ingen auth system
- ✅ Ingen real payments
- ✅ Alt data er mock/local state
- ✅ CV parsing er simuleret
- ✅ AI features er UI-only

## 🔮 Fremtidige forbedringer

For en produktionsklar version:
- Supabase/Firebase backend
- Auth med NextAuth.js
- Real CV parsing med API
- Stripe payment integration
- Analytics og tracking
- Email notifikationer
- Admin dashboard

## 📄 Licens

Dette er en demo-prototype bygget til læreformål.

---

**Bygget med ❤️ og ☕ af FlowStruktur Team**
