# Migration Guide: Status Model Implementation

## Oversigt

Dette dokument beskriver implementeringen af den nye statusmodel for jobkort.

## Datamodel-ændringer

### Før (gammel model):
```typescript
interface SavedJob {
  status: 'SAVED' | 'IN_PROGRESS' | 'APPLIED';
}
```

### Efter (ny model):
```typescript
interface SavedJob {
  jobStatus: 'SAVED' | 'IN_PROGRESS' | 'APPLIED';
  cvStatus: 'NOT_STARTED' | 'DRAFT' | 'FINAL';
  applicationStatus: 'NOT_STARTED' | 'DRAFT' | 'FINAL';
  previousStatus?: 'SAVED' | 'IN_PROGRESS';
}
```

## Nøglefunktioner

### 1. toggleApplied(jobId)
Implementeret i `contexts/saved-jobs-context.tsx`

**Logik:**
- Hvis job ikke er APPLIED:
  - Gem nuværende status i `previousStatus`
  - Sæt `jobStatus = 'APPLIED'`
- Hvis job er APPLIED:
  - Gendan fra `previousStatus` hvis den findes
  - Ellers beregn baseret på cv/application status:
    - Hvis cvStatus eller applicationStatus !== 'NOT_STARTED' → 'IN_PROGRESS'
    - Ellers → 'SAVED'

### 2. updateSubStatus(jobId, type, status)
Opdaterer cv eller application status og auto-promoverer til IN_PROGRESS hvis nødvendigt.

## UI-komponenter

### JobCard (`components/job-card.tsx`)
Ny komponent med:
- **Status-chip** (ikke klikbar): Viser aktuel jobStatus
- **Primær CTA**: Dynamisk baseret på status
  - SAVED → "Arbejd videre"
  - IN_PROGRESS → "Fortsæt arbejdet"
  - APPLIED → "Se detaljer"
- **⋯-menu**: Kontrolleret statusændring
  - "Markér som ansøgt" (når ikke APPLIED)
  - "Markér som ikke ansøgt" (når APPLIED)
  - "Fjern job"
- **Sekundære indikatorer**: CV og ansøgning status (kun visning)

### Fortryd-funktionalitet
Implementeret med Sonner toast i `app/app/gemte-jobs/page.tsx`:
- Toast vises når job markeres som ikke ansøgt
- "Fortryd" knap tillader at angre ændringen i 5 sekunder

## Persistens

- State gemmes i localStorage under nøgle: `flowstruktur_saved_jobs`
- Automatisk synkronisering mellem alle sider der bruger `useSavedJobs()`

## Migration af eksisterende data

Eksisterende data i localStorage vil automatisk få:
- `cvStatus: 'NOT_STARTED'`
- `applicationStatus: 'NOT_STARTED'`

når et nyt job gemmes via `saveJob()`.

## Brug af context

```typescript
import { useSavedJobs } from '@/contexts/saved-jobs-context';

function MyComponent() {
  const { 
    savedJobs,           // Alle gemte jobs
    toggleApplied,       // Toggle APPLIED status
    updateSubStatus,     // Opdater cv/application status
    saveJob,             // Gem nyt job
    unsaveJob,           // Fjern job
  } = useSavedJobs();
}
```

## Filændringer

### Nye filer:
- `components/job-card.tsx` - Jobkort komponent med status-chip og menu

### Opdaterede filer:
- `contexts/saved-jobs-context.tsx` - Udvidet datamodel og nye funktioner
- `app/app/gemte-jobs/page.tsx` - Bruger JobCard og fortryd-funktionalitet
- `app/app/page.tsx` - Opdateret til ny statusmodel (Overblik)
- `app/layout.tsx` - Tilføjet Sonner Toaster

### Installerede pakker:
- `sonner` - Toast notifications
