// Scoring bands for the Clarity assessment — this REPLACES the old
// 3-archetype system (Phoenix Momentum / Dreaming / Awakening, which was
// derived from the 5 dimension scores). Bands are now the single source of
// truth for classifying a result, driven by the raw total score (25-125),
// per Veta's spec:
//   Rebuilding:     25–65
//   Transitioning:  66–85
//   Awakening:      86–105
//   Rising:         106–125
//
// NOTE FOR VETA: `intro` and `directRead` below are PLACEHOLDERS, deliberately
// obvious so nobody mistakes them for final copy. Replace each with your real
// band narrative before this goes live for clients viewing full reports —
// this is now the ONLY narrative shown on the results page, in the email,
// and in the dashboard, so it needs your actual copy.

export const getRawTotal = (answers) => {
  if (!Array.isArray(answers)) return null;
  return answers.reduce((sum, val) => sum + (Number(val) || 0), 0);
};

export const scoringBands = [
  {
    key: 'rebuilding',
    label: 'Rebuilding',
    min: 25,
    max: 65,
    intro: `You’re in the Rebuilding band. Something important has shifted for you — you’re beginning to see what’s possible — but the evidence hasn’t caught up yet. This is the stage where you rebuild the internal foundation that makes change stick: clarity, self-trust, and momentum you can rely on.`,
    directRead: `Your scores reveal something most people in your position never get told.

You’re not starting from zero. You’re in the season where the work is real, but the results are still in progress. The gap isn’t typically ability — it’s consistency of belief. When you don’t yet feel the “proof,” your mind may quietly try to protect you by downgrading the plan.

The Clarity Intensive helps you turn what you already understand into a next step you can follow through on — with a belief structure strong enough to carry you until the tangible outcomes arrive.

Book it.`,
  },
  {
    key: 'transitioning',
    label: 'Transitioning',
    min: 66,
    max: 85,
    intro: `You’re in the Transitioning band. You can see the shift taking place — and you’re beginning to live in a “new direction” way of thinking. The next obstacle isn’t your ability to understand what’s right; it’s your willingness to bet on it even before the world confirms it.`,
    directRead: `Your scores reveal something most people in your position never get told.

You’re not stuck because you lack clarity — you scored well there. You’re stuck because some part of you doesn’t yet believe you’re allowed to have what you can see. That belief gap shows up as hesitation, self-editing, or “waiting for certainty” that never comes.

The Clarity Intensive names the pattern and gives you a single, clear conversation that turns insight into conviction — and conviction into the kind of follow-through that changes outcomes.

Book it.`,
  },
  {
    key: 'awakening',
    label: 'Awakening',
    min: 86,
    max: 105,
    intro: `You’re in the Awakening band. Something inside you is changing — and the discomfort you feel is part of the process, not evidence that you’re doing it wrong. You’re in the middle of becoming, not stuck in a broken version of the story.`,
    directRead: `Your scores reveal something most people in your position never get told.

You are not behind. You are not broken. You’re navigating one of the most important transitions a professional can go through — identity is shifting, and you’re learning what the new you requires.

The discomfort isn’t a signal that you should go back. It’s a signal that something real is happening. What you need right now isn’t more “figuring out.” It’s a space where someone can help you see what’s actually shifting — and what your next step needs to look like so you can keep moving forward.

That space is the Clarity Intensive. Book it.`,
  },
  {
    key: 'rising',
    label: 'Rising',
    min: 106,
    max: 125,
    intro: `You’re in the Rising band. You’re not just understanding what to do — you’re ready to move it into the world. Your clarity is deepening, your confidence is stabilizing, and your next chapter is starting to take shape through action.`,
    directRead: `Your scores reveal something most people in your position never get told.

  This is the season where belief becomes behavior. You’ve already done enough internal work that the remaining challenge is focus: choosing the right moves, protecting your energy, and staying consistent when things feel fast or uncertain.

  Your clarity isn’t theoretical anymore — it’s operational. You’re poised to translate insight into decisions, and decisions into results.

  The Clarity Intensive helps you lock in your next step so you can keep rising with less doubt and more momentum.

  Book it.`,
  },
];

export const getScoringBand = (rawTotal) => {
  if (rawTotal === null || rawTotal === undefined) return null;
  return scoringBands.find((b) => rawTotal >= b.min && rawTotal <= b.max) || null;
};

export const getScoringBandByKey = (key) => scoringBands.find((b) => b.key === key) || null;
