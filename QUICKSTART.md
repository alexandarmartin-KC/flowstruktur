# FlowStruktur - Quick Start Guide

## 🚀 Start serveren

```bash
npm run dev
```

Åbn http://localhost:3000

## 📱 Test flow

### 1. Landing page (/)
- Se hero, features, og benefits
- Klik "Kom i gang gratis" → går til /app/onboarding
- Eller "Se priser" → går til /pris

### 2. Onboarding (/onboarding)
**Trin 1**: Velkomst
- Læs om processen
- Klik "Næste"

**Trin 2**: CV Upload
- Klik "Vælg fil" og upload en fil (mock)
- Se "Vi har fundet" feedback
- Klik "Næste"

**Trin 3**: Kompetencer
- Se auto-detekterede kompetencer
- Juster niveau (dropdown)
- Marker interesser (❤️ knap)
- Klik "Næste"

**Trin 4**: Personlighedsprofil
- Besvar 10 spørgsmål (1-5 skala)
- Mindst 5 svar påkrævet
- Klik "Næste"

**Trin 5**: Preview
- Se sammendrag
- Klik "Gå til dashboard"

### 3. Dashboard (/app)
- Se profilstatus (progress bar)
- Top styrker (badges)
- Arbejdsstil summary
- 1 karrierespor (Light) eller 5 (Pro)
- 5 jobkort (Light) eller 12 (Pro)
- Næste skridt actions

### 4. Test Plan Toggle
**I headeren:**
- Se aktiv plan badge
- Klik "Opgrader til Pro" eller "Skift til Light"
- Observér ændringer:
  - Flere karrierespor
  - Flere jobkort
  - Action Plan låses op
  - Badge opdateres

**Eller i Indstillinger:**
- Gå til /app/indstillinger
- Toggle switch

### 5. Udforsk features

**Mit CV** (/app/cv)
- Se uploadet CV
- Administrér kompetencer
- Toggle mellem tabs

**Personprofil** (/app/personprofil)
- Se personlighedsresultater
- Progress bars for dimensioner
- Summary tekst

**360° Overblik** (/app/360)
- Tab 1: Kompetencer (kategoriseret)
- Tab 2: Arbejdsstil (dimensioner)
- Tab 3: Overførbarhed (transferable skills)
- Tab 4: Motivation (drivkræfter)

**Karrierespor** (/app/karrierespor)
- Se karriereveje med match score
- Light: 1 spor synlig
- Pro: 5 spor synlige
- Låste spor har overlay med upgrade CTA

**Jobmatch** (/app/jobmatch)
- Se jobkort med match %
- Filtre (remote, senioritet, lokation)
- Klik på job → modal med detaljer
- "Hvorfor passer det" + "Gaps"
- Pro feature: AI ansøgning (mock)

**Action Plan** (/app/plan) - KUN PRO
- Light users: Se gate modal
- Pro users: Se 4 faser
  - Fase 1: Kompetenceudvikling
  - Fase 2: Netværk
  - Fase 3: Erfaring
  - Fase 4: Jobsøgning
- Check af actions
- Ressourcer

**Indstillinger** (/app/indstillinger)
- Plan toggle (demo switch)
- Profil info
- Notifikationer
- Privatliv

## 🎯 Pro Gating Test

1. Start i Light plan
2. Gå til Dashboard
3. Klik "Lås op" knappen ved karrierespor → Pro gate modal
4. Klik "Se flere" ved jobmatch → Pro gate modal
5. Gå til /app/plan → Auto-redirect til gate modal
6. I modalen: Klik "Opgrader til Pro"
7. Nu kan du se alle features

## 🎨 Design elementer at bemærke

- **Sidebar**: Fixed på desktop, burger menu på mobile
- **Header**: Plan badge + toggle knap + user dropdown
- **Cards**: Hover effekter (border-primary)
- **Badges**: Forskellige varianter (primary, secondary, outline)
- **Progress bars**: Animerede, grøn/primary farve
- **Empty states**: Placeholder tekst og ikoner
- **Loading states**: (ikke implementeret, men struktur er klar)
- **Tooltips**: Kan tilføjes med Tooltip component
- **Modal dialogs**: Pro gate og job details

## 📋 Alle routes

### Offentlige
- `/` - Landing
- `/pris` - Priser
- `/om` - Om os

### App (med sidebar)
- `/app` - Dashboard
- `/app/cv` - CV upload
- `/app/personprofil` - Personlighedsprofil
- `/app/360` - 360° overblik
- `/app/karrierespor` - Karrierespor
- `/app/jobmatch` - Jobmatch
- `/app/plan` - Action plan (Pro)
- `/app/indstillinger` - Indstillinger

### Onboarding (standalone)
- `/app/onboarding` - 5-trins wizard

## 🐛 Troubleshooting

**Build fejl?**
```bash
npm run build
```

**Server starter ikke?**
```bash
rm -rf .next
npm run dev
```

**TypeScript fejl?**
Alle types er defineret i `lib/mock-data.ts`

**Styling ser forkert ud?**
Tailwind v4 er brugt - check at alle classes er gyldige

## 📊 Mock Data

Alt data er i `lib/mock-data.ts`:
- 15 kompetencer
- 12 personlighedsspørgsmål
- 5 karrierespor
- 12 jobs

Tilføj mere data ved at udvide arrays i denne fil.

## 🎓 Lær mere

- Next.js App Router: https://nextjs.org/docs
- shadcn/ui: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com
- Lucide Icons: https://lucide.dev

---

God fornøjelse med FlowStruktur! 🚀
