import test from 'node:test';
import assert from 'node:assert/strict';
import { buildClarityReport } from './clarityReport.js';
import { positionNarratives } from './clarityNarratives.js';

test('builds the shared report model from stored raw answers', () => {
  const report = buildClarityReport({ firstName: 'Ada', answers: Array(25).fill(3), score: 0, dimScores: [] });
  assert.equal(report.score, 60);
  assert.equal(report.band.key, 'executor');
  assert.deepEqual(report.dimensions.map((d) => d.score), [12, 12, 12, 12, 12]);
  assert.equal(report.position.quadrant, 'System Evaluator');
  assert.equal(report.frictionVector.archetype, 'Imposter Protector');
  assert.equal(report.growthEdge.name, 'Strengths & Skills');
  assert.equal(report.dimensions[0].tier, 'Strong');
  assert.ok(report.dimensions[0].narrative.startsWith('You have a working, mostly accurate picture'));
  assert.ok(positionNarratives[report.position.quadrant].startsWith("You're currently in an evaluating posture"));
});

test('falls back to stored category scores when responses are missing', () => {
  const report = buildClarityReport({ score: 68, dimScores: [14.4, 16, 12, 12, 13.6] });
  assert.equal(report.band.key, 'executor');
  assert.equal(report.frictionVector.archetype, 'The Magnifier');
  assert.equal(report.growthEdge.name, 'Patterns & Blocks');
});
