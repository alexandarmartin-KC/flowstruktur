export type Level = "Lav" | "Moderat" | "Høj";

export type DimensionKey = 
  | "Struktur & Rammer"
  | "Beslutningsstil"
  | "Forandring & Stabilitet"
  | "Selvstændighed & Sparring"
  | "Sociale præferencer i arbejdet"
  | "Ledelse & Autoritet"
  | "Tempo & Belastning"
  | "Konflikt & Feedback";

/**
 * Beregner niveau baseret på score (1.0-5.0)
 */
export function getLevel(score: number): Level {
  if (score >= 3.7) return "Høj";
  if (score >= 2.5) return "Moderat";
  return "Lav";
}

/**
 * Forklaringer for hver dimension på hvert niveau
 */
const explanations: Record<DimensionKey, Record<Level, string>> = {
  "Struktur & Rammer": {
    "Lav": "Denne score indikerer lavt behov for faste rammer og strukturer.\nDu kan typisk arbejde i uklare eller skiftende kontekster uden at miste overblik,\nmen kan opleve faste processer som begrænsende.",
    "Moderat": "Denne score indikerer en balance mellem behov for struktur og fleksibilitet.\nDu kan fungere i både tydeligt strukturerede og mere åbne arbejdsmiljøer,\nså længe forventninger er nogenlunde klare.",
    "Høj": "Denne score indikerer et tydeligt behov for klare rammer og definerede processer.\nDu arbejder typisk bedst, når roller, ansvar og arbejdsgange er tydelige\nog kan opleve ustruktur som belastende.",
  },
  "Beslutningsstil": {
    "Lav": "Denne score indikerer høj tolerance for beslutninger under usikkerhed.\nDu kan træffe valg uden fuldt datagrundlag\nog oplever sjældent behov for omfattende analyse før handling.",
    "Moderat": "Denne score indikerer en afbalanceret beslutningsstil.\nDu kan både handle relativt hurtigt og tage dig tid til at overveje,\nafhængigt af situationens betydning og konsekvens.",
    "Høj": "Denne score indikerer et behov for grundig overvejelse før beslutninger.\nDu foretrækker typisk at forstå konsekvenser og sammenhænge\nog kan opleve pres, hvis beslutninger skal tages meget hurtigt.",
  },
  "Forandring & Stabilitet": {
    "Lav": "Denne score indikerer høj tolerance for forandring.\nDu kan typisk navigere i skiftende vilkår uden større ubehag\nog tilpasser dig hurtigt nye måder at arbejde på.",
    "Moderat": "Denne score indikerer både behov for stabilitet og evne til omstilling.\nDu kan håndtere forandringer, hvis de er nogenlunde forudsigelige\nog ledsaget af forklaring eller retning.",
    "Høj": "Denne score indikerer et tydeligt behov for stabilitet og forudsigelighed.\nHyppige ændringer kan opleves som belastende,\nog du arbejder typisk bedst i stabile rammer.",
  },
  "Selvstændighed & Sparring": {
    "Lav": "Denne score indikerer høj grad af selvstændighed i arbejdet.\nDu kan typisk træffe beslutninger og løse opgaver uden behov for løbende sparring\nog foretrækker stor autonomi.",
    "Moderat": "Denne score indikerer en balance mellem selvstændighed og samarbejde.\nDu kan arbejde alene, men værdsætter også dialog og sparring\ni mere komplekse situationer.",
    "Høj": "Denne score indikerer et tydeligt behov for sparring og dialog.\nDu arbejder typisk bedst i samspil med andre\nog kan opleve manglende sparring som usikkerhedsskabende.",
  },
  "Sociale præferencer i arbejdet": {
    "Lav": "Denne score indikerer lavt behov for social interaktion i arbejdet.\nDu arbejder typisk mest effektivt med ro og fordybelse\nog kan opleve hyppige afbrydelser som drænende.",
    "Moderat": "Denne score indikerer et afbalanceret socialt behov.\nDu kan fungere i samarbejde med andre\nsamtidig med at du har behov for perioder med koncentreret arbejde.",
    "Høj": "Denne score indikerer et højt behov for social kontakt i arbejdet.\nDialog og samarbejde giver typisk energi\nog er en central del af din arbejdsdag.",
  },
  "Ledelse & Autoritet": {
    "Lav": "Denne score indikerer lavt behov for tydelig hierarkisk ledelse.\nDu kan typisk arbejde effektivt uden faste beslutningslinjer\nog trives med stor grad af selvstyring.",
    "Moderat": "Denne score indikerer fleksibilitet i forhold til ledelsesform.\nDu kan arbejde under både tydelig ledelse og mere flade strukturer,\nså længe prioriteringer er nogenlunde klare.",
    "Høj": "Denne score indikerer et tydeligt behov for klar ledelse og retning.\nUklare beslutningsprocesser kan opleves som frustrerende,\nog du arbejder typisk bedst med tydeligt placeret ansvar.",
  },
  "Tempo & Belastning": {
    "Lav": "Denne score indikerer høj tolerance for tempo og belastning.\nDu kan typisk arbejde under pres over længere tid\nuden at opleve markant fald i overblik.",
    "Moderat": "Denne score indikerer en vis robusthed kombineret med behov for balance.\nDu kan håndtere perioder med højt tempo,\nmen har samtidig behov for stabilitet for at bevare kvalitet.",
    "Høj": "Denne score indikerer lav tolerance for vedvarende højt tempo.\nDu arbejder typisk bedst med realistiske deadlines\nog kan opleve spidsbelastninger som drænende.",
  },
  "Konflikt & Feedback": {
    "Lav": "Denne score indikerer høj tolerance for direkte kommunikation og uenighed.\nDu kan typisk håndtere konflikt åbent\nuden at det påvirker dit arbejde nævneværdigt.",
    "Moderat": "Denne score indikerer behov for konstruktiv og respektfuld dialog.\nDu kan håndtere uenighed,\nmen foretrækker klare rammer for feedback og konflikt.",
    "Høj": "Denne score indikerer lav tolerance for konfliktfyldte miljøer.\nDirekte eller vedvarende uenighed kan påvirke din trivsel,\nog du arbejder typisk bedst i psykologisk trygge rammer.",
  },
};

/**
 * Returnerer forklaring for en dimension baseret på score
 */
export function getExplanation(dimensionKey: DimensionKey, score: number): string {
  if (isNaN(score) || score === undefined) {
    return "Manglende score";
  }
  
  const level = getLevel(score);
  return explanations[dimensionKey][level];
}
