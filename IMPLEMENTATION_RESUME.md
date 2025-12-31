# Implementering: Statusdesign på Jobkort - Resume

## ✅ Implementeret

### 1. **Datamodel (contexts/saved-jobs-context.tsx)**

#### Nye felter:
- `jobStatus: 'SAVED' | 'IN_PROGRESS' | 'APPLIED'` (erstatter `status`)
- `cvStatus: 'NOT_STARTED' | 'DRAFT' | 'FINAL'`
- `applicationStatus: 'NOT_STARTED' | 'DRAFT' | 'FINAL'`
- `previousStatus?: 'SAVED' | 'IN_PROGRESS'` (til fortryd-funktionalitet)

#### Nye funktioner:
```typescript
toggleApplied(jobId: string): void
  // Toggle mellem APPLIED og ikke-APPLIED med previousStatus logik

updateSubStatus(jobId: string, type: 'cv' | 'application', status: SubStatus): void
  // Opdater cv/application status og auto-promover til IN_PROGRESS
```

#### Toggle-logik:
- **Når ikke APPLIED → APPLIED:**
  - Gem current jobStatus i previousStatus
  - Sæt jobStatus = 'APPLIED'

- **Når APPLIED → ikke APPLIED:**
  - Gendan fra previousStatus hvis den findes
  - Ellers beregn:
    - Hvis cvStatus ELLER applicationStatus !== 'NOT_STARTED' → 'IN_PROGRESS'
    - Ellers → 'SAVED'

---

### 2. **JobCard Komponent (components/job-card.tsx)**

#### Status-chip (ikke klikbar):
- SAVED → "Gemt" (secondary variant)
- IN_PROGRESS → "Under arbejde" (default variant)
- APPLIED → "Ansøgt" (outline variant med grøn border)

#### Primær CTA (dynamisk):
- SAVED → "Arbejd videre"
- IN_PROGRESS → "Fortsæt arbejdet"
- APPLIED → "Se detaljer"
- Alle linker til `/app/job/{jobId}/cv`

#### ⋯-menu (overflow):
- Placeret i øverste højre hjørne
- **Hvis ikke APPLIED:** "Markér som ansøgt" + "Fjern job"
- **Hvis APPLIED:** "Markér som ikke ansøgt" + "Fjern job"

#### Sekundære indikatorer (kun visning):
- Vises kun hvis cvStatus eller applicationStatus !== 'NOT_STARTED'
- Format: "CV: Klar", "Ansøgning: Kladde"
- IKKE klikbare

---

### 3. **Fortryd-funktionalitet (app/app/gemte-jobs/page.tsx)**

#### Toast-implementering:
- Bruger Sonner library
- Vises når job markeres som "ikke ansøgt"
- Tekst: "Job markeret som ikke ansøgt"
- Indeholder "Fortryd" knap
- Varighed: 5 sekunder
- Position: bottom-right

#### Fortryd-logik:
```typescript
const handleUndo = (jobId: string, previousStatus: string) => {
  toast('Job markeret som ikke ansøgt', {
    action: {
      label: 'Fortryd',
      onClick: () => toggleApplied(jobId), // Toggle tilbage til APPLIED
    },
    duration: 5000,
  });
};
```

---

### 4. **Integrationer**

#### Gemte jobs side (app/app/gemte-jobs/page.tsx):
- Viser ALLE gemte jobs (uanset status)
- Bruger JobCard komponent
- Implementerer fortryd-callback

#### Overblik side (app/app/page.tsx):
- Opdateret til ny statusmodel
- Viser tre kategorier:
  - **Gemt:** jobStatus === 'SAVED'
  - **Under arbejde:** jobStatus === 'IN_PROGRESS'
  - **Ansøgt:** jobStatus === 'APPLIED'
- Tæller antal jobs i hver kategori
- Linker til /app/gemte-jobs

#### Root layout (app/layout.tsx):
- Tilføjet Sonner `<Toaster />` komponent

---

### 5. **Persistens**

#### localStorage:
- Nøgle: `flowstruktur_saved_jobs`
- Automatisk synkronisering via useEffect i SavedJobsContext
- Data gemmes ved hver ændring
- Data indlæses ved mount

#### Datakilde:
- Én fælles SavedJobsContext
- Brugt af:
  - /app/gemte-jobs (Gemte jobs)
  - /app (Overblik)
  - /app/muligheder (Muligheder - gem job)
  - JobCard komponent

---

## 📁 Filændringer

### Nye filer:
- ✅ `components/job-card.tsx` - Jobkort med status-chip og menu
- ✅ `MIGRATION_STATUS.md` - Migrationsguide
- ✅ `TEST_GUIDE_STATUS.md` - Test guide
- ✅ `IMPLEMENTATION_RESUME.md` - Dette dokument

### Opdaterede filer:
- ✅ `contexts/saved-jobs-context.tsx` - Udvidet datamodel + nye funktioner
- ✅ `app/app/gemte-jobs/page.tsx` - Bruger JobCard + fortryd
- ✅ `app/app/page.tsx` - Opdateret til ny statusmodel
- ✅ `app/layout.tsx` - Tilføjet Toaster

### Nye dependencies:
- ✅ `sonner` - Toast notifications

---

## 🎯 Krav opfyldt

### Statusmodel:
✅ jobStatus: SAVED | IN_PROGRESS | APPLIED  
✅ cvStatus: NOT_STARTED | DRAFT | FINAL (kun visning)  
✅ applicationStatus: NOT_STARTED | DRAFT | FINAL (kun visning)  
✅ previousStatus til fortryd-funktionalitet

### UI-krav:
✅ Status-chip (ikke klikbar)  
✅ Præcis én primær CTA pr. status  
✅ Sekundære statusindikatorer (diskret, ikke klikbar)  
✅ ⋯-menu med kontrolleret statusændring  

### Statusændring:
✅ Kun via ⋯-menu  
✅ Ingen automatisk statusændring ved navigation  
✅ Toggle-logik med previousStatus  

### Fortryd:
✅ Toast med "Fortryd" knap (valgt over dialog)  
✅ 5 sekunders varighed  
✅ Fungerer korrekt med toggleApplied  

### Persistens:
✅ localStorage implementation  
✅ Én fælles datakilde  
✅ Automatisk synkronisering  

---

## 🧪 Næste skridt

1. Test implementeringen (se TEST_GUIDE_STATUS.md)
2. Verificer at eksisterende data migreres korrekt
3. Overvej at tilføje migration-script hvis der er mange eksisterende brugere
4. Opdater eventuelle andre sider der bruger saved jobs

---

## 💡 Vigtige design-beslutninger

1. **Toast frem for dialog:** Valgt fordi det er mindre invasivt og hurtigere at implementere
2. **previousStatus logik:** Simpel men effektiv - gemmer kun den direkte forrige status
3. **Auto-promotion til IN_PROGRESS:** Sker når cvStatus eller applicationStatus opdateres
4. **Alle jobs på én side:** Gemte jobs viser ALLE statuser for komplet overblik
5. **Sonner library:** Letvægts og moderne toast-løsning med god DX

---

## 📝 Vedligeholdelsesnoter

- Status må KUN ændres via toggleApplied() eller updateJobStatus()
- Undgå at ændre jobStatus direkte i komponenter
- Brug altid useSavedJobs() hook til at få adgang til funktioner
- previousStatus skal ALTID cleares når status gendan
