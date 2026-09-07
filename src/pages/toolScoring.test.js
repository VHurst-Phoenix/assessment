import test from 'node:test';
import assert from 'node:assert/strict';
import { getExecutionResults, getReadinessResults } from './toolScoring.js';

test('calculates the locked Execution percentage score, band, and gap', () => {
  const answers = [5, 5, 5, 5, 5, 3, 3, 3, 3, 3, 1, 1, 1, 1, 1];
  const result = getExecutionResults(answers);

  assert.equal(result.score, 50);
  assert.equal(result.band.label, 'Operational Cadence');
  assert.equal(result.gap.archetype, 'The Stall-Out');
  assert.deepEqual(result.categoryScores.map((item) => item.score), [100, 50, 0]);
});

test('calculates the locked Readiness percentage score, band, and gap', () => {
  const answers = [2, 2, 2, 2, 2, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5];
  const result = getReadinessResults(answers);

  assert.equal(result.score, 66.7);
  assert.equal(result.band.label, 'Willing');
  assert.equal(result.gap.archetype, 'The Uncertain Mirror');
});
