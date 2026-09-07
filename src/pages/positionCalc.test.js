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
  assert.equal(position.quadrant, 'Strategic Planner');
  assert.equal(vector.lowerAxis, 'outer');
  assert.equal(vector.patternsBlocks, 12);
  assert.equal(vector.archetype, 'Self-Discounter');
});
