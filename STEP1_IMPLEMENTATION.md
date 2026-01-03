# Step 1: "Hvad vi udleder af dit CV" - Implementation Guide

## Overview

Step 1 er implementeret som en præcis, struktureret spejling af CV-indhold ved hjælp af OpenAI's GPT-4o med strict JSON output.

**Formål**: At vise brugeren hvad vi udleder af deres CV - IKKE at analysere, anbefale eller kritisere.

---

## Architecture

### Files

1. **API Route**: `/app/api/cv/derive-step1/route.ts`
   - OpenAI integration med strict JSON schema
   - Validering af output
   - Retry-logik ved fejl
   - Fallback strategy

2. **Frontend**: `/app/app/profil/page.tsx`
   - Step 1 UI komponenter
   - Integration med CV upload flow
   - Automatisk generering efter CV extraction

---

## OpenAI Configuration

### Model & Parameters

```typescript
Model: gpt-4o-mini
Temperature: 0.2
Top_p: 1
Frequency_penalty: 0
Presence_penalty: 0
Max_tokens: 800
Response_format: json_object (strict JSON mode)
```

### Why These Settings?

- **gpt-4o-mini**: Cost-effective, fast, yet capable model for structured extraction
- **Temperature 0.2**: Low value ensures consistent, factual output without creative deviations
- **Top_p 1**: Standard setting for deterministic output
- **Frequency/Presence penalty 0**: No penalty needed for factual extraction
- **Max tokens 800**: Sufficient for complete Step 1 response while preventing verbose outputs
- **json_object mode**: OpenAI's native JSON validation ensures parseable output

---

## JSON Schema

Step 1 output følger dette strenge schema:

```typescript
{
  headline: string,                    // Max 100 chars
  summary: string,                     // Max 500 chars
  roleIdentity: {
    title: string,                     // Primary role
    seniority: "junior"|"mid"|"senior"|"unknown",
    domain: string                     // Industry/field
  },
  highConfidenceHighlights: string[],  // 4-6 bullets, max 120 chars each
  toolsAndSystems: string[],           // 0-8 items
  industriesAndContexts: string[],     // 0-6 items
  languages: string[],                 // 0-6 items
  workHistoryOverview: {
    yearsExperienceApprox: string,     // "Ca. X år"
    careerProgressionNote: string      // Max 150 chars
  },
  dataExtracted: {
    name: string | null,
    email: string | null,
    phone: string | null,
    location: string | null
  },
  limitationsNote: string              // Max 250 chars
}
```

---

## OpenAI Prompt Strategy

Prompten er designet til at:

1. **Forhindre analyse**: Eksplicit forbyde anbefalinger, kritik, interview-prep
2. **Fremme spejling**: Kun faktuel, neutral præsentation af CV-indhold
3. **Sikre struktur**: Tvinge output til at følge JSON schema 100%
4. **Håndtere usikkerhed**: Instruere modellen til at UDELADE usikker information

### System Prompt (STRAM OG KONTROLLERET)

```
Du er en præcis CV-udtræker. Din ENESTE opgave er at strukturere information fra et CV i JSON-format.

ABSOLUTTE FORBUD:
- Anbefalinger eller råd
- Analyse eller vurdering
- Interview-forberedelse
- "Du bør" eller "Vi anbefaler"
- Svagheder eller gaps
- Spekulationer

KUN TILLADT:
- Beskrive hvad der faktisk står i CV'et
- Neutral til let positiv tone
- Udelade usikre oplysninger

OUTPUT:
Returnér KUN valid JSON. Ingen markdown. Ingen forklaringer. KUN JSON.

SPROG: Dansk
```

### User Prompt Structure

User prompt inkluderer:
1. CV-tekst
2. Pre-extracted kontaktinfo (hvis tilgængelig)
3. Gentagne regler
4. STRICT JSON schema med alle constraints
5. Eksplicit instruktion: "Alt udenfor JSON er ugyldigt output"

---

## Validation & Error Handling

### 3-Level Validation

1. **JSON Parsing**: Kan responsen parses som valid JSON?
2. **Schema Validation**: Matcher alle felter schema?
3. **Constraint Validation**: Er længdebegrænsninger overholdt?

### Retry Strategy

```
Attempt 1: Normal derivation
↓ (hvis fejl)
Attempt 2: JSON fix prompt (forsøg at rette det invalid JSON)
↓ (hvis fejl)
Fallback: Returnér pre-defined fallback response
```

### Fallback Response

Hvis begge forsøg fejler, returneres et neutral fallback der:
- Informerer om tekniske problemer
- Beder brugeren prøve igen
- Undgår at vise halv-færdig eller invalid data

---

## Hvordan vi sikrer at Step 1 IKKE bliver analyse

### 1. Prompt Engineering

Prompten indeholder eksplicitte FORBUD mod:
- Anbefalinger ("du bør...")
- Kritik ("mangler...", "begrænset...")
- Vurderinger ("godt match til...")
- Interview-forberedelse

### 2. Tone Guidelines

```
✅ Neutral til let positiv
✅ Faktuel
✅ "CV'et viser..."
✅ "Der er erfaring med..."

❌ Vurderende
❌ "Dette er stærkt"
❌ "Du mangler..."
❌ "Forbered dig på..."
```

### 3. High-Confidence Only

Modellen instrueres til at UDELADE information hvis:
- Ikke tydeligt dokumenteret i CV
- Kræver gætteri eller antagelser
- Er usikker på fortolkning

Usikkerheder noteres i `limitationsNote` i stedet.

### 4. Struktureret Output

Ved at tvinge output til faste felter:
- Ingen fri-form tekst hvor analyse kan snige sig ind
- Hver sektion har klart defineret formål
- Længdebegrænsninger forhindrer lange forklaringer

---

## UI Implementation

### Step 1 Visning

Step 1 vises som strukturerede sektioner:

1. **Headline & Summary** - Overordnet præsentation
2. **Din professionelle identitet** - Rolle, senioritet, domæne
3. **Det vi tydeligt kan se** - High-confidence highlights (grøn)
4. **Værktøjer & Systemer** - Badges
5. **Brancher & Kontekster** - Badges
6. **Sprog** - Badges
7. **Erhvervserfaring** - Kort overview
8. **Kontaktoplysninger** - Fra CV
9. **Bemærk** - Limitations note (gul/amber)

### Flow Integration

```
CV Upload
    ↓
CV Extraction (parser fil)
    ↓
Step 1 Generation (dette API)
    ↓
Vis Step 1 UI
    ↓
Fortsæt til Personality Questionnaire
```

---

## Testing

### Test Cases

1. **Normal CV**: Komplet CV med klar rolle, erfaring, værktøjer
   - Forventet: Alle felter udfyldt korrekt

2. **Minimal CV**: Kun navn og 1-2 jobs
   - Forventet: Begrænsede lister, udvidet limitationsNote

3. **Uklart CV**: Blandet indhold, uklar rolle
   - Forventet: seniority="unknown", begrænset highConfidenceHighlights

4. **Invalid JSON Response** (simuleret):
   - Forventet: Retry + fallback

### Test Data

Se `loadTestData()` i `/app/app/profil/page.tsx` for mock data.

---

## Cost Considerations

### Per Request

- Model: gpt-4o-mini
- Avg input: ~1000-3000 tokens (CV text + prompt)
- Avg output: ~400-600 tokens (JSON response, max 800)
- Cost: ~$0.001-0.003 per request (meget billigere end gpt-4o)

### Optimization

- Max tokens sat til 800 (forhindrer lange, dyre outputs)
- Retry kun én gang (max 2 API calls per request)
- JSON mode reducerer token waste fra markdown formatting
- gpt-4o-mini: ~10x billigere end gpt-4o

---

## Maintenance

### Når du skal opdatere Step 1:

1. **Tilføj nyt felt til schema**:
   - Opdater TypeScript interface
   - Opdater JSON schema i system prompt
   - Tilføj til validation function
   - Tilføj til UI visning

2. **Ændre tone/stil**:
   - Opdater system prompt guidelines
   - Test med forskellige CV'er
   - Verificer at det stadig er "spejling" ikke "analyse"

3. **Håndter ny edge case**:
   - Identificer mønster
   - Tilføj til system prompt
   - Tilføj til validation hvis relevant

---

## Common Issues & Solutions

### Issue: Output bliver for analytisk

**Solution**: 
- Tilføj mere eksplicitte forbud i system prompt
- Reducer temperature yderligere (til 0.1)
- Tilføj eksempler på korrekt vs. forkert tone i prompt

### Issue: JSON parsing fejler ofte

**Solution**:
- Verificer at `response_format: { type: 'json_object' }` er sat
- Check om max_tokens er for lav (øg til 1000 hvis nødvendigt)
- Implementer bedre JSON-fix retry prompt
- Sikr at system prompt eksplicit siger "KUN JSON"

### Issue: highConfidenceHighlights er tomme eller få

**Solution**:
- Prompten kan være for streng med "high confidence"
- Tilføj guidance om hvad der tæller som "high confidence"
- Implementer min/max validation (4-6 bullets er required)

---

## Future Improvements

1. **Caching**: Cache Step 1 results for samme CV
2. **Streaming**: Stream JSON response for hurtigere UI feedback
3. **A/B Testing**: Test forskellige prompt variationer
4. **User Feedback**: Tillad brugere at rapportere upræcist Step 1 output
5. **Multi-language**: Support for CV'er på engelsk/andre sprog

---

## Contact & Questions

For spørgsmål eller problemer med Step 1 implementering, se:
- API route kommentarer i `/app/api/cv/derive-step1/route.ts`
- System prompt i samme fil
- UI integration i `/app/app/profil/page.tsx`
