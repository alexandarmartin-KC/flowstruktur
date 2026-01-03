# OpenAI Configuration for Step 1 - Technical Specification

## 🎯 Konfiguration (SKAL FØLGES)

### Model & Parametre

```typescript
{
  model: 'gpt-4o-mini',
  temperature: 0.2,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
  max_tokens: 800,
  response_format: { type: 'json_object' }
}
```

**VIGTIGT**: Disse parametre sættes PER REQUEST i koden.  
Intet må afhænge af OpenAI dashboard-indstillinger.

---

## 📋 Parametre Forklaring

### model: 'gpt-4o-mini'

**Hvorfor ikke gpt-4o eller gpt-4?**
- gpt-4o-mini er ~10x billigere end gpt-4o
- Stærk til struktureret udvinding (JSON)
- Hurtigere response times
- Tilstrækkelig til faktuel CV-spejling

**Cost comparison** (ca. priser):
- gpt-4o: $0.015-0.04 per request
- gpt-4o-mini: $0.001-0.003 per request
- 10-15x billigere for samme opgave

### temperature: 0.2

**Hvad betyder det?**
- 0 = helt deterministisk (samme input → samme output)
- 1 = maksimal kreativitet
- 0.2 = meget lav, kun minimal variation

**Hvorfor 0.2?**
- Vi vil have faktuel spejling, ikke kreativitet
- Konsistent output på tværs af requests
- Forhindrer "fantasifulde" tilføjelser
- Stadig nok flexibility til naturligt sprog

### top_p: 1

**Hvad betyder det?**
- Nucleus sampling parameter
- 1 = ingen begrænsning (standard)
- Lavere værdier begrænser ordvalg

**Hvorfor 1?**
- Standard setting for temperature-baseret control
- Vi styrer determinisme via temperature
- Ingen grund til yderligere begrænsning

### frequency_penalty: 0

**Hvad betyder det?**
- Straffer gentagelser af tokens
- 0 = ingen straf
- Positive værdier = mindre gentagelser

**Hvorfor 0?**
- CV-spejling kan KRÆVE gentagelser (fx "React" flere gange)
- Vi ønsker ikke kunstig variation for variationens skyld
- Output styres af schema, ikke penalty

### presence_penalty: 0

**Hvad betyder det?**
- Straffer tokens der allerede er nævnt
- 0 = ingen straf
- Positive værdier = mere diverse sprog

**Hvorfor 0?**
- Samme årsag som frequency_penalty
- Vi vil have præcist sprog, ikke tvungen diversity
- JSON-struktur sikrer allerede varieret output

### max_tokens: 800

**Hvad betyder det?**
- Maksimalt antal tokens i response
- 1 token ≈ 0.75 ord på engelsk, lidt mere på dansk
- 800 tokens ≈ 500-600 ord

**Hvorfor 800?**
- Tilstrækkeligt til komplet Step 1 JSON response
- Forhindrer alt for lange, dyre outputs
- Tvinger modellen til at være koncis
- Budget: ~$0.001-0.003 per request

**Hvad hvis det ikke er nok?**
- JSON schema har indbyggede længdebegrænsninger:
  - headline: max 100 tegn
  - summary: max 500 tegn
  - highConfidenceHighlights: 4-6 bullets × 120 tegn
  - limitationsNote: max 250 tegn
- Totalt skulle altid være under 800 tokens

### response_format: { type: 'json_object' }

**Hvad betyder det?**
- OpenAI's JSON mode (kun for visse modeller)
- Garanterer at output er valid JSON
- Ingen markdown, ingen ekstra tekst

**Hvorfor bruge det?**
- 100% parseable output
- Ingen `JSON.parse()` fejl fra markdown-wrapping
- Modellen ved at den SKAL producere JSON
- Reducer fejlrate dramatisk

---

## 📝 Prompts

### System Prompt - STRAM OG KONTROLLERET

```typescript
const SYSTEM_PROMPT = `Du er en præcis CV-udtræker. Din ENESTE opgave er at strukturere information fra et CV i JSON-format.

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

SPROG: Dansk`;
```

**Design principper:**
1. **Kort og autoritativ** - ingen lange forklaringer
2. **Eksplicitte forbud** - hvad modellen IKKE må gøre
3. **Klart formål** - strukturering, ikke analyse
4. **Output format** - gentag at det er KUN JSON

### User Prompt Structure

```typescript
const USER_PROMPT_TEMPLATE = (cvText: string, extracted?: ContactInfo) => `
CV-TEKST:
${cvText}

${extracted ? `KONTAKTINFO ALLEREDE FUNDET: ...` : ''}

REGLER:
1. Beskriv KUN hvad der står i CV'et
2. Ingen anbefalinger, analyse eller vurderinger
3. Udelad usikker information
4. Skriv på dansk
5. Neutral til let positiv tone

STRICT JSON SCHEMA (SKAL FØLGES 100%):
{
  "headline": string (max 100 tegn, neutral overskrift),
  "summary": string (max 500 tegn, hvad CV'et viser),
  "roleIdentity": { ... },
  "highConfidenceHighlights": string[] (præcis 4-6 bullets, max 120 tegn),
  ...
}

VIGTIGT: Output skal være KUN ren JSON. Ingen markdown-tags. Ingen tekst før eller efter JSON.
Alt udenfor JSON er ugyldigt output.

Returnér nu JSON:`;
```

**Design principper:**
1. **CV først** - primær input data
2. **Gentagelse af regler** - reinforcement af system prompt
3. **Eksplicit schema** - præcis hvad der forventes
4. **Constraints synlige** - max længder, antal items
5. **Eksplicit invalid output** - hvad der IKKE accepteres

---

## 🔄 Retry & Fallback Strategy

### Flow

```
┌─────────────────────────────┐
│  Attempt 1: Normal call     │
│  (with SYSTEM + USER prompt)│
└──────────┬──────────────────┘
           │
           ↓
    ┌──────────────┐
    │ Parse JSON?  │
    └──────┬───────┘
           │
     ┌─────┴─────┐
     │           │
    Yes         No
     │           │
     │           ↓
     │    ┌──────────────────────┐
     │    │ Attempt 2: JSON fix  │
     │    │ (retry med fix prompt)│
     │    └──────────┬───────────┘
     │               │
     │               ↓
     │        ┌──────────────┐
     │        │ Parse JSON?  │
     │        └──────┬───────┘
     │               │
     │         ┌─────┴─────┐
     │         │           │
     │        Yes         No
     │         │           │
     └─────────┴───────────┘
               │
               ↓
        ┌─────────────┐
        │  Validate   │
        │   Schema    │
        └──────┬──────┘
               │
         ┌─────┴─────┐
         │           │
        Yes         No
         │           │
         ↓           ↓
    ┌────────┐  ┌──────────┐
    │SUCCESS │  │ FALLBACK │
    └────────┘  └──────────┘
```

### Attempt 1: Normal Derivation

```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  temperature: 0.2,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
  max_tokens: 800,
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: USER_PROMPT_TEMPLATE(cvText, extracted) }
  ],
  response_format: { type: 'json_object' }
});

const parsed = JSON.parse(completion.choices[0].message.content);
const isValid = validateStep1Output(parsed);

if (isValid) return { success: true, data: parsed };
else return { success: false, rawResponse: completion.choices[0].message.content };
```

### Attempt 2: JSON Fix

Hvis Attempt 1 fejler validation:

```typescript
const fixPrompt = `Følgende JSON validerede ikke korrekt:
${rawJson}

Ret JSON så den matcher schema: ...

Returnér KUN rettet JSON. Ingen markdown.`;

const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  temperature: 0.1,  // ENDNU lavere for fix
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
  max_tokens: 800,
  messages: [
    { role: 'system', content: 'Du retter JSON. Returnér KUN valid JSON.' },
    { role: 'user', content: fixPrompt }
  ],
  response_format: { type: 'json_object' }
});
```

**Note**: Temperature 0.1 for fix (endnu mere deterministisk)

### Fallback Response

Hvis begge attempts fejler:

```typescript
const FALLBACK_RESPONSE: Step1Output = {
  headline: "CV modtaget",
  summary: "Vi har modtaget dit CV og arbejder på at behandle indholdet. Prøv venligst igen om et øjeblik.",
  roleIdentity: {
    title: "Ikke identificeret",
    seniority: "unknown",
    domain: "Ikke identificeret"
  },
  highConfidenceHighlights: [],
  toolsAndSystems: [],
  industriesAndContexts: [],
  languages: [],
  workHistoryOverview: {
    yearsExperienceApprox: "Ikke identificeret",
    careerProgressionNote: "Information er ved at blive behandlet"
  },
  dataExtracted: {
    name: null,
    email: null,
    phone: null,
    location: null
  },
  limitationsNote: "Vi oplever tekniske udfordringer med at behandle dit CV. Prøv venligst igen."
};
```

**Princip**: Brugeren må ALDRIG se en fejl.

---

## ✅ Validation

### Schema Validation Function

```typescript
function validateStep1Output(data: any): data is Step1Output {
  // Check types
  if (typeof data.headline !== 'string' || data.headline.length > 100) return false;
  if (typeof data.summary !== 'string' || data.summary.length > 500) return false;
  
  // Check roleIdentity
  if (!['junior', 'mid', 'senior', 'unknown'].includes(data.roleIdentity.seniority)) return false;
  
  // Check arrays
  if (!Array.isArray(data.highConfidenceHighlights) || 
      data.highConfidenceHighlights.length < 4 || 
      data.highConfidenceHighlights.length > 6) return false;
      
  if (!data.highConfidenceHighlights.every((h: string) => h.length <= 120)) return false;
  
  // ... more checks
  
  return true;
}
```

**Hvad valideres:**
1. Type checking (string, array, object)
2. Enum values (seniority)
3. Array lengths (4-6, 0-8, etc.)
4. String lengths (max 100, 500, 120, etc.)
5. Required fields present

---

## 💡 Hvorfor Denne Opsætning Er Stabil

### 1. Low Temperature (0.2)

- **Problem**: Varierende output, kreative tilføjelser
- **Løsning**: Deterministisk output, faktuel tone
- **Resultat**: Konsistent kvalitet

### 2. JSON Mode (response_format)

- **Problem**: Markdown-wrapping, parsing errors
- **Løsning**: Native JSON garanteret af OpenAI
- **Resultat**: 100% parseable output

### 3. Stramme Prompts

- **Problem**: Analyse sniger sig ind, for lange svar
- **Løsning**: Eksplicitte forbud, kort system prompt
- **Resultat**: Output holder sig til spejling

### 4. Schema i Prompt

- **Problem**: Uklar struktur, manglende felter
- **Løsning**: Schema gentaget i user prompt
- **Resultat**: Modellen ved præcis hvad der forventes

### 5. Max Tokens Limit (800)

- **Problem**: For lange, dyre outputs
- **Løsning**: Hard limit tvinger koncis output
- **Resultat**: Kontrollerede costs, fokuseret indhold

### 6. Retry + Fallback

- **Problem**: Lejlighedsvis fejl bryder user experience
- **Løsning**: 1 retry, så fallback
- **Resultat**: Brugeren ser ALDRIG en fejl

### 7. No Penalties (frequency/presence = 0)

- **Problem**: Tvungen variation kan ændre facts
- **Løsning**: Ingen penalties, præcist sprog tilladt
- **Resultat**: Faktuel akkuratesse

---

## 📊 Expected Performance

### Success Rates (estimated)

- Attempt 1 success: ~95%
- Attempt 2 success (after retry): ~4%
- Fallback: ~1%

### Response Times

- Normal call: 2-5 sekunder
- With retry: 5-10 sekunder
- Fallback: instant

### Cost per Request

- Successful (1 call): ~$0.001-0.003
- With retry (2 calls): ~$0.002-0.006
- Fallback: $0 (no API call)

---

## 🔧 Maintenance & Debugging

### If Output Becomes Too Analytical

**Symptom**: Anbefalinger, "du bør", vurderinger

**Fix:**
1. Tilføj mere eksplicitte forbud til system prompt
2. Reducer temperature til 0.1
3. Tilføj eksempler på forkert tone i user prompt

### If JSON Parsing Fails Often

**Symptom**: Mange retries, fallbacks

**Fix:**
1. Check at response_format er sat
2. Øg max_tokens til 1000
3. Forbedre JSON fix prompt
4. Log raw responses for analyse

### If Output Is Too Short/Empty

**Symptom**: Tomme arrays, "unknown" værdier

**Fix:**
1. Reducer constraints i validation
2. Tilføj guidance om "high confidence" til prompt
3. Check om CV-tekst faktisk er valid input

### If Costs Are Too High

**Symptom**: Budget overskrides

**Fix:**
1. Reducer max_tokens til 600
2. Cache results for identiske CV'er
3. Rate limit requests per user

---

## 📚 Reference

### OpenAI Documentation

- [Chat Completions API](https://platform.openai.com/docs/api-reference/chat)
- [JSON Mode](https://platform.openai.com/docs/guides/text-generation/json-mode)
- [gpt-4o-mini Model Card](https://platform.openai.com/docs/models/gpt-4o-mini)

### Implementation Files

- API Route: `/app/api/cv/derive-step1/route.ts`
- Frontend: `/app/app/profil/page.tsx`
- Documentation: `/STEP1_IMPLEMENTATION.md`

---

**Status**: ✅ PRODUCTION READY  
**Model**: gpt-4o-mini  
**Cost**: ~$0.001-0.003 per request  
**Success Rate**: ~99% (with retry)  
**Response Time**: 2-5 seconds average
