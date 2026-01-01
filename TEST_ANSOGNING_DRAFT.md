# Test Guide: Ansøgning-kladde Feature

## 🎯 Hvad skal testes

Denne guide hjælper dig med at verificere at den nye ansøgning-funktionalitet virker korrekt.

---

## ✅ Test 1: Første generation

**Formål**: Verificer at AI kan generere en ansøgning med analyse

**Steps**:
1. Naviger til et gemt job: `/app/job/[jobId]/ansøgning`
2. Sørg for at CV'et er tilpasset (gå til CV-tab hvis ikke)
3. Klik på **"Generer ansøgning"** knappen
4. Vent mens AI genererer (kan tage op til 30 sekunder)

**Forventet resultat**:
- ✅ Loading spinner vises med tekst "Genererer din ansøgning..."
- ✅ Blåt analyse-kort vises øverst med:
  - Grønne match-punkter (min. 3)
  - Orange gaps/risici (min. 1)
  - Anbefalet vinkel
- ✅ Ansøgningstekst vises i textarea (250-400 ord)
- ✅ Teksten er på dansk og professionel
- ✅ Ingen "Edited" badge (endnu)

**Fejl at se efter**:
- ❌ "Kunne ikke indlæse CV data" → CV mangler
- ❌ "Kunne ikke generere ansøgning" → API fejl
- ❌ Generering tager >60 sekunder → Timeout problem

---

## ✅ Test 2: Redigering og "Edited" state

**Formål**: Verificer at brugeren kan redigere draft og at det trackes

**Steps**:
1. Efter generation (Test 1), ændr noget tekst i textarea
2. Observer "Edited" badge
3. Vent 1 sekund (auto-save)
4. Refresh siden (F5 eller ⌘R)

**Forventet resultat**:
- ✅ "Edited" badge med pen-ikon vises efter ændring
- ✅ Efter refresh: Teksten er stadig der med dine ændringer
- ✅ "Edited" badge vises stadig
- ✅ Analyse-kortet vises stadig

**Fejl at se efter**:
- ❌ Ændringer forsvinder ved refresh
- ❌ "Edited" badge vises ikke
- ❌ Analyse forsvinder

---

## ✅ Test 3: AI Rewrite - "Kortere"

**Formål**: Test at AI kan omskrive til kortere version

**Steps**:
1. Efter generation, klik på **"Kortere"** knappen
2. Vent på omskrivning (~10 sekunder)
3. Observer den nye tekst

**Forventet resultat**:
- ✅ Knappen viser loading state
- ✅ "Omskriver..." tekst vises
- ✅ Ny tekst erstatter gammel tekst
- ✅ Ny tekst er 20-30% kortere
- ✅ Vigtige pointer er bevaret
- ✅ "Edited" badge vises

**Fejl at se efter**:
- ❌ Teksten bliver ikke kortere
- ❌ Vigtige informationer mangler
- ❌ Teksten bliver til engelsk
- ❌ Loading state hænger

---

## ✅ Test 4: AI Rewrite - "Mere konkret"

**Formål**: Test at AI kan tilføje konkrete eksempler

**Steps**:
1. Efter generation, klik på **"Mere konkret"** knappen
2. Sammenlign før/efter

**Forventet resultat**:
- ✅ Vage udsagn bliver til specifikke beskrivelser
- ✅ Tal og konkrete eksempler tilføjes hvor relevant
- ✅ Teksten er stadig troværdig (ingen hallucination)

**Fejl at se efter**:
- ❌ AI opfinder erfaring der ikke er i CV'et
- ❌ Teksten bliver for lang
- ❌ Tonen bliver for casual

---

## ✅ Test 5: AI Rewrite - "Mere professionel"

**Formål**: Test at AI kan hæve sprogligt niveau

**Steps**:
1. Efter generation, klik på **"Mere professionel"** knappen
2. Observer tone-ændring

**Forventet resultat**:
- ✅ Sproget bliver mere formelt
- ✅ Kollokvialismer fjernes
- ✅ Branche-relevant terminologi bruges
- ✅ Teksten er stadig varm og personlig (ikke stiv)

**Fejl at se efter**:
- ❌ Teksten bliver for akademisk/stiv
- ❌ AI bruger klichéer
- ❌ Mister personlighed

---

## ✅ Test 6: AI Rewrite - "Mere målrettet"

**Formål**: Test at AI kan fokusere på relevant erfaring

**Steps**:
1. Efter generation, klik på **"Mere målrettet"** knappen
2. Sammenlign med original

**Forventet resultat**:
- ✅ Mest relevant erfaring fremhæves
- ✅ Jobbets terminologi bruges mere
- ✅ Tydeligere kobling mellem erfaring og jobkrav
- ✅ Irrelevant info reduceres

**Fejl at se efter**:
- ❌ Vigtig erfaring fjernes
- ❌ Teksten bliver generisk
- ❌ Mister sammenhæng

---

## ✅ Test 7: Persistence ved navigation

**Formål**: Verificer at draft bevares ved navigation væk og tilbage

**Steps**:
1. Generér eller rediger ansøgning
2. Naviger til CV-tab
3. Naviger til "Gemte jobs" (sidebar)
4. Naviger tilbage til ansøgning-tab

**Forventet resultat**:
- ✅ Draft er stadig der
- ✅ Analyse er stadig der
- ✅ "Edited" state er korrekt

**Fejl at se efter**:
- ❌ Draft forsvinder
- ❌ Mister "Edited" state
- ❌ Analyse skal regenereres

---

## ✅ Test 8: Status-opdatering

**Formål**: Test at status-knapper virker

**Steps**:
1. Efter generation, klik **"Gem kladde"**
2. Gå til "Gemte jobs" og find jobbet
3. Observer status-badge
4. Gå tilbage og klik **"Markér som klar"**
5. Tjek igen i "Gemte jobs"

**Forventet resultat**:
- ✅ Efter "Gem kladde": Badge viser "Kladde" (gul)
- ✅ Efter "Markér som klar": Badge viser "Klar" (grøn)
- ✅ Badge opdateres uden refresh

**Fejl at se efter**:
- ❌ Status opdateres ikke
- ❌ Kræver page refresh for at se ændring
- ❌ Status forsvinder ved reload

---

## ✅ Test 9: Kopier til clipboard

**Formål**: Test copy-funktionalitet

**Steps**:
1. Efter generation, klik **"Kopier"** knappen (top-højre)
2. Paste i en text editor (Ctrl+V / ⌘V)

**Forventet resultat**:
- ✅ Knap ændrer til "Kopieret" med check-mark
- ✅ Efter 2 sekunder: Tilbage til "Kopier"
- ✅ Pasted tekst er komplet ansøgning
- ✅ Formatting er bevaret (linjeskift)

**Fejl at se efter**:
- ❌ Intet kopieres
- ❌ Kun del af tekst kopieres
- ❌ Linjeskift mangler

---

## ✅ Test 10: Guard - Uden CV

**Formål**: Test at systemet håndterer manglende CV data

**Steps**:
1. Clear localStorage: `localStorage.clear()` i console
2. Naviger til `/app/job/[jobId]/ansøgning`

**Forventet resultat**:
- ✅ Rød error alert vises
- ✅ Tekst: "Kunne ikke indlæse CV data. Gå tilbage og færdiggør CV-tilpasningen først."
- ✅ Ingen "Generer ansøgning" knap vises
- ✅ Ingen crash

**Fejl at se efter**:
- ❌ Side crasher
- ❌ Blank side
- ❌ Knapper er stadig synlige

---

## ✅ Test 11: Guard - CV ikke færdigt

**Formål**: Test warning når CV status ikke er FINAL

**Steps**:
1. Naviger til CV-tab
2. Lav ændringer men tryk IKKE "Godkend CV"
3. Naviger til Ansøgning-tab

**Forventet resultat**:
- ✅ Gul/blå info-alert vises øverst
- ✅ Tekst: "Anbefaling: Færdiggør dit CV først"
- ✅ Du kan stadig generere ansøgning (warning, ikke blocking)

**Fejl at se efter**:
- ❌ Ingen warning vises
- ❌ Systemet blokerer generation
- ❌ Alert vises når CV ER færdigt

---

## ✅ Test 12: Analyse fold/unfold

**Formål**: Test collapsible analyse-kort

**Steps**:
1. Efter generation med analyse
2. Klik på analyse-kort header
3. Klik igen

**Forventet resultat**:
- ✅ Første klik: Analyse-indhold skjules, pil-ikon ændrer
- ✅ Andet klik: Analyse vises igen
- ✅ Smooth transition

**Fejl at se efter**:
- ❌ Intet sker ved klik
- ❌ Hele kortet forsvinder
- ❌ Pil-ikon opdateres ikke

---

## ✅ Test 13: Flere rewrites efter hinanden

**Formål**: Test at man kan bruge flere rewrite-funktioner

**Steps**:
1. Generér ansøgning
2. Klik "Kortere"
3. Vent til færdig
4. Klik "Mere professionel"
5. Vent til færdig
6. Klik "Mere målrettet"

**Forventet resultat**:
- ✅ Hver rewrite bygger på den forrige version
- ✅ Ingen errors
- ✅ Teksten ændrer sig meningsfuldt hver gang
- ✅ "Edited" badge bliver ved med at vise

**Fejl at se efter**:
- ❌ Second rewrite fejler
- ❌ Teksten bliver unaturlig efter flere rewrites
- ❌ Draft ikke gemt efter hver rewrite

---

## ✅ Test 14: Generer igen

**Formål**: Test re-generation af ansøgning

**Steps**:
1. Efter generation og/eller editing
2. Klik "Generer igen" knappen

**Forventet resultat**:
- ✅ Ny generation startes
- ✅ Gammel tekst erstattes
- ✅ "Edited" badge fjernes (ny original)
- ✅ Ny analyse genereres

**Fejl at se efter**:
- ❌ Generering fejler
- ❌ Gammel draft blandes med ny
- ❌ "Edited" state bliver ved

---

## 🐛 Almindelige fejl og løsninger

### Fejl: "Missing credentials. Please pass an `apiKey`"
**Årsag**: OpenAI API key mangler i environment  
**Løsning**: Sæt `OPENAI_API_KEY` i `.env.local`

### Fejl: "Kunne ikke indlæse CV data"
**Årsag**: CV ikke gemt for dette job  
**Løsning**: Gå til CV-tab først og tilpas/godkend CV

### Fejl: Draft forsvinder ved refresh
**Årsag**: localStorage ikke persistent eller ad-blocker  
**Løsning**: Check browser settings, disable ad-blockers

### Fejl: AI hallucination (opfinder erfaring)
**Årsag**: Prompt ikke strong enough eller dårligt CV-data  
**Løsning**: Reporte som bug - vi har "ABSOLUTTE REGLER" i prompts

---

## 📊 Test Checklist

- [ ] Test 1: Første generation
- [ ] Test 2: Redigering og "Edited" state
- [ ] Test 3: AI Rewrite - "Kortere"
- [ ] Test 4: AI Rewrite - "Mere konkret"
- [ ] Test 5: AI Rewrite - "Mere professionel"
- [ ] Test 6: AI Rewrite - "Mere målrettet"
- [ ] Test 7: Persistence ved navigation
- [ ] Test 8: Status-opdatering
- [ ] Test 9: Kopier til clipboard
- [ ] Test 10: Guard - Uden CV
- [ ] Test 11: Guard - CV ikke færdigt
- [ ] Test 12: Analyse fold/unfold
- [ ] Test 13: Flere rewrites efter hinanden
- [ ] Test 14: Generer igen

**Alle tests passed?** 🎉 Feature er klar til brug!

---

**Sidst opdateret**: $(date)  
**Feature version**: 1.0  
**Related commit**: ac13fdf
