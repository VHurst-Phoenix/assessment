import test from 'node:test';
import assert from 'node:assert/strict';
import { getQuestionSetFor, QUESTION_SET_VERSIONS } from './questionSetVersions.js';
import { getClarityScore, getCategoryScores } from './scoringBands.js';
import { buildClarityReport } from './clarityReport.js';

const reverseSlots = (set) => set.questions.map((q, i) => (q.reverse ? i + 1 : null)).filter(Boolean);

test('each live question set has 25 items in the same category order', () => {
  for (const set of QUESTION_SET_VERSIONS) {
    assert.equal(set.questions.length, 25);
    assert.deepEqual(set.questions.map((q) => q.dim), [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4]);
  }
  assert.deepEqual(QUESTION_SET_VERSIONS.map(reverseSlots), [[], [3, 8, 12, 18, 21], [2, 7, 13, 17, 24]]);
});

test('picks the question set that was live when a record was submitted', () => {
  assert.equal(getQuestionSetFor('2026-08-15T17:33:33Z').id, 'original');
  assert.equal(getQuestionSetFor('2026-09-17T21:38:54Z').id, 'interim');
  assert.equal(getQuestionSetFor('2026-09-29T17:35:33Z').id, 'interim');
  assert.equal(getQuestionSetFor('2026-09-29T17:35:35Z').id, 'locked');
  assert.equal(getQuestionSetFor('2026-11-09T12:26:22Z').id, 'locked');
  assert.equal(getQuestionSetFor(undefined).id, 'locked');
});

test('scores an original-set record with no reverse items', () => {
  const allFives = Array(25).fill(5);
  const original = getQuestionSetFor('2026-08-01').questions;
  assert.equal(getClarityScore(allFives, original), 100);
  // The locked set would wrongly reverse five of those answers.
  assert.equal(getClarityScore(allFives), 84);
});

test('scores an interim-set record against its own reverse items', () => {
  const answers = Array(25).fill(5);
  [3, 8, 12, 18, 21].forEach((q) => { answers[q - 1] = 1; }); // strong disagreement with the negative items
  const interim = getQuestionSetFor('2026-09-20').questions;
  assert.equal(getClarityScore(answers, interim), 100);
  assert.deepEqual(getCategoryScores(answers, interim), [20, 20, 20, 20, 20]);
});

test('the report model uses the record date to choose the question set', () => {
  const answers = Array(25).fill(5);
  assert.equal(buildClarityReport({ answers, date: '2026-08-01T00:00:00Z' }).score, 100);
  assert.equal(buildClarityReport({ answers, date: '2026-10-20T00:00:00Z' }).score, 84);
});
