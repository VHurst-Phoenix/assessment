const roundPercent = (value) => Math.round(value * 10) / 10;

const getCategoryScores = (answers, categoryNames) => categoryNames.map((name, index) => {
  const categoryAnswers = answers.slice(index * 5, (index + 1) * 5);
  const rawTotal = categoryAnswers.reduce((total, answer) => total + (Number(answer) || 0), 0);
  return {
    name,
    score: roundPercent(((rawTotal - 5) / 20) * 100),
  };
});

const calculateAssessment = ({ answers, categoryNames, bands, gapArchetypes }) => {
  const categoryScores = getCategoryScores(Array.isArray(answers) ? answers : [], categoryNames);
  const score = roundPercent(categoryScores.reduce((total, category) => total + category.score, 0) / categoryScores.length);
  const lowestCategory = categoryScores.reduce((lowest, category) => (
    category.score < lowest.score ? category : lowest
  ), categoryScores[0]);
  const lowestIndex = categoryScores.indexOf(lowestCategory);
  const band = bands.find((item, index) => {
    const nextBand = bands[index + 1];
    return score >= item.min && (nextBand ? score < nextBand.min : score <= item.max);
  }) || null;

  return {
    score,
    categoryScores,
    band,
    gap: {
      category: lowestCategory.name,
      archetype: gapArchetypes[lowestIndex],
      score: lowestCategory.score,
    },
  };
};

const executionCategories = ['Consistency', 'Alignment & Authenticity', 'Resilience'];
const readinessCategories = ['Self-Awareness & Capability', 'Emotional Stability & Capacity', 'Commitment & Investment'];

export const getExecutionResults = (answers) => calculateAssessment({
  answers,
  categoryNames: executionCategories,
  bands: [
    { key: 'friction-bound', label: 'Friction-Bound', min: 0, max: 24 },
    { key: 'emergent-traction', label: 'Emergent Traction', min: 25, max: 49 },
    { key: 'operational-cadence', label: 'Operational Cadence', min: 50, max: 74 },
    { key: 'strategic-velocity', label: 'Strategic Velocity', min: 75, max: 100 },
  ],
  gapArchetypes: ['The Stop-Starter', 'The Autopilot', 'The Stall-Out'],
});

export const getReadinessResults = (answers) => calculateAssessment({
  answers,
  categoryNames: readinessCategories,
  bands: [
    { key: 'guarded', label: 'Guarded', min: 0, max: 24 },
    // The locked specification intentionally leaves this band unnamed.
    { key: 'developing', label: 'Developing (25–49)', min: 25, max: 49 },
    { key: 'willing', label: 'Willing', min: 50, max: 74 },
    { key: 'all-in', label: 'All In', min: 75, max: 100 },
  ],
  gapArchetypes: ['The Uncertain Mirror', 'The Overloaded', 'The Hesitant Investor'],
});

export const formatPercent = (score) => `${Number.isInteger(score) ? score : Number(score).toFixed(1)}%`;
