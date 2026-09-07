// Clarity scoring: all 25 responses are stored exactly as chosen. The five
// negatively phrased items carry `reverse: true` and are converted to 6 -
// response only while scores are calculated. Each category's adjusted 5–25
// total is then normalized by ×0.8, producing the locked 4–20 category range
// and 20–100 overall score.

import { clarityQuestions } from './assessmentQuestions.js';
import { getPosition, POSITION_THRESHOLD } from './positionCalc.js';
import { getFrictionVector } from './frictionVectorCalc.js';

const QUESTION_COUNT = clarityQuestions.length;
const QUESTIONS_PER_CATEGORY = 5;
const MAX_OPTION_VALUE = 5;
const CATEGORY_COUNT = QUESTION_COUNT / QUESTIONS_PER_CATEGORY;
export const MAX_RAW_SCORE = QUESTION_COUNT * MAX_OPTION_VALUE;
export const MAX_CATEGORY_SCORE = QUESTIONS_PER_CATEGORY * MAX_OPTION_VALUE * 0.8;
// Growth Edge ties are resolved in the category order shown to participants.
export const GROWTH_EDGE_TIE_BREAK_ORDER = [0, 1, 2, 3, 4];
export { getPosition, POSITION_THRESHOLD, getFrictionVector };

const roundScore = (score) => Math.round((Number(score) || 0) * 10) / 10;

const numericResponse = (answer) => {
  const value = Number(answer);
  return Number.isFinite(value) && value >= 1 && value <= MAX_OPTION_VALUE ? value : 0;
};

export const getAdjustedResponse = (answer, question) => {
  const value = numericResponse(answer);
  return value && question?.reverse ? (MAX_OPTION_VALUE + 1) - value : value;
};

export const getRawTotal = (answers) => {
  if (!Array.isArray(answers)) return 0;
  return clarityQuestions.reduce(
    (total, question, index) => total + getAdjustedResponse(answers[index], question),
    0,
  );
};

/**
 * Returns normalized category scores. Each category contains five adjusted
 * 1–5 marks and is multiplied by 0.8, giving a 4–20 range.
 */
export const getCategoryScores = (answers) => {
  if (!Array.isArray(answers)) return [0, 0, 0, 0, 0];
  const categories = Array(CATEGORY_COUNT).fill(0);
  clarityQuestions.forEach((question, index) => {
    categories[question.dim] += getAdjustedResponse(answers[index], question);
  });
  return categories.map((score) => roundScore(score * 0.8));
};

export const getClarityScore = (answers) => {
  return roundScore((getRawTotal(answers) / MAX_RAW_SCORE) * 100);
};

export const getGrowthEdge = (categoryScores) => {
  if (!categoryScores || categoryScores.length < 5) return null;
  let minScore = categoryScores[0];
  let minIndex = 0;
  categoryScores.forEach((score, idx) => {
    if (score < minScore) {
      minScore = score;
      minIndex = idx;
    } else if (score === minScore && GROWTH_EDGE_TIE_BREAK_ORDER[idx] < GROWTH_EDGE_TIE_BREAK_ORDER[minIndex]) {
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
    intro: `You are in a meaningful in-between: no longer willing to move on autopilot, and still gathering the clarity to choose what comes next. Your score suggests that your foundation is forming — the work now is giving it language, direction, and a pace you can sustain.`,
    directRead: `You do not need to have your whole future mapped to make an honest next decision. The most useful thing you can do now is separate the signal from the noise: name what matters, notice where your energy changes, and choose one action that reflects it.

The Clarity Intensive is a focused space to turn that emerging self-knowledge into a grounded direction and a next step that feels like yours.`,
  },
  {
    key: 'strategist',
    label: 'Strategist',
    min: 40,
    max: 59,
    intro: `You can see more of the path than you may be giving yourself credit for. Your score points to real insight and a growing ability to make choices from it. The opportunity now is to turn reflection into a clear strategy rather than waiting for perfect certainty.`,
    directRead: `At this stage, hesitation can look very responsible: more research, another round of refinement, one more sign that the choice is safe. Your results suggest you may benefit less from collecting information and more from deciding what information is already sufficient.

The Clarity Intensive helps you translate what you know into a practical direction, a decision filter, and a commitment you can carry into daily life.`,
  },
  {
    key: 'executor',
    label: 'Executor',
    min: 60,
    max: 79,
    intro: `Your clarity is becoming operational. You have a solid view of your strengths, priorities, and direction — and you are ready to make that insight visible through consistent action. The next level is less about doing more and more about protecting what matters.`,
    directRead: `Your results point to capability with momentum behind it. The question is not whether you can move; it is whether your calendar, boundaries, and decisions are serving the direction you have named.

The Clarity Intensive can help you identify the few moves with the greatest return, design support around them, and stay connected to your own criteria when new opportunities compete for your attention.`,
  },
  {
    key: 'phoenix',
    label: 'Phoenix',
    min: 80,
    max: 100,
    intro: `You are meeting this chapter with substantial clarity, self-trust, and direction. Your results suggest you know what is important and are equipped to act on it. The work ahead is stewardship: keeping your choices aligned as your responsibilities and possibilities expand.`,
    directRead: `High clarity does not mean every decision becomes easy. It means you have an internal compass to return to when the pace increases or the stakes change. Your strongest next step may be strengthening the structures that protect your energy, values, and focus.

The Clarity Intensive offers a dedicated conversation to sharpen that compass, test your next priorities, and build a plan that matches the scale of what you are creating.`,
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
