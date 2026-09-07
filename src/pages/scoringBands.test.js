import test from 'node:test';
import assert from 'node:assert/strict';
import { GROWTH_EDGE_TIE_BREAK_ORDER, getAdjustedResponse, getCategoryScores, getClarityScore, getGrowthEdge, getRawTotal, getScoringBand } from './scoringBands.js';

test('converts reverse-adjusted 25–125 marks to the required 20–100 score', () => {
  const lowestAnswers = Array(25).fill(1);
  [2, 7, 11, 17, 20].forEach((index) => { lowestAnswers[index] = 5; });
  assert.equal(getRawTotal(lowestAnswers), 25);
  assert.equal(getClarityScore(lowestAnswers), 20);
  assert.equal(getRawTotal(Array(25).fill(3)), 75);
  assert.equal(getClarityScore(Array(25).fill(3)), 60);
  const highestAnswers = Array(25).fill(5);
  [2, 7, 11, 17, 20].forEach((index) => { highestAnswers[index] = 1; });
  assert.equal(getRawTotal(highestAnswers), 125);
  assert.equal(getClarityScore(highestAnswers), 100);
});

test('returns zero for missing or empty responses', () => {
  assert.equal(getClarityScore(null), 0);
  assert.equal(getClarityScore([]), 0);
});

test('keeps raw responses intact while reverse-scoring the five flagged items', () => {
  const answers = Array(25).fill(5);
  // Q3 is reverse-scored: a raw 1 becomes an adjusted 5.
  answers[2] = 1;

  assert.equal(getAdjustedResponse(answers[2], { reverse: true }), 5);
  assert.deepEqual(getCategoryScores(answers), [20, 16.8, 16.8, 16.8, 16.8]);
  assert.equal(getRawTotal(answers), 109);
  assert.equal(getClarityScore(answers), 87.2);
});

test('uses normalized category totals and the percentage band boundaries', () => {
  // A raw 1 on every answer becomes 5 on each reverse-scored item.
  assert.deepEqual(getCategoryScores(Array(25).fill(1)), [7.2, 7.2, 7.2, 7.2, 7.2]);
  assert.equal(getScoringBand(39.9).key, 'transitioner');
  assert.equal(getScoringBand(40).key, 'strategist');
  assert.equal(getScoringBand(60).key, 'executor');
  assert.equal(getScoringBand(80).key, 'phoenix');
});

test('locks Growth Edge ties to the first listed category', () => {
  assert.deepEqual(GROWTH_EDGE_TIE_BREAK_ORDER, [0, 1, 2, 3, 4]);
  assert.deepEqual(getGrowthEdge([8, 8, 12, 14, 16]), { score: 8, index: 0 });
});
