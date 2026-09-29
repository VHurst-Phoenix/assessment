// Friction Vector is determined only by the axis-forming dimensions. Patterns
// & Blocks belongs exclusively to Growth Edge, never Position or Friction.

export function getFrictionVector(categoryScores, position) {
  if (!Array.isArray(categoryScores) || categoryScores.length < 5 || !position) return null;

  const [strengths, values, , direction, alignment] = categoryScores.map(Number);
  if (![strengths, values, direction, alignment].every(Number.isFinite)) return null;
  const lowerAxis = position.innerAxis <= position.outerAxis ? 'inner' : 'outer';
  const weakerDimension = lowerAxis === 'inner'
    ? (values <= direction ? 'Values & What Matters' : 'Direction & Opportunity')
    : (strengths <= alignment ? 'Strengths & Skills' : 'Alignment & Confidence');
  const archetypeByDimension = {
    'Values & What Matters': 'Self-Discounter',
    'Direction & Opportunity': 'Vision Staller',
    'Strengths & Skills': 'Imposter Protector',
    'Alignment & Confidence': 'The Magnifier',
  };

  return { lowerAxis, weakerDimension, archetype: archetypeByDimension[weakerDimension] };
}
