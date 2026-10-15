// Band intro/directRead copy is Section 2 of the Clarity Narrative Content
// Library v1 (other report narrative lives in clarityNarratives.js).

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

// Every category score is a multiple of 0.8, so one-decimal rounding is
// lossless: it only strips floating-point noise (e.g. 14.400000000000002).
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
    intro: `You are in the Transitioner stage.

Something is shifting, and you can feel it — even if you can't fully name what "it" is yet. This isn't a stall. It's the early, unglamorous part of real change, and it rarely looks like progress from the inside. What you're in right now is normal, and it's the necessary first mile.`,
    directRead: `Your scores reveal something most people in your position never get told.

You are not behind, and you are not doing this wrong. Transitioner isn't a deficiency score — it's an honest read of someone in the early, disorienting part of real change, where the old identity has loosened its grip but the new one hasn't solidified yet. That gap is uncomfortable by design; it's supposed to feel unstable, because you're actually in motion, not stuck. What you need right now isn't more information or another framework — it's a clear-eyed read of exactly where you are, from someone who can see the shape of what's forming before you can.

That read is the Clarity Intensive. Book it.`,
  },
  {
    key: 'strategist',
    label: 'Strategist',
    min: 40,
    max: 59,
    intro: `You are in the Strategist stage.

The fog is lifting. You can name what matters and you have real ideas about where you're headed — the thinking has caught up. What hasn't caught up yet is the follow-through: turning the plan in your head into the plan in motion.`,
    directRead: `Your scores reveal something most people in your position never get told.

You are not short on clarity — you scored well there. You're short on deployment. Somewhere between "I know what I need to do" and "I am actually doing it," the plan is getting stuck — often because it's still a plan for someday, not a plan with a next Tuesday attached to it. That gap between strategy and action is one of the most common, and most fixable, places people stall. It doesn't get solved by more planning. It gets solved by one direct conversation that turns the blueprint into a first move.

That conversation is the Clarity Intensive. Book it.`,
  },
  {
    key: 'executor',
    label: 'Executor',
    min: 60,
    max: 79,
    intro: `You are in the Executor stage.

You're not planning anymore — you're building. The action is real, the follow-through is there, and it shows in your scores. What's still catching up is the full internal alignment behind it: making sure the direction you're executing on is actually the one you'd choose with total clarity, not just the one that was available.`,
    directRead: `Your scores reveal something most people in your position never get told.

You are already doing the work most people never get to — showing up, taking action, building real momentum. The risk at this stage isn't inaction; it's motion without a periodic gut-check on direction. People who execute well can run hard for a long time before noticing they optimized the wrong hill. What you need now isn't more output. It's fifteen minutes of pressure-testing where this is actually headed, from someone who isn't inside the momentum with you.

That gut-check is the Clarity Intensive. Book it.`,
  },
  {
    key: 'phoenix',
    label: 'Phoenix',
    min: 80,
    max: 100,
    intro: `You are in the Phoenix stage.

You've figured it out and you're building it. The direction is clear, the action is real, and it's showing up in how you're living, not just how you're thinking. What you need now isn't more clarity — it's the conviction to keep pressing forward even before all the proof has caught up to the work.`,
    directRead: `Your scores reveal something most people in your position never get told.

You have done the hard work of figuring it out, and you are building it in real time. The gap left at this stage is rarely capability or clarity — it's trusting what you're building before the external proof fully arrives. That is one of the hardest phases of any transformation, because it's the part where most people quietly stop, right before the results become visible. What you need is not another plan. It's the conviction to keep pressing forward — and a clear-eyed partner who can see how close you actually are.

That partner is the Clarity Intensive. Book it.`,
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
