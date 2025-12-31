# Komplet Statusmodel - Implementeringsrapport

## ✅ Implementering Fuldført

Alle krav fra opgaven er nu implementeret og deployed til Vercel.

---

## 📊 DATAMODEL

### SavedJob Interface
```typescript
interface SavedJob {
  id: string;
  title: string;
  company?: string;
  description?: string;
  source?: string;
  
  // Status fields
  jobStatus: 'SAVED' | 'IN_PROGRESS' | 'APPLIED';
  previousStatus?: 'SAVED' | 'IN_PROGRESS';  // For revert
  cvStatus: 'NOT_STARTED' | 'DRAFT' | 'FINAL';
  applicationStatus: 'NOT_STARTED' | 'DRAFT' | 'FINAL';
  
  // Timestamps
  createdAt: string;   // ISO
  updatedAt: string;   // ISO
  
  fullData?: any;
}
```

### Defaults for Nye Jobs
Når et job gemmes via `saveJob()`:
- `jobStatus = 'SAVED'`
- `cvStatus = 'NOT_STARTED'`
- `applicationStatus = 'NOT_STARTED'`
- `createdAt` og `updatedAt` sættes til current timestamp

---

## 🏗️ SINGLE SOURCE OF TRUTH

### Implementering
**Context:** `contexts/saved-jobs-context.tsx`
- React Context med localStorage persistence
- Nøgle: `flowstruktur_saved_jobs`
- Automatisk synkronisering ved alle ændringer

### Hvor Bruges Context
✅ `/app/muligheder` - Gem job  
✅ `/app/gemte-jobs` - Jobkort oversigt  
✅ `/app` - Overblik dashboard  
✅ `/app/job/[jobId]/cv` - CV-arbejdszone  
✅ `/app/job/[jobId]/ansøgning` - Ansøgning-arbejdszone  

**Ingen divergens:** Alle sider læser fra samme store via `useSavedJobs()` hook.

---

## 🎯 STATUSDESIGN PÅ JOBCARD

### Status-chip (Read-Only)
```
SAVED       → "Gemt"
IN_PROGRESS → "Under arbejde"
APPLIED     → "Ansøgt"
```
- Ikke klikbar
- Vises øverst til højre på jobkortet

### Primær CTA (Dynamisk)
```
SAVED       → "Arbejd videre"
IN_PROGRESS → "Fortsæt arbejdet"
APPLIED     → "Se detaljer"
```
- Kalder `markInProgress()` ved klik (kun hvis SAVED)
- Navigerer til `/app/job/[jobId]/cv`

### Sekundær Info (Display Only)
```
cvStatus:
  NOT_STARTED → skjules
  DRAFT       → "CV: Kladde"
  FINAL       → "CV: Klar"

applicationStatus:
  NOT_STARTED → skjules
  DRAFT       → "Ansøgning: Kladde"
  FINAL       → "Ansøgning: Klar"
```

### ⋯-menu (Overflow)
**Hvis jobStatus !== APPLIED:**
- "Markér som ansøgt"

**Hvis jobStatus === APPLIED:**
- "Markér som ikke ansøgt"

**Altid:**
- "Fjern job"

### Fortryd-funktionalitet
Ved "Markér som ikke ansøgt":
- Toast vises med tekst: "Job markeret som ikke ansøgt"
- Toast har "Fortryd" knap
- Duration: 5 sekunder
- Klik på "Fortryd" kalder `toggleApplied()` igen

---

## 🔄 STATUS TRANSITIONS

### toggleApplied(jobId)
```typescript
// Hvis jobStatus !== 'APPLIED':
previousStatus = jobStatus  // Gem current status
jobStatus = 'APPLIED'

// Hvis jobStatus === 'APPLIED':
jobStatus = previousStatus hvis findes, ellers:
  hvis cvStatus !== 'NOT_STARTED' ELLER applicationStatus !== 'NOT_STARTED':
    jobStatus = 'IN_PROGRESS'
  ellers:
    jobStatus = 'SAVED'
previousStatus = undefined
```

### markInProgress(jobId)
Kaldes eksplicit fra "Arbejd videre" knappen:
```typescript
hvis jobStatus === 'SAVED':
  jobStatus = 'IN_PROGRESS'
  updatedAt = now()
```

**Kritisk:** Sker KUN ved brugerklik, ikke ved navigation.

---

## 📝 DOKUMENTSTATUS (CV & ANSØGNING)

### CV-side (/app/job/[jobId]/cv)

**UI-elementer:**
1. Status-badge: Viser current cvStatus
2. "Gem kladde" knap → `setCvStatus(jobId, 'DRAFT')`
3. "Markér CV som klar" knap → `setCvStatus(jobId, 'FINAL')`

**Adfærd:**
- Klik på "Gem kladde": Sætter cvStatus = 'DRAFT' + auto-promoverer til IN_PROGRESS hvis SAVED
- Klik på "Markér som klar": Sætter cvStatus = 'FINAL' (kræver alle sektioner godkendt)
- Ingen automatisk statusændring ved sidevisning

### Ansøgning-side (/app/job/[jobId]/ansøgning)

**Guard:**
Hvis cvStatus !== 'FINAL':
- Viser alert med anbefaling: "Før du skriver ansøgningen, anbefales det at gøre CV'et klar først"
- Blokerer IKKE adgang (soft guard)

**UI-elementer:**
1. Status-badge: Viser current applicationStatus
2. "Gem kladde" knap → `setApplicationStatus(jobId, 'DRAFT')`
3. "Markér ansøgning som klar" knap → `setApplicationStatus(jobId, 'FINAL')`

**Adfærd:**
- Samme disciplin som CV-siden
- Auto-promoverer til IN_PROGRESS hvis nødvendigt
- Ingen automatisk statusændring

---

## 📍 OVERBLIK-SIDEN

### Data Source
Læser direkte fra `useSavedJobs()` context - **ingen dummy data**.

### Visning
```typescript
const savedJobsList = savedJobs.filter(j => j.jobStatus === 'SAVED');
const inProgressJobs = savedJobs.filter(j => j.jobStatus === 'IN_PROGRESS');
const appliedJobs = savedJobs.filter(j => j.jobStatus === 'APPLIED');

// Sortér efter senest opdateret
const recentJobs = [...savedJobs]
  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  .slice(0, 5);
```

### Tre Kategorier
1. **Gemt** - jobStatus = SAVED
2. **Under arbejde** - jobStatus = IN_PROGRESS
3. **Ansøgt** - jobStatus = APPLIED

---

## 🔐 SIKKERHED MOD AUTO-STATUSÆNDRING

### ✅ Ingen Automatisk Statusændring Ved:
- Åbning af /app/job/[jobId]/cv
- Åbning af /app/job/[jobId]/ansøgning
- Navigation mellem sider
- Download af CV
- Kopiering af ansøgningstekst

### ✅ Status Ændres KUN Ved:
1. Brugerklik på "Arbejd videre" → markInProgress()
2. Brugerklik på "Gem kladde" → setCvStatus/setApplicationStatus
3. Brugerklik på "Markér som klar" → setCvStatus/setApplicationStatus
4. Brugerklik på "Markér som ansøgt" → toggleApplied()
5. Brugerklik på "Markér som ikke ansøgt" → toggleApplied()

---

## 🛠️ CONTEXT API FUNKTIONER

```typescript
interface SavedJobsContextType {
  // State
  savedJobs: SavedJob[];
  
  // CRUD
  saveJob: (job) => void;
  unsaveJob: (jobId) => void;
  getJobById: (jobId) => SavedJob | undefined;
  isJobSaved: (jobId) => boolean;
  
  // Status Operations
  updateJobStatus: (jobId, jobStatus) => void;
  markInProgress: (jobId) => void;        // Eksplicit IN_PROGRESS
  toggleApplied: (jobId) => void;         // Toggle APPLIED
  
  // Document Status
  setCvStatus: (jobId, status) => void;
  setApplicationStatus: (jobId, status) => void;
}
```

---

## 📦 PERSISTENS

### localStorage
- **Nøgle:** `flowstruktur_saved_jobs`
- **Format:** JSON array af SavedJob objekter
- **Synkronisering:** Automatisk ved alle ændringer
- **Load:** Ved mount af SavedJobsProvider

### Migration
Eksisterende jobs uden nye felter får automatisk:
- `cvStatus: 'NOT_STARTED'`
- `applicationStatus: 'NOT_STARTED'`
- `createdAt: <current timestamp>`
- `updatedAt: <current timestamp>`

---

## 🎨 UI-KOMPONENTER

### JobCard (components/job-card.tsx)
- Status-chip
- Primær CTA med markInProgress
- Sekundære indikatorer
- ⋯-menu med toggleApplied
- Fortryd via toast

### CV-side
- CV-status badge
- "Gem kladde" knap
- "Markér CV som klar" knap
- Sektionsgennemgang

### Ansøgning-side
- Guard hvis CV ikke klar
- Ansøgning-status badge
- "Gem kladde" knap
- "Markér ansøgning som klar" knap
- Generer og rediger tekst

---

## 📝 TESTSCENARIER

### 1. Gem Nyt Job
✅ jobStatus = SAVED  
✅ cvStatus = NOT_STARTED  
✅ applicationStatus = NOT_STARTED  

### 2. Klik "Arbejd videre"
✅ jobStatus skifter til IN_PROGRESS  
✅ Navigerer til CV-siden  

### 3. Åbn CV-siden (når SAVED)
✅ Status forbliver SAVED  
✅ Ingen automatisk ændring  

### 4. Klik "Gem kladde" på CV
✅ cvStatus = DRAFT  
✅ jobStatus skifter til IN_PROGRESS (hvis var SAVED)  

### 5. Klik "Markér CV som klar"
✅ cvStatus = FINAL  

### 6. Åbn Ansøgning (CV ikke klar)
✅ Guard vises  
✅ Kan stadig arbejde videre  

### 7. Klik "Markér som ansøgt"
✅ previousStatus gemmes  
✅ jobStatus = APPLIED  
✅ Toast med "Fortryd" vises  

### 8. Klik "Fortryd" i toast
✅ jobStatus går tilbage til previousStatus  

### 9. Klik "Markér som ikke ansøgt"
✅ jobStatus gendan fra previousStatus  
✅ Toast vises igen  

### 10. Tjek Overblik
✅ Viser korrekte counts  
✅ Sorteret efter updatedAt  
✅ Ingen dummy data  

---

## 🚀 DEPLOYMENT

**Commits:**
1. `0679e26` - Initial statusdesign implementation
2. `72e09f9` - Komplet statusmodel med eksplicitte triggers

**Branch:** main  
**Remote:** GitHub  
**Deployment:** Vercel (automatisk)  

---

## 📚 DOKUMENTATION

Følgende filer er oprettet:
- ✅ MIGRATION_STATUS.md - Migrationsguide
- ✅ TEST_GUIDE_STATUS.md - Test guide
- ✅ IMPLEMENTATION_RESUME.md - Første implementation
- ✅ STATUS_MODEL_COMPLETE.md - Denne fil

---

## ✨ HØJDEPUNKTER

1. **Single Source of Truth** - Én context, alle sider synkroniserede
2. **Eksplicitte Triggers** - Status ændres KUN ved brugerhandling
3. **Fortryd-funktionalitet** - Toast med undo for APPLIED status
4. **Dokumentstatus** - Separat tracking af CV og ansøgning progress
5. **Guard på Ansøgning** - Soft warning hvis CV ikke er klar
6. **Timestamps** - createdAt/updatedAt for sortering og audit trail
7. **Ingen Automatik** - Navigation ændrer ALDRIG status
8. **Clean Architecture** - Klar separation mellem UI og state

---

## 🎯 KRAVOPFYLDELSE

✅ Konsistent statusmodel (SAVED/IN_PROGRESS/APPLIED)  
✅ Dokumentstatus (cvStatus, applicationStatus)  
✅ Klare transitions med previousStatus  
✅ Single source of truth (SavedJobsContext)  
✅ Overblik og Gemte jobs læser samme data  
✅ Status ændres KUN ved eksplicit handling  
✅ Fortryd-funktionalitet for APPLIED  
✅ Guard på ansøgning hvis CV ikke klar  
✅ Timestamps (createdAt/updatedAt)  
✅ localStorage persistens  
✅ Alle UI-krav opfyldt  

**Status: 100% Implementeret** ✨
