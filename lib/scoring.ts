// Dimension mappings: hver dimension har 5 spørgsmål
export const DIMENSION_MAPPINGS = {
  'Struktur & Rammer': ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'],
  'Beslutningsstil': ['Q6', 'Q7', 'Q8', 'Q9', 'Q10'],
  'Forandring & Stabilitet': ['Q11', 'Q12', 'Q13', 'Q14', 'Q15'],
  'Selvstændighed & Sparring': ['Q16', 'Q17', 'Q18', 'Q19', 'Q20'],
  'Sociale præferencer i arbejdet': ['Q21', 'Q22', 'Q23', 'Q24', 'Q25'],
  'Ledelse & Autoritet': ['Q26', 'Q27', 'Q28', 'Q29', 'Q30'],
  'Tempo & Belastning': ['Q31', 'Q32', 'Q33', 'Q34', 'Q35'],
  'Konflikt & Feedback': ['Q36', 'Q37', 'Q38', 'Q39', 'Q40'],
} as const;

export type DimensionName = keyof typeof DIMENSION_MAPPINGS;

export interface DimensionScore {
  dimension: DimensionName;
  score: number;
  missingAnswers?: string[];
}

/**
 * Beregner gennemsnittet for en dimension baseret på svarene.
 * Hvis der mangler svar, returneres null for den dimension.
 */
export function calculateDimensionScore(
  dimension: DimensionName,
  answers: Record<string, number>
): DimensionScore {
  const questions = DIMENSION_MAPPINGS[dimension];
  const scores: number[] = [];
  const missing: string[] = [];

  for (const questionId of questions) {
    const answer = answers[questionId];
    if (answer === undefined || answer === null || answer < 1 || answer > 5) {
      missing.push(questionId);
    } else {
      scores.push(answer);
    }
  }

  // Hvis der mangler svar, returner 0 og marker som manglende
  if (missing.length > 0) {
    return {
      dimension,
      score: 0,
      missingAnswers: missing,
    };
  }

  // Beregn gennemsnit og afrund til 1 decimal
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const roundedScore = Math.round(average * 10) / 10;

  return {
    dimension,
    score: roundedScore,
  };
}

/**
 * Beregner alle dimensionsscorer baseret på de 40 svar.
 * Returnerer et array med 8 dimensioner i fast rækkefølge.
 */
export function calculateAllDimensionScores(
  answers: Record<string, number>
): DimensionScore[] {
  const dimensions: DimensionName[] = [
    'Struktur & Rammer',
    'Beslutningsstil',
    'Forandring & Stabilitet',
    'Selvstændighed & Sparring',
    'Sociale præferencer i arbejdet',
    'Ledelse & Autoritet',
    'Tempo & Belastning',
    'Konflikt & Feedback',
  ];

  return dimensions.map((dimension) =>
    calculateDimensionScore(dimension, answers)
  );
}
