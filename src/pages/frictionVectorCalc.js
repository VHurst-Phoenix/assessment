// Friction Vector is a separate narrative signal: Patterns & Blocks plus the
// lower of the two Position axes. Category scores are normalized (4–20).

const frictionArchetypes = ['Self-Discounter', 'Vision Staller', 'Imposter Protector', 'The Magnifier'];

export function getFrictionVector(categoryScores, position) {
  if (!Array.isArray(categoryScores) || categoryScores.length < 5 || !position) return null;

  const patternsBlocks = Number(categoryScores[2]);
  if (!Number.isFinite(patternsBlocks)) return null;

  const lowerAxis = position.innerAxis <= position.outerAxis ? 'inner' : 'outer';
  // The locked archetype pool is selected deterministically from the
  // normalized Patterns & Blocks score; it is not a second band system.
  const index = Math.round(patternsBlocks) % frictionArchetypes.length;
  return { patternsBlocks, lowerAxis, archetype: frictionArchetypes[index] };
}
