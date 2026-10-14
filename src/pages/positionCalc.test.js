import test from 'node:test';
import assert from 'node:assert/strict';
import { getPosition, POSITION_THRESHOLD } from './positionCalc.js';
import { getFrictionVector } from './frictionVectorCalc.js';

test('uses the locked normalized Position threshold and quadrant names', () => {
  const position = getPosition([14, 12, 10, 15, 13]);
  assert.equal(POSITION_THRESHOLD, 26.5);
  assert.equal(position.innerAxis, 27);
  assert.equal(position.outerAxis, 27);
  assert.equal(position.maxAxisScore, 40);
  assert.equal(position.quadrant, 'Momentum Builder');
});

test('feeds the lower Position axis into Friction Vector', () => {
  const position = getPosition([16, 10, 12, 11, 16]);
  const vector = getFrictionVector([16, 10, 12, 11, 16], position);
  assert.equal(position.quadrant, 'Kinetic Operator');
  assert.equal(vector.lowerAxis, 'inner');
  assert.equal(vector.weakerDimension, 'Values & What Matters');
  assert.equal(vector.archetype, 'Self-Discounter');
});

test('treats an exact axis tie as Outer lagging', () => {
  // Inner = 16 + 12 = 28, Outer = 14.4 + 13.6 = 28.
  const scores = [14.4, 16, 10, 12, 13.6];
  const position = getPosition(scores);
  const vector = getFrictionVector(scores, position);
  assert.equal(position.innerAxis, position.outerAxis);
  assert.equal(vector.lowerAxis, 'outer');
  assert.equal(vector.weakerDimension, 'Alignment & Confidence');
  assert.equal(vector.archetype, 'The Magnifier');
});

test('breaks a tie inside the lagging axis toward the first-listed dimension', () => {
  const scores = [12, 16, 10, 16, 12];
  const vector = getFrictionVector(scores, getPosition(scores));
  assert.equal(vector.lowerAxis, 'outer');
  assert.equal(vector.archetype, 'Imposter Protector');
});
