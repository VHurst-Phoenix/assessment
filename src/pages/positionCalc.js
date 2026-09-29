// Clarity Position is intentionally isolated from the band calculation. It
// accepts the five normalized (4–20) category scores and returns the locked
// two-axis coach signal.

export const POSITION_THRESHOLD = 26.5;
export const POSITION_MAX_AXIS_SCORE = 40;

export function getPosition(categoryScores) {
  if (!Array.isArray(categoryScores) || categoryScores.length < 5) return null;

  // Inner Clarity: Values & What Matters + Direction & Opportunity.
  // Outer Action: Strengths & Skills + Alignment & Confidence.
  // Patterns & Blocks is intentionally excluded from both axes.
  const innerAxis = Number(categoryScores[1]) + Number(categoryScores[3]);
  const outerAxis = Number(categoryScores[0]) + Number(categoryScores[4]);
  if (!Number.isFinite(innerAxis) || !Number.isFinite(outerAxis)) return null;

  const innerHigh = innerAxis >= POSITION_THRESHOLD;
  const outerHigh = outerAxis >= POSITION_THRESHOLD;
  const quadrant = innerHigh && outerHigh
    ? 'Momentum Builder'
    : innerHigh
      ? 'Strategic Planner'
      : outerHigh
        ? 'Kinetic Operator'
        : 'System Evaluator';

  return { innerAxis, outerAxis, maxAxisScore: POSITION_MAX_AXIS_SCORE, threshold: POSITION_THRESHOLD, quadrant, innerHigh, outerHigh };
}
