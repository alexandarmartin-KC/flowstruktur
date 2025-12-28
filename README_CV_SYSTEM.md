# CV Analyse System - MVP Dokumentation

## Oversigt

Dette system giver brugere mulighed for at uploade et CV (PDF/DOCX/TXT), få en AI-baseret analyse via Claude, og give feedback for at revidere analysen.

## Funktionalitet

1. **Upload CV**: Brugere kan uploade PDF, DOCX eller TXT filer
2. **AI Udtræk**: Claude analyserer CV'et og udtrækker nøgleinformation i et struktureret format
3. **Feedback**: Brugere kan godkende ("Enig") eller afvise ("Ikke enig") analysen
4. **Revision**: Ved uenighed kan brugere skrive kommentarer, hvorefter AI reviderer analysen

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, React
- **UI**: Shadcn/ui komponenter (Card, Button, Textarea, etc.)
- **Backend**: Next.js API Routes med Node.js runtime
- **AI**: OpenAI API (model: gpt-4o)
- **CV Parsing**: 
  - PDF: `pdf-parse`
  - DOCX: `mammoth`
  - TXT: native Node.js

## Filstruktur

```
app/
├── app/
│   └── profil/
│       └── page.tsx          # Hovedside med upload, visning og feedback
├── api/
    ├── extract/
    │   └── route.ts          # POST endpoint til CV-udtræk
    └── revise/
        └── route.ts          # POST endpoint til revision
.env.local                    # Miljøvariabler (ANTHROPIC_API_KEY)
```

## Installation & Opsætning

### 1. Installér Dependencies

```bash
npm install pdf-parse mammoth
npm install -D @types/pdf-parse
```

### 2. Konfigurér Miljøvariabler

Opret eller rediger `.env.local` i projektets rod:

```env
OPENAI_API_KEY=din-openai-api-key
```

Få din API key fra: https://platform.openai.com/api-keys

### 3. Kør Udvikler Server

```bash
npm run dev
```

Åbn http://localhost:3000/app/profil i din browser.

## API Dokumentation

### POST /api/extract

Modtager en CV-fil og returnerer AI-analyse.

**Request**: `multipart/form-data`
- `file`: CV-fil (PDF/DOCX/TXT)

**Response**: `application/json`
```json
{
  "summary": "TEKST:\n[Analyse]\n\nBULLETS:\n- [punkt]\n\nKILDE-NOTER:\n[noter]",
  "cvText": "Fuld CV tekst..."
}
```

**Errors**:
- 400: Ingen fil, ugyldig filtype, ikke nok tekst
- 500: Server eller API fejl

### POST /api/revise

Reviderer en analyse baseret på bruger-feedback.

**Request**: `application/json`
```json
{
  "originalSummary": "Original analyse",
  "feedback": "Brugerens kommentarer",
  "cvText": "Original CV tekst"
}
```

**Response**: `application/json`
```json
{
  "revised": "TEKST:\n[Revideret analyse]\n\nBULLETS:\n- [punkt]\n\nKILDE-NOTER:\n[noter]"
}
```

**Errors**:
- 400: Manglende data, feedback for kort
- 500: Server eller API fejl

## AI Output Format

Claude returnerer ALTID analyser i dette format:

```
TEKST:
[1-2 afsnit sammenfatning af personens professionelle baggrund]

BULLETS:
- [Nøgleerfaring eller kompetence 1]
- [Nøgleerfaring eller kompetence 2]
- [Nøgleerfaring eller kompetence 3]
- [Nøgleerfaring eller kompetence 4]
- [Nøgleerfaring eller kompetence 5]

KILDE-NOTER:
[Noter om hvilke CV-sektioner der blev brugt]
```

## Sikkerhed & Begrænsninger

### Data Validering
- Kun PDF, DOCX og TXT filer accepteres
- Minimum 50 tegn i CV-tekst
- Feedback skal være mindst 10 tegn

### AI Begrænsninger
- AI må IKKE opfinde information
- Alt skal være baseret på CV-teksten
- Hvis info mangler: "Ikke oplyst i CV'et"
- Bruger-tilføjet info markeres: "Bruger oplyser: ..."

### Runtime
- Extract endpoint bruger Node.js runtime for filhåndtering
- Max tokens sat til 2000 for begge endpoints

## Model Configuration

Default model: `gpt-4o`

For at ændre model, rediger denne linje i både `extract/route.ts` og `revise/route.ts`:

```typescript
model: 'gpt-4o', // Skift til anden OpenAI model
```

Tilgængelige modeller:
- `gpt-4o` (anbefalet - nyeste, hurtigste GPT-4 niveau)
- `gpt-4-turbo` (kraftfuld, god balance)
- `gpt-4` (klassisk GPT-4)
- `gpt-3.5-turbo` (billigere, stadig god)

## Fejlfinding

### "OPENAI_API_KEY er ikke sat"
- Sørg for at `.env.local` eksisterer i projektets rod
- Genstart udvikler serveren efter ændringer i `.env.local`

### "Kunne ikke læse PDF/DOCX"
- Tjek at filen ikke er korrupt
- Prøv at eksportere filen igen fra dit tekstbehandlingsprogram

### "OpenAI API fejl"
- Verificer at din API key er gyldig
- Tjek din OpenAI-konto for rate limits eller budget
- Se console for detaljerede fejlmeddelelser

### Import fejl med pdf-parse eller mammoth
- Sørg for at dependencies er installeret: `npm install`
- Prøv at slette `node_modules` og `.next`, derefter `npm install` igen

## Fremtidige Forbedringer

- [ ] Gem analyser i database
- [ ] Bruger authentication
- [ ] Historik over tidligere uploads
- [ ] Support for flere sprog
- [ ] Eksport af analyser som PDF
- [ ] Batch upload af flere CVer
- [ ] Sammenligning af flere CVer

## Support

For spørgsmål eller problemer, se:
- [OpenAI API Dokumentation](https://platform.openai.com/docs)
- [Next.js Dokumentation](https://nextjs.org/docs)
