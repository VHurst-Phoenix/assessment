import test from 'node:test';
import assert from 'node:assert/strict';
import { getTrajectory, isInDateRange } from './dashboardSignals.js';

test('compares a record with the same client’s previous submission', () => {
  const records = [
    { id: 1, email: 'a@x.com', date: '2026-08-01', score: 40 },
    { id: 2, email: 'A@x.com ', date: '2026-09-01', score: 55 },
    { id: 3, email: 'b@x.com', date: '2026-09-01', score: 70 },
  ];
  assert.equal(getTrajectory(records[1], records).direction, 'up');
  assert.equal(getTrajectory(records[0], records).direction, 'first');
  assert.equal(getTrajectory({ ...records[1], score: 40.5 }, records).direction, 'flat');
  assert.equal(getTrajectory({ ...records[1], score: 30 }, records).direction, 'down');
});

test('filters by date range', () => {
  const now = new Date('2026-10-14T12:00:00Z');
  assert.equal(isInDateRange('2026-10-01', '30', now), true);
  assert.equal(isInDateRange('2026-08-01', '30', now), false);
  assert.equal(isInDateRange('2026-10-02', 'quarter', now), true);
  assert.equal(isInDateRange('2026-09-30', 'quarter', now), false);
  assert.equal(isInDateRange('2020-01-01', 'all', now), true);
});
