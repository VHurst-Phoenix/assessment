// Clarity scoring: 25 direct-mark questions, each worth its selected 1–5
// value. The raw total is 25–125; the displayed score is raw / 125 × 100,
// which yields the required 20–100 percentage range.

import { clarityQuestions } from './assessmentQuestions.js';

const QUESTION_COUNT = clarityQuestions.length;
const QUESTIONS_PER_CATEGORY = 5;
const MAX_OPTION_VALUE = 5;
const CATEGORY_COUNT = QUESTION_COUNT / QUESTIONS_PER_CATEGORY;
export const MAX_RAW_SCORE = QUESTION_COUNT * MAX_OPTION_VALUE;

const roundScore = (score) => Math.round((Number(score) || 0) * 10) / 10;

export const getRawTotal = (answers) => {
  if (!Array.isArray(answers)) return 0;
  return answers.reduce((total, answer) => total + (Number(answer) || 0), 0);
};

/**
 * Returns direct category marks. Each category contains five 1–5 questions
 * and therefore has a raw range of 5–25. No answer is reverse-scored.
 */
export const getCategoryScores = (answers) => {
  if (!Array.isArray(answers)) return [0, 0, 0, 0, 0];
  const categories = Array(CATEGORY_COUNT).fill(0);
  clarityQuestions.forEach((question, index) => {
    categories[question.dim] += Number(answers[index]) || 0;
  });
  return categories;
};

export const getClarityScore = (answers) => {
  return roundScore((getRawTotal(answers) / MAX_RAW_SCORE) * 100);
};

export const getPosition = (categoryScores) => {
  if (!categoryScores || categoryScores.length < 5) return null;
  const innerAxis = categoryScores[0] + categoryScores[4];
  const outerAxis = categoryScores[1] + categoryScores[3];
  // 66.25% of each two-category axis (33.125 of 50 direct marks).
  const threshold = 33.125;
  const innerHigh = innerAxis >= threshold;
  const outerHigh = outerAxis >= threshold;
  let quadrant;
  if (innerHigh && outerHigh) quadrant = 'Momentum Builder';
  else if (innerHigh && !outerHigh) quadrant = 'Strategic Planner';
  else if (!innerHigh && outerHigh) quadrant = 'Kinetic Operator';
  else quadrant = 'System Evaluator';
  return { innerAxis, outerAxis, maxAxisScore: 50, threshold, quadrant, innerHigh, outerHigh };
};

export const getFrictionVector = (categoryScores, position) => {
  if (!categoryScores || categoryScores.length < 5 || !position) return null;
  const patternsBlocks = categoryScores[2];
  const lowerAxis = position.innerAxis <= position.outerAxis ? 'inner' : 'outer';
  const archetypes = ['Self-Discounter', 'Vision Staller', 'Imposter Protector', 'The Magnifier'];
  const index = patternsBlocks % archetypes.length;
  return { patternsBlocks, lowerAxis, archetype: archetypes[index] };
};

export const getGrowthEdge = (categoryScores) => {
  if (!categoryScores || categoryScores.length < 5) return null;
  const tieBreakOrder = [0, 1, 2, 3, 4];
  let minScore = categoryScores[0];
  let minIndex = 0;
  categoryScores.forEach((score, idx) => {
    if (score < minScore) {
      minScore = score;
      minIndex = idx;
    } else if (score === minScore && tieBreakOrder[idx] < tieBreakOrder[minIndex]) {
      minIndex = idx;
    }
  });
  return { score: minScore, index: minIndex };
};

export const scoringBands = [
  {
    key: 'transitioner',
    label: 'Transitioner',
    min: 20,
    max: 39,
    intro: `You're in the Transitioner band. Something important has shifted for you — you're beginning to see what's possible — but the evidence hasn't caught up yet. This is the stage where you rebuild the internal foundation that makes change stick: clarity, self-trust, and momentum you can rely on.`,
    directRead: `Your scores reveal something most people in your position never get told.

You're not starting from zero. You're in the season where the work is real, but the results are still in progress. The gap isn't typically ability — it's consistency of belief. When you don't yet feel the "proof," your mind may quietly try to protect you by downgrading the plan.

The Clarity Intensive helps you turn what you already understand into a next step you can follow through on — with a belief structure strong enough to carry you until the tangible outcomes arrive.

Book it.`,
  },
  {
    key: 'strategist',
    label: 'Strategist',
    min: 40,
    max: 59,
    intro: `You're in the Strategist band. You can see the shift taking place — and you're beginning to live in a "new direction" way of thinking. The next obstacle isn't your ability to understand what's right; it's your willingness to bet on it even before the world confirms it.`,
    directRead: `Your scores reveal something most people in your position never get told.

You're not stuck because you lack clarity — you scored well there. You're stuck because some part of you doesn't yet believe you're allowed to have what you can see. That belief gap shows up as hesitation, self-editing, or "waiting for certainty" that never comes.

The Clarity Intensive names the pattern and gives you a single, clear conversation that turns insight into conviction — and conviction into the kind of follow-through that changes outcomes.

Book it.`,
  },
  {
    key: 'executor',
    label: 'Executor',
    min: 60,
    max: 79,
    intro: `You're in the Executor band. You're not just understanding what to do — you're ready to move it into the world. Your clarity is deepening, your confidence is stabilizing, and your next chapter is starting to take shape through action.`,
    directRead: `Your scores reveal something most people in your position never get told.

This is the season where belief becomes behavior. You've already done enough internal work that the remaining challenge is focus: choosing the right moves, protecting your energy, and staying consistent when things feel fast or uncertain.

Your clarity isn't theoretical anymore — it's operational. You're poised to translate insight into decisions, and decisions into results.

The Clarity Intensive helps you lock in your next step so you can keep rising with less doubt and more momentum.

Book it.`,
  },
  {
    key: 'phoenix',
    label: 'Phoenix',
    min: 80,
    max: 100,
    intro: `You're in the Phoenix band. You have done the hard work of figuring it out. The direction is real. The building is happening. What your scores show is that the gap right now isn't capability or clarity — it's the faith to trust what you're building before the results are fully visible.`,
    directRead: `Your scores reveal something most people in your position never get told.

You have done the hard work of figuring it out. The direction is real. The building is happening. What your scores show is that the gap right now isn't capability or clarity — it's the faith to trust what you're building before the results are fully visible. That is one of the hardest phases of any transformation. Most people stop here because they can't see the proof yet. The Clarity Intensive is where we map exactly what the next chapter requires — and build the conviction to see it through.

Book it.`,
  },
];

export const getScoringBand = (rawTotal) => {
  if (rawTotal === null || rawTotal === undefined) return null;
  const total = Number(rawTotal);
  if (!Number.isFinite(total)) return null;

  return scoringBands.find((band, index) => {
    const nextBand = scoringBands[index + 1];
    return total >= band.min && (nextBand ? total < nextBand.min : total <= band.max);
  }) || null;
};

export const getScoringBandByKey = (key) => scoringBands.find((b) => b.key === key) || null;
