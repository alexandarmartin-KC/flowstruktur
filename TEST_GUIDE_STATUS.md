# Test Guide: Status Design Implementation

## Hvordan man tester funktionaliteten

### 1. Gem et job
1. Naviger til `/app/muligheder`
2. Gem et job
3. Verificer at jobStatus = 'SAVED', cvStatus = 'NOT_STARTED', applicationStatus = 'NOT_STARTED'

### 2. Se jobkort på "Gemte jobs"
1. Naviger til `/app/gemte-jobs`
2. Se jobkortet med:
   - Status-chip: "Gemt" (grå)
   - Primær CTA: "Arbejd videre"
   - ⋯-menu i øverste højre hjørne

### 3. Test ⋯-menu statusændring
1. Klik på ⋯-ikonet på et jobkort
2. Vælg "Markér som ansøgt"
3. Verificer:
   - Status-chip ændres til "Ansøgt" (grøn border)
   - Primær CTA ændres til "Se detaljer"
   - ⋯-menu viser nu "Markér som ikke ansøgt"

### 4. Test fortryd-funktionalitet
1. Klik på ⋯-ikonet på et APPLIED job
2. Vælg "Markér som ikke ansøgt"
3. Verificer:
   - Toast vises nederst til højre med teksten "Job markeret som ikke ansøgt"
   - Toast har en "Fortryd" knap
4. Klik på "Fortryd" før toast forsvinder (5 sek)
5. Verificer:
   - Jobbet sættes tilbage til APPLIED status

### 5. Test previousStatus logik
1. Gem et nyt job (status: SAVED)
2. Naviger til job og start CV-tilpasning (simulator at cvStatus bliver 'DRAFT')
3. Job skulle nu automatisk være IN_PROGRESS
4. Markér job som ansøgt via ⋯-menu
5. Verificer previousStatus = 'IN_PROGRESS' (check i localStorage)
6. Markér som ikke ansøgt
7. Verificer at jobbet går tilbage til IN_PROGRESS (ikke SAVED)

### 6. Test Overblik side
1. Naviger til `/app` (Overblik)
2. Verificer at antal jobs vises korrekt i tre kategorier:
   - Gemt
   - Under arbejde
   - Ansøgt

### 7. Test localStorage persistens
1. Opdater status på flere jobs
2. Genindlæs siden (F5)
3. Verificer at alle statusser er bevaret

### 8. Test responsivt design
1. Skift til mobil viewport
2. Verificer at jobkort, status-chips og ⋯-menu vises korrekt

## Forventet adfærd

### Status-chip
- Aldrig klikbar
- Viser altid én af: "Gemt", "Under arbejde", "Ansøgt"
- Farve/styling ændres baseret på status

### Primær CTA
- Altid synlig
- Tekst ændres baseret på jobStatus
- Linker til `/app/job/{jobId}/cv`

### ⋯-menu
- Altid placeret i øverste højre hjørne af jobkortet
- Indeholder handlinger afhængigt af status
- Viser confirm/undo via toast (ikke dialog)

### Sekundære indikatorer
- Kun synlige hvis cvStatus eller applicationStatus !== 'NOT_STARTED'
- Viser diskret info: "CV: Klar" eller "Ansøgning: Kladde"
- IKKE klikbare

## Debug tips

### Check localStorage
```javascript
// I browser console:
const data = localStorage.getItem('flowstruktur_saved_jobs');
console.log(JSON.parse(data));
```

### Check context state
Tilføj midlertidigt i komponent:
```typescript
const { savedJobs } = useSavedJobs();
console.log('Current jobs:', savedJobs);
```

### Reset al data
```javascript
// I browser console:
localStorage.removeItem('flowstruktur_saved_jobs');
window.location.reload();
```
