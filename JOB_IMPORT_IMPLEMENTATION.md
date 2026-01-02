# Job Import Feature - Implementering Komplet

## Oversigt
"Importér job via URL" funktionen er nu implementeret på `/app/muligheder`. Brugere kan indsætte et link til et jobopslag, få det automatisk parset, redigere informationen, og gemme det til deres job-flow.

## Implementerede Filer

### 1. API Route: `/app/api/job/import/route.ts`
**Server-side endpoint** der håndterer job import med følgende funktionalitet:

#### Sikkerhed
- ✅ URL validation (kun HTTP/HTTPS)
- ✅ SSRF protection (blokerer localhost og private IPs)
- ✅ 10 sekunders timeout på fetch requests
- ✅ Fejlhåndtering og graceful degradation

#### Parsing Strategi (MVP uden headless browser)
**Titel extraction:**
- Prioritet: `<meta property="og:title">` → `<title>` → `<h1>`

**Virksomhed extraction:**
- Prioritet: `<meta property="og:site_name">` → structured data (JSON-LD) → heuristik

**Lokation extraction:**
- Fra JSON-LD structured data hvis tilgængelig

**Jobtekst extraction:**
- Prioriterer: `<main>` → `<article>` → `[role="main"]` → `<body>` (fallback)
- Fjerner: `<script>`, `<style>`, `<nav>`, `<footer>`, `<header>`, navigations- og ad-elementer
- Normaliserer whitespace og linjeskift

#### Fallback Håndtering
Hvis `descriptionClean` er tom eller < 500 tegn:
- Returnerer `parseFailed: true`
- Brugeren får mulighed for manuel indtastning
- Bevarer metadata (sourceUrl, sourceDomain, fetchedAt)

### 2. UI Komponent: `/components/job-importer.tsx`
**3-trins import flow:**

#### Trin 1: Input
- URL input felt med placeholder tekst
- "Importér job" knap med loading state
- Fejlbeskeder ved valideringsfejl
- Instruktionsboks der forklarer processen

#### Trin 2: Review (når parsing lykkes)
- ✅ Editable felter: Titel*, Virksomhed, Lokation, Jobtekst*
- ✅ Viser kilde-URL (read-only) med ekstern link
- ✅ Viser hentet tidspunkt
- ✅ Tegntæller på jobtekst
- ✅ "Gem job og fortsæt" + "Annullér" knapper
- ✅ Validering: Titel og jobtekst (min 50 tegn) er påkrævet

#### Trin 3: Manual (når parsing fejler)
- ⚠️ Advarselsboks forklarer hvorfor automatisk parsing fejlede
- 📋 Store textarea til manuel paste af jobtekst
- ✅ Samme validering som review-trinnet
- ℹ️ Guider brugeren til at kopiere fra hjemmesiden

#### Features
- **Dedupe check:** Tjekker om job med samme sourceUrl allerede er gemt
- **Navigation:** Efter gem → `/app/job/{jobId}/cv`
- **Fejlhåndtering:** Viser tydelige fejlbeskeder ved problemer
- **Accessibility:** Alle felter har labels, ARIA support via Radix UI

### 3. Integration: `/app/app/muligheder/page.tsx`
- ✅ JobImporter komponenten placeret øverst på siden (før intro card)
- ✅ Fremhævet med border (`border-2 border-primary/20`)
- ✅ Ingen breaking changes til eksisterende funktionalitet

### 4. Job Data Model Integration
Jobs gemmes via `saved-jobs-context` med følgende struktur:

```typescript
{
  id: `imported-${timestamp}-${random}`,
  title: string,
  company?: string,
  location?: string,
  description: string,
  source: 'imported',
  jobStatus: 'SAVED',
  cvStatus: 'NOT_STARTED',
  applicationStatus: 'NOT_STARTED',
  createdAt: ISO timestamp,
  updatedAt: ISO timestamp,
  fullData: {
    sourceUrl: string,
    sourceDomain: string,
    fetchedAt: ISO timestamp,
    importMethod: 'auto' | 'paste',
    ...
  }
}
```

## Hvorfor Server-Side Fetch?

**Problem:** Browser fetch requests til eksterne domæner bliver blokeret af CORS (Cross-Origin Resource Sharing).

**Løsning:** Server-side fetch i Next.js API route:
- ✅ Ingen CORS restriktioner (serveren kan fetche frit)
- ✅ Mulighed for at sætte custom User-Agent
- ✅ Bedre sikkerhedskontrol (SSRF protection)
- ✅ Timeout håndtering
- ✅ Kan håndtere redirects korrekt

## Hvordan Fallback Fungerer

### Automatisk Parsing Lykkes
1. Bruger indsætter URL
2. Server fetcher HTML
3. Cheerio parser HTML og udtrækker data
4. Data sendes til client
5. Bruger kan review/redigere
6. Gem og fortsæt til job flow

### Automatisk Parsing Fejler
1. Bruger indsætter URL
2. Server fetcher HTML MEN:
   - Jobtekst er for kort (< 500 tegn)
   - Indhold er dynamisk loaded med JavaScript
   - Anti-bot beskyttelse blokerer indhold
3. `parseFailed: true` returneres
4. UI skifter til "manual mode"
5. Bruger kopierer jobtekst manuelt fra browser
6. Titel/virksomhed kan stadig være auto-udfyldt hvis fundet
7. Gem og fortsæt til job flow

## Typiske Fejl-Scenarier

### 1. JavaScript-Rendered Content
**Eksempel:** React/Vue/Angular apps der loader indhold dynamisk
**Problem:** Server-side fetch får kun tom HTML shell
**Løsning:** Fallback til manuel paste

### 2. Anti-Bot Beskyttelse
**Eksempel:** Cloudflare, reCAPTCHA, rate limiting
**Problem:** Server får 403/429 eller challenge-side
**Løsning:** Fallback til manuel paste

### 3. Login-Protected Content
**Eksempel:** Jobs på LinkedIn, interne jobboards
**Problem:** Kræver authentication cookies
**Løsning:** Fallback til manuel paste

### 4. Dynamiske Job Boards
**Eksempel:** Jobindex, StepStone med infinite scroll
**Problem:** Job-detaljer loader via AJAX efter page load
**Løsning:** Fallback til manuel paste

## Fremtidige Forbedringer (Uden for MVP)

### Headless Browser Option
- Puppeteer/Playwright for JavaScript-rendered sites
- Højere success rate men meget dyrere i compute
- Kan håndtere dynamisk content
- Kræver mere infrastruktur (Docker, længere timeouts)

### AI-Enhanced Parsing
- Brug GPT til at udtrække strukturerede data fra råtekst
- Bedre håndtering af ukonventionelle layouts
- Automatisk kategorisering af job requirements
- Dyrere per request

### Job Board Integrations
- Direkte API integration med Jobindex, LinkedIn, etc.
- Kræver partnerships eller scraping agreements
- Bedre data quality og metadata
- Maintenance overhead

### Caching
- Cache parsed jobs by URL (Redis/database)
- Reducer redundant fetches
- Expire after X dage

## Test Cases

### Happy Path
1. ✅ Indsæt valid job URL fra virksomhedsside
2. ✅ Auto-parse lykkes med komplet data
3. ✅ Review og evt. redigér
4. ✅ Gem job
5. ✅ Navigér til `/app/job/{id}/cv`

### Fallback Path
1. ✅ Indsæt URL til JavaScript-heavy site
2. ✅ Auto-parse fejler (parseFailed: true)
3. ✅ Manuel input form vises
4. ✅ Bruger kopierer og indsætter jobtekst
5. ✅ Gem job
6. ✅ Navigér til job flow

### Error Paths
1. ✅ Invalid URL → Validation error
2. ✅ localhost/private IP → SSRF blocked
3. ✅ Timeout → Graceful fallback
4. ✅ Duplicate URL → "Job already imported" besked
5. ✅ Network error → User-friendly error message

## Dependencies
```json
{
  "cheerio": "^1.0.0",  // HTML parsing
  "@types/cheerio": "^0.22.35"  // TypeScript types
}
```

## Deployment Notes
- ✅ Server-side routes fungerer out-of-the-box på Vercel
- ✅ Ingen environment variables nødvendige for MVP
- ✅ 10 sekund timeout passer inden for Vercel's grænser (default 10s)
- ⚠️ For produktion: overvej rate limiting på `/api/job/import`
- ⚠️ For produktion: log og monitor parse success rates

## Bruger-Facing Features Checklist
- ✅ URL input med auto-import
- ✅ Loading states under import
- ✅ Auto-udfyldte felter fra parsing
- ✅ Editable review step
- ✅ Manuel fallback når parsing fejler
- ✅ Dedupe detection
- ✅ Gem til job store (single source of truth)
- ✅ Direkte navigation til job flow efter gem
- ✅ Kilde-URL bevares for reference
- ✅ Instruktioner og hjælpetekster
- ✅ Fejlhåndtering med klare beskeder
- ✅ Responsivt design
- ✅ Accessibility support

## Konklusion
Funktionen er **produktionsklar** som MVP. Den håndterer success cases elegant og degraderer gracefully når automatisk parsing ikke er mulig. Fallback til manuel indtastning sikrer at brugeren altid kan importere et job, uanset tekniske begrænsninger.

**Status:** ✅ FEATURE COMPLETE & TESTED
