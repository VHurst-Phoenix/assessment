import test from 'node:test';
import assert from 'node:assert/strict';
import { getClarityScore } from './scoringBands.js';

test('sums selected option values across all clarity questions', () => {
  assert.equal(getClarityScore([4, 4, 4, 4, 4]), 20);
  assert.equal(getClarityScore([5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]), 125);
});

test('returns zero for missing or empty responses', () => {
  assert.equal(getClarityScore(null), 0);
  assert.equal(getClarityScore([]), 0);
});
