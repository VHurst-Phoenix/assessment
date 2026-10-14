// One computed view of a Clarity submission, shared by the results page,
// the summary email and the full PDF report so they can never disagree.

import { clarityDimensions, clarityQuestions } from './assessmentQuestions.js';
import {
  getCategoryScores,
  getClarityScore,
  getFrictionVector,
  getGrowthEdge,
  getPosition,
  getScoringBand,
  getScoringBandByKey,
} from './scoringBands.js';
import { getDimensionNarrative, narrativeTier } from './clarityNarratives.js';

export const formatScore = (score) => (Number.isInteger(Number(score)) ? String(Number(score)) : Number(score).toFixed(1));

export function buildClarityReport(data) {
  if (!data) return null;
  const answers = Array.isArray(data.answers) ? data.answers : Array.isArray(data.responses) ? data.responses : [];
  const hasAllAnswers = answers.length === clarityQuestions.length && !answers.includes(null);

  // Prefer the stored raw responses so every surface uses the current model.
  const categoryScores = hasAllAnswers
    ? getCategoryScores(answers)
    : (Array.isArray(data.dimScores) && data.dimScores.length === 5 ? data.dimScores : []);
  const score = hasAllAnswers ? getClarityScore(answers) : Number(data.score) || 0;
  const band = getScoringBand(score) || getScoringBandByKey(data.archetype);
  const position = getPosition(categoryScores);
  const frictionVector = getFrictionVector(categoryScores, position);
  const growthEdge = getGrowthEdge(categoryScores);
  const strongestIndex = categoryScores.length ? categoryScores.indexOf(Math.max(...categoryScores)) : null;

  return {
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email || '',
    date: data.date || null,
    score,
    band,
    position,
    frictionVector,
    growthEdge: growthEdge
      ? { ...growthEdge, name: clarityDimensions[growthEdge.index], tier: narrativeTier(growthEdge.score), narrative: getDimensionNarrative(growthEdge.index, growthEdge.score) }
      : null,
    strongest: strongestIndex === null
      ? null
      : { index: strongestIndex, name: clarityDimensions[strongestIndex], score: categoryScores[strongestIndex] },
    dimensions: categoryScores.map((categoryScore, index) => ({
      name: clarityDimensions[index],
      score: categoryScore,
      tier: narrativeTier(categoryScore),
      narrative: getDimensionNarrative(index, categoryScore),
    })),
  };
}
