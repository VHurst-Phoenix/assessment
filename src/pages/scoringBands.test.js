import test from 'node:test';
import assert from 'node:assert/strict';
import { getCategoryScores, getClarityScore, getRawTotal, getScoringBand } from './scoringBands.js';

test('converts the direct 25–125 marks to the required 20–100 score', () => {
  assert.equal(getRawTotal(Array(25).fill(1)), 25);
  assert.equal(getClarityScore(Array(25).fill(1)), 20);
  assert.equal(getRawTotal(Array(25).fill(3)), 75);
  assert.equal(getClarityScore(Array(25).fill(3)), 60);
  assert.equal(getRawTotal(Array(25).fill(5)), 125);
  assert.equal(getClarityScore(Array(25).fill(5)), 100);
});

test('returns zero for missing or empty responses', () => {
  assert.equal(getClarityScore(null), 0);
  assert.equal(getClarityScore([]), 0);
});

test('uses every chosen option as its direct mark with no reverse scoring', () => {
  const answers = Array(25).fill(5);
  answers[2] = 1;

  assert.deepEqual(getCategoryScores(answers), [21, 25, 25, 25, 25]);
  assert.equal(getRawTotal(answers), 121);
  assert.equal(getClarityScore(answers), 96.8);
});

test('uses direct category totals and the percentage band boundaries', () => {
  assert.deepEqual(getCategoryScores(Array(25).fill(1)), [5, 5, 5, 5, 5]);
  assert.equal(getScoringBand(39.9).key, 'transitioner');
  assert.equal(getScoringBand(40).key, 'strategist');
  assert.equal(getScoringBand(60).key, 'executor');
  assert.equal(getScoringBand(80).key, 'phoenix');
});
