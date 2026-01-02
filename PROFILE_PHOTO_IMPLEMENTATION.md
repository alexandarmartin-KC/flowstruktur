# Profilbillede Implementation

## Oversigt
Brugere kan nu uploade et valgfrit profilbillede på `/app/profil` og vælge om det skal vises på CV'et.

## Features

### 1. Data Model
**UserProfile interface** (`contexts/user-profile-context.tsx`):
```typescript
profilePhoto?: {
  dataUrl: string;      // Base64 encoded image
  fileName: string;     // Original filename
  updatedAt: string;    // ISO timestamp
}

cvPreferences?: {
  showProfilePhoto: boolean;  // Default: false
}
```

### 2. Upload Funktionalitet
**ProfilePhotoSection** (`components/profile-photo-section.tsx`):
- Avatar preview med initials fallback
- Upload billede knap med file input
- Fjern billede knap
- Real-time validering:
  - Max filstørrelse: 3MB
  - Tilladte formater: JPG, PNG, WebP
  - Klar fejlbeskeder til brugeren

### 3. CV Visning Toggle
- Switch/toggle til at aktivere/deaktivere visning på CV
- Disabled hvis intet billede er uploadet
- Visual feedback om status

### 4. CV Preview Integration
**CVPreview komponent** (`components/CVPreview/CVPreview.tsx`):
- Viser billede i øverste højre hjørne af CV header
- Kun vist hvis:
  - `cvPreferences.showProfilePhoto === true`
  - `profilePhoto.dataUrl` findes
- Responsive layout adjustment

## Tekniske Detaljer

### Storage
- Billeder gemmes som base64 dataUrl i localStorage
- Del af `flowstruktur_user_profile` key
- Automatisk persist via UserProfileContext

### Edge Cases Håndteret
1. **Fil for stor**: Klar fejlbesked, upload stoppes
2. **Forkert filtype**: Validation før processing
3. **Upload fejl**: Try-catch med brugervenlig fejl
4. **Intet billede men toggle on**: Disabled state med hjælpetekst
5. **Legacy compatibility**: Bevarede `profileImage` felt som fallback

### Type Safety
- TypeScript type guards i completeness checks
- Sikrer at kun string felter kaldes med `.trim()`
- Fuldt typed interfaces på tværs af komponenter

## Bruger Flow

1. **Upload**:
   - Bruger klikker "Upload billede"
   - Vælger fil fra system
   - Automatisk validation og preview
   - Gemmes til localStorage

2. **Aktivér på CV**:
   - Toggle "Vis profilbillede på CV" switch
   - Se preview direkte i CV preview

3. **Fjern**:
   - Klik "Fjern billede"
   - Billede og toggle nulstilles

## Filer Ændret/Oprettet

### Oprettet:
- `components/profile-photo-section.tsx` (ny komponent)

### Modificeret:
- `contexts/user-profile-context.tsx` - Data model + type guards
- `app/app/profil/page.tsx` - Tilføjet ProfilePhotoSection
- `components/CVPreview/CVPreview.tsx` - Conditional rendering af billede
- `hooks/use-resolved-cv.ts` - Opdateret interface

## UX Beslutninger

### Default: OFF
Visning af profilbillede er slået fra som standard fordi:
- Mange brancher foretrækker CV uden billede
- GDPR og bias overvejelser
- Giver brugeren eksplicit kontrol

### Valgfrit Feature
- Ikke påkrævet for export
- Ikke del af completeness beregning
- Fuldt opt-in

### Visual Hierarchy
- Placeret efter kontaktoplysninger
- Tydeligt markeret som "Valgfrit"
- Informativ hjælpetekst

## Fremtidige Forbedringer (Optional)

- Client-side image resize/compression for at reducere localStorage payload
- Crop funktionalitet før upload
- Multiple billeder (fx formelt/uformelt)
- Cloud storage integration i stedet for localStorage
- Image optimization (WebP conversion)

## Testing

Build testet ✅
- TypeScript compilation: Success
- No runtime errors
- Type safety maintained
